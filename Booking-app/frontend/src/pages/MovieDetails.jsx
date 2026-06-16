import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaCalendar, FaClock, FaFilm, FaShareAlt, FaStar, FaTicketAlt } from "react-icons/fa";
import "./MovieDetails.css";

function MovieDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [movie, setMovie] = useState(location.state?.movie || null);
  const [loading, setLoading] = useState(!location.state?.movie);

  useEffect(() => {
    const savedMovie = sessionStorage.getItem("selectedMovie");
    const parsedMovie = savedMovie ? JSON.parse(savedMovie) : null;
    const movieId = id || location.state?.movie?._id || parsedMovie?._id;

    if (!movie && parsedMovie) {
      setMovie(parsedMovie);
      setLoading(false);
    }

    if (movieId) {
      axios
        .get(`http://localhost:5000/api/movies/${movieId}`)
        .then((res) => {
          setMovie(res.data);
          sessionStorage.setItem("selectedMovie", JSON.stringify(res.data));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [location.state, movie]);

  if (loading) {
    return <div className="movie-details-empty">Loading movie...</div>;
  }

  if (!movie) {
    return (
      <div className="movie-details-empty">
        <h1>No movie selected</h1>
        <button onClick={() => navigate("/dashboard/movies")}>Back to Movies</button>
      </div>
    );
  }

  const goToTheatres = () => {
    sessionStorage.setItem("selectedMovie", JSON.stringify(movie));
    navigate(`/dashboard/movies/${movie._id}/theatres`, { state: { movie } });
  };

  const poster = movie.posterUrl || movie.image;
  const banner = movie.bannerUrl || movie.image;
  const showTimes = movie.showTimes?.length ? movie.showTimes : String(movie.showTime || movie.showtime || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const castItems = movie.castMembers?.length
    ? movie.castMembers
    : String(movie.cast || "")
      .split(",")
      .map((name) => ({ name: name.trim(), role: "Cast" }))
      .filter((item) => item.name);

  return (
    <div className="tix-movie-details-page">
      <section
        className="tix-movie-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.96), rgba(15,23,42,0.78), rgba(15,23,42,0.42)), url(${banner})`,
        }}
      >
        <div className="tix-poster-panel">
          {poster && <img src={poster} alt={movie.title} />}
        </div>

        <div className="tix-movie-copy">
          <span className="tix-chip">Now booking</span>
          <h1>{movie.title}</h1>
          <p className="interest-text">{movie.interestCount || "Customers are showing interest in this movie"}</p>

          <div className="tix-meta-row">
            {movie.duration && <span><FaClock /> {movie.duration}</span>}
            {movie.format && <span><FaFilm /> {movie.format}</span>}
            <span>{movie.language || "Language not available"}</span>
            <span>{movie.genre || "Genre not available"}</span>
            <span>{movie.certificate || "Certificate not available"}</span>
            <span><FaStar /> {movie.rating || "Rating not available"}</span>
            <span><FaCalendar /> {movie.releaseDate || "Release date not available"}</span>
          </div>

          <div className="tix-action-row">
            {movie.trailerUrl && (
              <a className="secondary-share-btn" href={movie.trailerUrl} target="_blank" rel="noreferrer">
                Watch Trailer
              </a>
            )}
            <button className="primary-book-btn" onClick={goToTheatres}>
              <FaTicketAlt /> Book Tickets
            </button>
            <button className="secondary-share-btn">
              <FaShareAlt /> Share
            </button>
          </div>
        </div>
      </section>

      <main className="tix-detail-content">
        <section className="tix-section">
          <h2>About Movie</h2>
          <p>{movie.aboutMovie || movie.description || "Movie information will be updated soon."}</p>
        </section>

        <section className="tix-section movie-info-grid">
          <div><h2>Theatre</h2><p>{movie.theatreName || movie.theatre || "Not available"}</p></div>
          <div><h2>Location</h2><p>{movie.theatreAddress || movie.theatreCity || movie.city || "Not available"}</p></div>
          <div><h2>Screen</h2><p>{movie.screenNumber || "Not available"}</p></div>
          <div><h2>Show Date</h2><p>{movie.showDate || "Not available"}</p></div>
          <div><h2>Show Times</h2><p>{showTimes.join(", ") || "Not available"}</p></div>
          <div><h2>Ticket Price</h2><p>Rs {movie.ticketPrice || movie.price || 240}</p></div>
          <div><h2>Available Seats</h2><p>{Number(movie.totalSeats || 120) - Number(movie.bookedSeats?.length || 0)}</p></div>
          <div><h2>Director</h2><p>{movie.director || "Not available"}</p></div>
        </section>

        {castItems.length > 0 && (
          <section className="tix-section">
            <h2>Cast</h2>
            <div className="people-row">
              {castItems.map((member, index) => (
                <div className="people-card" key={`${member.name}-${index}`}>
                  {member.photo && <img src={member.photo} alt={member.name} />}
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default MovieDetails;
