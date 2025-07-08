from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
from datetime import datetime
import json
import logging
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re
from collections import Counter
import asyncio
from dotenv import load_dotenv
import httpx
from pydantic import BaseModel
import praw                           # ← NEW
import re
import asyncio



# Load environment variables
load_dotenv()
print("GNEWS_API_KEY =", os.getenv("GNEWS_API_KEY")[:6], "...loaded")
print("REDDIT_CLIENT_ID =", os.getenv("REDDIT_CLIENT_ID")[:6], "...loaded")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Climate Sentiment Analyzer API",
    description="Advanced sentiment analysis for climate-related text using VADER and custom climate lexicons",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize VADER analyzer
analyzer = SentimentIntensityAnalyzer()

# Custom climate lexicon for enhanced accuracy
CLIMATE_LEXICON = {
    # Positive climate terms
    'renewable': 2.0,
    'sustainable': 1.8,
    'clean_energy': 2.2,
    'solar_power': 1.9,
    'wind_energy': 1.9,
    'carbon_neutral': 2.1,
    'green_technology': 1.7,
    'conservation': 1.6,
    'reforestation': 1.9,
    'biodiversity': 1.5,
    'eco_friendly': 1.8,
    'climate_action': 1.7,
    'energy_efficiency': 1.6,
    'sustainability': 1.8,
    'environmental_protection': 1.9,
    'climate_solution': 2.0,
    'green_innovation': 1.8,
    'carbon_reduction': 1.7,
    'renewable_transition': 1.9,
    'climate_resilience': 1.6,
    
    # Negative climate terms
    'climate_crisis': -2.5,
    'global_warming': -1.8,
    'climate_catastrophe': -2.8,
    'environmental_destruction': -2.6,
    'carbon_emissions': -1.5,
    'greenhouse_gas': -1.4,
    'climate_emergency': -2.3,
    'sea_level_rise': -1.9,
    'extreme_weather': -2.1,
    'climate_disaster': -2.4,
    'environmental_degradation': -2.2,
    'species_extinction': -2.7,
    'deforestation': -2.0,
    'air_pollution': -1.8,
    'water_pollution': -1.8,
    'fossil_fuels': -1.6,
    'carbon_footprint': -1.2,
    'climate_change_denial': -2.3,
    'environmental_damage': -2.1,
    'climate_threat': -2.0,
    
    # Neutral but important climate terms
    'climate_science': 0.1,
    'carbon_cycle': 0.0,
    'greenhouse_effect': -0.5,
    'climate_data': 0.0,
    'environmental_policy': 0.2,
    'climate_model': 0.0,
    'temperature_increase': -0.8,
    'climate_adaptation': 0.5,
    'environmental_impact': -0.3,
    'climate_research': 0.1,
}

# Update VADER lexicon with climate terms
for term, score in CLIMATE_LEXICON.items():
    analyzer.lexicon[term.replace('_', ' ')] = score
    analyzer.lexicon[term.replace('_', '')] = score
    analyzer.lexicon[term] = score

# Pydantic models
class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Text to analyze")
    include_keywords: bool = Field(default=True, description="Include climate keywords analysis")
    context: Optional[str] = Field(default=None, description="Additional context for analysis")

class SentimentResponse(BaseModel):
    text: str
    sentiment: Dict[str, float]
    classification: str
    confidence: float
    climate_keywords: Optional[List[Dict[str, Any]]] = None
    analysis_timestamp: datetime
    word_count: int
    processing_time_ms: float

class KeywordAnalysis(BaseModel):
    keyword: str
    frequency: int
    sentiment_contribution: float
    category: str

class BatchSentimentRequest(BaseModel):
    texts: List[str] = Field(..., max_items=100, description="List of texts to analyze")
    include_keywords: bool = Field(default=True, description="Include climate keywords analysis")

class BatchSentimentResponse(BaseModel):
    results: List[SentimentResponse]
    summary: Dict[str, Any]
    total_processed: int
    processing_time_ms: float

