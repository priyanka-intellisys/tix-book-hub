const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* ✅ CONNECT DATABASE */

mongoose.connect("mongodb://127.0.0.1:27017/tixhub")
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

/* ✅ MODEL */

const Movie = mongoose.model("Movie", {

  title: String,
  language: String,
  duration: String,
  image: String,
  description: String,
  theatre: String,
  genre: String,
  cast: String,
  director: String,
  releaseDate: String,
  rating: String,
  hero: String,

});

/* ✅ GET MOVIES */

app.get("/api/movies", async (req, res) => {

  const movies = await Movie.find();
  res.json(movies);

});

/* ✅ ADD MOVIE */

app.post("/api/add-movie", async (req, res) => {

  const movie = new Movie(req.body);
  await movie.save();

  res.json(movie);

});

app.listen(5000, () =>
  console.log("Server running on 5000 ✅")
);