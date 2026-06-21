import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaCreditCard, FaMobileAlt, FaUniversity, FaWallet } from "react-icons/fa";
import "./FlightPayment.css";

const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const getUser = () => {
  const rawUser = localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser");
  return rawUser ? JSON.parse(rawUser) : {};
};

function MoviePayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const saved = JSON.parse(sessionStorage.getItem("moviePayment") || "null");
  const payload = location.state || saved || {};
  const { movie, theatre, showtime, seats = [], totalAmount = 0 } = payload;
  const [method, setMethod] = useState("UPI");
  const [paying, setPaying] = useState(false);

  if (!movie) {
    return (
      <div className="flight-empty">
        <h1>No payment selected</h1>
        <button onClick={() => navigate("/dashboard/movies")}>Back to Movies</button>
      </div>
    );
  }

  const paymentMethods = [
    { name: "UPI", icon: <FaMobileAlt /> },
    { name: "Card", icon: <FaCreditCard /> },
    { name: "Net Banking", icon: <FaUniversity /> },
    { name: "Wallet", icon: <FaWallet /> },
  ];

  const confirmPayment = async () => {
    setPaying(true);

    try {
      const user = getUser();
      const showDate = showtime?.date?.value || showtime?.date?.label || "";
      const showTime = showtime?.time || "";
      const response = await fetch(`${apiBase}/bookings/movie`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieId: movie._id || movie.id,
          showId: showtime?.showId || showtime?._id || payload.showId || null,
          vendorId: movie.vendorId || movie.vendor || payload.vendorId || null,
          customerName: user.name || "Customer",
          customerEmail: user.email || "",
          customerMobile: user.mobile || "",
          title: movie.title,
          theatre: theatre?.name || theatre || "",
          showDate,
          showTime,
          seats,
          amount: totalAmount,
          paymentStatus: "Paid",
          bookingStatus: "Confirmed",
          details: {
            ...payload,
            movieId: movie._id || movie.id,
            showId: showtime?.showId || showtime?._id || payload.showId || null,
            vendorId: movie.vendorId || movie.vendor || payload.vendorId || null,
            customerName: user.name || "Customer",
            customerEmail: user.email || "",
            customerMobile: user.mobile || "",
            theatre,
            showDate,
            showTime,
            paymentMethod: method,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Payment failed");
        return;
      }

      const confirmation = { ...payload, paymentMethod: method, booking: data.booking };
      sessionStorage.setItem("movieConfirmation", JSON.stringify(confirmation));
      navigate(`/dashboard/movies/${movie._id}/confirmation`, { state: confirmation });
    } catch (error) {
      alert("Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="flight-payment-page">
      <header className="flight-step-header">
        <button onClick={() => navigate(-1)}><FaArrowLeft /></button>
        <div>
          <h1>Movie Payment</h1>
          <p>Choose a payment method and confirm your booking</p>
        </div>
      </header>

      <main className="payment-grid">
        <section className="payment-card">
          <h2>Payment Method</h2>
          <div className="payment-method-grid">
            {paymentMethods.map((item) => (
              <button key={item.name} className={method === item.name ? "active" : ""} onClick={() => setMethod(item.name)}>
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="payment-summary-card">
          <h2>Booking Summary</h2>
          <div className="payment-summary-row"><span>Movie</span><strong>{movie.title}</strong></div>
          <div className="payment-summary-row"><span>Theatre</span><strong>{theatre?.name}</strong></div>
          <div className="payment-summary-row"><span>Showtime</span><strong>{showtime?.time}</strong></div>
          <div className="payment-summary-row"><span>Seats</span><strong>{seats.join(", ")}</strong></div>
          <div className="payment-total"><span>Total Amount</span><strong>Rs {totalAmount}</strong></div>
          <button disabled={paying} onClick={confirmPayment}>
            <FaCheckCircle /> {paying ? "Processing..." : "Pay and Confirm"}
          </button>
        </aside>
      </main>
    </div>
  );
}

export default MoviePayment;
