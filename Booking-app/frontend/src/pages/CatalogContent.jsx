import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaRegHeart, FaStar } from "react-icons/fa";
import "./Dashboard.css";

const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

const endpointMap = {
  browse: "flights",
  bus: "buses",
  train: "trains",
  hotel: "hotels",
  holiday: "holidays",
  event: "events",
};

function CatalogContent({ module = "browse" }) {
  const params = useParams();
  const navigate = useNavigate();
  const activeModule = params.module || module;
  const [catalog, setCatalog] = useState([]);
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("tixhubWishlist") || "[]"));
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }), []);

  useEffect(() => {
    fetch(`${apiBase}/catalog/${endpointMap[activeModule] || "flights"}`)
      .then((res) => res.json())
      .then((data) => setCatalog(Array.isArray(data) ? data : []))
      .catch(() => setCatalog([]));
  }, [activeModule]);

  const saveWishlist = (item) => {
    const exists = wishlist.some((saved) => saved.id === item.id && saved.title === item.title);
    const next = exists ? wishlist.filter((saved) => saved.id !== item.id || saved.title !== item.title) : [...wishlist, item];
    setWishlist(next);
    localStorage.setItem("tixhubWishlist", JSON.stringify(next));
  };

  const createBooking = async (item) => {
    const response = await fetch(`${apiBase}/bookings`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        module: activeModule === "browse" ? "flight" : activeModule,
        title: item.title,
        details: item,
        amount: item.price,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      alert(`Booking confirmed: ${data.booking.bookingCode}`);
      navigate("/dashboard/my-bookings");
    } else {
      alert(data.message || "Booking failed");
    }
  };

  return (
    <section className="section-block">
      <div className="section-header">
        <h3>{activeModule === "browse" ? "Browse Deals" : activeModule}</h3>
        <span className="view-all" onClick={() => navigate("/dashboard")}>Back Home</span>
      </div>
      <div className="cards-grid">
        {catalog.map((item) => (
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
              <button className="search-submit-btn full-width-btn" onClick={() => createBooking(item)}>
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CatalogContent;
