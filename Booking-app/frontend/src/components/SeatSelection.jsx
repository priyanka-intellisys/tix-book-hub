import React, { useState } from "react";

import {
  FaArrowLeft,
} from "react-icons/fa";

import "./SeatSelection.css";

function SeatSelection({

  selectedMovie,

  setActivePage,

}) {

  const [selectedSeats, setSelectedSeats] =
    useState([]);

  const seats = Array.from(
    { length: 40 },
    (_, i) => i + 1
  );

  const handleSeat = (seat) => {

    if (
      selectedSeats.includes(seat)
    ) {

      setSelectedSeats(
        selectedSeats.filter(
          (s) => s !== seat
        )
      );

    } else {

      setSelectedSeats([
        ...selectedSeats,
        seat,
      ]);

    }

  };

  return (

    <div className="seat-page">

      <div className="seat-top">

        <button
          className="seat-back-btn"

          onClick={() =>
            setActivePage(
              "movieDetails"
            )
          }
        >
          <FaArrowLeft />
        </button>

        <div>

          <h1>
            {selectedMovie?.title}
          </h1>

          <p>
            Select Your Seats
          </p>

        </div>

      </div>

      {/* SCREEN */}

      <div className="screen">
        SCREEN
      </div>

      {/* SEATS */}

      <div className="seats-grid">

        {seats.map((seat) => (

          <button
            key={seat}

            className={`seat ${
              selectedSeats.includes(
                seat
              )
                ? "selected-seat"
                : ""
            }`}

            onClick={() =>
              handleSeat(seat)
            }
          >
            {seat}
          </button>

        ))}

      </div>

      {/* SUMMARY */}

      <div className="booking-bar">

        <div>

          <h3>
            Selected Seats:
            {selectedSeats.length}
          </h3>

          <p>
            Total:
            ₹
            {selectedSeats.length *
              250}
          </p>

        </div>

        <button>
          Confirm Booking
        </button>

      </div>

    </div>
  );
}

export default SeatSelection;