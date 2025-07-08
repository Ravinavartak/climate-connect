import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  /* ─── helpers ─── */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        /* -------- Login flow -------- */
        await signInWithEmailAndPassword(auth, form.email, form.password);
      } else {
        /* -------- Sign‑up flow -------- */
        const cred = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        /* Optional: save displayName */
        if (form.name.trim()) {
          await updateProfile(cred.user, { displayName: form.name.trim() });
        }
      }

      /* ✅ success → go to dashboard */
      navigate("/home", { replace: true });
    } catch (err) {
      /* strip the Firebase prefix for cleaner message */
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? "Login" : "Create Account"}</h2>

      <form onSubmit={handleSubmit}>
        {/* name field only in Sign‑Up mode */}
        {!isLogin && (
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password (min 6 chars)"
          value={form.password}
          onChange={handleChange}
          required
          minLength={6}
        />

        {error && (
          <p style={{ color: "#ff5252", marginTop: 6, fontSize: "0.9rem" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait…" : isLogin ? "Login" : "Register"}
        </button>
      </form>

      <p style={{ marginTop: 20 }}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <span
          onClick={() => setIsLogin(!isLogin)}
          style={{ cursor: "pointer", color: "#26a69a", marginLeft: 6 }}
        >
          {isLogin ? "Sign up" : "Login"}
        </span>
      </p>
    </div>
  );
}
