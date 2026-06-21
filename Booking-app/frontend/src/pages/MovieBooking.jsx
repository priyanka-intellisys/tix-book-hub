import React from "react";

import "./MovieBooking.css";

function MovieBooking() {

  return (

    <div className="movie-booking-page">

      <div className="movie-booking-container">

        <h1 className="movie-booking-title">
          Book Movies
        </h1>

        <div className="movie-booking-grid">

          {/* CARD */}

          <div className="movie-booking-card">

            <img
              src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200"
              alt="movie"
              className="movie-booking-image"
            />

            <div className="movie-booking-content">

              <h2>Avengers Endgame</h2>

              <p>Action • Adventure</p>

              <button>
                Book Tickets
              </button>

            </div>

          </div>

          {/* CARD */}

          <div className="movie-booking-card">

            <img
              src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200"
              alt="movie"
              className="movie-booking-image"
            />

            <div className="movie-booking-content">

              <h2>Batman</h2>

              <p>Action • Drama</p>

              <button>
                Book Tickets
              </button>

            </div>

          </div>

          {/* CARD */}

          <div className="movie-booking-card">

            <img
              src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200"
              alt="movie"
              className="movie-booking-image"
            />

            <div className="movie-booking-content">

              <h2>Joker</h2>

              <p>Crime • Thriller</p>

              <button>
                Book Tickets
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default MovieBooking;