import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaClock, FaFilter, FaMapMarkerAlt, FaRupeeSign, FaTicketAlt } from "react-icons/fa";
import SeatCountModal from "../components/SeatCountModal";
import "./TheatreShows.css";

const defaultShowtimes = ["10:20 AM", "01:40 PM", "05:30 PM", "09:15 PM"];

const getTheatresFromMovie = (movie) => {
  const theatreNames = String(movie.theatre || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  const names = theatreNames.length ? theatreNames : ["Theatre details unavailable"];

  return names.map((name) => ({
    name,
    location: movie.city || "Configured by vendor",
    amenities: ["M-Ticket", "Food & Beverage"],
    cancellation: "Cancellation available",
    showtimes: defaultShowtimes,
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

function TheatreShows() {
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState(location.state?.movie || null);
  const [selectedDate, setSelectedDate] = useState(dateFilters[0]);
  const [selectedShow, setSelectedShow] = useState(null);

  useEffect(() => {
    const savedMovie = sessionStorage.getItem("selectedMovie");
    const parsedMovie = savedMovie ? JSON.parse(savedMovie) : null;
    const movieId = location.state?.movie?._id || parsedMovie?._id;

    if (!movie && parsedMovie) setMovie(parsedMovie);

    if (movieId) {
      axios
        .get(`http://localhost:5000/api/movies/${movieId}`)
        .then((res) => {
          setMovie(res.data);
          sessionStorage.setItem("selectedMovie", JSON.stringify(res.data));
        })
        .catch(() => {});
    }
  }, [location.state, movie]);

  if (!movie) {
    return (
      <div className="theatre-empty">
        <h1>No movie selected</h1>
        <button onClick={() => navigate("/movies")}>Back to Movies</button>
      </div>
    );
  }

  const openShow = (theatre, time) => {
    setSelectedShow({
      theatre,
      showtime: {
        time,
        date: selectedDate,
      },
    });
  };

  const theatres = getTheatresFromMovie(movie);

  const selectSeats = ({ seatCount, category }) => {
    navigate("/seat-selection", {
      state: {
        movie,
        theatre: selectedShow.theatre,
        showtime: selectedShow.showtime,
        selectedSeats: seatCount,
        category,
      },
    });
  };

  return (
    <div className="theatre-page">
      <header className="theatre-topbar">
        <button onClick={() => navigate("/movie-details", { state: { movie } })}>
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
              {theatre.showtimes.map((time) => (
                <button key={time} onClick={() => openShow(theatre, time)}>
                  <FaTicketAlt /> {time}
                </button>
              ))}
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
