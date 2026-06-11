import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaClock } from "react-icons/fa";

import "./MoviesContent.css";

function MoviesContent() {

  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);

  /* ✅ FETCH MOVIES */

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {

    try {
      const res = await axios.get("http://localhost:5000/api/movies");

      console.log(res.data); ✅ // DEBUG

      setMovies(res.data);

    } catch (error) {
      console.log(error);
    }
  };

  return (

    <div className="movies-page">

      <h1>🎬 Movies</h1>

      <div className="movies-grid">

        {movies.length === 0 ? (

          <h2>No Movies Found ❌</h2>

        ) : (

          movies.map((movie) => (

            <div className="movie-card" key={movie._id}>

              {/* ✅ IMAGE */}
              <div className="poster-wrapper">

                <img
                  src={movie.image}
                  alt={movie.title}
                />

              </div>

              {/* ✅ INFO */}
              <div className="movie-info">

                <h3>{movie.title}</h3>

                <p>{movie.language}</p>

                <span>
                  <FaClock /> {movie.duration}
                </span>

                <button
                  onClick={() =>
                    navigate("/movie-details", {
                      state: { movie },
                    })
                  }
                >
                  Book Ticket
                </button>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default MoviesContent;
``