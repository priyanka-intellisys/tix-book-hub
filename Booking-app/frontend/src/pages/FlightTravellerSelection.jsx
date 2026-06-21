import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaUserFriends } from "react-icons/fa";
import "./FlightTravellerSelection.css";

function FlightTravellerSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const saved = JSON.parse(sessionStorage.getItem("flightSeatSelection") || "null");
  const payload = location.state || saved || {};
  const { flight, search = {}, seats = [], seatFee = 250, cabinClass = "Economy", totalTravellers = 1 } = payload;
  const [passenger, setPassenger] = useState({
    name: "",
    age: "",
    gender: "Male",
    mobile: "",
    email: "",
    idProofType: "Aadhaar",
    idProofNumber: "",
  });

  if (!flight) {
    return (
      <div className="flight-empty">
        <h1>No flight selected</h1>
        <button onClick={() => navigate("/dashboard/flights")}>Back to Flights</button>
      </div>
    );
  }

  const updatePassenger = (key, value) => {
    setPassenger((current) => ({ ...current, [key]: value }));
  };

  const continueFlow = () => {
    const baseFare = Number(flight.price || 0) * totalTravellers;
    const seatCharges = Number(seatFee || 0) * seats.length;
    const taxes = Math.round((baseFare + seatCharges) * 0.12);
    const platformFee = 99;
    const totalAmount = baseFare + seatCharges + taxes + platformFee;
    const nextPayload = { ...payload, passenger, baseFare, seatCharges, taxes, platformFee, totalAmount };
    sessionStorage.setItem("flightReviewBooking", JSON.stringify(nextPayload));
    navigate(`/dashboard/flights/${flight.id || flight._id}/payment`, { state: nextPayload });
  };

  return (
    <div className="flight-traveller-page">
      <header className="flight-step-header">
        <button onClick={() => navigate(-1)}><FaArrowLeft /></button>
        <div>
          <h1>Passenger Details</h1>
          <p>{flight.airline} {flight.flightNumber} | {flight.fromCode} to {flight.toCode}</p>
        </div>
      </header>

      <main className="traveller-shell">
        <section className="traveller-card">
          <h2><FaUserFriends /> Lead Passenger</h2>
          <div className="passenger-form-grid">
            <label><span>Passenger name</span><input value={passenger.name} onChange={(event) => updatePassenger("name", event.target.value)} /></label>
            <label><span>Age</span><input type="number" value={passenger.age} onChange={(event) => updatePassenger("age", event.target.value)} /></label>
            <label><span>Gender</span><select value={passenger.gender} onChange={(event) => updatePassenger("gender", event.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></label>
            <label><span>Mobile number</span><input value={passenger.mobile} onChange={(event) => updatePassenger("mobile", event.target.value)} /></label>
            <label><span>Email</span><input type="email" value={passenger.email} onChange={(event) => updatePassenger("email", event.target.value)} /></label>
            <label><span>ID proof type</span><select value={passenger.idProofType} onChange={(event) => updatePassenger("idProofType", event.target.value)}><option>Aadhaar</option><option>PAN</option><option>Passport</option><option>Driving License</option></select></label>
            <label className="full"><span>ID proof number</span><input value={passenger.idProofNumber} onChange={(event) => updatePassenger("idProofNumber", event.target.value)} /></label>
          </div>
        </section>

        <section className="traveller-card">
          <h2>Trip Summary</h2>
          <div className="traveller-row"><div><strong>Cabin Class</strong><span>{cabinClass}</span></div></div>
          <div className="traveller-row"><div><strong>Selected Seats</strong><span>{seats.join(", ") || "Not selected"}</span></div></div>
          <div className="traveller-row"><div><strong>Passengers</strong><span>{totalTravellers}</span></div></div>
        </section>
      </main>

      <footer className="flight-step-summary">
        <div>
          <span>Total Travellers</span>
          <h2>{totalTravellers}</h2>
        </div>
        <button onClick={continueFlow}>Continue</button>
      </footer>
    </div>
  );
}

export default FlightTravellerSelection;
