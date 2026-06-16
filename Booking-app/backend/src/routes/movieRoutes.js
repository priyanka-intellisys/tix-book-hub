const express = require("express");

const router = express.Router();

const Movie =
require("../models/Movie");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

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

/* GET MOVIE BY ID */

router.get(
  "/movies/:id",

  async (req, res) => {

    try {

      const movie =
      await Movie.findById(req.params.id);

      if (!movie) {
        return res.status(404).json({
          message:"Movie not found",
        });
      }

      res.json(movie);

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
  requireAuth,
  requireRole("admin", "vendor"),

  async (req, res) => {

    try {

      const movie =
      new Movie({
        ...req.body,
        vendor: req.user.id,
        vendorId: req.user.id,
      });

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
  requireAuth,
  requireRole("admin", "vendor"),

  async (req, res) => {

    try {

      const updatedMovie =
      await Movie.findOneAndUpdate(

        {
          _id: req.params.id,
          ...(req.user.role === "admin" ? {} : { $or: [{ vendor: req.user.id }, { vendorId: req.user.id }] }),
        },

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
  requireAuth,
  requireRole("admin", "vendor"),

  async (req, res) => {

    try {

      await Movie.findOneAndDelete({
        _id: req.params.id,
        ...(req.user.role === "admin" ? {} : { $or: [{ vendor: req.user.id }, { vendorId: req.user.id }] }),
      });

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
