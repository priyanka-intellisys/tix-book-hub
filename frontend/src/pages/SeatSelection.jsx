import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaRupeeSign } from "react-icons/fa";
import "./SeatSelection.css";

const sectionTitle = (seatType, price) => {
  const label = {
    vip: "VIP ROWS",
    premium: "PRIME ROWS",
    prime: "PRIME ROWS",
    regular: "REGULAR ROWS",
  }[seatType] || "SEATS";
  return `Rs ${price || 0} ${label}`;
};

const sectionCategory = (seatType) => ({
  vip: "VIP",
  premium: "Prime",
  prime: "Prime",
  regular: "Regular",
}[seatType] || "Regular");

const categoryOrder = { regular: 0, premium: 1, prime: 1, vip: 2 };
const rowIndex = (label) => String(label || "").toUpperCase().split("").reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;

function SeatSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    movie,
    theatre,
    showtime,
    selectedSeats = 2,
    category = { name: "Regular", price: 240 },
  } = location.state || {};

  const [selected, setSelected] = useState([]);
  const [seatTarget, setSeatTarget] = useState(Number(selectedSeats || 1));
  const [liveSeats, setLiveSeats] = useState([]);
  const [seatError, setSeatError] = useState("");
  const showId = showtime?.showId || movie?._id || "";

  const unavailableSeats = useMemo(() => {
    const liveUnavailable = liveSeats
      .filter((seat) => seat.status === "booked" || seat.status === "blocked")
      .map((seat) => seat.seatNo || seat.seatNumber);
    return liveUnavailable.length ? liveUnavailable : [...(movie?.bookedSeats || []), ...(movie?.blockedSeats || [])];
  }, [liveSeats, movie?.bookedSeats, movie?.blockedSeats]);

  const seatsByNumber = useMemo(
    () => new Map(liveSeats.map((seat) => [seat.seatNo || seat.seatNumber, seat])),
    [liveSeats]
  );

  const seatSections = useMemo(() => {
    const grouped = liveSeats.reduce((acc, seat) => {
      const seatType = seat.seatType || "regular";
      const row = seat.rowName || String(seat.seatNo || seat.seatNumber || "").replace(/\d/g, "") || "A";
      if (!acc[seatType]) acc[seatType] = { seatType, price: seat.price || category.price || 240, rows: {} };
      if (!acc[seatType].rows[row]) acc[seatType].rows[row] = [];
      acc[seatType].rows[row].push(seat);
      return acc;
    }, {});

    return Object.values(grouped).sort((left, right) => (categoryOrder[left.seatType] ?? 99) - (categoryOrder[right.seatType] ?? 99)).map((section) => ({
      ...section,
      category: sectionCategory(section.seatType),
      title: sectionTitle(section.seatType, section.price),
      rows: Object.entries(section.rows).map(([row, seats]) => ({
        row,
        seats: seats.sort((a, b) => Number(a.seatNumber) - Number(b.seatNumber)),
      })).sort((a, b) => rowIndex(a.row) - rowIndex(b.row)),
    }));
  }, [liveSeats, category.price]);

  const rowLabels = seatSections.flatMap((section, index) => [
    ...section.rows.map((item) => item.row),
    ...(index < seatSections.length - 1 ? [""] : []),
  ]);

  useEffect(() => {
    if (!movie?._id || !showId) return;
    const theatreName = theatre?.name || theatre || "";
    const showDate = showtime?.showDate || showtime?.date?.value || showtime?.date?.label || "";
    const showTime = showtime?.showTime || showtime?.time || "";
    const params = new URLSearchParams({
      movieId: movie._id,
      theatre: theatreName,
      screenId: showtime?.screenId || movie.screenNumber || "Screen 1",
      showDate,
      showTime,
      totalSeats: String(showtime?.totalSeats || movie.totalSeats || 120),
      rows: String(showtime?.screen?.rows || ""),
      seatsPerRow: String(showtime?.screen?.seatsPerRow || ""),
      price: String(showtime?.price || movie.ticketPrice || category.price || 240),
      vipSeats: String(showtime?.vipSeats || showtime?.screen?.vipSeats || movie.vipSeats || movie.vipSeatCount || ""),
      primeSeats: String(showtime?.primeSeats || showtime?.screen?.primeSeats || movie.primeSeats || movie.primeSeatCount || ""),
      regularSeats: String(showtime?.regularSeats || showtime?.screen?.regularSeats || movie.regularSeats || movie.regularSeatCount || ""),
      vipPrice: String(showtime?.vipPrice || showtime?.screen?.vipPrice || movie.vipSeatPrice || ""),
      primePrice: String(showtime?.primePrice || showtime?.screen?.primePrice || movie.premiumSeatPrice || ""),
      regularPrice: String(showtime?.regularPrice || showtime?.screen?.regularPrice || movie.regularSeatPrice || ""),
      vipRowsStart: String(showtime?.vipRowsStart || showtime?.screen?.vipRowsStart || movie.vipRowsStart || ""),
      vipRowsEnd: String(showtime?.vipRowsEnd || showtime?.screen?.vipRowsEnd || movie.vipRowsEnd || ""),
      vipSeatsPerRow: String(showtime?.vipSeatsPerRow || showtime?.screen?.vipSeatsPerRow || movie.vipSeatsPerRow || ""),
      premiumRowsStart: String(showtime?.premiumRowsStart || showtime?.screen?.premiumRowsStart || movie.premiumRowsStart || movie.primeRowsStart || ""),
      premiumRowsEnd: String(showtime?.premiumRowsEnd || showtime?.screen?.premiumRowsEnd || movie.premiumRowsEnd || movie.primeRowsEnd || ""),
      premiumSeatsPerRow: String(showtime?.premiumSeatsPerRow || showtime?.screen?.premiumSeatsPerRow || movie.premiumSeatsPerRow || movie.primeSeatsPerRow || ""),
      primeRowsStart: String(showtime?.primeRowsStart || showtime?.screen?.primeRowsStart || movie.primeRowsStart || movie.premiumRowsStart || ""),
      primeRowsEnd: String(showtime?.primeRowsEnd || showtime?.screen?.primeRowsEnd || movie.primeRowsEnd || movie.premiumRowsEnd || ""),
      primeSeatsPerRow: String(showtime?.primeSeatsPerRow || showtime?.screen?.primeSeatsPerRow || movie.primeSeatsPerRow || movie.premiumSeatsPerRow || ""),
      regularRowsStart: String(showtime?.regularRowsStart || showtime?.screen?.regularRowsStart || movie.regularRowsStart || ""),
      regularRowsEnd: String(showtime?.regularRowsEnd || showtime?.screen?.regularRowsEnd || movie.regularRowsEnd || ""),
      regularSeatsPerRow: String(showtime?.regularSeatsPerRow || showtime?.screen?.regularSeatsPerRow || movie.regularSeatsPerRow || ""),
      todayVisibleRowStart: String(showtime?.todayVisibleRowStart || showtime?.screen?.todayVisibleRowStart || showtime?.screen?.visible_row_start || ""),
      todayVisibleRowEnd: String(showtime?.todayVisibleRowEnd || showtime?.screen?.todayVisibleRowEnd || showtime?.screen?.visible_row_end || ""),
    });

    fetch(`http://localhost:5000/api/seats/${encodeURIComponent(showId)}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Unable to load seats");
        return data;
      })
      .then((data) => {
        setSeatError("");
        setLiveSeats(Array.isArray(data.seats) ? data.seats : []);
      })
      .catch((error) => {
        setSeatError(error.message || "Unable to load seats");
        setLiveSeats([]);
      });
  }, [movie?._id, showId, theatre, showtime, category.price]);

  if (!movie || !theatre || !showtime) {
    return (
      <div className="seat-empty">
        <h2>Booking details missing</h2>
        <button onClick={() => navigate("/dashboard/movies")}>Back</button>
      </div>
    );
  }

  const toggleSeat = (seatNo) => {
    if (unavailableSeats.includes(seatNo)) return;

    setSelected((prev) => {
      if (prev.includes(seatNo)) return prev.filter((s) => s !== seatNo);
      if (prev.length >= seatTarget) return prev;
      return [...prev, seatNo];
    });
  };

  const selectTenSeats = () => {
    const available = seatSections
      .flatMap((section) => section.rows.flatMap((row) => row.seats))
      .map((seat) => seat.seatNo || seat.seatNumber)
      .filter((seatNo) => seatNo && !unavailableSeats.includes(seatNo));
    setSeatTarget(10);
    setSelected(available.slice(0, 10));
  };

  const totalAmount = selected.reduce(
    (sum, seatNo) => sum + Number(seatsByNumber.get(seatNo)?.price || category.price || 240),
    0
  );

  return (
    <div className="seat-page">
      <header className="seat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>

        <div>
          <h2>{movie.title} - ({movie.language})</h2>
          <p>
            {theatre.name} | {showtime.date?.label}, {showtime.date?.day}{" "}
            {showtime.date?.month}, 2026 | {showtime.time}
          </p>
        </div>

        <button className="ticket-count">{seatTarget} Tickets</button>
      </header>

      <div className="time-bar">
        <button className="active-time">{showtime.time}</button>
        <button className="select-ten-btn" type="button" onClick={selectTenSeats} disabled={!liveSeats.length}>
          Select 10 Seats
        </button>
      </div>

      <main className="seat-area">
        <div className="row-side">
          {(rowLabels.length ? rowLabels : [""]).map((row, index) => (
            <span key={`${row}-${index}`}>{row}</span>
          ))}
        </div>

        <div className="seat-layout">
          {seatSections.map((section) => (
            <div className="seat-section" key={section.title}>
              <h3>{section.title}</h3>

              {section.rows.map(({ row, seats }) => (
                <div className="seat-row" key={row}>
                  <div className="seat-gap"></div>

                  {seats.map((seat) => {
                    const seatNo = seat.seatNo || seat.seatNumber;
                    const num = seat.seatNumber || seatNo.replace(row, "");
                    const isBooked = seat.status === "booked";
                    const isBlocked = seat.status === "blocked";
                    const isUnavailable = unavailableSeats.includes(seatNo);
                    const isSelected = selected.includes(seatNo);

                    return (
                      <button
                        key={seatNo}
                        className={`seat ${isBooked ? "sold" : ""} ${isBlocked ? "blocked" : ""} ${isSelected ? "selected" : ""}`}
                        disabled={isUnavailable}
                        onClick={() => toggleSeat(seatNo)}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}

          {!liveSeats.length && (
            <div className="seat-empty">
              <h2>{seatError || "Loading seats..."}</h2>
            </div>
          )}

          <div className="screen-box">
            <div className="screen-line"></div>
            <p>SCREEN THIS WAY</p>
          </div>
        </div>

        <div className="zoom-icons">
          <button>+</button>
          <button>-</button>
        </div>
      </main>

      <div className="legend">
        <span><i className="available"></i> Available</span>
        <span><i className="selected-box"></i> Selected</span>
        <span><i className="sold-box"></i> Booked</span>
        <span><i className="blocked-box"></i> Blocked</span>
      </div>

      {selected.length > 0 && (
        <footer className="booking-footer">
          <div>
            <strong>{selected.join(", ")}</strong>
            <p>{selected.length}/{seatTarget} seats selected</p>
          </div>

          <div>
            <strong>
              <FaRupeeSign /> {totalAmount}
            </strong>
            <p>Total Amount</p>
          </div>

          <button
            disabled={selected.length !== seatTarget}
            onClick={() => {
              const payload = {
                movie,
                theatre,
                showtime,
                showId,
                screenId: showtime?.screenId || showtime?.screen?._id,
                totalSeats: showtime?.totalSeats || movie.totalSeats,
                rows: showtime?.screen?.rows,
                seatsPerRow: showtime?.screen?.seatsPerRow,
                vipSeats: showtime?.vipSeats || showtime?.screen?.vipSeats || movie.vipSeats || movie.vipSeatCount,
                primeSeats: showtime?.primeSeats || showtime?.screen?.primeSeats || movie.primeSeats || movie.primeSeatCount,
                regularSeats: showtime?.regularSeats || showtime?.screen?.regularSeats || movie.regularSeats || movie.regularSeatCount,
                vipPrice: showtime?.vipPrice || showtime?.screen?.vipPrice || movie.vipSeatPrice,
                primePrice: showtime?.primePrice || showtime?.screen?.primePrice || movie.premiumSeatPrice,
                regularPrice: showtime?.regularPrice || showtime?.screen?.regularPrice || movie.regularSeatPrice,
                vipRowsStart: showtime?.vipRowsStart || showtime?.screen?.vipRowsStart || movie.vipRowsStart,
                vipRowsEnd: showtime?.vipRowsEnd || showtime?.screen?.vipRowsEnd || movie.vipRowsEnd,
                vipSeatsPerRow: showtime?.vipSeatsPerRow || showtime?.screen?.vipSeatsPerRow || movie.vipSeatsPerRow,
                premiumRowsStart: showtime?.premiumRowsStart || showtime?.screen?.premiumRowsStart || movie.premiumRowsStart || movie.primeRowsStart,
                premiumRowsEnd: showtime?.premiumRowsEnd || showtime?.screen?.premiumRowsEnd || movie.premiumRowsEnd || movie.primeRowsEnd,
                premiumSeatsPerRow: showtime?.premiumSeatsPerRow || showtime?.screen?.premiumSeatsPerRow || movie.premiumSeatsPerRow || movie.primeSeatsPerRow,
                primeRowsStart: showtime?.primeRowsStart || showtime?.screen?.primeRowsStart || movie.primeRowsStart || movie.premiumRowsStart,
                primeRowsEnd: showtime?.primeRowsEnd || showtime?.screen?.primeRowsEnd || movie.primeRowsEnd || movie.premiumRowsEnd,
                primeSeatsPerRow: showtime?.primeSeatsPerRow || showtime?.screen?.primeSeatsPerRow || movie.primeSeatsPerRow || movie.premiumSeatsPerRow,
                regularRowsStart: showtime?.regularRowsStart || showtime?.screen?.regularRowsStart || movie.regularRowsStart,
                regularRowsEnd: showtime?.regularRowsEnd || showtime?.screen?.regularRowsEnd || movie.regularRowsEnd,
                regularSeatsPerRow: showtime?.regularSeatsPerRow || showtime?.screen?.regularSeatsPerRow || movie.regularSeatsPerRow,
                todayVisibleRowStart: showtime?.todayVisibleRowStart || showtime?.screen?.todayVisibleRowStart || showtime?.screen?.visible_row_start,
                todayVisibleRowEnd: showtime?.todayVisibleRowEnd || showtime?.screen?.todayVisibleRowEnd || showtime?.screen?.visible_row_end,
                seats: selected,
                totalAmount,
                category,
              };
              sessionStorage.setItem("moviePayment", JSON.stringify(payload));
              navigate(`/dashboard/movies/${movie._id}/payment`, { state: payload });
            }}
          >
            Continue
          </button>
        </footer>
      )}
    </div>
  );
}

export default SeatSelection;
