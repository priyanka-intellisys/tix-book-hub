import React, { useEffect, useState } from "react";
import axios from "axios";

import "./VendorDashboard.css";

function MoviesContent() {

  const [movies, setMovies] = useState([]);

  /* ✅ FETCH MOVIES */

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {

      const res = await axios.get(
        "http://localhost:5000/api/movies"
      );

      setMovies(res.data);

    } catch (error) {
      console.log(error);
    }
  };

  return (

    <div className="movies-page">

      <div className="movies-grid">

        {movies.map((movie) => (

          <div
            className="movie-card"
            key={movie._id}
          >

            {/* ✅ IMAGE FIX (IMPORTANT) */}

            <div className="poster-preview">

              <img
                src={movie.image}
                alt={movie.title}
              />

            </div>

            {/* ✅ CONTENT */}

            <div className="movie-content">

              <h3>{movie.title}</h3>

              <p>{movie.language}</p>

              <span>{movie.duration}</span>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}

export default MoviesContent;