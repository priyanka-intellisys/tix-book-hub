const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("Screen", {
  rows: 10,
  seatsPerRow: 10,
  vipSeats: 0,
  primeSeats: 0,
  regularSeats: 120,
  vipPrice: 0,
  primePrice: 0,
  regularPrice: 0,
  screenType: "2D",
  status: "active",
});
