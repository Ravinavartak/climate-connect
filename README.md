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
