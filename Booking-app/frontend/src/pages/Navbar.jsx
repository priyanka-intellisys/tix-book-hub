import React from "react";
import { Link } from "react-router-dom";
import {
  FaTicketAlt,
  FaUserCircle,
  FaHome
} from "react-icons/fa";

import "./MyBookings.css";

function Navbar() {
  return (
    <nav className="navbar">

      <div className="logo">
        <FaTicketAlt />
        <span>TixHub</span>
      </div>

      <div className="nav-links">
        <Link to="/dashboard">
          <FaHome /> Dashboard
        </Link>

        <Link to="/myBookings">
          My Bookings
        </Link>

        <Link to="/">
          Logout
        </Link>
      </div>

      <FaUserCircle className="profile-icon" />
    </nav>
  );
}

export default Navbar;