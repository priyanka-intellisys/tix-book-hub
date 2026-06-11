
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
  });

  const [loading, setLoading] = useState(false);

  // ✅ handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ handle submit (CONNECTED TO BACKEND)
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Register button clicked ✅"); // DEBUG

    // ✅ validation
    if (formData.name.length < 3) {
      alert("Name must be at least 3 characters");
      return;
    }

    if (formData.mobile.length !== 10) {
      alert("Enter valid mobile number");
      return;
    }

    setLoading(true);

    try {
      // ✅ API CALL
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("API called ✅"); // DEBUG

      let data;

      try {
        data = await response.json();
      } catch (err) {
        alert("Invalid response from server");
        setLoading(false);
        return;
      }

      if (response.ok) {
        console.log("Registration success ✅");

        alert("Registration Successful");
        navigate("/"); // ✅ go to login
      } else {
        alert(data.message || "Registration failed");
      }

    } catch (error) {
      console.log("ERROR:", error);
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

        <p className="subtitle">
          Create your account and start booking
        </p>

        {/* ✅ NAME */}
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        {/* ✅ MOBILE */}
        <input
          type="tel"
          name="mobile"
          placeholder="Mobile Number"
          value={formData.mobile}
          onChange={handleChange}
          required
        />

        {/* ✅ EMAIL */}
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />

        {/* ✅ PASSWORD */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {/* ✅ SUBMIT BUTTON */}
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;

