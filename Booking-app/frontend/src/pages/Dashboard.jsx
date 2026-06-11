import React, { useState, useEffect } from "react";

import MoviesContent from "../components/MoviesContent";
import MovieDetails from "../components/MovieDetails";

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
  FaTrain,
  FaWallet,
  FaCalendarAlt,
} from "react-icons/fa";

import "./Dashboard.css";

/* =========================
   CATEGORY DATA
========================= */
const categories = [
  { id: "movies", name: "Movies", icon: <FaFilm /> },
  { id: "flights", name: "Flights", icon: <FaPlane /> },
  { id: "buses", name: "Buses", icon: <FaBus /> },
  { id: "trains", name: "Trains", icon: <FaTrain /> },
  { id: "events", name: "Events", icon: <FaCalendarAlt /> },
  { id: "hotels", name: "Hotels", icon: <FaHotel /> },
  { id: "travel", name: "Holidays", icon: <FaSuitcaseRolling /> },
];

/* =========================
   TRENDING
========================= */
const topRecommendations = [
  {
    id: 1,
    title: "Avatar: The Way of Water",
    location: "INOX Pune",
    date: "Jun 12, 2026",
    price: "₹250",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    title: "Mumbai Express",
    location: "Pune → Mumbai",
    date: "Jun 15, 2026",
    price: "₹750",
    rating: "4.6",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    title: "Goa Beach Resort",
    location: "3 Days / 2 Nights",
    date: "Jun 20, 2026",
    price: "₹4,999",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
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
    subtitle: "Pune → Delhi",
    time: "Jun 20, 2026 • 7:00 PM",
    details: "Seat 12B",
    price: "₹4,240",
    status: "Confirmed",
    icon: <FaPlane />,
  },
  {
    id: 2,
    type: "bus",
    title: "Hanif Enterprise",
    subtitle: "Pune → Mumbai",
    time: "Jun 22, 2026 • 6:30 AM",
    details: "Seat C2, C3",
    price: "₹1,000",
    status: "Confirmed",
    icon: <FaBus />,
  },
];