class NewsArticle(BaseModel):
    title: str
    url: str
    source: str
    published_at: datetime
    sentiment: str            # positive | neutral | negative
    compound: float           # sentiment score

class NewsFeedResponse(BaseModel):
    total: int
    generated_at: datetime
    articles: list[NewsArticle]

# -------- Reddit models --------
class RedditPost(BaseModel):
    title: str
    url: str
    score: int
    sentiment: str     # Positive | Neutral | Negative
    compound: float
    pos: float          # 0‑1  share of positive words
    neu: float          # 0‑1  share of neutral words
    neg: float          # 0‑1  share of negative words

class RedditFeedResponse(BaseModel):
    subreddit: str
    total: int
    generated_at: datetime
    posts: list[RedditPost]


# Helper functions
def extract_climate_keywords(text: str) -> List[Dict[str, Any]]:
    """Extract and analyze climate-related keywords from text."""
    text_lower = text.lower()
    keywords = []
    
    # Find climate keywords
    for term, score in CLIMATE_LEXICON.items():
        pattern = term.replace('_', r'[_\s]')
        matches = re.findall(pattern, text_lower)
        if matches:
            category = "positive" if score > 0.5 else "negative" if score < -0.5 else "neutral"
            keywords.append({
                "keyword": term.replace('_', ' '),
                "frequency": len(matches),
                "sentiment_contribution": score,
                "category": category
            })
    
    return sorted(keywords, key=lambda x: abs(x["sentiment_contribution"]), reverse=True)

def classify_sentiment(compound_score: float) -> tuple[str, float]:
    """Classify sentiment based on compound score and return confidence."""
    if compound_score >= 0.05:
        confidence = min(compound_score * 2, 1.0)
        return "positive", confidence
    elif compound_score <= -0.05:
        confidence = min(abs(compound_score) * 2, 1.0)
        return "negative", confidence
    else:
        confidence = 1 - abs(compound_score) * 10
        return "neutral", max(confidence, 0.1)

def preprocess_text(text: str) -> str:
    """Preprocess text for better sentiment analysis."""
    # Handle climate-specific phrases
    text = re.sub(r'\bclimate\s+crisis\b', 'climate_crisis', text, flags=re.IGNORECASE)
    text = re.sub(r'\bclimate\s+emergency\b', 'climate_emergency', text, flags=re.IGNORECASE)
    text = re.sub(r'\bclimate\s+action\b', 'climate_action', text, flags=re.IGNORECASE)
    text = re.sub(r'\bclean\s+energy\b', 'clean_energy', text, flags=re.IGNORECASE)
    text = re.sub(r'\bsolar\s+power\b', 'solar_power', text, flags=re.IGNORECASE)
    text = re.sub(r'\bwind\s+energy\b', 'wind_energy', text, flags=re.IGNORECASE)
    text = re.sub(r'\bcarbon\s+neutral\b', 'carbon_neutral', text, flags=re.IGNORECASE)
    text = re.sub(r'\bsea\s+level\s+rise\b', 'sea_level_rise', text, flags=re.IGNORECASE)
    
    return text

def get_event_loop():
    try:
        return asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.new_event_loop()

async def analyze_sentiment_enhanced(text: str, include_keywords: bool = True) -> Dict[str, Any]:
    """Enhanced sentiment analysis with climate-specific processing."""
    start_time = datetime.now()
    
    # Preprocess text
    processed_text = preprocess_text(text)
    
    # Get VADER scores
    scores = analyzer.polarity_scores(processed_text)
    
    # Classify sentiment
    classification, confidence = classify_sentiment(scores['compound'])
    
    # Extract climate keywords if requested
    climate_keywords = None
    if include_keywords:
        climate_keywords = extract_climate_keywords(text)
    
    # Calculate processing time
    processing_time = (datetime.now() - start_time).total_seconds() * 1000
    
    return {
        "text": text,
        "sentiment": {
            "compound": scores['compound'],
            "positive": scores['pos'],
            "negative": scores['neg'],
            "neutral": scores['neu']
        },
        "classification": classification,
        "confidence": confidence,
        "climate_keywords": climate_keywords,
        "analysis_timestamp": datetime.now(),
        "word_count": len(text.split()),
        "processing_time_ms": processing_time
    }

