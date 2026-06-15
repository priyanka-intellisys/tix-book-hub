import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaMinus, FaPlus, FaUserFriends } from "react-icons/fa";
import "./FlightTravellerSelection.css";

const cabinClasses = ["Economy", "Premium Economy", "Business Class"];

function FlightTravellerSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const saved = JSON.parse(sessionStorage.getItem("selectedFlight") || "null");
  const flight = location.state?.flight || saved?.flight;
  const search = location.state?.search || saved?.search || {};
  const [travellers, setTravellers] = useState({
    adult: Number(search.passengers) || 1,
    child: 0,
    infant: 0,
  });
  const [cabinClass, setCabinClass] = useState(search.cabinClass || "Economy");

  if (!flight) {
    return (
      <div className="flight-empty">
        <h1>No flight selected</h1>
        <button onClick={() => navigate("/flights")}>Back to Flights</button>
      </div>
    );
  }

  const setCount = (key, direction) => {
    setTravellers((current) => {
      const min = key === "adult" ? 1 : 0;
      const nextValue = Math.max(min, current[key] + direction);
      return { ...current, [key]: nextValue };
    });
  };

  const totalTravellers = travellers.adult + travellers.child + travellers.infant;
  const continueFlow = () => {
    const payload = { flight, search, travellers, cabinClass, totalTravellers };
    sessionStorage.setItem("flightTravellers", JSON.stringify(payload));
    navigate("/flight-seat-selection", { state: payload });
  };

  return (
    <div className="flight-traveller-page">
      <header className="flight-step-header">
        <button onClick={() => navigate("/flight-details", { state: { flight, search } })}><FaArrowLeft /></button>
        <div>
          <h1>Traveller Selection</h1>
          <p>{flight.airline} {flight.flightNumber} | {flight.fromCode} to {flight.toCode}</p>
        </div>
      </header>

      <main className="traveller-shell">
        <section className="traveller-card">
          <h2><FaUserFriends /> Passengers</h2>
          {[
            ["adult", "Adult", "12 years and above"],
            ["child", "Child", "2 to 11 years"],
            ["infant", "Infant", "Below 2 years"],
          ].map(([key, title, subtitle]) => (
            <div className="traveller-row" key={key}>
              <div>
                <strong>{title}</strong>
                <span>{subtitle}</span>
              </div>
              <div className="count-control">
                <button onClick={() => setCount(key, -1)}><FaMinus /></button>
                <strong>{travellers[key]}</strong>
                <button onClick={() => setCount(key, 1)}><FaPlus /></button>
              </div>
            </div>
          ))}
        </section>

        <section className="traveller-card">
          <h2>Cabin Class</h2>
          <div className="cabin-grid">
            {cabinClasses.map((item) => (
              <button key={item} className={cabinClass === item ? "active" : ""} onClick={() => setCabinClass(item)}>
                {item}
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="flight-step-summary">
        <div>
          <span>Total Travellers</span>
          <h2>{totalTravellers}</h2>
        </div>
        <button onClick={continueFlow}>Continue</button>
      </footer>
    </div>
  );
}

export default FlightTravellerSelection;
