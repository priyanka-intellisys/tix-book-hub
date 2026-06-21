import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BarChart3, CalendarDays, ClipboardList, Plane, Plus, Ticket, Users } from "lucide-react";
import "./FlightModule.css";

const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" } });

const emptyFlight = {
  airlineName: "",
  airlineLogo: "",
  flightNumber: "",
  aircraftType: "A320",
  cabinClass: "Economy",
  status: "active",
  fromCity: "",
  fromAirport: "",
  fromCode: "",
  toCity: "",
  toAirport: "",
  toCode: "",
  departureDate: "",
  departureTime: "",
  arrivalDate: "",
  arrivalTime: "",
  duration: "",
  stops: "Non-stop",
  baseFare: "",
  taxes: "",
  platformFee: "",
  ticketPrice: "",
  totalSeats: "",
  availableSeats: "",
  bookedSeats: 0,
  blockedSeats: 0,
  baggageAllowance: "",
  refundPolicy: "",
  cancellationPolicy: "",
};

const columnsByAircraft = {
  A320: [["A", "B", "C"], ["D", "E", "F"]],
  B737: [["A", "B", "C"], ["D", "E", "F"]],
  ATR72: [["A", "B"], ["C", "D"]],
  B777: [["A", "B", "C"], ["D", "E", "F", "G"], ["H", "J", "K"]],
};

function FlightModule({ page = "dashboard", navigate }) {
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [revenue, setRevenue] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  const loadFlightData = async () => {
    setLoading(true);
    const [flightsRes, bookingsRes, passengersRes, revenueRes, statsRes] = await Promise.allSettled([
      axios.get(`${apiBase}/vendor/flights`, auth()),
      axios.get(`${apiBase}/vendor/flight-bookings`, auth()),
      axios.get(`${apiBase}/vendor/passengers`, auth()),
      axios.get(`${apiBase}/vendor/flight-revenue`, auth()),
      axios.get(`${apiBase}/vendor/flight-dashboard-stats`, auth()),
    ]);
    if (flightsRes.status === "fulfilled") setFlights(Array.isArray(flightsRes.value.data) ? flightsRes.value.data : []);
    if (bookingsRes.status === "fulfilled") setBookings(Array.isArray(bookingsRes.value.data) ? bookingsRes.value.data : []);
    if (passengersRes.status === "fulfilled") setPassengers(Array.isArray(passengersRes.value.data) ? passengersRes.value.data : []);
    if (revenueRes.status === "fulfilled") setRevenue(revenueRes.value.data || {});
    if (statsRes.status === "fulfilled") setStats(statsRes.value.data || {});
    setLoading(false);
  };

  useEffect(() => {
    loadFlightData();
  }, []);

  if (page === "add-flight") return <FlightForm reload={loadFlightData} navigate={navigate} />;
  if (page.startsWith("edit-flight")) return <FlightForm editFlight={flights.find((flight) => page.endsWith(flight._id))} reload={loadFlightData} navigate={navigate} />;
  if (page === "my-flights") return <MyFlights flights={flights} reload={loadFlightData} navigate={navigate} />;
  if (page === "flight-seat-management") return <FlightSeatManagement flights={flights} reload={loadFlightData} />;
  if (page === "flight-bookings") return <FlightBookings bookings={bookings} />;
  if (page === "passengers") return <Passengers passengers={passengers} />;
  if (page === "flight-revenue") return <FlightRevenue revenue={revenue} />;
  if (page === "flight-reports") return <FlightReports flights={flights} bookings={bookings} stats={stats} />;
  return <FlightDashboard stats={stats} flights={flights} bookings={bookings} revenue={revenue} loading={loading} navigate={navigate} />;
}

