import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../App.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        alert("Password reset successful");
        navigate("/");
      } else {
        alert(data.message || "Password reset failed");
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
        <p className="subtitle">Create a new password</p>
        <input
          type="password"
          placeholder="New Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>{loading ? "Updating..." : "Reset Password"}</button>
        <p><Link to="/">Back to login</Link></p>
      </form>
    </div>
  );
}

export default ResetPassword;
