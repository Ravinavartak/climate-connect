import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

/** Save array of subreddits for the current user */
export async function saveInterests(interests) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  await setDoc(
    doc(db, "users", user.uid),
    { interests },
    { merge: true }
  );
}

/** Read interests.  Returns [] if nothing saved yet */
export async function loadInterests() {
  const user = auth.currentUser;
  if (!user) return [];

  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() ? snap.data().interests || [] : [];
}
