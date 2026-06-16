const mongoose = require("mongoose");

const movieSchema =
new mongoose.Schema({

  title: String,

  language: String,

  duration: String,

  image: String,
  posterUrl: String,
  bannerUrl: String,

  description: String,

  theatre: String,
  theatreName: String,
  theatreCity: String,
  theatreAddress: String,
  screenNumber: String,
  showDate: String,
  showTime: String,
  showTimes: [String],
  totalSeats: {
    type: Number,
    default: 120,
  },
  bookedSeats: {
    type: [String],
    default: [],
  },
  ticketPrice: {
    type: Number,
    default: 240,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "draft"],
    default: "active",
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },

  genre: String,

  cast: String,

  director: String,

  releaseDate: String,

  rating: String,

  hero: String,

  certificate: String,

  format: {
    type: String,
    default: "2D",
  },

  trailerUrl: String,

  interestCount: {
    type: String,
    default: "",
  },

  aboutMovie: String,

  isOfferApplicable: {
    type: Boolean,
    default: false,
  },

  offers: [
    {
      title: String,
      description: String,
    },
  ],

  castMembers: [
    {
      name: String,
      role: String,
      photo: String,
    },
  ],

  crewMembers: [
    {
      name: String,
      role: String,
      photo: String,
    },
  ],

});

module.exports =
mongoose.model(
  "Movie",
  movieSchema
);
