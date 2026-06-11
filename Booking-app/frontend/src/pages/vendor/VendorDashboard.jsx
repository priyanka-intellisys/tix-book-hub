import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  useNavigate,
} from "react-router-dom";

import "./VendorDashboard.css";

function VendorDashboard() {

  const navigate =
  useNavigate();

  const [movies,setMovies] =
  useState([]);

  useEffect(() => {

    fetchMovies();

  }, []);

  const fetchMovies =
  async () => {

    const res =
    await axios.get(
      "http://localhost:5000/api/movies"
    );

    setMovies(res.data);

  };

  const deleteMovie =
  async (id) => {

    await axios.delete(

      `http://localhost:5000/api/delete-movie/${id}`

    );

    fetchMovies();

  };

  return (

    <div className="vendor-dashboard">

      <div className="vendor-top">

        <h1>
          Vendor Dashboard 🎬
        </h1>

        <button
          className="add-movie-btn"

          onClick={() =>
            navigate("/add-movie")
          }
        >
          Add Movie
        </button>

      </div>

      <div className="movies-grid">

        {movies.map((movie)=>(

          <div
            className="movie-card"
            key={movie._id}
          >

            <img
              src={movie.image}
              alt={movie.title}
            />

            <div className="movie-content">

              <h3>
                {movie.title}
              </h3>

              <p>
                {movie.language}
              </p>

              <span>
                {movie.duration}
              </span>

              <div className="movie-actions">

                <button
                  className="edit-btn"

                  onClick={() =>
                    navigate(
                      "/add-movie",
                      {
                        state:{
                          movie,
                        },
                      }
                    )
                  }
                >
                  Edit
                </button>

                <button
                  className="delete-btn"

                  onClick={() =>
                    deleteMovie(
                      movie._id
                    )
                  }
                >
                  Delete
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}

export default VendorDashboard;