import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import "./SeatSelection.css";

const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
const soldSeats = new Set(["A3", "A4", "C6", "D2", "E8", "F5", "H1"]);

function SeatSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { movie, theatre, showtime, selectedSeats = 1, category = { name: "Prime", price: 250 } } = location.state || {};
  const [selected, setSelected] = useState([]);

  const showtimeOptions = useMemo(
    () => ["10:20 AM", "01:40 PM", "05:30 PM", "09:15 PM"],
    []
  );

  if (!movie || !theatre || !showtime) {
    return (
      <div className="seat-empty">
        <h1>Booking details missing</h1>
        <button onClick={() => navigate("/movies")}>Back to Movies</button>
      </div>
    );
  }

  const toggleSeat = (seatId) => {
    if (soldSeats.has(seatId)) return;

    setSelected((current) => {
      if (current.includes(seatId)) {
        return current.filter((seat) => seat !== seatId);
      }

      if (current.length >= selectedSeats) {
        return current;
      }

      return [...current, seatId];
    });
  };

  const total = selected.length * category.price;

  return (
    <div className="tix-seat-page">
      <header className="seat-flow-header">
        <button onClick={() => navigate("/theatre-shows", { state: { movie } })}>
          <FaArrowLeft />
        </button>
        <div>
          <h1>{movie.title}</h1>
          <p>{theatre.name} · {showtime.date.label}, {showtime.date.day} {showtime.date.month} · {showtime.time}</p>
        </div>
      </header>

      <div className="seat-showtime-row">
        {showtimeOptions.map((time) => (
          <button key={time} className={time === showtime.time ? "active" : ""}>
            {time}
          </button>
        ))}
      </div>

      <main className="seat-map-shell">
        <div className="screen-arc">SCREEN</div>

        <div className="seat-grid-map">
          {rows.map((row) => (
            <div className="seat-row" key={row}>
              <span className="row-label">{row}</span>
              {Array.from({ length: 10 }, (_, index) => {
                const seatId = `${row}${index + 1}`;
                const isSold = soldSeats.has(seatId);
                const isSelected = selected.includes(seatId);

                return (
                  <button
                    key={seatId}
                    className={`seat-cell ${isSold ? "sold" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleSeat(seatId)}
                    disabled={isSold}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="seat-legend">
          <span><i className="available"></i> Available</span>
          <span><i className="selected"></i> Selected</span>
          <span><i className="sold"></i> Sold</span>
        </div>
      </main>

      <footer className="seat-booking-summary">
        <div>
          <p>{category.name} · Rs {category.price}</p>
          <h2>{selected.length}/{selectedSeats} seats selected</h2>
          <span>{selected.join(", ") || "Choose your seats"}</span>
        </div>
        <button disabled={selected.length !== selectedSeats}>
          <FaCheckCircle /> Continue · Rs {total}
        </button>
      </footer>
    </div>
  );
}

export default SeatSelection;
