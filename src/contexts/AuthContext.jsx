import { createContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);  // wait for Firebase

  // Firebase observer → keeps session on refresh
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ───────── Auth helpers ───────── */
  const register = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  /* ──────────────────────────────── */
  const value = { user, register, login, logout };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* render only after auth checked */}
    </AuthContext.Provider>
  );
}
