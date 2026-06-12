import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCalendar, FaClock, FaFilm, FaShareAlt, FaStar, FaTicketAlt } from "react-icons/fa";
import "./MovieDetails.css";

function MovieDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState(location.state?.movie || null);
  const [loading, setLoading] = useState(!location.state?.movie);

  useEffect(() => {
    const savedMovie = sessionStorage.getItem("selectedMovie");
    const parsedMovie = savedMovie ? JSON.parse(savedMovie) : null;
    const movieId = location.state?.movie?._id || parsedMovie?._id;

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
        <button onClick={() => navigate("/movies")}>Back to Movies</button>
      </div>
    );
  }

  const goToTheatres = () => {
    sessionStorage.setItem("selectedMovie", JSON.stringify(movie));
    navigate("/theatre-shows", { state: { movie } });
  };

  return (
    <div className="tix-movie-details-page">
      <section
        className="tix-movie-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.96), rgba(15,23,42,0.78), rgba(15,23,42,0.42)), url(${movie.image})`,
        }}
      >
        <div className="tix-poster-panel">
          {movie.image && <img src={movie.image} alt={movie.title} />}
        </div>

        <div className="tix-movie-copy">
          <span className="tix-chip">Now booking</span>
          <h1>{movie.title}</h1>
          <p className="interest-text">{movie.interestCount || "Customers are showing interest in this movie"}</p>

          <div className="tix-meta-row">
            {movie.duration && <span><FaClock /> {movie.duration}</span>}
            {movie.format && <span><FaFilm /> {movie.format}</span>}
            {movie.language && <span>{movie.language}</span>}
            {movie.rating && <span><FaStar /> {movie.rating}</span>}
            {movie.releaseDate && <span><FaCalendar /> {movie.releaseDate}</span>}
          </div>

          <div className="tix-action-row">
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

        {movie.castMembers?.length > 0 && (
          <section className="tix-section">
            <h2>Cast</h2>
            <div className="people-row">
              {movie.castMembers.map((member, index) => (
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
