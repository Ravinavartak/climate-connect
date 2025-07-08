import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./contexts/AuthContext";
import AuthForm from "./components/AuthForm";
import Home from "./pages/Home";
import Analyze from "./pages/Analyze";
import Interests from "./pages/Interests";
import Reddit from "./pages/RedditFeed";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import ClimateNewsFeed from "./pages/ClimateNewsFeed";
import RedditFeed from "./pages/RedditFeed";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route (Auth) */}
          <Route path="/" element={<AuthForm />} />
          
          {/* Protected group - All feature pages are protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/interests" element={<Interests />} />
            <Route path="/news" element={<ClimateNewsFeed />} />
            <Route path="/reddit" element={<RedditFeed />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<AuthForm />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);