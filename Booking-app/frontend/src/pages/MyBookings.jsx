import React from "react";
import Navbar from "./Navbar";
import {
  FaBus,
  FaMapMarkerAlt
} from "react-icons/fa";

import "./MyBookings.css";

const bookings = [
  {
    id: 1,
    operator: "Hanif Enterprise",
    from: "Pune",
    to: "Mumbai",
    fare: 500,
    seat: "C2",
    status: "Confirmed",
  },
  {
    id: 2,
    operator: "Ena Travels",
    from: "Delhi",
    to: "Jaipur",
    fare: 750,
    seat: "D4",
    status: "Ongoing",
  },
];

function MyBookings() {
  return (
    <>
      <Navbar />

      <div className="booking-page">

        <div className="header">
          <h1>My Bookings</h1>
          <input
            type="text"
            placeholder="Search booking..."
          />
        </div>

        <div className="booking-layout">

          <div className="sidebar">
            <button className="active">
              Upcoming
            </button>

            <button>
              Previous
            </button>
          </div>

          <div className="booking-content">

            {bookings.map((item) => (
              <div
                className="booking-card"
                key={item.id}
              >
                <div className="left">

                  <div className="icon-box">
                    <FaBus />
                  </div>

                  <div>
                    <h3>{item.operator}</h3>

                    <p>
                      <FaMapMarkerAlt />
                      {item.from} → {item.to}
                    </p>

                    <p>
                      Seat: {item.seat}
                    </p>
                  </div>

                </div>

                <div className="right">

                  <span className="status">
                    {item.status}
                  </span>

                  <h2>₹{item.fare}</h2>

                  <button>
                    View Details
                  </button>

                </div>
              </div>
            ))}

          </div>

        </div>

      </div>
    </>
  );
}

export default MyBookings;