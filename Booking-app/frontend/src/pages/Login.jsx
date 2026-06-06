import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

function Login() {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // HANDLE INPUT CHANGE
  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  // HANDLE LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();

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

      let data;

      try {
        data = await response.json();
      } catch (err) {
        alert("Server returned invalid response");
        setLoading(false);
        return;
      }

      // LOGIN SUCCESS
      if (response.ok) {

        // SAVE TOKEN
        localStorage.setItem("token", data.token);

        // SAVE CURRENT USER
        localStorage.setItem(
          "ticketproUser",
          JSON.stringify({
            name: data.user.name,
            email: data.user.email,

            // DEFAULT IMAGE IF NO IMAGE FROM DATABASE
            image:
              data.user.image ||
              "https://randomuser.me/api/portraits/men/1.jpg",
          })
        );

        alert("Login Successful");

        navigate("/dashboard");

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

        <div className="logo">
          <h1>
            Tix<span>Hub</span>
          </h1>
        </div>

        <p className="subtitle">
          Welcome back to TixHub
        </p>

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={loginData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={loginData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          Don't have an account?{" "}
          <Link to="/register">
            Register
          </Link>
        </p>

      </form>
    </div>
  );
}

export default Login;