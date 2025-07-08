/*  utils/savedPosts.js  */
import {
  collection, onSnapshot, query, orderBy
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db }     from "../firebase";

/**
 * Listen to the current user's saved posts.
 * Resolves with an `unsubscribe()` function.
 *
 * @param {(posts: any[]) => void} cb  callback that receives the array
 */
export function listenSavedPosts(cb) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    cb([]);                         // not logged‑in → empty list
    return () => {};
  }

  const q = query(
    collection(db, "users", user.uid, "savedPosts"),
    orderBy("savedAt", "desc")      // newest first
  );

  // Realtime listener
  const unsub = onSnapshot(q, (snap) => {
    const posts = snap.docs.map((d) => d.data());
    cb(posts);
  });

  return unsub;
}
