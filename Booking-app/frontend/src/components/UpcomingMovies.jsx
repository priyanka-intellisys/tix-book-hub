import React from "react";
import {
  FaArrowLeft,
  FaClock,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "./UpcomingMovies.css";

const upcomingMovies = [

  {
    id:1,
    title:"War 2",
    language:"Hindi",
    release:"15 Aug 2026",
    duration:"2h 45m",

    image:
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200",
  },

  {
    id:2,
    title:"Coolie",
    language:"Tamil",
    release:"20 Sep 2026",
    duration:"2h 20m",

    image:
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200",
  },

  {
    id:3,
    title:"Kalki 2898 AD",
    language:"Telugu",
    release:"1 Nov 2026",
    duration:"3h 02m",

    image:
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200",
  },

];

function UpcomingMovies() {
  const navigate = useNavigate();

  return (

    <div className="upcoming-page">

      <div className="upcoming-top">

        <button
          className="back-btn"

          onClick={() =>
            navigate("/dashboard/movies")
          }
        >
          <FaArrowLeft />
        </button>

        <h1>
          Upcoming Movies 🍿
        </h1>

      </div>

      <div className="upcoming-grid">

        {upcomingMovies.map((movie) => (

          <div
            className="upcoming-card"
            key={movie.id}
          >

            <img
              src={movie.image}
              alt={movie.title}
            />

            <div className="upcoming-content">

              <h2>{movie.title}</h2>

              <p>
                {movie.language}
              </p>

              <span>
                <FaClock />

                {movie.duration}
              </span>

              <h4>
                Releasing:
                {movie.release}
              </h4>

              <button>
                Notify Me
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default UpcomingMovies;
