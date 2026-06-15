import React, { useEffect, useMemo, useState } from "react";
import MoviesContent from "../components/MoviesContent";
import { useNavigate } from "react-router-dom";

import {
  FaBus,
  FaCalendarAlt,
  FaFilm,
  FaHome,
  FaHotel,
  FaMapMarkerAlt,
  FaPlane,
  FaRegBell,
  FaRegHeart,
  FaRegUser,
  FaSearch,
  FaSignOutAlt,
  FaStar,
  FaSuitcaseRolling,
  FaTicketAlt,
  FaTrain,
  FaWallet,
} from "react-icons/fa";

import "./Dashboard.css";

const apiBase = "http://localhost:5000/api";

const categories = [
  { id: "movies", name: "Movies", icon: <FaFilm /> },
  { id: "flights", name: "Flights", icon: <FaPlane /> },
  { id: "buses", name: "Buses", icon: <FaBus /> },
  { id: "trains", name: "Trains", icon: <FaTrain /> },
  { id: "events", name: "Events", icon: <FaCalendarAlt /> },
  { id: "hotels", name: "Hotels", icon: <FaHotel /> },
  { id: "holidays", name: "Holidays", icon: <FaSuitcaseRolling /> },
];

const topRecommendations = [
  { id: 1, module: "movie", title: "Avatar: The Way of Water", location: "INOX Pune", date: "Jun 12, 2026", price: 250, rating: "4.8", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80" },
  { id: 2, module: "bus", title: "Mumbai Express", location: "Pune to Mumbai", date: "Jun 15, 2026", price: 750, rating: "4.6", image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80" },
  { id: 3, module: "hotel", title: "Goa Beach Resort", location: "3 Days / 2 Nights", date: "Jun 20, 2026", price: 4999, rating: "4.7", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80" },
];

const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const moduleNameMap = {
  flights: "flight",
  trains: "train",
  buses: "bus",
  hotels: "hotel",
  holidays: "holiday",
  events: "event",
  movies: "movie",
};
const getSavedUser = () => {
  const raw = localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser");
  return raw ? JSON.parse(raw) : null;
};

function Dashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("Home");
  const [activePage, setActivePage] = useState("dashboard");
  const [catalog, setCatalog] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("tixhubWishlist") || "[]"));
  const [user, setUser] = useState({
    name: "Guest User",
    email: "",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
  });

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }), []);

  useEffect(() => {
    const savedUser = getSavedUser();
    if (savedUser) setUser(savedUser);
    loadBookings();
    loadWallet();
  }, []);

  useEffect(() => {
    if (["flights", "trains", "buses", "hotels", "holidays", "events", "browse"].includes(activePage)) {
      const moduleName = activePage === "browse" ? "flights" : activePage;
      fetch(`${apiBase}/catalog/${moduleName}`)
        .then((res) => res.json())
        .then(setCatalog)
        .catch(() => setCatalog([]));
    }
  }, [activePage]);

  const loadBookings = () => {
    fetch(`${apiBase}/bookings`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]));
  };

  const loadWallet = () => {
    fetch(`${apiBase}/wallet`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setWallet(data.transactions ? data : { balance: 0, transactions: [] }))
      .catch(() => setWallet({ balance: 0, transactions: [] }));
  };

  const navigateTo = (menuName, pageName) => {
    setActiveMenu(menuName);
    setActivePage(pageName);
  };

  const openCategory = (cat) => {
    if (cat.id === "flights") {
      navigate("/flights");
      return;
    }

    navigateTo(cat.name, cat.id);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiBase}/auth/logout`, { method: "POST", headers: authHeaders });
    } catch (error) {
      // Local logout should still succeed if the API is offline.
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  const saveWishlist = (item) => {
    const exists = wishlist.some((saved) => saved.id === item.id && saved.title === item.title);
    const next = exists ? wishlist.filter((saved) => saved.id !== item.id || saved.title !== item.title) : [...wishlist, item];
    setWishlist(next);
    localStorage.setItem("tixhubWishlist", JSON.stringify(next));
  };

  const createBooking = async (item, moduleName = item.module || moduleNameMap[activePage] || "event") => {
    const response = await fetch(`${apiBase}/bookings`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        module: moduleNameMap[moduleName] || moduleName,
        title: item.title,
        details: item,
        amount: item.price,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      alert(`Booking confirmed: ${data.booking.bookingCode}`);
      loadBookings();
      loadWallet();
      navigateTo("My Bookings", "bookings");
    } else {
      alert(data.message || "Booking failed");
    }
  };

  const addMoney = async () => {
    const amount = Number(prompt("Enter amount to add"));
    if (!amount || amount <= 0) return;

    const response = await fetch(`${apiBase}/wallet/add-money`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ amount }),
    });

    if (response.ok) setWallet(await response.json());
  };

  const cancelBooking = async (id) => {
    const response = await fetch(`${apiBase}/bookings/${id}/cancel`, {
      method: "PATCH",
      headers: authHeaders,
    });

    if (response.ok) {
      loadBookings();
      loadWallet();
    }
  };

  const renderCards = (items, moduleName) => (
    <div className="cards-grid">
      {items.map((item) => (
        <div key={item.id || item._id} className="trending-card">
          {item.image && (
            <div className="card-image-wrapper">
              <img src={item.image} alt={item.title} />
              <button className="like-btn" onClick={() => saveWishlist(item)}><FaRegHeart /></button>
            </div>
          )}
          <div className="card-body">
            <h4>{item.title}</h4>
            <p className="card-sub">{item.subtitle || item.location}</p>
            <p className="card-date">{item.date}</p>
            <div className="card-footer">
              <span className="price-tag">Rs {item.price}</span>
              <span className="rating-tag"><FaStar /> {item.rating}</span>
            </div>
            <button className="search-submit-btn full-width-btn" onClick={() => createBooking(item, moduleName)}>
              Book Now
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCatalog = () => {
    const title = activePage === "browse" ? "Browse Deals" : categories.find((cat) => cat.id === activePage)?.name;
    return (
      <section className="section-block">
        <div className="section-header">
          <h3>{title}</h3>
          <span className="view-all" onClick={() => navigateTo("Home", "dashboard")}>Back Home</span>
        </div>
        {renderCards(catalog, activePage === "browse" ? "flight" : moduleNameMap[activePage])}
      </section>
    );
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-section" onClick={() => navigateTo("Home", "dashboard")} style={{ cursor: "pointer" }}>
          <div className="logo-icon">TH</div>
          <h2>TixHub</h2>
        </div>

        <nav className="sidebar-menu">
          <button className={activeMenu === "Home" ? "active" : ""} onClick={() => navigateTo("Home", "dashboard")}><FaHome /> Home</button>
          <button className={activeMenu === "Browse Deals" ? "active" : ""} onClick={() => navigateTo("Browse Deals", "browse")}><FaSearch /> Browse Deals</button>
          <button className={activeMenu === "My Bookings" ? "active" : ""} onClick={() => navigateTo("My Bookings", "bookings")}><FaTicketAlt /> My Bookings</button>
          <button className={activeMenu === "Wallet" ? "active" : ""} onClick={() => navigateTo("Wallet", "wallet")}><FaWallet /> TixWallet</button>
          <button className={activeMenu === "Wishlist" ? "active" : ""} onClick={() => navigateTo("Wishlist", "wishlist")}><FaRegHeart /> Wishlist</button>
          <button className={activeMenu === "Profile" ? "active" : ""} onClick={() => navigateTo("Profile", "profile")}><FaRegUser /> Profile</button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
      </aside>

      <main className="main-content">
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
            <button className="icon-notification-btn" onClick={() => navigateTo("Notifications", "notifications")}><FaRegBell /></button>
            <div className="user-profile" onClick={() => navigateTo("Profile", "profile")} style={{ cursor: "pointer" }}>
              <div className="user-avatar"><img src={user.image} alt={user.name} /></div>
              <div className="user-details"><h4>{user.name}</h4><p>Welcome Back</p></div>
            </div>
          </div>
        </header>

        {activePage === "dashboard" && (
          <>
            <section className="hero-banner">
              <div className="hero-text"><h1>Discover Amazing <br /> Bookings Everywhere</h1></div>
              <div className="search-bar-container">
                <FaSearch className="search-input-icon" />
                <input type="text" placeholder="Search movies, buses, flights..." />
                <button className="search-submit-btn" onClick={() => navigateTo("Browse Deals", "browse")}>Search</button>
              </div>
            </section>

            <section className="section-block">
              <div className="section-header"><h3>Categories</h3><span className="view-all" onClick={() => navigateTo("Browse Deals", "browse")}>View All</span></div>
              <div className="categories-grid">
                {categories.map((cat) => (
                  <div key={cat.id} className={`category-card ${cat.id}`} onClick={() => openCategory(cat)}>
                    <div className={`category-icon-wrapper ${cat.id}`}>{cat.icon}</div>
                    <p>{cat.name}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="section-block">
              <div className="section-header"><h3>Trending Bookings</h3><span className="view-all" onClick={() => navigateTo("Browse Deals", "browse")}>View All</span></div>
              {renderCards(topRecommendations, "movie")}
            </section>

            <section className="section-block">
              <div className="section-header"><h3>My Upcoming Bookings</h3><span className="view-all" onClick={() => navigateTo("My Bookings", "bookings")}>View All</span></div>
              {bookings.slice(0, 2).map((booking) => (
                <div className="summary-booking-card" key={booking._id}>
                  <div className="summary-card-left"><div className="summary-icon-box movies"><FaTicketAlt /></div><div className="summary-info"><h4>{booking.title}</h4><p className="subtitle">{booking.module}</p><p className="time-details">{booking.bookingCode}</p></div></div>
                  <div className="summary-card-right"><span className="status-badge green">{booking.status}</span><h3 className="summary-price">Rs {booking.amount}</h3></div>
                </div>
              ))}
            </section>
          </>
        )}

        {activePage === "movies" && <MoviesContent />}
        {["flights", "trains", "buses", "hotels", "holidays", "events", "browse"].includes(activePage) && renderCatalog()}

        {activePage === "bookings" && (
          <section className="section-block">
            <div className="section-header"><h3>Booking Management</h3></div>
            {bookings.map((booking) => (
              <div className="summary-booking-card" key={booking._id}>
                <div className="summary-card-left"><div className="summary-icon-box movies"><FaTicketAlt /></div><div className="summary-info"><h4>{booking.title}</h4><p className="subtitle">{booking.module} · {booking.bookingCode}</p><p className="time-details">QR Ticket and invoice ready</p></div></div>
                <div className="summary-card-right"><span className="status-badge green">{booking.status}</span><h3 className="summary-price">Rs {booking.amount}</h3>{booking.status === "confirmed" && <button className="text-action" onClick={() => cancelBooking(booking._id)}>Cancel</button>}</div>
              </div>
            ))}
          </section>
        )}

        {activePage === "wallet" && (
          <div className="wallet-page">
            <h1 className="wallet-heading">TixWallet</h1>
            <div className="wallet-section">
              <div className="wallet-card"><div><p>TixWallet Balance</p><h2>Rs {wallet.balance}</h2></div><FaWallet className="wallet-icon" /></div>
              <button className="wallet-card wallet-action" onClick={addMoney}>Add Money</button>
            </div>
            <div className="wallet-transactions">
              {wallet.transactions.map((item) => (
                <div className="transaction-card" key={item._id}><div><h4>{item.note}</h4><p>{item.type}</p></div><span className={["credit", "refund", "cashback"].includes(item.type) ? "green" : "red"}>Rs {item.amount}</span></div>
              ))}
            </div>
          </div>
        )}

        {activePage === "wishlist" && (
          <section className="section-block">
            <div className="section-header"><h3>Wishlist</h3></div>
            {renderCards(wishlist, "event")}
          </section>
        )}

        {activePage === "profile" && (
          <section className="section-block">
            <div className="section-header"><h3>Profile</h3></div>
            <div className="wallet-card profile-panel"><img src={user.image} alt={user.name} /><div><h2>{user.name}</h2><p>{user.email}</p><p>Notification, privacy, and password settings are enabled for this account.</p></div></div>
          </section>
        )}

        {activePage === "notifications" && (
          <section className="section-block">
            <div className="section-header"><h3>Notification Center</h3></div>
            {["Booking confirmations", "Payment updates", "Offer alerts", "Admin messages"].map((item) => (
              <div className="transaction-card" key={item}><div><h4>{item}</h4><p>Latest TixHub updates appear here.</p></div><span className="status-badge green">Active</span></div>
            ))}
          </section>
        )}
      </main>

      <div className="mobile-bottom-nav">
        <button className={`nav-item ${activeMenu === "Home" ? "active" : ""}`} onClick={() => navigateTo("Home", "dashboard")}><FaHome /> <span>Home</span></button>
        <button className={`nav-item ${activeMenu === "Browse Deals" ? "active" : ""}`} onClick={() => navigateTo("Browse Deals", "browse")}><FaSearch /> <span>Browse</span></button>
        <button className={`nav-item ${activeMenu === "My Bookings" ? "active" : ""}`} onClick={() => navigateTo("My Bookings", "bookings")}><FaTicketAlt /> <span>Bookings</span></button>
        <button className={`nav-item ${activeMenu === "Profile" ? "active" : ""}`} onClick={() => navigateTo("Profile", "profile")}><FaRegUser /> <span>Profile</span></button>
      </div>
    </div>
  );
}

export default Dashboard;
