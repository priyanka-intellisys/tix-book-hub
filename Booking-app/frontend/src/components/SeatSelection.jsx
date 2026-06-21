import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./SeatSelection.css";

const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

function SeatSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const movie = location.state?.movie;
  const [selectedSeats, setSelectedSeats] = useState([]);
  const seats = Array.from({ length: 40 }, (_, i) => i + 1);

  const handleSeat = (seat) => {
    setSelectedSeats((current) =>
      current.includes(seat)
        ? current.filter((selected) => selected !== seat)
        : [...current, seat]
    );
  };

  const confirmBooking = async () => {
    if (!movie) return navigate("/movies");
    if (!selectedSeats.length) return alert("Select at least one seat");

    const response = await fetch("http://localhost:5000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        module: "movie",
        title: movie.title,
        seats: selectedSeats.map(String),
        details: movie,
        amount: selectedSeats.length * 250,
      }),
    });
    const data = await response.json();

    if (response.ok) {
      alert(`Booking confirmed: ${data.booking.bookingCode}`);
      navigate("/dashboard");
    } else {
      alert(data.message || "Booking failed");
    }
  };

  return (
    <div className="seat-page">
      <div className="seat-top">
        <button className="seat-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div>
          <h1>{movie?.title || "Seat Selection"}</h1>
          <p>Select Your Seats</p>
        </div>
      </div>

      <div className="screen">SCREEN</div>

      <div className="seats-grid">
        {seats.map((seat) => (
          <button
            key={seat}
            className={`seat ${selectedSeats.includes(seat) ? "selected-seat" : ""}`}
            onClick={() => handleSeat(seat)}
          >
            {seat}
          </button>
        ))}
      </div>

      <div className="booking-bar">
        <div>
          <h3>Selected Seats: {selectedSeats.length}</h3>
          <p>Total: Rs {selectedSeats.length * 250}</p>
        </div>
        <button onClick={confirmBooking}>Confirm Booking</button>
      </div>
    </div>
  );
}

export default SeatSelection;
