import React from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaStar,
  FaClock,
  FaCalendar,
  FaFilm,
} from "react-icons/fa";

import "./MovieDetails.css";

function MovieDetails() {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const movie =
    location.state?.movie;

  /* NO MOVIE */

  if (!movie) {

    return (

      <div className="no-movie">

        <h1>
          No Movie Selected
        </h1>

        <button
          onClick={() =>
            navigate("/movies")
          }
        >
          Go Back to Movies
        </button>

      </div>

    );

  }

  return (

    <div className="movie-details-page">

      {/* HERO */}

      <div className="details-hero">

        
<img
  src={movie.image}
  alt={movie.title}
  className="details-poster"
/>


        <div className="details-content">

          <h1>
            {movie.title}
          </h1>

          <p className="description">
            {movie.description}
          </p>

          {/* META */}

          <div className="movie-meta">

            <span>

              <FaFilm />

              {movie.genre}

            </span>

            <span>

              <FaClock />

              {movie.duration}

            </span>

            <span>

              <FaStar />

              {movie.rating}

            </span>

            <span>

              <FaCalendar />

              {movie.releaseDate}

            </span>

          </div>

          {/* INFO */}

          <div className="movie-info-section">

            <h3>
              Hero
            </h3>

            <p>
              {movie.hero}
            </p>

            <h3>
              Cast
            </h3>

            <p>
              {movie.cast}
            </p>

            <h3>
              Director
            </h3>

            <p>
              {movie.director}
            </p>

            <h3>
              Theatre
            </h3>

            <p>
              {movie.theatre}
            </p>

            <h3>
              Language
            </h3>

            <p>
              {movie.language}
            </p>

          </div>

          {/* BUTTON */}

          <button
            className="book-ticket-btn"

            onClick={() =>
              navigate(
                "/seat-selection",
                {
                  state:{movie},
                }
              )
            }
          >
            Book Ticket 🎟️
          </button>

        </div>

      </div>

    </div>

  );
}

export default MovieDetails;