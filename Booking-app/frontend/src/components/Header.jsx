import React from "react";
import { FaMapMarkerAlt, FaRegBell } from "react-icons/fa";

function Header({ user, goTo }) {
  return (
    <header className="top-header">
      <div className="location-picker">
        <FaMapMarkerAlt className="marker-icon" />
        <select defaultValue="Pune">
          <option value="Pune">Pune, India</option>
          <option value="Mumbai">Mumbai, India</option>
          <option value="Delhi">Delhi, India</option>
          <option value="Bangalore">Bangalore, India</option>
        </select>
      </div>

      <div className="header-actions">
        <button className="icon-notification-btn" onClick={() => goTo("/dashboard/notifications")}><FaRegBell /></button>
        <div className="user-profile" onClick={() => goTo("/dashboard/profile")} style={{ cursor: "pointer" }}>
          <div className="user-avatar"><img src={user.image} alt={user.name} /></div>
          <div className="user-details"><h4>{user.name}</h4><p>Welcome Back</p></div>
        </div>
      </div>
    </header>
  );
}

export default Header;
