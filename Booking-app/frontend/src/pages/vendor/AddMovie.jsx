import React, {
  useState,
} from "react";

import axios from "axios";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./AddMovie.css";

function AddMovie() {

  const navigate =
  useNavigate();

  const location =
  useLocation();

  const editMovie =
  location.state?.movie;

  const [movie, setMovie] =
  useState(

    editMovie || {

      title:"",
      language:"",
      duration:"",
      image:"",
      description:"",
      theatre:"",
      genre:"",
      cast:"",
      director:"",
      releaseDate:"",
      rating:"",
      hero:"",

    }

  );

  const handleSubmit =
  async (e) => {

    e.preventDefault();

    try {

      if(editMovie){

        await axios.put(

          `http://localhost:5000/api/edit-movie/${editMovie._id}`,

          movie

        );

        alert(
          "Movie Updated ✅"
        );

      } else {

        await axios.post(

          "http://localhost:5000/api/add-movie",

          movie

        );

        alert(
          "Movie Added ✅"
        );

      }

      navigate(
        "/vendor-dashboard"
      );

    } catch(error){

      console.log(error);

    }

  };

  return (

    <div className="add-movie-page">

      <div className="add-movie-container">

        <div className="add-movie-top">

          <h1>

            {editMovie
              ? "Edit Movie ✏️"
              : "Add New Movie 🎬"}

          </h1>

          <p>
            Upload Movie Details
          </p>

        </div>

        <div className="add-movie-card">

          <form
            className="add-movie-form"
            onSubmit={handleSubmit}
          >

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Movie Title
                </label>

                <input
                  type="text"

                  value={movie.title}

                  onChange={(e)=>
                    setMovie({
                      ...movie,
                      title:e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Language
                </label>

                <input
                  type="text"

                  value={movie.language}

                  onChange={(e)=>
                    setMovie({
                      ...movie,
                      language:e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Duration
                </label>

                <input
                  type="text"

                  value={movie.duration}

                  onChange={(e)=>
                    setMovie({
                      ...movie,
                      duration:e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Genre
                </label>

                <input
                  type="text"

                  value={movie.genre}

                  onChange={(e)=>
                    setMovie({
                      ...movie,
                      genre:e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Hero
                </label>

                <input
                  type="text"

                  value={movie.hero}

                  onChange={(e)=>
                    setMovie({
                      ...movie,
                      hero:e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Cast
                </label>

                <input
                  type="text"

                  value={movie.cast}

                  onChange={(e)=>
                    setMovie({
                      ...movie,
                      cast:e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Director
                </label>

                <input
                  type="text"

                  value={movie.director}

                  onChange={(e)=>
                    setMovie({
                      ...movie,
                      director:e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Release Date
                </label>

                <input
                  type="date"

                  value={movie.releaseDate}

                  onChange={(e)=>
                    setMovie({
                      ...movie,
                      releaseDate:e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Rating
                </label>

                <input
                  type="text"

                  value={movie.rating}

                  onChange={(e)=>
                    setMovie({
                      ...movie,
                      rating:e.target.value,
                    })
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Theatre
                </label>

                <input
                  type="text"

                  value={movie.theatre}

                  onChange={(e)=>
                    setMovie({
                      ...movie,
                      theatre:e.target.value,
                    })
                  }
                />

              </div>

            </div>

            <div className="form-group">

              <label>
                Poster URL
              </label>

              <input
                type="text"

                value={movie.image}

                onChange={(e)=>
                  setMovie({
                    ...movie,
                    image:e.target.value,
                  })
                }
              />

            </div>

            {movie.image && (

              <div className="poster-preview">

                <img
                  src={movie.image}
                  alt="Poster"
                />

              </div>

            )}

            <div className="form-group">

              <label>
                Description
              </label>

              <textarea

                value={movie.description}

                onChange={(e)=>
                  setMovie({
                    ...movie,
                    description:e.target.value,
                  })
                }
              />

            </div>

            <button
              type="submit"
              className="add-movie-btn"
            >

              {editMovie
                ? "Update Movie"
                : "Add Movie"}

            </button>

          </form>

        </div>

      </div>

    </div>

  );
}

export default AddMovie;