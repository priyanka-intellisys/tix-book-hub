import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const apiBase = "http://localhost:5000/api";

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

const moduleRoutes = {
  flight: "/add-flight",
  hotel: "/add-hotel",
  event: "/add-event",
  bus: "/add-bus",
  "travel-package": "/add-travel-package",
};

function VendorListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${apiBase}/vendor-listings`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setListings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Unable to load vendor listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const deleteListing = async (id) => {
    try {
      await axios.delete(`${apiBase}/vendor-listings/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to delete listing");
    }
  };

  if (loading) return <div className="vendor-state-card">Loading listings...</div>;
  if (error) return <div className="vendor-state-card error">{error}</div>;
  if (!listings.length) return <div className="vendor-state-card">No vendor listings yet. Add flights, hotels, events, buses, or packages.</div>;

  return (
    <div className="vendor-listing-grid">
      {listings.map((listing) => (
        <article className="vendor-listing-card" key={listing._id}>
          {listing.imageUrl && <img src={listing.imageUrl} alt={listing.title} />}
          <div className="vendor-listing-content">
            <span className="listing-module">{listing.module.replace("-", " ")}</span>
            <h3>{listing.title}</h3>
            <p>{listing.route || listing.city || "Configured listing"}</p>
            <div className="listing-meta-row">
              <strong>Rs {listing.price}</strong>
              <span>{listing.inventory} available</span>
            </div>
            <div className="movie-actions">
              <button
                className="edit-btn"
                onClick={() => navigate(moduleRoutes[listing.module], { state: { listing } })}
              >
                Edit
              </button>
              <button className="delete-btn" onClick={() => deleteListing(listing._id)}>
                Delete
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default VendorListings;
