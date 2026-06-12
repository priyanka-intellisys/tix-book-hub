import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.name.trim().length < 3) return alert("Name must be at least 3 characters");
    if (!/^\d{10}$/.test(formData.mobile)) return alert("Enter valid 10 digit mobile number");
    if (formData.password.length < 6) return alert("Password must be at least 6 characters");
    if (formData.password !== formData.confirmPassword) return alert("Passwords do not match");

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "ticketproUser",
          JSON.stringify({
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            status: data.user.status,
            image: data.user.image || "https://randomuser.me/api/portraits/men/1.jpg",
          })
        );

        navigate(data.user.role === "vendor" ? "/vendor-dashboard" : "/dashboard");
      } else {
        alert(data.message || "Registration failed");
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

        <p className="subtitle">Create your account and start booking</p>

        <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
        <input type="tel" name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
        <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
        <select name="role" value={formData.role} onChange={handleChange} required>
          <option value="user">User</option>
          <option value="vendor">Vendor</option>
        </select>

        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>

        <p>Already have an account? <Link to="/">Login</Link></p>
      </form>
    </div>
  );
}

export default Register;
