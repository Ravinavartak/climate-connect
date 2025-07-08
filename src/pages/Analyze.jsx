import { useState, useRef, useEffect } from "react";
import "./Analyze.css";           // ← the stylesheet below

export default function Analyze() {
  /* ────────────── state ────────────── */
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const textareaRef = useRef(null);

  /* auto‑resize textarea */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [text]);

  /* ────────────── handlers ────────────── */
  const handleAnalyze = async () => {
    if (!text.trim()) {
      alert("Please enter some text to analyze!");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, include_keywords: true }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Error while contacting the analysis API.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
  };

  const setExample = (sample) => {
    setText(sample);
    // optional: auto‑run analysis right away
    handleAnalyze();
  };

  /* ────────────── helpers ────────────── */
  const overallClass = (cls) =>
    cls === "positive"
      ? "positive"
      : cls === "negative"
      ? "negative"
      : "neutral";

  /* ────────────── render ────────────── */
  return (
    <div className="analyze-page">
    <div className="container">
      <h1>🌍 Climate Sentiment Analyzer</h1>
      <p className="subtitle">
        Analyze the emotional tone of climate‑related text using advanced AI
      </p>

      {/* input */}
      <div className="input-container">
        <label htmlFor="textInput">Enter your climate‑related text:</label>
        <textarea
          id="textInput"
          ref={textareaRef}
          value={text}
          placeholder="e.g., 'The recent climate summit brought hope for renewable energy initiatives and carbon reduction goals...'"
          maxLength={5000}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {/* buttons */}
      <div className="button-container">
        <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>
          🔍 Analyze Sentiment
        </button>
        <button className="clear-btn" onClick={handleClear}>🗑️ Clear</button>
      </div>

      {/* loader */}
      {loading && (
        <div className="loading show">
          <div className="spinner"></div>
          <p>Analyzing sentiment...</p>
        </div>
      )}

      {/* results */}
      {result && (
        <div className="results show">
          <div className="sentiment-score">
            <span className="score-label">Overall Sentiment:</span>
            <span
              id="sentimentLabel"
              className={`score-value ${overallClass(result.classification)}`}
            >
              {result.classification.charAt(0).toUpperCase() +
                result.classification.slice(1)}
            </span>
          </div>

          <div className="breakdown">
            <Metric label="Compound Score" value={result.sentiment.compound.toFixed(3)} />
            <Metric label="Positive" value={(result.sentiment.positive * 100).toFixed(1) + "%"} />
            <Metric label="Neutral"  value={(result.sentiment.neutral  * 100).toFixed(1) + "%"} />
            <Metric label="Negative" value={(result.sentiment.negative * 100).toFixed(1) + "%"} />
          </div>

          <div className="climate-insights">
            <div className="insights-title">🌱 Climate Context Insights</div>
            <div className="insights-text">
              {result.climate_keywords && result.climate_keywords.length ? (
                <>
                  Top keywords:&nbsp;
                  {result.climate_keywords
                    .slice(0, 5)
                    .map((kw) => kw.keyword)
                    .join(", ")}
                  .
                </>
              ) : (
                "No specific climate keywords detected."
              )}
            </div>
          </div>
        </div>
      )}

      {/* examples */}
      <div className="examples">
        <h3>💡 Try these examples:</h3>
        {[
          "Renewable energy sources like solar and wind power are becoming more affordable and efficient, offering hope for a sustainable future.",
          "The devastating effects of climate change are becoming increasingly evident through extreme weather events and rising sea levels.",
          "Climate change is a complex issue that requires balanced approaches considering both environmental and economic factors.",
        ].map((sample, i) => (
          <div key={i} className="example" onClick={() => setExample(sample)}>
            {sample}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}

/* small presentational helper */
function Metric({ label, value }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}