/* =========================
   DASHBOARD COMPONENT
========================= */
function Dashboard() {
  const [activeMenu, setActiveMenu] = useState("Home");
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [user, setUser] = useState({
    name: "Guest User",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
  });

  /* LOAD USER */
  useEffect(() => {
    const savedUser = localStorage.getItem("ticketproUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  /* LOGOUT */
  const handleLogout = () => {
    localStorage.removeItem("ticketproUser");
    window.location.href = "/";
  };

  // Helper function to handle navigation changes uniformly
  const navigateTo = (menuName, pageName) => {
    setActiveMenu(menuName);
    setActivePage(pageName);
  };

  return (
    <div className="dashboard-container">
      {/* SIDEBAR (DESKTOP) */}
      <aside className="sidebar">
        <div className="logo-section" onClick={() => navigateTo("Home", "dashboard")} style={{ cursor: "pointer" }}>
          <div className="logo-icon">TH</div>
          <h2>TixHub</h2>
        </div>

        <nav className="sidebar-menu">
          <button className={activeMenu === "Home" ? "active" : ""} onClick={() => navigateTo("Home", "dashboard")}>
            <FaHome /> Home
          </button>

          <button className={activeMenu === "Browse Deals" ? "active" : ""} onClick={() => navigateTo("Browse Deals", "browse")}>
            <FaSearch /> Browse Deals
          </button>

          <button className={activeMenu === "My Bookings" ? "active" : ""} onClick={() => navigateTo("My Bookings", "bookings")}>
            <FaTicketAlt /> My Bookings
          </button>

          <button className={activeMenu === "Wallet" ? "active" : ""} onClick={() => navigateTo("Wallet", "wallet")}>
            <FaWallet /> TixWallet
          </button>

          <button className={activeMenu === "Wishlist" ? "active" : ""} onClick={() => navigateTo("Wishlist", "wishlist")}>
            <FaRegHeart /> Wishlist
          </button>

          <button className={activeMenu === "Profile" ? "active" : ""} onClick={() => navigateTo("Profile", "profile")}>
            <FaRegUser /> Profile
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {/* HEADER */}
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
            <button className="icon-notification-btn" onClick={() => alert("No new notifications")}>
              <FaRegBell />
            </button>

            <div className="user-profile" onClick={() => navigateTo("Profile", "profile")} style={{ cursor: "pointer" }}>
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

        {/* =========================
            DASHBOARD HOME VIEW
        ========================= */}
        {activePage === "dashboard" && (
          <>
            {/* HERO */}
            <section className="hero-banner">
              <div className="hero-text">
                <h1>Discover Amazing <br /> Bookings Everywhere</h1>
              </div>
              <div className="search-bar-container">
                <FaSearch className="search-input-icon" />
                <input type="text" placeholder="Search movies, buses, flights..." />
                <button className="search-submit-btn" onClick={() => navigateTo("Browse Deals", "browse")}>Search</button>
              </div>
            </section>

            {/* CATEGORIES */}
            <section className="section-block">
              <div className="section-header">
                <h3>Categories</h3>
                <span className="view-all" onClick={() => navigateTo("Browse Deals", "browse")}>View All</span>
              </div>
              <div className="categories-grid">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`category-card ${cat.id}`}
                    onClick={() => {
                      if (cat.id === "movies") {
                        navigateTo("Home", "movies");
                      } else {
                        navigateTo("Browse Deals", cat.id);
                      }
                    }}
                  >
                    <div className={`category-icon-wrapper ${cat.id}`}>{cat.icon}</div>
                    <p>{cat.name}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* TRENDING */}
            <section className="section-block">
              <div className="section-header">
                <h3>Trending Bookings</h3>
                <span className="view-all" onClick={() => navigateTo("Browse Deals", "browse")}>View All</span>
              </div>
              <div className="cards-grid">
                {topRecommendations.map((item) => (
                  <div key={item.id} className="trending-card">
                    <div className="card-image-wrapper">
                      <img src={item.image} alt={item.title} />
                      <button className="like-btn" onClick={() => navigateTo("Wishlist", "wishlist")}>
                        <FaRegHeart />
                      </button>
                    </div>
                    <div className="card-body">
                      <h4>{item.title}</h4>
                      <p className="card-sub">{item.location}</p>
                      <p className="card-date">{item.date}</p>
                      <div className="card-footer">
                        <span className="price-tag">{item.price}</span>
                        <span className="rating-tag"><FaStar /> {item.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* UPCOMING */}
            <section className="section-block">
              <div className="section-header">
                <h3>My Upcoming Bookings</h3>
                <span className="view-all" onClick={() => navigateTo("My Bookings", "bookings")}>View All</span>
              </div>
              <div className="upcoming-list">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="summary-booking-card">
                    <div className="summary-card-left">
                      <div className={`summary-icon-box ${booking.type}`}>{booking.icon}</div>
                      <div className="summary-info">
                        <h4>{booking.title}</h4>
                        <p className="subtitle">{booking.subtitle}</p>
                        <p className="time-details">{booking.time} <span> • {booking.details}</span></p>
                      </div>
                    </div>
                    <div className="summary-card-right">
                      <span className="status-badge green">{booking.status}</span>
                      <h3 className="summary-price">{booking.price}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* MOVIES MODULE */}
        {activePage === "movies" && (
          <MoviesContent setActivePage={setActivePage} setSelectedMovie={setSelectedMovie} />
        )}
        {activePage === "movieDetails" && (
          <MovieDetails setActivePage={setActivePage} selectedMovie={selectedMovie} />
        )}

        {/* WALLET VIEW */}
        {activePage === "wallet" && (
          <div className="wallet-page">
            <h1 className="wallet-heading">TixWallet</h1>
            <div className="wallet-section">
              <div className="wallet-card">
                <div>
                  <p>TixWallet Balance</p>
                  <h2>₹2,450</h2>
                </div>
                <FaWallet className="wallet-icon" />
              </div>
            </div>
          </div>
        )}

        {/* FALLBACK / DYNAMIC PLACEHOLDERS FOR UNFINISHED PAGES */}
        {!["dashboard", "movies", "movieDetails", "wallet"].includes(activePage) && (
          <div className="placeholder-page">
            <h1>{activeMenu || "Category View"}</h1>
            <p>Displaying contents for item query: <strong>{activePage}</strong></p>
            <div className="wallet-card" style={{ marginTop: "20px" }}>
              <h4>Feature coming soon!</h4>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="mobile-bottom-nav">
        <button className={`nav-item ${activeMenu === "Home" ? "active" : ""}`} onClick={() => navigateTo("Home", "dashboard")}>
          <FaHome /> <span>Home</span>
        </button>
        <button className={`nav-item ${activeMenu === "Browse Deals" ? "active" : ""}`} onClick={() => navigateTo("Browse Deals", "browse")}>
          <FaSearch /> <span>Browse</span>
        </button>
        <button className={`nav-item ${activeMenu === "My Bookings" ? "active" : ""}`} onClick={() => navigateTo("My Bookings", "bookings")}>
          <FaTicketAlt /> <span>Bookings</span>
        </button>
        <button className={`nav-item ${activeMenu === "Profile" ? "active" : ""}`} onClick={() => navigateTo("Profile", "profile")}>
          <FaRegUser /> <span>Profile</span>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;