import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlay, FaStar, FaThumbsUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./MoviesContent.css";

const fallbackMovies = [
  {
    _id: "movie-1",
    title: "Deool Band 2",
    language: "Marathi",
    genre: "Comedy/Drama",
    rating: "9.4/10",
    votes: "49.2K+ Votes",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=90",
    bannerUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=90",
  },
  {
    _id: "movie-2",
    title: "Cocktail 2",
    language: "Hindi",
    genre: "Comedy/Drama/Romantic",
    rating: "61.3K+ Likes",
    votes: "",
    image:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=90",
    bannerUrl:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1600&q=90",
    isLike: true,
  },
  {
    _id: "movie-3",
    title: "Tumbadchi Manjula",
    language: "Marathi",
    genre: "Comedy/Horror",
    rating: "9.1/10",
    votes: "7.3K+ Votes",
    image:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=900&q=90",
    bannerUrl:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=90",
  },
  {
    _id: "movie-4",
    title: "Obsession",
    language: "English",
    genre: "Horror/Thriller",
    rating: "8.7/10",
    votes: "69.5K+ Votes",
    image:
      "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=900&q=90",
    bannerUrl:
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1600&q=90",
  },
  {
    _id: "movie-5",
    title: "Hai Jawani Toh Ishq Hona Hai",
    language: "Hindi",
    genre: "Comedy/Romantic",
    rating: "7.7/10",
    votes: "24.7K+ Votes",
    image:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=90",
    bannerUrl:
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1600&q=90",
  },
];

function MoviesContent() {
  const navigate = useNavigate();

  const [moviesData, setMoviesData] = useState([]);
  const [activeLanguage, setActiveLanguage] = useState("All");

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/movies");
      setMoviesData(res.data?.length ? res.data : fallbackMovies);
    } catch (error) {
      setMoviesData(fallbackMovies);
    }
  };

  const filteredMovies =
    activeLanguage === "All"
      ? moviesData
      : moviesData.filter((movie) => movie.language === activeLanguage);

  const openMovieDetails = (movie) => {
    sessionStorage.setItem("selectedMovie", JSON.stringify(movie));
    navigate(`/dashboard/movies/${movie._id}`, { state: { movie } });
  };

  const heroMovie = moviesData[0] || fallbackMovies[0];

  return (
    <div className="movies-page">
      <section className="movies-hero">
        <img
          src={heroMovie.bannerUrl || heroMovie.image}
          alt={heroMovie.title}
        />

        <div className="movies-hero-overlay">
          <div className="movies-hero-content">
            <span className="movies-tag">#1 Movie Booking Platform</span>

            <h1>Book Latest Movies 🍿</h1>

            <p>Select theatre and book your favorite seats instantly.</p>

            <div className="movies-hero-buttons">
              <button className="watch-btn">
                <FaPlay />
                Watch Trailer
              </button>

              <button className="explore-btn">Explore Movies</button>
            </div>
          </div>
        </div>
      </section>

      <div className="movie-categories">
        {["All", "Hindi", "English", "Marathi", "Tamil", "Telugu"].map(
          (language) => (
            <button
              key={language}
              className={activeLanguage === language ? "active" : ""}
              onClick={() => setActiveLanguage(language)}
            >
              {language}
            </button>
          )
        )}
      </div>

      <div className="coming-header">
        <h2>Recommended Movies</h2>
      </div>

      <div className="movies-grid">
        {filteredMovies.map((movie) => (
          <div
            className="movie-card"
            key={movie._id}
            onClick={() => openMovieDetails(movie)}
          >
            <div className="poster-wrapper">
              <img
                src={movie.image || movie.posterUrl || fallbackMovies[0].image}
                alt={movie.title}
              />

              <div className="rating-bar">
                {movie.isLike ? (
                  <FaThumbsUp className="like-icon" />
                ) : (
                  <FaStar className="star-icon" />
                )}

                <span>{movie.rating || "8.5/10"}</span>

                {movie.votes && <span>{movie.votes}</span>}
              </div>
            </div>

            <div className="movie-info">
              <h3>{movie.title || "Movie Name"}</h3>
              <p>{movie.genre || "Drama/Romantic"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MoviesContent;