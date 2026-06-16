import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

function Login() {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setLoginData({ ...loginData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("ticketproUser");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("ticketproUser");

        const storage = loginData.rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", data.token);
        storage.setItem(
          "ticketproUser",
          JSON.stringify({
            name: data.user.name,
            email: data.user.email,
            mobile: data.user.mobile,
            role: data.user.role,
            status: data.user.status,
            image: data.user.image || "https://randomuser.me/api/portraits/men/1.jpg",
          })
        );

        const landing = data.user.role === "admin"
          ? "/admin-dashboard"
          : data.user.role === "vendor"
            ? "/vendor-dashboard"
            : "/dashboard";

        navigate(landing);
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      alert("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <form className="form" onSubmit={handleSubmit}>
        <div className="logo">
          <h1>
            Tix<span>Hub</span>
          </h1>
        </div>

        <p className="subtitle">Welcome back to TixHub</p>

        <input type="email" name="email" placeholder="Email Address" value={loginData.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={loginData.password} onChange={handleChange} required />

        <label className="inline-check">
          <input type="checkbox" name="rememberMe" checked={loginData.rememberMe} onChange={handleChange} />
          Remember me
        </label>

        <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>

        <p><Link to="/forgot-password">Forgot password?</Link></p>
        <p>Don't have an account? <Link to="/register">Register</Link></p>
      </form>
    </div>
  );
}

export default Login;
