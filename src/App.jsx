import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./components/Chat";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🔐 CHECK TOKEN
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // ✅ LOGIN HANDLER
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // 🚪 LOGOUT HANDLER
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* 🔐 AUTH ROUTES */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/chat" />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/register"
          element={
            isLoggedIn ? <Navigate to="/chat" /> : <Register />
          }
        />

        {/* 💬 PROTECTED CHAT */}
        <Route
          path="/chat"
          element={
            isLoggedIn ? (
              <Chat onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 🔁 DEFAULT REDIRECT */}
        <Route
          path="*"
          element={
            <Navigate to={isLoggedIn ? "/chat" : "/login"} />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;