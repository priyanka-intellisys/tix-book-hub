import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaPlane, FaSearch, FaStar } from "react-icons/fa";
import "../pages/FlightContent.css";

const apiBase = "http://localhost:5000/api";

function FlightContent() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState("One Way");
  const [search, setSearch] = useState({
    from: "Pune",
    to: "Delhi",
    departureDate: "",
    returnDate: "",
    passengers: 1,
    cabinClass: "Economy",
  });
  const [flights, setFlights] = useState([]);
  const [offers, setOffers] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFlights();
    axios.get(`${apiBase}/flights/offers`).then((res) => setOffers(res.data)).catch(() => setOffers([]));
    axios.get(`${apiBase}/flights/recent-searches`).then((res) => setRecentSearches(res.data)).catch(() => setRecentSearches([]));
  }, []);

  const updateSearch = (key, value) => {
    setSearch((current) => ({ ...current, [key]: value }));
  };

  const fetchFlights = async () => {
    setLoading(true);

    try {
      const res = await axios.get(`${apiBase}/flights`, {
        params: {
          from: search.from,
          to: search.to,
          departureDate: search.departureDate,
          cabinClass: search.cabinClass,
        },
      });
      setFlights(res.data);
    } catch (error) {
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const openFlight = (flight) => {
    const payload = { flight, search: { ...search, tripType } };
    sessionStorage.setItem("selectedFlight", JSON.stringify(payload));
    navigate(`/dashboard/flights/${flight.id || flight._id}`, { state: payload });
  };

  const openOffer = (offer) => {
    navigate(`/dashboard/flights/${offer.id || offer._id}`, { state: { flightId: offer.id || offer._id, search: { ...search, tripType } } });
  };

  return (
    <div className="flight-page flight-dashboard-module">
      <header className="flight-module-heading">
        <div>
          <span>Travel</span>
          <h1>Flights</h1>
          <p>Search and book flights from TixHub inventory.</p>
        </div>
      </header>

      <section className="flight-search-panel">
        <div className="flight-trip-toggle" aria-label="Trip type">
          {["One Way", "Round Trip"].map((item) => (
            <button key={item} className={tripType === item ? "active" : ""} onClick={() => setTripType(item)}>
              {item}
            </button>
          ))}
        </div>

        <div className="flight-search-grid">
          <label>
            <span>From Airport</span>
            <input value={search.from} onChange={(event) => updateSearch("from", event.target.value)} />
          </label>
          <label>
            <span>To Airport</span>
            <input value={search.to} onChange={(event) => updateSearch("to", event.target.value)} />
          </label>
          <label>
            <span>Departure Date</span>
            <input type="date" value={search.departureDate} onChange={(event) => updateSearch("departureDate", event.target.value)} />
          </label>
          <label>
            <span>Return Date</span>
            <input type="date" value={search.returnDate} disabled={tripType === "One Way"} onChange={(event) => updateSearch("returnDate", event.target.value)} />
          </label>
          <label>
            <span>Passenger Count</span>
            <input type="number" min="1" max="9" value={search.passengers} onChange={(event) => updateSearch("passengers", Number(event.target.value))} />
          </label>
          <label>
            <span>Cabin Class</span>
            <select value={search.cabinClass} onChange={(event) => updateSearch("cabinClass", event.target.value)}>
              <option>Economy</option>
              <option>Premium Economy</option>
              <option>Business Class</option>
            </select>
          </label>
        </div>

        <button className="flight-search-btn" onClick={fetchFlights}>
          <FaSearch /> Search Flights
        </button>
      </section>

      <section className="flight-section">
        <div className="flight-section-header">
          <h2>Available Flights</h2>
          <span>{loading ? "Searching..." : `${flights.length} results`}</span>
        </div>

        <div className="flight-results-list">
          {flights.map((flight) => (
            <article className="flight-result-card" key={flight.id || flight._id}>
              <div className="airline-mark">
                {flight.airlineLogoUrl ? <img src={flight.airlineLogoUrl} alt={flight.airline} /> : flight.airline.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3>{flight.airline}</h3>
                <p>{flight.flightNumber} | {flight.aircraftType || flight.aircraft} | {flight.cabinClass || flight.cabinClasses?.[0] || search.cabinClass}</p>
              </div>
              <div>
                <strong>{flight.departureTime}</strong>
                <span>{flight.fromCode}</span>
              </div>
              <div className="flight-duration">
                <FaClock />
                <span>{flight.duration}</span>
                <small>{flight.stops}</small>
              </div>
              <div>
                <strong>{flight.arrivalTime}</strong>
                <span>{flight.toCode}</span>
              </div>
              <div className="flight-price-block">
                <strong>Rs {flight.price}</strong>
                <span>{flight.availableSeats ?? "Seats"} available</span>
                <button onClick={() => openFlight(flight)}>Select Flight</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="flight-section flight-two-column">
        <div>
          <div className="flight-section-header">
            <h2>Flight Offers</h2>
          </div>
          <div className="flight-offer-grid">
            {offers.map((offer) => (
              <button className="flight-offer-card" key={offer.id || offer._id} onClick={() => openOffer(offer)}>
                <FaPlane />
                <strong>{offer.title}</strong>
                <span>{offer.subtitle} | Rs {offer.price}</span>
                <small><FaStar /> {offer.rating}</small>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flight-section-header">
            <h2>Recent Searches</h2>
          </div>
          <div className="flight-recent-list">
            {recentSearches.map((item) => (
              <button className="flight-recent-card" key={item.id || `${item.from}-${item.to}`} onClick={() => setSearch((current) => ({ ...current, ...item }))}>
                <strong>{item.from} to {item.to}</strong>
                <span><FaCalendarAlt /> {item.departureDate}</span>
                <small>{item.passengers} passenger | {item.cabinClass}</small>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default FlightContent;
