import React, { useEffect, useMemo, useState } from "react";
import { FaTicketAlt } from "react-icons/fa";
import "./Dashboard.css";

const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }), []);

  const loadBookings = () => {
    fetch(`${apiBase}/bookings`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]));
  };

  useEffect(loadBookings, [authHeaders]);

  const cancelBooking = async (id) => {
    const response = await fetch(`${apiBase}/bookings/${id}/cancel`, {
      method: "PATCH",
      headers: authHeaders,
    });
    if (response.ok) loadBookings();
  };

  return (
    <section className="section-block">
      <div className="section-header"><h3>My Bookings</h3></div>
      {bookings.map((booking) => (
        <div className="summary-booking-card" key={booking._id}>
          <div className="summary-card-left">
            <div className="summary-icon-box movies"><FaTicketAlt /></div>
            <div className="summary-info">
              <h4>{booking.title}</h4>
              <p className="subtitle">{booking.module} - {booking.bookingCode}</p>
              <p className="time-details">QR Ticket and invoice ready</p>
            </div>
          </div>
          <div className="summary-card-right">
            <span className="status-badge green">{booking.status}</span>
            <h3 className="summary-price">Rs {booking.amount}</h3>
            {booking.status === "confirmed" && <button className="text-action" onClick={() => cancelBooking(booking._id)}>Cancel</button>}
          </div>
        </div>
      ))}
    </section>
  );
}

export default MyBookings;
