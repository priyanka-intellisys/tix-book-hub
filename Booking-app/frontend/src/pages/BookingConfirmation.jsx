import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTicketAlt } from "react-icons/fa";
import "./Dashboard.css";
import "./FlightPayment.css";

function BookingConfirmation({ type = "movie" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const savedKey = type === "flight" ? "flightConfirmation" : "movieConfirmation";
  const saved = JSON.parse(sessionStorage.getItem(savedKey) || "null");
  const payload = location.state || saved || {};
  const booking = payload.booking;
  const title = type === "flight"
    ? `${payload.flight?.airline || "Flight"} ${payload.flight?.flightNumber || ""}`
    : payload.movie?.title || "Movie";

  return (
    <section className="section-block">
      <div className="wallet-card profile-panel">
        <FaCheckCircle className="wallet-icon" />
        <div>
          <h2>Booking Confirmed</h2>
          <p>{title}</p>
          <p><FaTicketAlt /> {booking?.bookingCode || "Confirmation saved"}</p>
        </div>
      </div>
      <div className="wallet-transactions">
        <div className="transaction-card"><div><h4>Booking ID</h4><p>{booking?.bookingCode || "Not available"}</p></div><span className="green">Confirmed</span></div>
        {type === "flight" && <div className="transaction-card"><div><h4>PNR Number</h4><p>{payload.pnr || "PNR will be generated"}</p></div><span>{payload.flight?.fromCode} to {payload.flight?.toCode}</span></div>}
        {type === "movie" && <div className="transaction-card"><div><h4>Theatre</h4><p>{payload.theatre?.name || "Not available"}</p></div><span>{payload.showtime?.time}</span></div>}
        <div className="transaction-card"><div><h4>Seats</h4><p>{payload.seats?.join(", ") || "Not available"}</p></div><span>Rs {payload.totalAmount || booking?.amount || 0}</span></div>
        <div className="transaction-card"><div><h4>Download Ticket</h4><p>Your ticket is ready in My Bookings.</p></div><button className="search-submit-btn" onClick={() => window.print()}>Download</button></div>
      </div>
      <button className="search-submit-btn" onClick={() => navigate("/dashboard/my-bookings")}>
        View My Bookings
      </button>
    </section>
  );
}

export default BookingConfirmation;
