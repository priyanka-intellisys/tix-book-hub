import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaCreditCard, FaMobileAlt, FaUniversity, FaWallet } from "react-icons/fa";
import "./FlightPayment.css";

const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const getUser = () => {
  const rawUser = localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser");
  return rawUser ? JSON.parse(rawUser) : {};
};

function MoviePayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const saved = JSON.parse(sessionStorage.getItem("moviePayment") || "null");
  const payload = location.state || saved || {};
  const { movie, theatre, showtime, seats = [], totalAmount = 0 } = payload;
  const [method, setMethod] = useState("UPI");
  const [paying, setPaying] = useState(false);

  if (!movie) {
    return (
      <div className="flight-empty">
        <h1>No payment selected</h1>
        <button onClick={() => navigate("/dashboard/movies")}>Back to Movies</button>
      </div>
    );
  }

  const paymentMethods = [
    { name: "UPI", icon: <FaMobileAlt /> },
    { name: "Card", icon: <FaCreditCard /> },
    { name: "Net Banking", icon: <FaUniversity /> },
    { name: "Wallet", icon: <FaWallet /> },
  ];

  const confirmPayment = async () => {
    setPaying(true);

    try {
      const user = getUser();
      const showDate = showtime?.showDate || showtime?.date?.value || showtime?.date?.label || "";
      const showTime = showtime?.showTime || showtime?.time || "";
      const showId = showtime?.showId || showtime?._id || payload.showId || movie._id || movie.id;
      const screenId = payload.screenId || showtime?.screenId || showtime?.screen?._id || movie.screenNumber || "Screen 1";
      const vendorId = movie.vendorId || movie.vendor || payload.vendorId || null;
      const commonBookingPayload = {
        movieId: movie._id || movie.id,
        showId,
        screenId,
        totalSeats: payload.totalSeats || showtime?.totalSeats || movie.totalSeats,
        rows: payload.rows || showtime?.screen?.rows,
        seatsPerRow: payload.seatsPerRow || showtime?.screen?.seatsPerRow,
        vipSeats: payload.vipSeats || showtime?.vipSeats || showtime?.screen?.vipSeats,
        primeSeats: payload.primeSeats || showtime?.primeSeats || showtime?.screen?.primeSeats,
        regularSeats: payload.regularSeats || showtime?.regularSeats || showtime?.screen?.regularSeats,
        vipPrice: payload.vipPrice || showtime?.vipPrice || showtime?.screen?.vipPrice || movie.vipSeatPrice,
        primePrice: payload.primePrice || showtime?.primePrice || showtime?.screen?.primePrice || movie.premiumSeatPrice,
        regularPrice: payload.regularPrice || showtime?.regularPrice || showtime?.screen?.regularPrice || movie.regularSeatPrice,
        vipRowsStart: payload.vipRowsStart,
        vipRowsEnd: payload.vipRowsEnd,
        vipSeatsPerRow: payload.vipSeatsPerRow,
        premiumRowsStart: payload.premiumRowsStart,
        premiumRowsEnd: payload.premiumRowsEnd,
        premiumSeatsPerRow: payload.premiumSeatsPerRow,
        regularRowsStart: payload.regularRowsStart,
        regularRowsEnd: payload.regularRowsEnd,
        regularSeatsPerRow: payload.regularSeatsPerRow,
        todayVisibleRowStart: payload.todayVisibleRowStart,
        todayVisibleRowEnd: payload.todayVisibleRowEnd,
        price: showtime?.price || movie.ticketPrice,
        vendorId,
        customerName: user.name || "Customer",
        customerEmail: user.email || "",
        customerMobile: user.mobile || "",
        title: movie.title,
        theatre: theatre?.name || theatre || "",
        showDate,
        showTime,
        seats,
        amount: totalAmount,
        paymentStatus: "pending",
        bookingStatus: "confirmed",
        details: {
          ...payload,
          movieId: movie._id || movie.id,
          showId,
          screenId,
          totalSeats: payload.totalSeats || showtime?.totalSeats || movie.totalSeats,
          rows: payload.rows || showtime?.screen?.rows,
          seatsPerRow: payload.seatsPerRow || showtime?.screen?.seatsPerRow,
          vipSeats: payload.vipSeats || showtime?.vipSeats || showtime?.screen?.vipSeats,
          primeSeats: payload.primeSeats || showtime?.primeSeats || showtime?.screen?.primeSeats,
          regularSeats: payload.regularSeats || showtime?.regularSeats || showtime?.screen?.regularSeats,
          vipPrice: payload.vipPrice || showtime?.vipPrice || showtime?.screen?.vipPrice || movie.vipSeatPrice,
          primePrice: payload.primePrice || showtime?.primePrice || showtime?.screen?.primePrice || movie.premiumSeatPrice,
          regularPrice: payload.regularPrice || showtime?.regularPrice || showtime?.screen?.regularPrice || movie.regularSeatPrice,
          vipRowsStart: payload.vipRowsStart,
          vipRowsEnd: payload.vipRowsEnd,
          vipSeatsPerRow: payload.vipSeatsPerRow,
          premiumRowsStart: payload.premiumRowsStart,
          premiumRowsEnd: payload.premiumRowsEnd,
          premiumSeatsPerRow: payload.premiumSeatsPerRow,
          regularRowsStart: payload.regularRowsStart,
          regularRowsEnd: payload.regularRowsEnd,
          regularSeatsPerRow: payload.regularSeatsPerRow,
          todayVisibleRowStart: payload.todayVisibleRowStart,
          todayVisibleRowEnd: payload.todayVisibleRowEnd,
          vendorId,
          customerName: user.name || "Customer",
          customerEmail: user.email || "",
          customerMobile: user.mobile || "",
          theatre,
          showDate,
          showTime,
          paymentMethod: method,
          paymentInterlockEnabled: false,
        },
      };

      const response = await fetch(`${apiBase}/bookings/movie`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...commonBookingPayload,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Booking failed");
        return;
      }

      const confirmation = { ...payload, paymentMethod: method, booking: data.booking };
      sessionStorage.setItem("movieConfirmation", JSON.stringify(confirmation));
      navigate(`/dashboard/movies/${movie._id}/confirmation`, { state: confirmation });
    } catch (error) {
      alert("Booking failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="flight-payment-page">
      <header className="flight-step-header">
        <button onClick={() => navigate(-1)}><FaArrowLeft /></button>
        <div>
          <h1>Confirm Movie Booking</h1>
          <p>Payment will be connected later; confirm your booking now</p>
        </div>
      </header>

      <main className="payment-grid">
        <section className="payment-card">
          <h2>Payment Method</h2>
          <div className="payment-method-grid">
            {paymentMethods.map((item) => (
              <button key={item.name} className={method === item.name ? "active" : ""} onClick={() => setMethod(item.name)}>
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="payment-summary-card">
          <h2>Booking Summary</h2>
          <div className="payment-summary-row"><span>Movie</span><strong>{movie.title}</strong></div>
          <div className="payment-summary-row"><span>Theatre</span><strong>{theatre?.name}</strong></div>
          <div className="payment-summary-row"><span>Showtime</span><strong>{showtime?.time}</strong></div>
          <div className="payment-summary-row"><span>Seats</span><strong>{seats.join(", ")}</strong></div>
          <div className="payment-total"><span>Total Amount</span><strong>Rs {totalAmount}</strong></div>
          <button disabled={paying} onClick={confirmPayment}>
            <FaCheckCircle /> {paying ? "Confirming..." : "Confirm Booking"}
          </button>
        </aside>
      </main>
    </div>
  );
}

export default MoviePayment;
