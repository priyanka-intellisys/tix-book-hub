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
    role: "user",
  });

  const [loading, setLoading] = useState(false);

  /* HANDLE INPUT CHANGE */

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

  };

  /* HANDLE SUBMIT */

  const handleSubmit = async (e) => {

    e.preventDefault();

    /* ✅ VALIDATION */

    if (formData.name.trim().length < 3) {
      return alert("Name must be at least 3 characters");
    }

    if (!/^[0-9]{10}$/.test(formData.mobile)) {
      return alert("Enter valid 10-digit mobile number");
    }

    if (!formData.email.includes("@")) {
      return alert("Invalid email address");
    }

    if (formData.password.length < 5) {
      return alert("Password must be 5+ characters");
    }

    setLoading(true);

    try {

      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        alert("Server error (invalid response)");
        setLoading(false);
        return;
      }

      if (response.ok) {

        alert("Registration Successful ✅");

        navigate("/");

      } else {

        alert(data.message || "Registration failed");

      }

    } catch (error) {

      console.log(error);

      alert("Server not running / API error");

    }

    setLoading(false);

  };

  return (

    <div className="container">

      <form className="form" onSubmit={handleSubmit}>

        <h1>TixHub Register 🚀</h1>

        {/* NAME */}
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        {/* MOBILE */}
        <input
          type="text"
          name="mobile"
          placeholder="Mobile Number"
          value={formData.mobile}
          onChange={handleChange}
          required
        />

        {/* EMAIL */}
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />

        {/* PASSWORD */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {/* ✅ ROLE DROPDOWN */}

        {/* <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="user">User</option>
          <option value="vendor">Vendor</option>
          <option value="admin">Admin</option>
        </select> */}

        {/* BUTTON */}
        <button type="submit" disabled={loading}>

          {loading ? "Creating..." : "Register"}

        </button>

        {/* LINK */}
        <p>
          Already have account?{" "}
          <Link to="/">Login</Link>
        </p>

      </form>

    </div>

  );
}

export default Register;