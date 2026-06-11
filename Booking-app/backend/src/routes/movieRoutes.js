const express = require("express");

const router = express.Router();

const Movie =
require("../models/Movie");

/* GET MOVIES */

router.get(
  "/movies",

  async (req, res) => {

    try {

      const movies =
      await Movie.find();

      res.json(movies);

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

/* ADD */

router.post(
  "/add-movie",

  async (req, res) => {

    try {

      const movie =
      new Movie(req.body);

      await movie.save();

      res.json(movie);

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

/* UPDATE */

router.put(
  "/edit-movie/:id",

  async (req, res) => {

    try {

      const updatedMovie =
      await Movie.findByIdAndUpdate(

        req.params.id,

        req.body,

        { new:true }

      );

      res.json(updatedMovie);

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

/* DELETE */

router.delete(
  "/delete-movie/:id",

  async (req, res) => {

    try {

      await Movie.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success:true,
      });

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

module.exports = router;