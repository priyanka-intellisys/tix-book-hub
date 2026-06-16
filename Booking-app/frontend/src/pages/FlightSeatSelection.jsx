import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaPlane } from "react-icons/fa";
import "./FlightSeatSelection.css";

const layouts = {
  A320: { columns: ["A", "B", "C", "D", "E", "F"], groups: [3, 3], rows: 20 },
  B737: { columns: ["A", "B", "C", "D", "E", "F"], groups: [3, 3], rows: 20 },
  ATR72: { columns: ["A", "B", "C", "D"], groups: [2, 2], rows: 18 },
  B777: { columns: ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"], groups: [3, 4, 3], rows: 35 },
};

const getLayout = (aircraft = "") => {
  const key = Object.keys(layouts).find((item) => aircraft.toUpperCase().includes(item));
  return layouts[key] || layouts.A320;
};

const getSeatType = (columns, column) => {
  const index = columns.indexOf(column);
  if (index === 0 || index === columns.length - 1) return "Window";
  if (columns.length === 10 && ["C", "D", "G", "H"].includes(column)) return "Aisle";
  if (["C", "D"].includes(column)) return "Aisle";
  return "Middle";
};

function FlightSeatSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const saved = JSON.parse(sessionStorage.getItem("selectedFlight") || "null");
  const payload = location.state || saved || {};
  const { flight, search = {} } = payload;
  const cabinClass = search.cabinClass || flight?.cabinClass || flight?.cabinClasses?.[0] || "Economy";
  const totalTravellers = Number(search.passengers || 1);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const layout = getLayout(flight?.aircraftType || flight?.aircraft || "");

  if (!flight) {
    return (
      <div className="flight-empty">
        <h1>No flight selected</h1>
        <button onClick={() => navigate("/dashboard/flights")}>Back to Flights</button>
      </div>
    );
  }

  const reservedSeats = new Set(flight.reservedSeats || []);
  const seatFee = cabinClass === "Business Class" ? 950 : cabinClass === "Premium Economy" ? 550 : 250;

  const toggleSeat = (seatId) => {
    if (reservedSeats.has(seatId)) return;

    setSelectedSeats((current) => {
      if (current.includes(seatId)) return current.filter((seat) => seat !== seatId);
      if (current.length >= totalTravellers) return current;
      return [...current, seatId];
    });
  };

  const continueFlow = () => {
    const nextPayload = { flight, search, cabinClass, totalTravellers, seats: selectedSeats, seatFee };
    sessionStorage.setItem("flightSeatSelection", JSON.stringify(nextPayload));
    navigate(`/dashboard/flights/${flight.id || flight._id}/passengers`, { state: nextPayload });
  };

  return (
    <div className="flight-seat-page">
      <header className="flight-step-header">
        <button onClick={() => navigate(-1)}><FaArrowLeft /></button>
        <div>
          <h1>Flight Seat Selection</h1>
          <p>{flight.aircraftType || flight.aircraft} | {cabinClass} | Select {totalTravellers} seats</p>
        </div>
      </header>

      <main className="flight-aircraft-shell">
        <section className="aircraft-map">
          <div className="aircraft-nose"><FaPlane /> Aircraft Layout</div>
          <div className="aircraft-columns">
            {layout.columns.map((column) => <span key={column}>{column}</span>)}
          </div>

          <div className="aircraft-seat-grid">
            {Array.from({ length: layout.rows }, (_, rowIndex) => rowIndex + 1).map((row) => (
              <div className="aircraft-row" key={row} style={{ "--seat-columns": layout.columns.length }}>
                <span className="aircraft-row-label">{row}</span>
                {layout.columns.map((column) => {
                  const seatId = `${row}${column}`;
                  const reserved = reservedSeats.has(seatId);
                  const selected = selectedSeats.includes(seatId);
                  const seatKind = getSeatType(layout.columns, column);

                  return (
                    <button
                      key={seatId}
                      className={`flight-seat ${seatKind.toLowerCase()} ${reserved ? "reserved" : ""} ${selected ? "selected" : ""}`}
                      disabled={reserved}
                      onClick={() => toggleSeat(seatId)}
                      title={`${seatId} | ${seatKind}`}
                    >
                      {seatId}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <aside className="seat-pricing-card">
          <h2>Seat Pricing</h2>
          <p>{cabinClass}</p>
          <strong>Rs {seatFee} per seat</strong>
          <div className="flight-seat-legend">
            <span><i className="available"></i> Available Seats</span>
            <span><i className="reserved"></i> Reserved Seats</span>
            <span><i className="selected"></i> Selected Seats</span>
            <span><i className="window"></i> Window Seats</span>
            <span><i className="middle"></i> Middle Seats</span>
            <span><i className="aisle"></i> Aisle Seats</span>
          </div>
          <div className="selected-flight-seats">
            <span>Selected Seats</span>
            <h3>{selectedSeats.join(", ") || "Select seats"}</h3>
          </div>
          <button disabled={selectedSeats.length !== totalTravellers} onClick={continueFlow}>
            <FaCheckCircle /> Continue
          </button>
        </aside>
      </main>
    </div>
  );
}

export default FlightSeatSelection;
