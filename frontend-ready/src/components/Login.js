import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(API('auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      const user = { ...data.user, token: data.token };
      localStorage.setItem("ea_user", JSON.stringify(user));
      if (onLogin) onLogin(user);

      if (user.role === "teacher") navigate("/teacher");
      else if (user.role === "student") navigate("/student");
      else navigate("/admin");
    } catch (error) {
      const message = error.message === "Failed to fetch"
        ? `Cannot reach the backend. Make sure the server is running and accessible at: ${API('')}`
        : error.message;
      alert(`❌ ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white shadow-lg p-8 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">🔐 Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">New here? </span>
          <Link to="/register" className="text-blue-600 hover:underline">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