function FlightDashboard({ stats, flights, bookings, revenue, loading, navigate }) {
  const cards = [
    ["Total Flights", stats.totalFlights || flights.length, Plane],
    ["Active Flights", stats.activeFlights || flights.filter((flight) => flight.status === "active").length, ClipboardList],
    ["Today Bookings", stats.todayBookings || 0, CalendarDays],
    ["Passengers", stats.totalPassengers || bookings.length, Users],
    ["Total Revenue", `Rs ${stats.totalRevenue || revenue.totalRevenue || 0}`, BarChart3],
    ["Available Seats", stats.availableSeats || 0, Ticket],
    ["Booked Seats", stats.bookedSeats || 0, Ticket],
    ["Blocked Seats", stats.blockedSeats || 0, Ticket],
  ];

  return (
    <>
      {loading && <div className="vendor-alert">Loading flight module...</div>}
      <section className="vendor-card-grid flight-card-grid">
        {cards.map(([label, value, Icon]) => (
          <article className="vendor-kpi-card" key={label}>
            <div><p>{label}</p><h2>{value}</h2><span>Flight module</span></div>
            <div className="flight-kpi-icon"><Icon size={22} /></div>
          </article>
        ))}
      </section>
      <section className="vendor-dashboard-grid">
        <article className="vendor-panel flight-chart-panel">
          <PanelTitle title="Bookings Overview Chart" />
          <MiniBars values={[30, 55, 44, 72, 63, 80, 58]} />
        </article>
        <article className="vendor-panel flight-chart-panel">
          <PanelTitle title="Revenue Overview Chart" right="Live" />
          <h3>Rs {revenue.totalRevenue || stats.totalRevenue || 0}</h3>
          <MiniBars values={[42, 38, 66, 48, 74, 56, 82]} />
        </article>
        <article className="vendor-panel">
          <PanelTitle title="Top Routes" right="Routes" />
          <div className="flight-list">
            {(stats.topRoutes || []).length ? stats.topRoutes.map((item) => <p key={item.route}><strong>{item.route}</strong><span>{item.count} flights</span></p>) : <p>No routes yet.</p>}
          </div>
        </article>
        <article className="vendor-panel">
          <PanelTitle title="Quick Actions" right="Vendor" />
          <div className="quick-action-grid">
            <button type="button" onClick={() => navigate("/vendor/add-flight")}>Add Flight</button>
            <button type="button" onClick={() => navigate("/vendor/my-flights")}>Edit Flight</button>
            <button type="button" onClick={() => navigate("/vendor/my-flights")}>Delete Flight</button>
            <button type="button" onClick={() => navigate("/vendor/flight-seat-management")}>Manage Seats</button>
            <button type="button" onClick={() => navigate("/vendor/flight-bookings")}>View Bookings</button>
            <button type="button" onClick={() => navigate("/vendor/flight-revenue")}>Revenue Report</button>
          </div>
        </article>
      </section>
      <section className="vendor-operations-grid">
        <DataTable title="Recent Flight Bookings" columns={["Booking ID", "PNR", "Passenger", "Flight", "Seat", "Amount", "Status"]} rows={(stats.recentBookings || bookings).slice(0, 6).map((booking) => [booking.bookingId, booking.pnr, booking.passengerName, booking.flightNumber, booking.seatNumber, `Rs ${booking.amount || 0}`, booking.bookingStatus])} />
        <article className="vendor-panel">
          <PanelTitle title="Seat Status Summary" right={`${stats.occupancyRate || 0}%`} />
          <div className="flight-seat-summary">
            <span style={{ "--value": `${stats.occupancyRate || 0}%` }} />
            <p>Occupancy Rate</p>
            <strong>{stats.occupancyRate || 0}%</strong>
          </div>
        </article>
      </section>
    </>
  );
}

function FlightForm({ editFlight, reload, navigate }) {
  const [form, setForm] = useState(editFlight || emptyFlight);
  useEffect(() => setForm(editFlight || emptyFlight), [editFlight]);

  const update = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      const baseFare = Number(next.baseFare || 0);
      const taxes = Number(next.taxes || 0);
      const platformFee = Number(next.platformFee || 0);
      if (["baseFare", "taxes", "platformFee"].includes(field)) next.ticketPrice = baseFare + taxes + platformFee;
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (editFlight?._id) {
      await axios.put(`${apiBase}/vendor/flights/${editFlight._id}`, form, auth());
    } else {
      await axios.post(`${apiBase}/vendor/flights`, form, auth());
    }
    await reload();
    navigate("/vendor/my-flights");
  };

  const groups = [
    ["Airline Info", ["airlineName", "airlineLogo", "flightNumber", "aircraftType", "cabinClass", "status"]],
    ["Route Info", ["fromCity", "fromAirport", "fromCode", "toCity", "toAirport", "toCode"]],
    ["Schedule Info", ["departureDate", "departureTime", "arrivalDate", "arrivalTime", "duration", "stops"]],
    ["Pricing Info", ["baseFare", "taxes", "platformFee", "ticketPrice"]],
    ["Seat Info", ["totalSeats", "availableSeats", "bookedSeats", "blockedSeats"]],
    ["Rules", ["baggageAllowance", "refundPolicy", "cancellationPolicy"]],
  ];

  return (
    <section className="vendor-panel vendor-page-panel">
      <PanelTitle title={editFlight ? "Edit Flight" : "Add Flight"} right="Flight" />
      <form className="flight-form" onSubmit={submit}>
        {groups.map(([title, fields]) => (
          <fieldset key={title}>
            <legend>{title}</legend>
            <div className="vendor-filter-grid">
              {fields.map((field) => <FlightField key={field} field={field} value={form[field]} update={update} />)}
            </div>
          </fieldset>
        ))}
        <button className="flight-primary-btn" type="submit"><Plus size={17} /> {editFlight ? "Update Flight" : "Add Flight"}</button>
      </form>
    </section>
  );
}

