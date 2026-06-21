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
  const { flight, passenger, cabinClass, seats = [], baseFare = 0, taxes = 0, platformFee = 0, totalAmount = 0 } = payload;
  const [method, setMethod] = useState("UPI");
  const [paying, setPaying] = useState(false);

  if (!flight) {
    return (
      <div className="flight-empty">
        <h1>No payment selected</h1>
        <button onClick={() => navigate("/dashboard/flights")}>Back to Flights</button>
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
      const response = await fetch(`${apiBase}/flight-bookings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flightId: flight._id || flight.id,
          passengerName: passenger?.name || "",
          passengerMobile: passenger?.mobile || "",
          passengerEmail: passenger?.email || "",
          seatNumber: seats.join(", "),
          classType: cabinClass || flight.cabinClass || "Economy",
          totalAmount,
          bookingStatus: "confirmed",
          paymentStatus: "pending",
          title: `${flight.airline} ${flight.flightNumber}`,
          details: {
            ...payload,
            paymentMethod: method,
            paymentInterlockEnabled: false,
          },
          seats,
          amount: totalAmount,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Booking failed");
        return;
      }

      const confirmation = { ...payload, paymentMethod: method, booking: data.booking, pnr: data.pnr };
      sessionStorage.setItem("flightConfirmation", JSON.stringify(confirmation));
      navigate(`/dashboard/flights/${flight.id || flight._id}/confirmation`, { state: confirmation });
    } catch (error) {
      alert("Booking failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="flight-payment-page">
      <header className="flight-step-header">
        <button onClick={() => navigate(-1)}><FaArrowLeft /></button>
        <div>
          <h1>Confirm Flight Booking</h1>
          <p>Payment will be connected later; confirm your booking now</p>
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
          <div className="payment-summary-row"><span>Passenger</span><strong>{passenger?.name || "Not available"}</strong></div>
          <div className="payment-summary-row"><span>Cabin</span><strong>{cabinClass}</strong></div>
          <div className="payment-summary-row"><span>Seats</span><strong>{seats.join(", ")}</strong></div>
          <div className="payment-summary-row"><span>Base fare</span><strong>Rs {baseFare}</strong></div>
          <div className="payment-summary-row"><span>Taxes</span><strong>Rs {taxes}</strong></div>
          <div className="payment-summary-row"><span>Platform fee</span><strong>Rs {platformFee}</strong></div>
          <div className="payment-total"><span>Total Amount</span><strong>Rs {totalAmount}</strong></div>
          <button disabled={paying} onClick={confirmPayment}>
            <FaCheckCircle /> {paying ? "Confirming..." : "Confirm Booking"}
          </button>
        </aside>
      </main>
    </div>
  );
}

export default FlightPayment;
