import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBus,
  FaCalendarAlt,
  FaFilm,
  FaHotel,
  FaPlane,
  FaRegHeart,
  FaSearch,
  FaStar,
  FaSuitcaseRolling,
  FaTicketAlt,
  FaTrain,
} from "react-icons/fa";
import "./Dashboard.css";

const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

const categories = [
  { name: "Movies", path: "/dashboard/movies", icon: <FaFilm />, style: "movies" },
  { name: "Flights", path: "/dashboard/flights", icon: <FaPlane />, style: "flights" },
  { name: "Buses", path: "/dashboard/bus", icon: <FaBus />, style: "buses" },
  { name: "Trains", path: "/dashboard/train", icon: <FaTrain />, style: "trains" },
  { name: "Events", path: "/dashboard/event", icon: <FaCalendarAlt />, style: "events" },
  { name: "Hotels", path: "/dashboard/hotel", icon: <FaHotel />, style: "hotels" },
  { name: "Holidays", path: "/dashboard/holiday", icon: <FaSuitcaseRolling />, style: "travel" },
];

const topRecommendations = [
  { id: 1, module: "movie", title: "Avatar: The Way of Water", location: "INOX Pune", date: "Jun 12, 2026", price: 250, rating: "4.8", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80" },
  { id: 2, module: "bus", title: "Mumbai Express", location: "Pune to Mumbai", date: "Jun 15, 2026", price: 750, rating: "4.6", image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80" },
  { id: 3, module: "hotel", title: "Goa Beach Resort", location: "3 Days / 2 Nights", date: "Jun 20, 2026", price: 4999, rating: "4.7", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80" },
];

function HomeContent() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("tixhubWishlist") || "[]"));
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }), []);

  useEffect(() => {
    fetch(`${apiBase}/bookings`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]));
  }, [authHeaders]);

  const saveWishlist = (item) => {
    const exists = wishlist.some((saved) => saved.id === item.id && saved.title === item.title);
    const next = exists ? wishlist.filter((saved) => saved.id !== item.id || saved.title !== item.title) : [...wishlist, item];
    setWishlist(next);
    localStorage.setItem("tixhubWishlist", JSON.stringify(next));
  };

  const renderCards = (items) => (
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
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <section className="hero-banner">
        <div className="hero-text"><h1>Discover Amazing <br /> Bookings Everywhere</h1></div>
        <div className="search-bar-container">
          <FaSearch className="search-input-icon" />
          <input type="text" placeholder="Search movies, buses, flights..." />
          <button className="search-submit-btn" onClick={() => navigate("/dashboard/browse")}>Search</button>
        </div>
      </section>

      <section className="section-block">
        <div className="section-header"><h3>Categories</h3><span className="view-all" onClick={() => navigate("/dashboard/browse")}>View All</span></div>
        <div className="categories-grid">
          {categories.map((cat) => (
            <div key={cat.name} className={`category-card ${cat.style}`} onClick={() => navigate(cat.path)}>
              <div className={`category-icon-wrapper ${cat.style}`}>{cat.icon}</div>
              <p>{cat.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-header"><h3>Trending Bookings</h3><span className="view-all" onClick={() => navigate("/dashboard/browse")}>View All</span></div>
        {renderCards(topRecommendations)}
      </section>

      <section className="section-block">
        <div className="section-header"><h3>My Upcoming Bookings</h3><span className="view-all" onClick={() => navigate("/dashboard/my-bookings")}>View All</span></div>
        {bookings.slice(0, 2).map((booking) => (
          <div className="summary-booking-card" key={booking._id}>
            <div className="summary-card-left"><div className="summary-icon-box movies"><FaTicketAlt /></div><div className="summary-info"><h4>{booking.title}</h4><p className="subtitle">{booking.module}</p><p className="time-details">{booking.bookingCode}</p></div></div>
            <div className="summary-card-right"><span className="status-badge green">{booking.status}</span><h3 className="summary-price">Rs {booking.amount}</h3></div>
          </div>
        ))}
      </section>
    </>
  );
}

export default HomeContent;
