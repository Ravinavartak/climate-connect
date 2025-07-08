import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { listenSavedPosts } from "../utils/savedPosts";
import "./Reddit.css";

export default function Interests() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        const unsubscribePosts = listenSavedPosts(setPosts);
        return () => unsubscribePosts(); // unsubscribe on unmount
      } else {
        setPosts([]);
      }
    });

    return () => unsubscribeAuth(); // clean up auth listener
  }, []);

  return (
    <div className="reddit-page">
      <div className="reddit-container">
        <h1>📌 Your Saved Posts</h1>

        {loading ? (
          <p>Loading your saved posts...</p>
        ) : !user ? (
          <p>Please <strong>log in</strong> to view your saved posts.</p>
        ) : posts.length === 0 ? (
          <p>No bookmarks yet – hit the 💾 Save button on a post.</p>
        ) : (
          <div className="reddit-posts">
            {posts.map((p, i) => (
              <article key={i} className={`reddit-post ${p.sentiment?.toLowerCase() || ""}`}>
                <h3>{p.title}</h3>
                <p><strong>Sentiment:</strong> {p.sentiment}</p>
                <p><strong>Score:</strong> {p.score}</p>
                <a href={p.url} target="_blank" rel="noreferrer">🔗 Open on Reddit</a>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
