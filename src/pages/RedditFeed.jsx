/*  ==== RedditFeed.jsx (complete) ====  */
import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";          // <-- make sure this path is correct
import "./Reddit.css";
// import { loadInterests } from "../utils/userPrefs";

/* ---------- colour palette ---------- */
const COLORS = {
  positive: "#2ecc71",
  neutral : "#f1c40f",
  negative: "#e74c3c",
};

export default function RedditFeed() {
  /* -------- state -------- */
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [sentiment, setSentiment] = useState({ positive:0, neutral:0, negative:0 });
  const [saving, setSaving]       = useState(new Set());    // url‑hashes already saved this session

  /* -------- fetch Reddit once -------- */
  useEffect(() => {
    (async () => {
      setLoading(true);

      // const subs  = await loadInterests();      // optional personalisation
      // const query = subs.length ? subs.join("+") : "climatechange";
      const query = "climatechange";

      try {
        const res = await fetch(
          `http://127.0.0.1:8000/reddit?subreddit=${query}&limit=15`
        );
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`API ${res.status}: ${msg}`);
        }
        const data    = await res.json();
        const fetched = data.posts || [];

        /* sentiment counters */
        const counts = { positive:0, neutral:0, negative:0 };
        fetched.forEach(p => counts[p.sentiment.toLowerCase()]++);
        setSentiment(counts);
        setPosts(fetched);
      } catch (err) {
        console.error("Reddit fetch failed:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- pie‑chart data ---------- */
  const chartData = [
    { name: "Positive", value: sentiment.positive },
    { name: "Neutral" , value: sentiment.neutral  },
    { name: "Negative", value: sentiment.negative },
  ];

  /* ---------- helpers ---------- */
  const auth  = getAuth();
  const user  = auth.currentUser;

  /** save post to Firestore (and mark as saved in UI) */
  const savePost = async (post) => {
    if (!user) {
      alert("Please log in to save posts.");
      return;
    }

    const hash = btoa(post.url).slice(0, 20);         // simple stable id
    if (saving.has(hash)) return;                     // already saved

    setSaving(prev => new Set(prev).add(hash));       // optimistic UI

    try {
      await setDoc(
        doc(db, "users", user.uid, "savedPosts", hash),
        {
          ...post,
          savedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Firestore save failed:", e);
      alert("Could not save post.");
      setSaving(prev => {
        const next = new Set(prev);
        next.delete(hash);
        return next;
      });
    }
  };

  /* native share / clipboard fallback */
  const share = (title, url) => {
    if (navigator.share) {
      navigator.share({ title: `Reddit Post: ${title}`, url })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("🔗 Link copied!");
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="reddit-page">
      <div className="reddit-container">
        <h1>👾 Reddit Climate Sentiment</h1>

        {loading && <p>Loading posts…</p>}
        {!loading && error && <p style={{ color: "crimson" }}>Error: {error}</p>}

        {!loading && !error && posts.length === 0 && (
          <p>
            No posts. Add topics in&nbsp;
            <Link to="/interests" style={{ color: "#26a69a" }}>
              My Interests
            </Link>.
          </p>
        )}

        {!loading && !error && posts.length > 0 && (
          <>
            {/* ---------- pie chart ---------- */}
            <div className="sentiment-graph">
              <h3>📊 Overall Sentiment Breakdown</h3>
              <ResponsiveContainer width="100%" height={290}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    label
                  >
                    {chartData.map((e, i) => (
                      <Cell key={i} fill={COLORS[e.name.toLowerCase()]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* ---------- post list ---------- */}
            <div className="reddit-posts">
              {posts.map((p, i) => {
                const idHash = btoa(p.url).slice(0, 20);
                const already = saving.has(idHash);
                return (
                  <article
                    className={`reddit-post ${p.sentiment.toLowerCase()}`}
                    key={i}
                  >
                    <h3>{p.title}</h3>

                    <p>
                      <strong>Sentiment:</strong>{" "}
                      <span style={{ color: COLORS[p.sentiment.toLowerCase()] }}>
                        {p.sentiment}
                      </span>
                    </p>

                    <p>
                      <strong>Score:</strong> {p.score}
                    </p>

                    <a href={p.url} target="_blank" rel="noreferrer">
                      🔗 Read on Reddit
                    </a>

                    <div className="btn-row">
                      <button
                        className="share-btn"
                        onClick={() => share(p.title, p.url)}
                      >
                        🔗 Share
                      </button>

                      <button
                        className="share-btn"
                        style={{ opacity: already ? 0.6 : 1 }}
                        onClick={() => savePost(p)}
                        disabled={already}
                      >
                        {already ? "Saved ✓" : "💾 Save"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
