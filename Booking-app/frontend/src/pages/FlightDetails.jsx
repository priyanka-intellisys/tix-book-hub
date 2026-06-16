import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaClock, FaPlane, FaRupeeSign, FaSuitcaseRolling } from "react-icons/fa";
import "./FlightDetails.css";

const apiBase = "http://localhost:5000/api";

function FlightDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const saved = JSON.parse(sessionStorage.getItem("selectedFlight") || "null");
  const [flight, setFlight] = useState(location.state?.flight || saved?.flight || null);
  const search = location.state?.search || saved?.search || {};
  const flightId = id || location.state?.flightId || flight?.id || flight?._id;

  useEffect(() => {
    if (!flightId) return;

    axios
      .get(`${apiBase}/flights/${flightId}`)
      .then((res) => {
        setFlight(res.data);
        sessionStorage.setItem("selectedFlight", JSON.stringify({ flight: res.data, search }));
      })
      .catch(() => {});
  }, [flightId]);

  if (!flight) {
    return (
      <div className="flight-empty">
        <h1>No flight selected</h1>
        <button onClick={() => navigate("/dashboard/flights")}>Back to Flights</button>
      </div>
    );
  }

  const continueFlow = () => {
    const payload = { flight, search };
    sessionStorage.setItem("selectedFlight", JSON.stringify(payload));
    navigate(`/dashboard/flights/${flight.id || flight._id}/seats`, { state: payload });
  };

  return (
    <div className="flight-details-page">
      <header className="flight-details-hero">
        <button className="flight-back-btn" onClick={() => navigate(-1)}><FaArrowLeft /></button>
        <div className="airline-logo">{flight.airlineLogoUrl ? <img src={flight.airlineLogoUrl} alt={flight.airline} /> : flight.airline.slice(0, 2).toUpperCase()}</div>
        <div className="flight-hero-copy">
          <span className="flight-chip">Flight Details</span>
          <h1>{flight.airline} {flight.flightNumber}</h1>
          <p>{flight.fromAirport} to {flight.toAirport}</p>
          <div className="flight-detail-meta">
            <span><FaPlane /> {flight.aircraft}</span>
            <span><FaClock /> {flight.duration}</span>
            <span><FaSuitcaseRolling /> {flight.baggage}</span>
            <span>{flight.cabinClass || flight.cabinClasses?.[0] || "Cabin not available"}</span>
          </div>
        </div>
      </header>

      <main className="flight-details-content">
        <section className="flight-timeline-card">
          <div>
            <span>{flight.fromCode}</span>
            <h2>{flight.departureTime}</h2>
            <p>{flight.from}</p>
            <small>{flight.fromAirport}</small>
          </div>
          <div className="timeline-line">
            <FaPlane />
            <strong>{flight.stops}</strong>
          </div>
          <div>
            <span>{flight.toCode}</span>
            <h2>{flight.arrivalTime}</h2>
            <p>{flight.to}</p>
            <small>{flight.toAirport}</small>
          </div>
        </section>

        <section className="flight-fare-card">
          <div>
            <p>Starting fare</p>
            <h2><FaRupeeSign /> {flight.price}</h2>
            <span>{flight.refundable}</span>
            <span>{flight.departureDate || "Date not available"}</span>
            <span>{flight.availableSeats ?? "Seats not available"} seats available</span>
          </div>
          <button onClick={continueFlow}>Select Seats</button>
        </section>
      </main>
    </div>
  );
}

export default FlightDetails;