async def fetch_and_analyse_news() -> list[NewsArticle]:
    api_key = os.getenv("GNEWS_API_KEY")
    if not api_key:
        raise RuntimeError("GNEWS_API_KEY missing in .env")

    url = (
        "https://gnews.io/api/v4/search"
        "?q=climate+OR+global+warming"
        "&lang=en&max=10&token=" + api_key
    )

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

    articles: list[NewsArticle] = []
    for art in data.get("articles", []):
        analysis = await analyze_sentiment_enhanced(
            art["title"], include_keywords=False
        )
        articles.append(
            NewsArticle(
                title=art["title"],
                url=art["url"],
                source=art["source"]["name"],
                published_at=datetime.fromisoformat(art["publishedAt"].rstrip("Z")),
                sentiment=analysis["classification"],
                compound=analysis["sentiment"]["compound"],
            )
        )
    return articles

# ---------- Reddit helpers ----------
def get_reddit_client() -> praw.Reddit:
    return praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        user_agent=os.getenv("REDDIT_USER_AGENT", "ClimateSentimentApp/0.1"),
    )

async def fetch_and_analyse_reddit(
    subreddit: str = "climatechange",
    limit: int = 15,
) -> list[RedditPost]:
    reddit = get_reddit_client()
    loop = asyncio.get_running_loop()

    def _sync_fetch():
        posts_out: list[RedditPost] = []
        for sub in reddit.subreddit(subreddit).hot(limit=limit):
            # Run the coroutine on the main FastAPI event loop safely
            future = asyncio.run_coroutine_threadsafe(
                analyze_sentiment_enhanced(sub.title, include_keywords=False),
                loop
            )
            analysis = future.result(timeout=5)  # Wait up to 5s
            posts_out.append(
                RedditPost(
                    title=sub.title,
                    url=sub.url,
                    score=sub.score,
                    sentiment=analysis["classification"].capitalize(),
                    compound=analysis["sentiment"]["compound"],
                    pos=analysis["sentiment"]["positive"],
                    neu=analysis["sentiment"]["neutral"],
                    neg=analysis["sentiment"]["negative"],
                )
            )
        return posts_out

    return await asyncio.to_thread(_sync_fetch)



# API Routes

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main application page."""
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Climate Sentiment Analyzer API</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #2c3e50; text-align: center; }
            .feature { margin: 20px 0; padding: 15px; background: #ecf0f1; border-radius: 5px; }
            .endpoint { background: #3498db; color: white; padding: 5px 10px; border-radius: 3px; font-family: monospace; }
            a { color: #3498db; text-decoration: none; }
            a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🌍 Climate Sentiment Analyzer API</h1>
            <p>Advanced sentiment analysis for climate-related text using VADER and custom climate lexicons.</p>
            
            <div class="feature">
                <h3>📊 Analyze Single Text</h3>
                <p><span class="endpoint">POST /analyze</span> - Analyze sentiment of a single text</p>
            </div>
            
            <div class="feature">
                <h3>📈 Batch Analysis</h3>
                <p><span class="endpoint">POST /analyze/batch</span> - Analyze multiple texts at once</p>
            </div>
            
            <div class="feature">
                <h3>🔍 Climate Keywords</h3>
                <p><span class="endpoint">GET /keywords</span> - Get list of climate-specific keywords</p>
            </div>
            
            <div class="feature">
                <h3>📚 API Documentation</h3>
                <p><a href="/docs">Interactive API Docs</a> | <a href="/redoc">ReDoc Documentation</a></p>
            </div>
        </div>
    </body>
    </html>
    """)

