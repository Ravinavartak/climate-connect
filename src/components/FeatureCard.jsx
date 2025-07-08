import { Link } from "react-router-dom";

export default function FeatureCard({ title, desc, img, path }) {
  return (
    <Link to={path} className="feature-card">
      {img && <img src={img} alt={title} />}
      <h3>{title}</h3>
      <p>{desc}</p>
    </Link>
  );
}
