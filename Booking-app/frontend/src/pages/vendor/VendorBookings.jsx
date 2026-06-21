import React, { useEffect, useState } from "react";
import axios from "axios";

const apiBase = "http://localhost:5000/api";

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

function VendorBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${apiBase}/vendor-bookings`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      .then((res) => setBookings(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Unable to load bookings."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="vendor-state-card">Loading bookings...</div>;
  if (error) return <div className="vendor-state-card error">{error}</div>;
  if (!bookings.length) return <div className="vendor-state-card">No bookings yet for vendor modules.</div>;

  return (
    <div className="vendor-table-shell">
      <table className="vendor-table">
        <thead>
          <tr>
            <th>Booking</th>
            <th>Module</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id}>
              <td>
                <strong>{booking.title}</strong>
                <span>{booking.bookingCode}</span>
              </td>
              <td>{booking.module}</td>
              <td><span className="vendor-status-pill">{booking.status}</span></td>
              <td>{booking.paymentStatus}</td>
              <td>Rs {booking.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VendorBookings;
