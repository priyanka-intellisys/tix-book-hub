import React, { useEffect, useMemo, useState } from "react";
import { FaTicketAlt } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import "./Dashboard.css";

const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }), []);

  const loadBookings = () => {
    fetch(`${apiBase}/bookings`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]));
  };

  useEffect(loadBookings, [authHeaders]);

  const cancelBooking = async (id) => {
    const response = await fetch(`${apiBase}/bookings/${id}/cancel`, {
      method: "PATCH",
      headers: authHeaders,
    });
    if (response.ok) loadBookings();
  };

  const getBookingId = (booking) => booking.bookingId || booking.booking_id || booking.bookingCode || booking.booking_code || booking._id || booking.id;
  const getQrValue = (booking) => JSON.stringify(booking.qrPayload || booking.details?.qrPayload || {
    bookingId: getBookingId(booking),
    userId: booking.user || booking.user_id,
    movieId: booking.movieId || booking.movie_id || booking.details?.movieId,
    theatreId: booking.theatreId || booking.theatre_id || booking.details?.theatreId,
    screenId: booking.screenId || booking.screen_id || booking.details?.screenId,
    showId: booking.showId || booking.show_id || booking.details?.showId,
    selectedSeats: booking.seats || booking.seatNumbers || booking.seat_numbers || [],
    paymentStatus: booking.paymentStatus || booking.payment_status,
    bookingStatus: booking.bookingStatus || booking.booking_status || booking.status,
    qrToken: booking.qrToken || booking.qr_token || booking.details?.qrToken || booking.details?.qr_token,
  });
  const isConfirmed = (booking) => String(booking.bookingStatus || booking.booking_status || booking.status || "").toLowerCase() === "confirmed";
  const canEdit = (booking) => {
    const payment = String(booking.paymentStatus || booking.payment_status || "").toLowerCase();
    const status = String(booking.bookingStatus || booking.booking_status || booking.status || "").toLowerCase();
    return booking.module === "movie" && !["paid", "success"].includes(payment) && !["completed", "cancelled", "refunded"].includes(status);
  };
  const editBooking = async (booking) => {
    const currentSeats = Array.isArray(booking.seats) ? booking.seats.join(", ") : "";
    const value = window.prompt("Enter new seat numbers separated by comma", currentSeats);
    if (!value) return;
    const seats = value.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
    if (!seats.length) return;
    const response = await fetch(`${apiBase}/bookings/${getBookingId(booking)}/edit`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ seats }),
    });
    const data = await response.json();
    if (!response.ok) return alert(data.message || "Unable to edit booking");
    loadBookings();
    setSelectedTicket(data.booking);
  };
  const getSeats = (booking) => {
    const seats = booking.seatNumbers || booking.seat_numbers || booking.seats || booking.details?.seats || [];
    if (Array.isArray(seats)) return seats.join(", ");
    return String(seats || "Not available");
  };

  return (
    <section className="section-block">
      <div className="section-header"><h3>My Bookings</h3></div>
      {bookings.map((booking) => (
        <div className="summary-booking-card" key={booking._id}>
          <div className="summary-card-left">
            <div className="summary-icon-box movies"><FaTicketAlt /></div>
            <div className="summary-info">
              <h4>{booking.title}</h4>
              <p className="subtitle">{booking.module} - {getBookingId(booking)}</p>
              <p className="time-details">QR Ticket and invoice ready</p>
            </div>
          </div>
          <div className="summary-card-right">
            <span className="status-badge green">{booking.status}</span>
            <h3 className="summary-price">Rs {booking.amount}</h3>
            {isConfirmed(booking) && (
              <div className="booking-qr-mini">
                <QRCodeCanvas value={getQrValue(booking)} size={82} level="M" includeMargin />
              </div>
            )}
            {isConfirmed(booking) && <button className="search-submit-btn" onClick={() => setSelectedTicket(booking)}>View Ticket</button>}
            {canEdit(booking) && <button className="text-action" onClick={() => editBooking(booking)}>Edit</button>}
            {booking.status === "confirmed" && <button className="text-action" onClick={() => cancelBooking(booking._id)}>Cancel</button>}
          </div>
        </div>
      ))}

      {selectedTicket && (
        <div className="ticket-modal-backdrop" role="presentation" onClick={() => setSelectedTicket(null)}>
          <div className="ticket-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="ticket-modal-close" onClick={() => setSelectedTicket(null)}>Close</button>
            <div className="ticket-modal-head">
              <FaTicketAlt />
              <div>
                <h3>{selectedTicket.title}</h3>
                <p>{getBookingId(selectedTicket)}</p>
              </div>
            </div>
            <div className="ticket-modal-grid">
              <p><strong>Movie Name</strong><span>{selectedTicket.title}</span></p>
              <p><strong>Booking ID</strong><span>{getBookingId(selectedTicket)}</span></p>
              <p><strong>Status</strong><span>{selectedTicket.bookingStatus || selectedTicket.booking_status || selectedTicket.status}</span></p>
              <p><strong>Theatre</strong><span>{selectedTicket.theatre || selectedTicket.details?.theatre?.name || selectedTicket.details?.theatre || "Not available"}</span></p>
              <p><strong>Show Time</strong><span>{selectedTicket.showTime || selectedTicket.show_time || selectedTicket.details?.showTime || "Not available"}</span></p>
              <p><strong>Seat Numbers</strong><span>{getSeats(selectedTicket)}</span></p>
              <p><strong>Price</strong><span>Rs {selectedTicket.totalAmount || selectedTicket.total_amount || selectedTicket.amount || 0}</span></p>
            </div>
            <div className="ticket-modal-qr">
              <QRCodeCanvas value={getQrValue(selectedTicket)} size={190} level="H" includeMargin />
              <span>{selectedTicket.qrToken || selectedTicket.qr_token || selectedTicket.details?.qrToken ? "Scan this QR at entry" : "Temporary QR uses booking ID"}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default MyBookings;
