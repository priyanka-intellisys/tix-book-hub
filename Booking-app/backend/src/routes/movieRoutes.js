const express = require("express");
const router = express.Router();

const Movie = require("../models/Movie");

/* GET ALL MOVIES */

router.get("/movies", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ADD MOVIE */

router.post("/add-movie", async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
``