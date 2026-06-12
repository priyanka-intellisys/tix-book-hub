import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        setResetToken(data.resetToken || "");
        alert(data.message);
      } else {
        alert(data.message || "Unable to create reset request");
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
        <p className="subtitle">Reset your password</p>
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</button>
        {resetToken && (
          <p>
            Reset link: <Link to={`/reset-password/${resetToken}`}>Open reset page</Link>
          </p>
        )}
        <p><Link to="/">Back to login</Link></p>
      </form>
    </div>
  );
}

export default ForgotPassword;
