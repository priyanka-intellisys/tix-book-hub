import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaCreditCard, FaMobileAlt, FaUniversity, FaWallet } from "react-icons/fa";
import "./FlightPayment.css";

const apiBase = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

function FlightPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const saved = JSON.parse(sessionStorage.getItem("flightReviewBooking") || "null");
  const payload = location.state || saved || {};
  const { flight, travellers, cabinClass, seats = [], totalAmount = 0 } = payload;
  const [method, setMethod] = useState("UPI");
  const [paying, setPaying] = useState(false);

  if (!flight) {
    return (
      <div className="flight-empty">
        <h1>No payment selected</h1>
        <button onClick={() => navigate("/flights")}>Back to Flights</button>
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
      const response = await fetch(`${apiBase}/bookings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module: "flight",
          title: `${flight.airline} ${flight.flightNumber}`,
          details: {
            ...payload,
            paymentMethod: method,
          },
          seats,
          amount: totalAmount,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Payment failed");
        return;
      }

      alert(`Flight booking confirmed: ${data.booking.bookingCode}`);
      navigate("/dashboard");
    } catch (error) {
      alert("Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="flight-payment-page">
      <header className="flight-step-header">
        <button onClick={() => navigate("/flight-review-booking", { state: payload })}><FaArrowLeft /></button>
        <div>
          <h1>Flight Payment</h1>
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
          <div className="payment-summary-row"><span>Flight</span><strong>{flight.airline} {flight.flightNumber}</strong></div>
          <div className="payment-summary-row"><span>Route</span><strong>{flight.fromCode} to {flight.toCode}</strong></div>
          <div className="payment-summary-row"><span>Passengers</span><strong>{(travellers?.adult || 0) + (travellers?.child || 0) + (travellers?.infant || 0)}</strong></div>
          <div className="payment-summary-row"><span>Cabin</span><strong>{cabinClass}</strong></div>
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

export default FlightPayment;
