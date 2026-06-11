import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {

  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    role: "user",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ VALIDATION
    if (!loginData.email.includes("@")) {
      return alert("Enter valid email");
    }

    if (loginData.password.length < 5) {
      return alert("Password must be 5+ characters");
    }

    setLoading(true);

    try {

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      const data = await response.json();

      if (response.ok) {

        // ✅ SAVE TOKEN
        localStorage.setItem("token", data.token);

        localStorage.setItem(
          "tixhubUser",
          JSON.stringify(data.user)
        );

        alert("Login Successful ✅");

        // ✅ ROLE BASED LOGIN
        if (loginData.role === "admin") {
          navigate("/admin-dashboard");
        } else if (loginData.role === "vendor") {
          navigate("/vendor-dashboard");
        } else {
          navigate("/dashboard");
        }

      } else {
        alert(data.message || "Login failed");
      }

    } catch (error) {
      console.log(error);
      alert("Server error");
    }

    setLoading(false);
  };

  return (

    <div className="container">

      <form className="form" onSubmit={handleSubmit}>

        <h1>TixHub Login 🎬</h1>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={loginData.email}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={loginData.password}
          onChange={handleChange}
        />

        {/* ✅ ROLE DROPDOWN */}

        

        <button type="submit">
          {loading ? "Logging..." : "Login"}
        </button>

        <p>
          Don't have account?{" "}
          <Link to="/register">Register</Link>
        </p>

      </form>
    </div>
  );
}

export default Login;