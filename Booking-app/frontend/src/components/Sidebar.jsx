import React from "react";
import {
  FaFilm,
  FaHome,
  FaPlane,
  FaRegHeart,
  FaRegUser,
  FaSearch,
  FaSignOutAlt,
  FaTicketAlt,
  FaWallet,
} from "react-icons/fa";

const links = [
  { label: "Home", path: "/dashboard", icon: <FaHome /> },
  { label: "Movies", path: "/dashboard/movies", icon: <FaFilm /> },
  { label: "Flights", path: "/dashboard/flights", icon: <FaPlane /> },
  { label: "Browse Deals", path: "/dashboard/browse", icon: <FaSearch /> },
  { label: "My Bookings", path: "/dashboard/my-bookings", icon: <FaTicketAlt /> },
  { label: "TixWallet", path: "/dashboard/wallet", icon: <FaWallet /> },
  { label: "Wishlist", path: "/dashboard/wishlist", icon: <FaRegHeart /> },
  { label: "Profile", path: "/dashboard/profile", icon: <FaRegUser /> },
];

function Sidebar({ currentPath = "/dashboard", goTo, handleLogout }) {
  const isActive = (path) => path === "/dashboard" ? currentPath === path : currentPath.startsWith(path);

  return (
    <aside className="sidebar">
      <div className="logo-section" onClick={() => goTo("/dashboard")} style={{ cursor: "pointer" }}>
        <div className="logo-icon">TH</div>
        <h2>TixHub</h2>
      </div>

      <nav className="sidebar-menu">
        {links.map((link) => (
          <button key={link.path} className={isActive(link.path) ? "active" : ""} onClick={() => goTo(link.path)}>
            {link.icon} <span>{link.label}</span>
          </button>
        ))}
      </nav>

      <button className="logout-btn" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
    </aside>
  );
}

export default Sidebar;
