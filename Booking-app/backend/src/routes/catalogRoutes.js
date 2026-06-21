const express = require("express");

const router = express.Router();

const catalog = {
  flights: [
    { id: "fl-1", title: "IndiGo 6E-214", subtitle: "Pune to Delhi", date: "Jun 20, 2026", price: 4240, rating: "4.6" },
    { id: "fl-2", title: "Air India AI-852", subtitle: "Mumbai to Bengaluru", date: "Jun 24, 2026", price: 3890, rating: "4.4" },
  ],
  trains: [
    { id: "tr-1", title: "Deccan Queen", subtitle: "Pune to Mumbai", date: "Jun 15, 2026", price: 750, rating: "4.7" },
    { id: "tr-2", title: "Duronto Express", subtitle: "Pune to Delhi", date: "Jun 26, 2026", price: 1860, rating: "4.5" },
  ],
  buses: [
    { id: "bu-1", title: "Hanif Enterprise", subtitle: "Pune to Mumbai", date: "Jun 22, 2026", price: 1000, rating: "4.6" },
    { id: "bu-2", title: "Orange Travels", subtitle: "Pune to Goa", date: "Jun 28, 2026", price: 1450, rating: "4.3" },
  ],
  hotels: [
    { id: "ho-1", title: "Goa Beach Resort", subtitle: "3 Days / 2 Nights", date: "Jun 20, 2026", price: 4999, rating: "4.7" },
    { id: "ho-2", title: "Mumbai Grand Stay", subtitle: "Deluxe Room", date: "Jun 18, 2026", price: 3200, rating: "4.5" },
  ],
  holidays: [
    { id: "hl-1", title: "Kerala Backwater Escape", subtitle: "4 Days / 3 Nights", date: "Jul 02, 2026", price: 12999, rating: "4.8" },
    { id: "hl-2", title: "Himachal Adventure", subtitle: "5 Days / 4 Nights", date: "Jul 12, 2026", price: 15499, rating: "4.6" },
  ],
  events: [
    { id: "ev-1", title: "Pune Music Fest", subtitle: "Phoenix Marketcity", date: "Jun 29, 2026", price: 999, rating: "4.7" },
    { id: "ev-2", title: "Standup Night", subtitle: "Bandra Amphitheatre", date: "Jul 05, 2026", price: 599, rating: "4.5" },
  ],
};

router.get("/catalog/:module", (req, res) => {
  res.json(catalog[req.params.module] || []);
});

module.exports = router;
