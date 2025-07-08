import { useEffect, useState } from "react";
import {
  /* --- NEW --- */
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  /* ----------- */
  Cell,
  Tooltip,
} from "recharts";
import "./News.css";

const COLORS = ["#2ecc71", "#f39c12", "#e74c3c"]; // pos / neu / neg

export default function ClimateNewsFeed() {
  const [articles, setArticles] = useState([]);
  const [radialData, setRadialData] = useState([]);   // <‑‑ renamed

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8000/news");
        const data = await res.json();
        setArticles(data.articles || []);

        /* build counts */
        const counts = { Positive: 0, Neutral: 0, Negative: 0 };
        (data.articles || []).forEach((a) => {
          const key =
            a.sentiment.charAt(0).toUpperCase() + a.sentiment.slice(1);
          counts[key]++;
        });

        /* prepare radial‑bar data */
        setRadialData([
          { name: "Positive", value: counts.Positive, fill: COLORS[0] },
          { name: "Neutral",  value: counts.Neutral,  fill: COLORS[1] },
          { name: "Negative", value: counts.Negative, fill: COLORS[2] },
        ]);
      } catch (err) {
        console.error("News fetch error:", err);
      }
    })();
  }, []);

  return (
    <div className="news-page">
      <div className="news-container">
        <h1>📰 Climate News Sentiment</h1>

        {/* ── Radial Bar Chart ── */}
        <ResponsiveContainer width="100%" height={320}>
          <RadialBarChart
            innerRadius="35%"
            outerRadius="100%"
            data={radialData}
            startAngle={90}
            endAngle={-270}      /* makes a full circular gauge */
          >
            <RadialBar
              minAngle={15}       /* each slice at least visible */
              background
              clockWise
              dataKey="value"
              cornerRadius={6}
            />
            <Legend
              iconSize={12}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
            <Tooltip />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* ── Articles ── */}
        <div className="article-list">
          {articles.map((a, i) => (
            <article className={`card ${a.sentiment}`} key={i}>
              <h3>{a.title}</h3>

              <small>
                {a.source} &nbsp;|&nbsp;
                {new Date(a.published_at).toLocaleDateString()}
              </small>

              <p>
                <span className="sentiment-label">Sentiment:</span>&nbsp;
                <span className={`sentiment ${a.sentiment}`}>
                  {a.sentiment.charAt(0).toUpperCase() + a.sentiment.slice(1)}
                </span>
              </p>

              <a href={a.url} target="_blank" rel="noreferrer">
                Read full article →
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
