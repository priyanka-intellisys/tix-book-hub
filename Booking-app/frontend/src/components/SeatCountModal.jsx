import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./SeatCountModal.css";

const priceCategories = [
  { name: "Prime", price: 250 },
  { name: "Classic Plus", price: 180 },
  { name: "Classic", price: 150 },
];

function SeatCountModal({ movie, theatre, showtime, onClose, onSelectSeats }) {
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
