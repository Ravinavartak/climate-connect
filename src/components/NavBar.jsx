import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function NavBar({ greeting }) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="navbar">
      <span className="brand">Climate Connect</span>
      <span className="welcome-nav">Welcome, {greeting}</span>
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
}
