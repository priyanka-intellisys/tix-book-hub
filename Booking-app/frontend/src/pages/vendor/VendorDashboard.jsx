import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  useNavigate,
} from "react-router-dom";

import "./VendorDashboard.css";

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

function VendorDashboard() {

  const navigate =
  useNavigate();

  const [movies,setMovies] =
  useState([]);
  const [loading,setLoading] =
  useState(true);
  const [error,setError] =
  useState("");

  useEffect(() => {

    fetchMovies();

  }, []);

  const fetchMovies =
  async () => {

    try {
      setLoading(true);
      setError("");

      const res =
      await axios.get(
        "http://localhost:5000/api/movies"
      );

      setMovies(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      setError(
        "Unable to load movies. Please make sure the backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }

  };

  const deleteMovie =
  async (id) => {

    try {
      await axios.delete(

        `http://localhost:5000/api/delete-movie/${id}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }

      );

      fetchMovies();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Unable to delete movie"
      );
    }

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

      {loading && (

        <div className="vendor-state-card">
          Loading movies...
        </div>

      )}

      {error && (

        <div className="vendor-state-card error">
          {error}
        </div>

      )}

      {!loading && !error && movies.length === 0 && (

        <div className="vendor-state-card">
          No movies added yet. Use Add Movie to create your first listing.
        </div>

      )}

      {!loading && !error && movies.length > 0 && (

        <div className="movies-grid">

        {movies.map((movie)=>(

          <div
            className="movie-card"
            key={movie._id}
          >

            <img
              src={
                movie.image ||
                "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=900"
              }
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

      )}

    </div>

  );
}

export default VendorDashboard;
