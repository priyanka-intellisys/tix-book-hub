import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  FaClock,
  FaArrowLeft,
  FaPlay,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import "./MoviesContent.css";

function MoviesContent() {

  const navigate = useNavigate();

  /* STATES */

  const [moviesData, setMoviesData] =
    useState([]);

  const [activeLanguage, setActiveLanguage] =
    useState("All");

  /* FETCH MOVIES */

  useEffect(() => {

    fetchMovies();

  }, []);

  const fetchMovies = async () => {

    try {

      const res = await axios.get(
        "http://localhost:5000/api/movies"
      );

      setMoviesData(res.data);

    } catch (error) {

      console.log(error);

    }

  };

  /* FILTER */

  const filteredMovies =
    activeLanguage === "All"
      ? moviesData
      : moviesData.filter(
          (movie) =>
            movie.language === activeLanguage
        );

  return (

    <div className="movies-page">

      {/* HERO */}

      <div className="movies-hero">

        <img
          src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1600"
          alt="Cinema"
        />

        <div className="movies-hero-overlay">

          {/* BACK BUTTON */}

          <button
            className="movies-back-btn"

            onClick={() =>
              navigate("/dashboard")
            }
          >
            <FaArrowLeft />
          </button>

          {/* CONTENT */}

          <div className="movies-hero-content">

            <span className="movies-tag">
              #1 Movie Booking Platform
            </span>

            <h1>
              Book Latest Movies 🍿
            </h1>

            <p>
              Select theatre and book
              your favorite seats instantly.
            </p>

            <div className="movies-hero-buttons">

              <button className="watch-btn">

                <FaPlay />

                Watch Trailer

              </button>

              <button className="explore-btn">
                Explore Movies
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* LANGUAGE FILTER */}

      <div className="movie-categories">

        {[
          "All",
          "Hindi",
          "English",
          "Tamil",
          "Telugu",
        ].map((language) => (

          <button
            key={language}

            className={
              activeLanguage === language
                ? "active"
                : ""
            }

            onClick={() =>
              setActiveLanguage(language)
            }
          >
            {language}
          </button>

        ))}

      </div>

      {/* HEADER */}

      <div className="coming-header">

        <h2>
          Coming Soon Movies
        </h2>

        <button
          onClick={() =>
            navigate(
              "/upcoming-movies"
            )
          }
        >
          Explore Upcoming Movies →
        </button>

      </div>

      {/* MOVIES GRID */}

      <div className="movies-grid">

        {filteredMovies.map((movie) => (

          <div
            className="movie-card"
            key={movie._id}
          >

            {/* IMAGE */}

            <div className="poster-wrapper">

              <img
                src={movie.image}
                alt={movie.title}
              />

            </div>

            {/* CONTENT */}

            <div className="movie-info">

              <h3>
                {movie.title}
              </h3>

              <p className="movie-language">
                {movie.language}
              </p>

              <div className="movie-stats">

                <span>

                  <FaClock />

                  {movie.duration}

                </span>

              </div>

              {/* BUTTON */}

              <div className="movie-bottom">

                <button
                  
onClick={() =>
    navigate(
      "/movie-details",
      {

                        state: {
                          movie,
                        },
                      }
                    )
                  }
                >
                  Buy Ticket
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}

export default MoviesContent;
