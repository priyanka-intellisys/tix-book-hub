import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  useNavigate,
} from "react-router-dom";

import {
  FaFilm,
  FaTicketAlt,
  FaMoneyBillWave,
  FaUsers,
  FaPlus,
} from "react-icons/fa";

import "./VendorDashboard.css";

function VendorDashboard() {

  const navigate =
  useNavigate();

  const [movies,setMovies] =
  useState([]);

  /* FETCH */

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

  /* DELETE */

  const deleteMovie =
  async (id) => {

    await axios.delete(

      `http://localhost:5000/api/delete-movie/${id}`

    );

    fetchMovies();

  };

  /* STATS */

  const stats = [

    {
      title:"Total Movies",
      value:movies.length,
      icon:<FaFilm />,
    },

    {
      title:"Total Booking",
      value:"12,540",
      icon:<FaTicketAlt />,
    },

    {
      title:"Revenue",
      value:"₹8.4L",
      icon:<FaMoneyBillWave />,
    },

    {
      title:"Users",
      value:"4,500",
      icon:<FaUsers />,
    },

  ];

  return (

    <div className="vendor-dashboard">

      {/* TOP */}

      <div className="vendor-top">

        <div>

          <h1>
            Vendor Dashboard 🎬
          </h1>

          <p>
            Manage Movies
          </p>

        </div>

        <button
          className="add-movie-btn"

          onClick={() =>
            navigate("/add-movie")
          }
        >

          <FaPlus />

          Add Movie

        </button>

      </div>

      {/* STATS */}

      <div className="stats-grid">

        {stats.map((item,index)=>(

          <div
            className="stat-card"
            key={index}
          >

            <div className="stat-icon">
              {item.icon}
            </div>

            <h2>
              {item.value}
            </h2>

            <p>
              {item.title}
            </p>

          </div>

        ))}

      </div>

      {/* MOVIES */}

      <div className="vendor-section">

        <div className="section-header">

          <h2>
            Running Movies
          </h2>

          <button>
            View All
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

    </div>

  );
}

export default VendorDashboard;