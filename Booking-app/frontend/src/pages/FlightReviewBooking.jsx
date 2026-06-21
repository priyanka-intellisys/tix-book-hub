import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlane, FaReceipt, FaUserFriends } from "react-icons/fa";
import "./FlightReviewBooking.css";

function FlightReviewBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const saved = JSON.parse(sessionStorage.getItem("flightSeatSelection") || "null");
  const payload = location.state || saved || {};
  const { flight, search, travellers, cabinClass, totalTravellers = 1, seats = [], seatFee = 250 } = payload;

  if (!flight) {
    return (
      <div className="flight-empty">
        <h1>No booking selected</h1>
        <button onClick={() => navigate("/dashboard/flights")}>Back to Flights</button>
      </div>
    );
  }

  const baseFare = flight.price * totalTravellers;
  const seatCharges = seatFee * seats.length;
  const taxes = Math.round((baseFare + seatCharges) * 0.12);
  const totalAmount = baseFare + seatCharges + taxes;

  const continueFlow = () => {
    const nextPayload = { ...payload, baseFare, seatCharges, taxes, totalAmount };
    sessionStorage.setItem("flightReviewBooking", JSON.stringify(nextPayload));
    navigate(`/dashboard/flights/${flight.id || flight._id}/payment`, { state: nextPayload });
  };

  return (
    <div className="flight-review-page">
      <header className="flight-step-header">
        <button onClick={() => navigate(-1)}><FaArrowLeft /></button>
        <div>
          <h1>Review Booking</h1>
          <p>Check passenger details, flight summary, and fare breakdown</p>
        </div>
      </header>

      <main className="review-grid">
        <section className="review-card">
          <h2><FaUserFriends /> Passenger Details</h2>
          <div className="review-row"><span>Adults</span><strong>{travellers?.adult || 0}</strong></div>
          <div className="review-row"><span>Children</span><strong>{travellers?.child || 0}</strong></div>
          <div className="review-row"><span>Infants</span><strong>{travellers?.infant || 0}</strong></div>
          <div className="review-row"><span>Cabin Class</span><strong>{cabinClass}</strong></div>
          <div className="review-row"><span>Selected Seats</span><strong>{seats.join(", ")}</strong></div>
        </section>

        <section className="review-card">
          <h2><FaPlane /> Flight Summary</h2>
          <div className="flight-summary-line">
            <div><strong>{flight.fromCode}</strong><span>{flight.departureTime}</span></div>
            <p>{flight.duration} | {flight.stops}</p>
            <div><strong>{flight.toCode}</strong><span>{flight.arrivalTime}</span></div>
          </div>
          <p>{flight.airline} {flight.flightNumber} | {search?.departureDate || flight.departureDate}</p>
        </section>

        <section className="review-card fare-card">
          <h2><FaReceipt /> Fare Breakdown</h2>
          <div className="review-row"><span>Base Fare</span><strong>Rs {baseFare}</strong></div>
          <div className="review-row"><span>Seat Pricing</span><strong>Rs {seatCharges}</strong></div>
          <div className="review-row"><span>Taxes</span><strong>Rs {taxes}</strong></div>
          <div className="review-total"><span>Total Amount</span><strong>Rs {totalAmount}</strong></div>
          <button onClick={continueFlow}>Continue To Payment</button>
        </section>
      </main>
    </div>
  );
}

export default FlightReviewBooking;
