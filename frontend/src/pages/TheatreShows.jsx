import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaClock, FaFilter, FaMapMarkerAlt, FaRupeeSign, FaTicketAlt } from "react-icons/fa";
import SeatCountModal from "../components/SeatCountModal";
import "./TheatreShows.css";

const defaultShowtimes = ["10:20 AM", "01:40 PM", "05:30 PM", "09:15 PM"];

const getTheatresFromMovie = (movie) => {
  const theatreNames = String(movie.theatreName || movie.theatre || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  const names = theatreNames.length ? theatreNames : ["Theatre details unavailable"];

  return names.map((name) => ({
    name,
    location: movie.theatreAddress || movie.theatreCity || movie.city || "Configured by vendor",
    amenities: ["M-Ticket", "Food & Beverage"],
    cancellation: "Cancellation available",
    showtimes: movie.showTimes?.length ? movie.showTimes : String(movie.showTime || movie.showtime || "").split(",").map((item) => item.trim()).filter(Boolean).length ? String(movie.showTime || movie.showtime || "").split(",").map((item) => item.trim()).filter(Boolean) : defaultShowtimes,
  }));
};

const dateFilters = Array.from({ length: 5 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return {
    label: date.toLocaleDateString("en-IN", { weekday: "short" }),
    day: date.getDate(),
    month: date.toLocaleDateString("en-IN", { month: "short" }),
    value: date.toISOString(),
  };
});

const screenLayoutFields = (screen = {}) => {
  const layout = Array.isArray(screen.layout) ? screen.layout : [];
  const find = (category) => layout.find((item) => String(item.category || "").toUpperCase() === category) || {};
  const vip = find("VIP");
  const premium = find("PREMIUM");
  const regular = find("REGULAR");
  return {
    todayVisibleRowStart: screen.visible_row_start || screen.visibleRowStart,
    todayVisibleRowEnd: screen.visible_row_end || screen.visibleRowEnd,
    vipRowsStart: vip.row_start || vip.rowStart,
    vipRowsEnd: vip.row_end || vip.rowEnd,
    vipSeatsPerRow: vip.seats_per_row || vip.seatsPerRow,
    premiumRowsStart: premium.row_start || premium.rowStart,
    premiumRowsEnd: premium.row_end || premium.rowEnd,
    premiumSeatsPerRow: premium.seats_per_row || premium.seatsPerRow,
    regularRowsStart: regular.row_start || regular.rowStart,
    regularRowsEnd: regular.row_end || regular.rowEnd,
    regularSeatsPerRow: regular.seats_per_row || regular.seatsPerRow,
  };
};

function TheatreShows() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [movie, setMovie] = useState(location.state?.movie || null);
  const [movieShows, setMovieShows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dateFilters[0]);
  const [selectedShow, setSelectedShow] = useState(null);

  useEffect(() => {
    const savedMovie = sessionStorage.getItem("selectedMovie");
    const parsedMovie = savedMovie ? JSON.parse(savedMovie) : null;
    const movieId = id || location.state?.movie?._id || parsedMovie?._id;

    if (!movie && parsedMovie) setMovie(parsedMovie);

    if (movieId) {
      axios
        .get(`http://localhost:5000/api/movies/${movieId}`)
        .then((res) => {
          setMovie(res.data);
          sessionStorage.setItem("selectedMovie", JSON.stringify(res.data));
        })
        .catch(() => {});
      axios
        .get(`http://localhost:5000/api/movies/${movieId}/shows`)
        .then((res) => setMovieShows(res.data.shows || []))
        .catch(() => setMovieShows([]));
    }
  }, [location.state, movie]);

  if (!movie) {
    return (
      <div className="theatre-empty">
        <h1>No movie selected</h1>
        <button onClick={() => navigate("/dashboard/movies")}>Back to Movies</button>
      </div>
    );
  }

  const openShow = (theatre, time, show = null) => {
    const layoutFields = screenLayoutFields(show?.screen);
    setSelectedShow({
      theatre,
      showtime: {
        time,
        date: selectedDate,
        showId: show?._id,
        screenId: show?.screen?._id || show?.screenId,
        screen: show?.screen,
        screenName: show?.screenName,
        totalSeats: show?.totalSeats,
        vipSeats: show?.screen?.vipSeats || show?.vipSeats,
        primeSeats: show?.screen?.primeSeats || show?.primeSeats,
        regularSeats: show?.screen?.regularSeats || show?.regularSeats,
        vipPrice: show?.screen?.vipPrice || show?.vipPrice || movie.vipSeatPrice,
        primePrice: show?.screen?.primePrice || show?.primePrice || movie.premiumSeatPrice,
        regularPrice: show?.screen?.regularPrice || show?.regularPrice || movie.regularSeatPrice,
        ...layoutFields,
        price: show?.price,
        showDate: show?.showDate,
        showTime: show?.showTime || time,
      },
    });
  };

  const selectedDateValue = new Date(selectedDate.value).toISOString().slice(0, 10);
  const dateMatchedShows = movieShows.filter((show) => String(show.showDate || "").slice(0, 10) === selectedDateValue);
  const visibleShows = dateMatchedShows.length ? dateMatchedShows : movieShows;
  const theatres = visibleShows.length
    ? Object.values(visibleShows.reduce((acc, show) => {
      const theatreName = show.theatre?.name || movie.theatreName || movie.theatre || "Theatre details unavailable";
      const key = `${theatreName}-${show.screenName || show.screen?.name || show.screenId || ""}`;
      if (!acc[key]) {
        acc[key] = {
          name: theatreName,
          location: show.theatre?.location || movie.theatreAddress || movie.theatreCity || movie.city || "Configured by vendor",
          amenities: ["M-Ticket", "Food & Beverage"],
          cancellation: "Cancellation available",
          showtimes: [],
        };
      }
      acc[key].showtimes.push(show);
      return acc;
    }, {}))
    : getTheatresFromMovie(movie);

  const selectSeats = ({ seatCount, category }) => {
    navigate(`/dashboard/movies/${movie._id}/seats`, {
      state: {
        movie,
        theatre: selectedShow.theatre,
        showtime: selectedShow.showtime,
        selectedSeats: seatCount,
        category: { ...category, price: selectedShow.showtime?.price || movie.ticketPrice || category.price || 240 },
      },
    });
  };

  return (
    <div className="theatre-page">
      <header className="theatre-topbar">
        <button onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div>
          <h1>{movie.title}</h1>
          <p>{movie.language} · {movie.format || "2D"} · {movie.duration}</p>
        </div>
      </header>

      <section className="date-filter-row">
        {dateFilters.map((date) => (
          <button
            key={date.value}
            className={selectedDate.value === date.value ? "active" : ""}
            onClick={() => setSelectedDate(date)}
          >
            <span>{date.label}</span>
            <strong>{date.day}</strong>
            <small>{date.month}</small>
          </button>
        ))}
      </section>

      <section className="show-filters">
        <button><FaFilter /> {movie.language || "Language"} / {movie.format || "Format"}</button>
        <button><FaRupeeSign /> Price Range</button>
        <button>Special Formats</button>
        <button><FaClock /> Preferred Time</button>
        <button>Sort By</button>
      </section>

      <section className="theatre-list">
        {theatres.map((theatre) => (
          <article className="theatre-card" key={theatre.name}>
            <div className="theatre-card-info">
              <h2>{theatre.name}</h2>
              <p><FaMapMarkerAlt /> {theatre.location}</p>
              <div className="amenities-row">
                {theatre.amenities.map((item) => <span key={item}>{item}</span>)}
              </div>
              <small>{theatre.cancellation}</small>
            </div>

            <div className="showtime-grid">
              {theatre.showtimes.map((item) => {
                const time = typeof item === "string" ? item : item.showTime;
                return (
                <button key={typeof item === "string" ? item : item._id} onClick={() => openShow(theatre, time, typeof item === "string" ? null : item)}>
                  <FaTicketAlt /> {time}
                </button>
                );
              })}
            </div>
          </article>
        ))}
      </section>

      {selectedShow && (
        <SeatCountModal
          movie={movie}
          theatre={selectedShow.theatre}
          showtime={selectedShow.showtime}
          onClose={() => setSelectedShow(null)}
          onSelectSeats={selectSeats}
        />
      )}
    </div>
  );
}

export default TheatreShows;