@app.post("/analyze", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment of a single text."""
    try:
        result = await analyze_sentiment_enhanced(
            request.text, 
            request.include_keywords
        )
        return SentimentResponse(**result)
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during analysis")

@app.post("/analyze/batch", response_model=BatchSentimentResponse)
async def analyze_batch_sentiment(request: BatchSentimentRequest):
    """Analyze sentiment of multiple texts."""
    try:
        start_time = datetime.now()
        
        # Process all texts
        tasks = [
            analyze_sentiment_enhanced(text, request.include_keywords) 
            for text in request.texts
        ]
        results = await asyncio.gather(*tasks)
        
        # Create response objects
        sentiment_responses = [SentimentResponse(**result) for result in results]
        
        # Calculate summary statistics
        total_texts = len(sentiment_responses)
        classifications = [r.classification for r in sentiment_responses]
        classification_counts = Counter(classifications)
        
        avg_compound = sum(r.sentiment['compound'] for r in sentiment_responses) / total_texts
        avg_confidence = sum(r.confidence for r in sentiment_responses) / total_texts
        
        summary = {
            "total_texts": total_texts,
            "classification_distribution": dict(classification_counts),
            "average_compound_score": avg_compound,
            "average_confidence": avg_confidence,
            "dominant_sentiment": max(classification_counts, key=classification_counts.get)
        }
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return BatchSentimentResponse(
            results=sentiment_responses,
            summary=summary,
            total_processed=total_texts,
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during batch analysis")

@app.get("/keywords")
async def get_climate_keywords():
    """Get list of climate-specific keywords used in analysis."""
    keywords_by_category = {
        "positive": {},
        "negative": {},
        "neutral": {}
    }
    
    for term, score in CLIMATE_LEXICON.items():
        clean_term = term.replace('_', ' ')
        if score > 0.5:
            keywords_by_category["positive"][clean_term] = score
        elif score < -0.5:
            keywords_by_category["negative"][clean_term] = score
        else:
            keywords_by_category["neutral"][clean_term] = score
    
    return {
        "keywords": keywords_by_category,
        "total_keywords": len(CLIMATE_LEXICON),
        "categories": {
            "positive": len(keywords_by_category["positive"]),
            "negative": len(keywords_by_category["negative"]),
            "neutral": len(keywords_by_category["neutral"])
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "service": "Climate Sentiment Analyzer API",
        "version": "1.0.0"
    }

@app.get("/stats")
async def get_stats():
    """Get API statistics."""
    return {
        "total_climate_keywords": len(CLIMATE_LEXICON),
        "vader_lexicon_size": len(analyzer.lexicon),
        "supported_languages": ["en"],
        "max_text_length": 10000,
        "max_batch_size": 100,
        "api_version": "1.0.0"
    }

@app.get("/news", response_model=NewsFeedResponse)
async def get_climate_news():
    try:
        articles = await fetch_and_analyse_news()
        return NewsFeedResponse(
            total=len(articles),
            generated_at=datetime.utcnow(),
            articles=articles,
        )
    except Exception as e:
        logger.error(f"/news error: {e}")
        raise HTTPException(500, "Failed to fetch news")
    
# --- main.py ---------------------------------------------------------------
@app.get("/reddit", response_model=RedditFeedResponse)
async def get_reddit_sentiment(
    subreddit: str = "climatechange",   # may be "india+environment"
    limit: int = 15,
):
    """Sentiment analysis for *hot* posts in one or many sub‑reddits."""
    try:
        names = re.split(r"[+,]", subreddit)          # ➊ split by + or ,
        names = [n.strip() for n in names if n.strip()]
        all_posts: list[RedditPost] = []

        # fetch each sub synchronously inside one background thread
        for name in names:
            posts = await fetch_and_analyse_reddit(name, limit // len(names))
            all_posts.extend(posts)

        # sort by Reddit score (optional)
        all_posts.sort(key=lambda p: p.score, reverse=True)

        return RedditFeedResponse(
            subreddit=",".join(names),
            total=len(all_posts),
            generated_at=datetime.utcnow(),
            posts=all_posts,
        )
    except Exception as e:
        logger.exception("/reddit failed")
        raise HTTPException(500, "Failed to fetch Reddit posts")
# --------------------------------------------------------------------------


    
# Exception handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"detail": f"Invalid input: {str(exc)}"}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )