import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./SeatCountModal.css";

const getPriceCategories = (movie, showtime) => {
  const hasCounts = [showtime?.vipSeats, showtime?.primeSeats, showtime?.regularSeats, showtime?.screen?.vipSeats, showtime?.screen?.primeSeats, showtime?.screen?.regularSeats]
    .some((value) => value !== undefined && value !== null && value !== "");
  return [
    { name: "VIP", count: showtime?.vipSeats || showtime?.screen?.vipSeats, price: showtime?.vipPrice || showtime?.screen?.vipPrice || movie?.vipSeatPrice || showtime?.price || movie?.ticketPrice || 0 },
    { name: "Prime", count: showtime?.primeSeats || showtime?.screen?.primeSeats, price: showtime?.primePrice || showtime?.screen?.primePrice || movie?.premiumSeatPrice || showtime?.price || movie?.ticketPrice || 0 },
    { name: "Regular", count: showtime?.regularSeats || showtime?.screen?.regularSeats, price: showtime?.regularPrice || showtime?.screen?.regularPrice || movie?.regularSeatPrice || showtime?.price || movie?.ticketPrice || 0 },
  ].filter((category) => !hasCounts || Number(category.count || 0) > 0);
};

function SeatCountModal({ movie, theatre, showtime, onClose, onSelectSeats }) {
  const priceCategories = getPriceCategories(movie, showtime);
  const [seatCount, setSeatCount] = useState(2);
  const [category, setCategory] = useState(priceCategories[0]);

  return (
    <div className="seat-count-backdrop">
      <div className="seat-count-modal">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>

        <div className="seat-count-header">
          <p>{movie?.title}</p>
          <h2>How many seats?</h2>
          <span>{theatre?.name} · {showtime?.time}</span>
        </div>

        <div className="seat-count-options">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
            <button
              key={count}
              className={seatCount === count ? "active" : ""}
              onClick={() => setSeatCount(count)}
            >
              {count}
            </button>
          ))}
        </div>

        <div className="price-category-list">
          {priceCategories.map((item) => (
            <button
              key={item.name}
              className={category.name === item.name ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              <span>{item.name}</span>
              <strong>Rs {item.price}</strong>
            </button>
          ))}
        </div>

        <button
          className="select-seats-btn"
          onClick={() =>
            onSelectSeats({
              seatCount,
              category,
            })
          }
        >
          Select Seats
        </button>
      </div>
    </div>
  );
}

export default SeatCountModal;