function FlightField({ field, value, update }) {
  const labels = field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
  const options = {
    aircraftType: ["A320", "B737", "ATR72", "B777"],
    cabinClass: ["Economy", "Premium Economy", "Business", "First Class"],
    status: ["active", "inactive"],
    stops: ["Non-stop", "1 Stop", "2 Stops"],
  };
  const numberFields = ["baseFare", "taxes", "platformFee", "ticketPrice", "totalSeats", "availableSeats", "bookedSeats", "blockedSeats"];
  const dateFields = ["departureDate", "arrivalDate"];
  const timeFields = ["departureTime", "arrivalTime"];
  if (options[field]) {
    return <label><span>{labels}</span><select value={value || ""} onChange={(event) => update(field, event.target.value)}>{options[field].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>;
  }
  return <label><span>{labels}</span><input type={dateFields.includes(field) ? "date" : timeFields.includes(field) ? "time" : numberFields.includes(field) ? "number" : "text"} value={value || ""} onChange={(event) => update(field, event.target.value)} /></label>;
}

function MyFlights({ flights, reload, navigate }) {
  const deleteFlight = async (flight) => {
    if (!window.confirm(`Delete ${flight.flightNumber}?`)) return;
    await axios.delete(`${apiBase}/vendor/flights/${flight._id}`, auth());
    reload();
  };
  return (
    <DataTable
      title="My Flights"
      columns={["Logo", "Airline", "Flight", "Route", "Aircraft", "Depart", "Arrive", "Seats", "Price", "Status", "Actions"]}
      rows={flights.map((flight) => [
        flight.airlineLogo ? <img className="flight-logo" src={flight.airlineLogo} alt={flight.airlineName} /> : "-",
        flight.airlineName,
        flight.flightNumber,
        `${flight.fromCode || flight.fromCity} to ${flight.toCode || flight.toCity}`,
        flight.aircraftType,
        `${flight.departureDate || "-"} ${flight.departureTime || ""}`,
        flight.arrivalTime || "-",
        `Total ${flight.totalSeats || 0} / Booked ${flight.bookedSeats || 0} / Available ${flight.availableSeats || 0}`,
        `Rs ${flight.ticketPrice || 0}`,
        <span className="vendor-status">{flight.status}</span>,
        <div className="vendor-row-actions"><button onClick={() => navigate(`/vendor/edit-flight/${flight._id}`)}>Edit</button><button onClick={() => deleteFlight(flight)}>Delete</button><button onClick={() => navigate("/vendor/flight-seat-management", { state: { flightId: flight._id } })}>Manage Seats</button></div>,
      ])}
    />
  );
}

function FlightSeatManagement({ flights }) {
  const [flightId, setFlightId] = useState(flights[0]?._id || "");
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const flight = flights.find((item) => item._id === flightId) || flights[0];
  const groups = columnsByAircraft[flight?.aircraftType || "A320"] || columnsByAircraft.A320;

  useEffect(() => {
    if (!flightId && flights[0]?._id) setFlightId(flights[0]._id);
  }, [flightId, flights]);

  const loadSeats = async (id = flightId) => {
    if (!id) return;
    const res = await axios.get(`${apiBase}/vendor/flights/${id}/seats`, auth());
    setSeats(res.data.seats || []);
    setSelectedSeat(null);
  };

  useEffect(() => {
    if (flightId) loadSeats(flightId);
  }, [flightId]);

  const seatAction = async (action) => {
    if (!selectedSeat) return;
    await axios.patch(`${apiBase}/vendor/flights/${flightId}/seats/${selectedSeat.seatNumber}/${action}`, {}, auth());
    loadSeats(flightId);
  };

  return (
    <section className="vendor-operations-grid seat-management-page">
      <article className="vendor-panel seat-panel">
        <PanelTitle title="Flight Seat Management" right={flight?.aircraftType || "Aircraft"} />
        <div className="vendor-filter-grid">
          <label><span>Flight</span><select value={flightId} onChange={(event) => setFlightId(event.target.value)}>{flights.map((item) => <option value={item._id} key={item._id}>{item.airlineName} {item.flightNumber}</option>)}</select></label>
          <label><span>Departure Date</span><input value={flight?.departureDate || ""} readOnly /></label>
          <label><span>Cabin Class</span><input value={flight?.cabinClass || ""} readOnly /></label>
        </div>
        <SeatLegend />
        <div className="flight-aircraft-layout">
          {seats.map((seat) => (
            <button key={seat.seatNumber} className={`vendor-seat ${seat.status} ${selectedSeat?.seatNumber === seat.seatNumber ? "selected" : ""}`} type="button" onClick={() => setSelectedSeat(seat)}>{seat.seatNumber}</button>
          ))}
        </div>
        <p className="flight-layout-note">{groups.map((group) => group.join(" ")).join(" | ")}</p>
      </article>
      <SeatDetails seat={selectedSeat} onBlock={() => seatAction("block")} onUnblock={() => seatAction("unblock")} />
    </section>
  );
}

function SeatDetails({ seat, onBlock, onUnblock }) {
  const rows = [
    ["Seat Number", seat?.seatNumber],
    ["Status", seat?.status],
    ["Passenger Name", seat?.passengerName || seat?.customerName],
    ["PNR Number", seat?.pnr],
    ["Booking ID", seat?.bookingId],
    ["Mobile", seat?.mobile || seat?.customerMobile],
    ["Email", seat?.email || seat?.customerEmail],
    ["Amount", seat?.amount ? `Rs ${seat.amount}` : ""],
    ["Payment Status", seat?.paymentStatus],
    ["Booking Status", seat?.bookingStatus],
    ["Booking Date", seat?.bookingDate ? new Date(seat.bookingDate).toLocaleString() : ""],
  ];
  return (
    <article className="vendor-panel seat-details-panel">
      <PanelTitle title="Seat Details" right="Live" />
      {!seat ? <p>Select a seat to view details.</p> : <div className="seat-detail-list">{rows.map(([label, value]) => <p key={label}><strong>{label}</strong><span>{value || "-"}</span></p>)}<div className="vendor-row-actions"><button disabled={seat.status !== "available"} onClick={onBlock}>Block Seat</button><button disabled={seat.status !== "blocked"} onClick={onUnblock}>Unblock Seat</button><button disabled={seat.status !== "booked"}>View Booking</button></div></div>}
    </article>
  );
}

function FlightBookings({ bookings }) {
  return <DataTable title="Flight Bookings" columns={["Booking ID", "PNR", "Passenger Name", "Flight Number", "Route", "Departure Date", "Departure Time", "Seat Number", "Amount", "Payment Status", "Booking Status", "Booking Date"]} rows={bookings.map((item) => [item.bookingId, item.pnr, item.passengerName, item.flightNumber, item.route, item.departureDate, item.departureTime, item.seatNumber, `Rs ${item.amount || 0}`, item.paymentStatus, item.bookingStatus, item.bookingDate ? new Date(item.bookingDate).toLocaleDateString() : "-"])} />;
}

function Passengers({ passengers }) {
  return <DataTable title="Passengers" columns={["Passenger Name", "Age", "Gender", "Mobile", "Email", "Flight Number", "Seat Number", "PNR", "ID Proof Type", "ID Proof Number"]} rows={passengers.map((item) => [item.passengerName, item.age, item.gender, item.mobile, item.email, item.flightNumber, item.seatNumber, item.pnr, item.idProofType, item.idProofNumber])} />;
}

function FlightRevenue({ revenue }) {
  const cards = [["Total Revenue", revenue.totalRevenue], ["Today Revenue", revenue.todayRevenue], ["Monthly Revenue", revenue.monthlyRevenue], ["TixHub Commission", revenue.tixhubCommission], ["Vendor Earnings", revenue.vendorEarnings], ["Pending Settlement", revenue.pendingSettlement], ["Settled Amount", revenue.settledAmount]];
  return <section className="vendor-card-grid revenue-card-grid">{cards.map(([label, value]) => <article className="vendor-kpi-card" key={label}><div><p>{label}</p><h2>Rs {value || 0}</h2><span>Flight revenue</span></div></article>)}</section>;
}

function FlightReports({ flights, bookings, stats }) {
  return <DataTable title="Flight Reports" columns={["Metric", "Value"]} rows={[["Total Flights", flights.length], ["Total Bookings", bookings.length], ["Occupancy Rate", `${stats.occupancyRate || 0}%`], ["Available Seats", stats.availableSeats || 0], ["Booked Seats", stats.bookedSeats || 0], ["Blocked Seats", stats.blockedSeats || 0]]} />;
}

function DataTable({ title, columns, rows }) {
  return (
    <section className="vendor-panel vendor-page-panel">
      <PanelTitle title={title} right="Live" />
      <div className="vendor-table-shell"><table className="vendor-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell || "-"}</td>)}</tr>) : <tr><td colSpan={columns.length}>No data available yet.</td></tr>}</tbody></table></div>
    </section>
  );
}

function PanelTitle({ title, right = "Flight" }) {
  return <div className="panel-title"><h2>{title}</h2><button type="button">{right}</button></div>;
}

function SeatLegend() {
  return <div className="seat-legend"><span className="available">Available</span><span className="booked">Booked</span><span className="blocked">Blocked</span><span className="selected">Selected</span></div>;
}

function MiniBars({ values }) {
  return <div className="flight-mini-bars">{values.map((value, index) => <i key={`${value}-${index}`} style={{ height: `${value}%` }} />)}</div>;
}

export default FlightModule;
