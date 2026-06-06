import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaSearch,
  FaRegHeart,
  FaTicketAlt,
  FaRegUser,
  FaBus,
  FaPlane,
  FaFilm,
  FaSuitcaseRolling,
  FaHotel,
  FaRegBell,
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaStar,
} from "react-icons/fa";

import "./Dashboard.css";

/* =========================
   CATEGORY DATA
========================= */

const categories = [
  { id: "movies", name: "Movies", icon: <FaFilm /> },
  { id: "flights", name: "Flights", icon: <FaPlane /> },
  { id: "buses", name: "Buses", icon: <FaBus /> },
  { id: "hotels", name: "Hotels", icon: <FaHotel /> },
  { id: "travel", name: "Holidays", icon: <FaSuitcaseRolling /> },
];

/* =========================
   TRENDING BOOKINGS
========================= */

const topRecommendations = [
  {
    id: 1,
    title: "Avatar: The Way of Water",
    location: "Inox: Pune",
    date: "Jun 12, 2026",
    price: "₹250",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    title: "Mumbai Express (Premium Sleeper)",
    location: "Shivajinagar to Borivali",
    date: "Jun 15, 2026",
    price: "₹750",
    rating: "4.6",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    title: "Goa Beach Resort Package",
    location: "3 Days / 2 Nights",
    date: "Jun 20, 2026",
    price: "₹4,999",
    rating: "4.7",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
  },
];

/* =========================
   UPCOMING BOOKINGS
========================= */

const upcomingBookings = [
  {
    id: 1,
    type: "flight",
    title: "IndiGo 6E-214",
    subtitle: "Pune (PNQ) → Delhi (DEL)",
    time: "Jun 20, 2026 • 7:00 PM",
    details: "1 Ticket • Economy • Seat 12B",
    price: "₹4,240.00",
    status: "Confirmed",
    icon: <FaPlane />,
  },
  {
    id: 2,
    type: "bus",
    title: "Hanif Enterprise",
    subtitle: "Pune → Mumbai",
    time: "Jun 22, 2026 • 6:30 AM",
    details: "2 Tickets • Sleeper • Seat C2, C3",
    price: "₹1,000.00",
    status: "Confirmed",
    icon: <FaBus />,
  },
];

/* =========================
   DASHBOARD COMPONENT
========================= */

function Dashboard() {
  const [activeMenu, setActiveMenu] = useState("Home");

  /* =========================
     USER PROFILE STATE
  ========================= */

  const [user, setUser] = useState({
    name: "Guest User",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
  });

  /* =========================
     LOAD USER FROM LOCALSTORAGE
  ========================= */

  useEffect(() => {
    const savedUser = localStorage.getItem("ticketproUser");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  /* =========================
     LOGOUT FUNCTION
  ========================= */

  const handleLogout = () => {
    localStorage.removeItem("ticketproUser");
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-container">
      
      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">TH</div>
          <h2>
            Tixhub<span></span>
          </h2>
        </div>

        <nav className="sidebar-menu">
          <button
            className={activeMenu === "Home" ? "active" : ""}
            onClick={() => setActiveMenu("Home")}
          >
            <FaHome /> Home
          </button>

          <button
            className={activeMenu === "Browse" ? "active" : ""}
            onClick={() => setActiveMenu("Browse")}
          >
            <FaSearch /> Browse Deals
          </button>

          <button
            className={activeMenu === "Bookings" ? "active" : ""}
            onClick={() => setActiveMenu("Bookings")}
          >
            <FaTicketAlt /> My Bookings
          </button>

          <button
            className={activeMenu === "Wishlist" ? "active" : ""}
            onClick={() => setActiveMenu("Wishlist")}
          >
            <FaRegHeart /> Wishlist
          </button>

          <button
            className={activeMenu === "Profile" ? "active" : ""}
            onClick={() => setActiveMenu("Profile")}
          >
            <FaRegUser /> Profile
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="main-content">

        {/* HEADER */}

        <header className="top-header">
          <div className="location-picker">
            <FaMapMarkerAlt className="marker-icon" />

            <select defaultValue="Pune">
              <option value="Pune">Pune, India</option>
              <option value="Mumbai">Mumbai, India</option>
              <option value="Delhi">Delhi, India</option>
            </select>
          </div>

          <div className="header-actions">
            <button className="icon-notification-btn">
              <FaRegBell />
            </button>

            {/* USER PROFILE */}

            <div className="user-profile">
              <div className="user-avatar">
                <img src={user.image} alt={user.name} />
              </div>

              <div className="user-details">
                <h4>{user.name}</h4>
                <p>Welcome Back 👋</p>
              </div>
            </div>
          </div>
        </header>

        {/* HERO BANNER */}

        <section className="hero-banner">
          <div className="hero-text">
            <h1>
              Discover Amazing
              <br />
              Bookings Everywhere
            </h1>
          </div>

          <div className="search-bar-container">
            <FaSearch className="search-input-icon" />

            <input
              type="text"
              placeholder="Search movies, flights, buses, destinations..."
            />

            <button className="search-submit-btn">
              Search
            </button>
          </div>
        </section>

        {/* CATEGORIES */}

        <section className="section-block">
          <div className="section-header">
            <h3>Categories</h3>
            <span className="view-all">View All</span>
          </div>

          <div className="categories-grid">
            {categories.map((cat) => (
              <div key={cat.id} className="category-card">
                <div className={`category-icon-wrapper ${cat.id}`}>
                  {cat.icon}
                </div>

                <p>{cat.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TRENDING BOOKINGS */}

        <section className="section-block">
          <div className="section-header">
            <h3>Trending Bookings</h3>
            <span className="view-all">View All</span>
          </div>

          <div className="cards-grid">
            {topRecommendations.map((item) => (
              <div key={item.id} className="trending-card">
                <div className="card-image-wrapper">
                  <img src={item.image} alt={item.title} />

                  <button className="like-btn">
                    <FaRegHeart />
                  </button>
                </div>

                <div className="card-body">
                  <h4>{item.title}</h4>

                  <p className="card-sub">
                    {item.location}
                  </p>

                  <p className="card-date">
                    {item.date}
                  </p>

                  <div className="card-footer">
                    <span className="price-tag">
                      {item.price}
                    </span>

                    <span className="rating-tag">
                      <FaStar /> {item.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* UPCOMING BOOKINGS */}

        <section className="section-block upcoming-summary-section">
          <div className="section-header">
            <h3>My Upcoming Bookings</h3>
            <span className="view-all">View All</span>
          </div>

          <div className="upcoming-list">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="summary-booking-card"
              >
                <div className="summary-card-left">
                  <div
                    className={`summary-icon-box ${booking.type}`}
                  >
                    {booking.icon}
                  </div>

                  <div className="summary-info">
                    <h4>{booking.title}</h4>

                    <p className="subtitle">
                      {booking.subtitle}
                    </p>

                    <p className="time-details">
                      {booking.time} •{" "}
                      <span>{booking.details}</span>
                    </p>
                  </div>
                </div>

                <div className="summary-card-right">
                  <span className="status-badge green">
                    {booking.status}
                  </span>

                  <h3 className="summary-price">
                    {booking.price}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* =========================
          MOBILE NAV
      ========================= */}

      <div className="mobile-bottom-nav">
        <button className="nav-item active">
          <FaHome />
          <span>Home</span>
        </button>

        <button className="nav-item">
          <FaSearch />
          <span>Browse</span>
        </button>

        <button className="nav-item">
          <FaTicketAlt />
          <span>Bookings</span>
        </button>

        <button className="nav-item">
          <FaRegUser />
          <span>Profile</span>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;