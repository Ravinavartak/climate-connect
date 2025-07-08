import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import NavBar from "../components/NavBar";
import FeatureCard from "../components/FeatureCard";
import banner from "../assets/banner.png";

export default function Home() {
  const { user } = useContext(AuthContext);
  const greeting = user.displayName || user.email;

  const features = [
    {
      title: "Live Sentiment Analyzer",
      desc: "Instantly gauge the mood of any text with sentiment analysis powered by climate-connect.",
      path: "/analyze"
    },
    {
      title: "Your Reddit Saved Posts",
      desc: "Save the reddit posts that attracts you the most.",
      path: "/interests"
    },
    {
      title: "Climate News Feed",
      desc: "Track sentiment in the latest climate news and stay informed about global trends.",
      path: "/news"
    },
    {
      title: "Reddit Trends Dashboard",
      desc: "See what r/climatechange is talking about with real-time sentiment tracking.",
      path: "/reddit"
    },
  ];



  return (
    <>
      {/* 1. Top Navigation */}
      <NavBar greeting={greeting} />

      {/* 2. Hero Banner */}
      <section
        className="hero"
        style={{ backgroundImage: `url(${banner})` }}
      >
        <div className="hero-overlay">
          <h1 className="hero-title">Climate Insights at a Glance</h1>
          <p className="hero-sub">Analyze • Discuss • Track</p>
        </div>
      </section>

      {/* 3. Features Section (cards) */}
      <section className="features">
        {features.map((feature) => (
          <FeatureCard
            key={feature.path}
            title={feature.title}
            desc={feature.desc}
            path={feature.path}
          />
        ))}
      </section>
    </>
  );
}