**Climate Connect**

**Climate Connect** is a full-stack web application that performs **real-time sentiment analysis** on climate change-related content. It helps visualize public opinion using live data from Reddit and news sources, while also allowing users to save posts and analyze custom text.

---

## 🚀 Features

- 🧠 **Live Sentiment Analyzer**  
  Paste any text and receive instant VADER‑based sentiment with climate‑lexicon enhancements. 

- 📰 **News Analysis**  
  Pulls the latest “climate / global‑warming” headlines (GNews API) and colours them by sentiment.

- 👥 **Reddit Sentiment Explorer**  
  Streams recent posts from chosen sub‑reddits, classifies each title, and lets users **save** favourites.

- 💾 **Save Favorite Posts**  
  Logged‑in users can bookmark Reddit items. Firestore provides real‑time sync to the **My Interests** page.

---

  ## 🛠️ Tech Stack

| Layer        | Stack                                                    |
|--------------|----------------------------------------------------------|
| **Frontend** | React 18 · Vite · React‑Router · Recharts · custom CSS |
| **Auth / DB**| Firebase Auth · Cloud Firestore (modular SDK)            |
| **Backend**  | Python 3.11 · FastAPI · Uvicorn · `vaderSentiment` · `praw` · `httpx` |
| **APIs**     | GNews API · Reddit API (via PRAW)                        |


## 📁 Project Structure
climate-connect/
│
├── backend/               # FastAPI backend
│   ├── main.py            # All API routes and logic
│   ├── .env.example       # Backend environment variables
│   ├── requirements.txt
│
├── src/                   # React frontend
│   ├── assets/
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   ├── utils/
│   ├── firebase.js        # Firebase config
│   ├── main.jsx
│   ├── App.jsx
│
├── .gitignore
├── README.md
├── package.json
└── vite.config.js

## 🔐 Prerequisites
Python 3.10+

Node.js and npm

Firebase project with Auth and Firestore enabled

GNews & Reddit API credentials

## Setup
🧪 Backend Setup
cd backend
python -m venv .venv
source .venv/Scripts/activate  # or . .venv/bin/activate (Linux/Mac)
pip install -r requirements.txt
cp .env.example .env  # then fill in API keys
uvicorn main:app --reload

💻 Frontend Setup
npm install
npm run dev

## 🔑 Environment Variables

backend/.env

GNEWS_API_KEY=your_gnews_api_key

REDDIT_CLIENT_ID=your_reddit_client_id

REDDIT_CLIENT_SECRET=your_reddit_secret

REDDIT_USER_AGENT=ClimateConnect/1.0

src/.env

VITE_FIREBASE_API_KEY=your_firebase_key

VITE_FIREBASE_PROJECT_ID=your_project_id

VITE_BACKEND_URL=http://localhost:8000

👤 Connect

Ravina Vartak

📧 ravinavartak@email.com

🌐 GitHub – https://github.com/Ravinavartak

🔗 Linkedin - https://www.linkedin.com/in/ravina-vartak0912/
