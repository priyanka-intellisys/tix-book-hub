import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  Clapperboard,
  ClipboardList,
  CreditCard,
  Film,
  Globe2,
  LayoutDashboard,
  LogOut,
  Plane,
  Plus,
  Search,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import FlightModule from "./FlightModule";
import "./VendorDashboard.css";

const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" } });

const sidebarItems = [
  ["Dashboard", LayoutDashboard, "/vendor-dashboard"],
  ["Movies", Film, "/vendor/movies"],
  ["Flights", Plane, "/vendor/flights"],
  ["Add Flight", Plus, "/vendor/add-flight"],
  ["My Flights", Plane, "/vendor/my-flights"],
  ["Flight Seat Management", Ticket, "/vendor/flight-seat-management"],
  ["Flight Bookings", ClipboardList, "/vendor/flight-bookings"],
  ["Passengers", Users, "/vendor/passengers"],
  ["Flight Revenue", BarChart3, "/vendor/flight-revenue"],
  ["Bookings", Ticket, "/vendor/bookings"],
  ["Customers", Users, "/vendor/customers"],
  ["Transactions", CreditCard, "/vendor/transactions"],
  ["Analytics", BarChart3, "/vendor/analytics"],
  ["Settings", Settings, "/vendor/settings"],
];

const weeklySales = [42, 42, 34, 33, 22, 22, 33, 41, 38, 49, 44, 47, 39, 22, 25, 21, 24, 23, 31, 24, 18, 21];
const revenueBars = [46, 36, 72, 58, 44, 50, 45];
const fallbackMovies = [
  { _id: "demo-1", title: "The Red Code", genre: "Action", language: "Hindi", theatre: "TixHub Screen 1", showTime: "7:30 PM", ticketPrice: 280, totalSeats: 80, bookedSeats: ["A1", "A2"], status: "active" },
  { _id: "demo-2", title: "Midnight Show", genre: "Drama", language: "English", theatre: "TixHub Screen 2", showTime: "9:45 PM", ticketPrice: 240, totalSeats: 72, bookedSeats: ["B4"], status: "active" },
  { _id: "demo-3", title: "City Lights", genre: "Romance", language: "Tamil", theatre: "TixHub Screen 3", showTime: "6:00 PM", ticketPrice: 220, totalSeats: 64, bookedSeats: [], status: "draft" },
];
const fallbackStats = {
  totalBookings: 2345,
  totalCustomers: 2345,
  todayBookings: 234,
  revenue: 234567,
  todayRevenue: 12340,
  monthlyRevenue: 180000,
  tixhubCommission: 28148,
  vendorEarnings: 206419,
  pendingSettlement: 206419,
  settledAmount: 0,
  availableSeats: 210,
  bookedSeats: 18,
  blockedSeats: 8,
};

function VendorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeRoute = location.pathname === "/vendor-dashboard" || location.pathname === "/vendor" ? "dashboard" : location.pathname.replace("/vendor/", "");
  const [stats, setStats] = useState(fallbackStats);
  const [movies, setMovies] = useState(fallbackMovies);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    const [statsRes, moviesRes, bookingsRes, customersRes, availabilityRes, paymentRes] = await Promise.allSettled([
      axios.get(`${apiBase}/vendor/dashboard-stats`, auth()),
      axios.get(`${apiBase}/vendor/movies`, auth()),
      axios.get(`${apiBase}/vendor/bookings`, auth()),
      axios.get(`${apiBase}/vendor/customers`, auth()),
      axios.get(`${apiBase}/vendor/availability`, auth()),
      axios.get(`${apiBase}/vendor/payment-details`, auth()),
    ]);

    if (statsRes.status === "fulfilled") setStats({ ...fallbackStats, ...(statsRes.value.data || {}) });
    if (moviesRes.status === "fulfilled") setMovies(Array.isArray(moviesRes.value.data) && moviesRes.value.data.length ? moviesRes.value.data : fallbackMovies);
    if (bookingsRes.status === "fulfilled") setBookings(Array.isArray(bookingsRes.value.data) ? bookingsRes.value.data : []);
    if (customersRes.status === "fulfilled") setCustomers(Array.isArray(customersRes.value.data) ? customersRes.value.data : []);
    if (availabilityRes.status === "fulfilled") setAvailability(Array.isArray(availabilityRes.value.data) ? availabilityRes.value.data : []);
    if (paymentRes.status === "fulfilled") setPaymentDetails(paymentRes.value.data || {});

    if ([statsRes, moviesRes, bookingsRes, customersRes, availabilityRes, paymentRes].some((item) => item.status === "rejected")) {
      setError("Live vendor data is unavailable. Showing safe fallback data where needed.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const topMovies = useMemo(() => movies.slice(0, 4).map((movie, index) => ({
    id: movie._id || movie.title,
    title: movie.title || "Untitled Movie",
    meta: movie.genre || movie.language || "Movie",
    value: [42, 28, 18, 12][index] || 10,
    price: movie.ticketPrice || movie.price || 250,
    image: movie.image || movie.posterUrl || movie.bannerUrl || "",
  })), [movies]);

  const upcomingMovies = useMemo(() => movies.slice(0, 4).map((movie, index) => ({
    id: movie._id || index,
    title: movie.title || "Untitled Movie",
    date: movie.releaseDate || movie.showDate || ["18 Jun", "22 Jun", "25 Jun", "29 Jun"][index],
    image: movie.image || movie.posterUrl || movie.bannerUrl || "",
  })), [movies]);

  const cardData = [
    ["Total Bookings", stats.totalBookings || bookings.length || 0, "+14.5%", Ticket],
    ["User Registration", stats.totalCustomers || customers.length || 0, "+18.8%", Users],
    ["Today Bookings", stats.todayBookings || 0, "+12.5%", CalendarDays],
    ["Total Revenue", `Rs ${stats.revenue || 0}`, "+4.5%", BarChart3],
  ];

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const renderPage = () => {
    if (["flights", "add-flight", "my-flights", "flight-seat-management", "flight-bookings", "passengers", "flight-revenue", "flight-reports"].includes(activeRoute) || activeRoute.startsWith("edit-flight")) {
      return <FlightModule page={activeRoute} navigate={navigate} />;
    }
    if (activeRoute === "movies") return <MoviesPage movies={movies} reload={loadDashboard} navigate={navigate} />;
    if (activeRoute === "bookings") return <BookingsPage bookings={bookings} />;
    if (activeRoute === "customers") return <CustomersPage customers={customers} />;
    if (activeRoute === "transactions" || activeRoute === "revenue") return <RevenuePage stats={stats} />;
    if (activeRoute === "analytics") return <AnalyticsPage stats={stats} movies={movies} />;
    if (activeRoute === "settings") return <SettingsPage details={paymentDetails} reload={loadDashboard} />;
    if (activeRoute === "seat-management") return <SeatManagementPage movies={movies} reload={loadDashboard} />;
    if (activeRoute === "availability") return <AvailabilityPage rows={availability} movies={movies} />;
    return (
      <DashboardHome
        cardData={cardData}
        stats={stats}
        topMovies={topMovies}
        upcomingMovies={upcomingMovies}
        navigate={navigate}
      />
    );
  };

  return (
    <div className="vendor-shell">
      <aside className="vendor-sidebar">
        <div className="vendor-brand">
          <span className="vendor-logo-mark"><Clapperboard size={24} /></span>
          <strong>TixHub Vendor</strong>
        </div>

        <nav className="vendor-sidebar-nav">
          {sidebarItems.map(([label, Icon, path]) => (
            <button
              key={label}
              className={(label === "Dashboard" && activeRoute === "dashboard") || path.endsWith(activeRoute) ? "active" : ""}
              type="button"
              onClick={() => navigate(path)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <button className="vendor-logout" type="button" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="vendor-dashboard">
        <header className="vendor-header">
          <label className="vendor-search">
            <Search size={18} />
            <input type="search" placeholder="Search" />
          </label>

          <div className="vendor-header-actions">
            <button className="vendor-language" type="button">
              <Globe2 size={18} />
              English
              <ChevronDown size={16} />
            </button>
            <button className="vendor-icon-btn" type="button" aria-label="Notifications">
              <Bell size={19} />
              <span />
            </button>
            <button className="vendor-profile" type="button">
              <span className="vendor-avatar">TV</span>
              <span>
                <strong>TixHub Vendor</strong>
                <small>Owner</small>
              </span>
              <ChevronDown size={16} />
            </button>
          </div>
        </header>

        {loading && <div className="vendor-alert">Loading vendor data...</div>}
        {error && <div className="vendor-alert warning">{error}</div>}
        {renderPage()}
      </main>
    </div>
  );
}

function DashboardHome({ cardData, stats, topMovies, upcomingMovies, navigate }) {
  return (
    <>
      <section className="vendor-card-grid">
        {cardData.map(([label, value, trend, Icon], index) => (
          <article className="vendor-kpi-card" key={label}>
            <div>
              <p>{label}</p>
              <h2>{value}</h2>
              <span>{trend}</span>
            </div>
            <div className={`kpi-mini-chart chart-${index + 1}`}>
              <Icon size={19} />
              {index < 2 && <MiniLine />}
              {index === 2 && <MiniBars />}
              {index === 3 && <MiniRevenue />}
            </div>
          </article>
        ))}
      </section>

      <section className="vendor-dashboard-grid">
        <article className="vendor-panel sales-panel">
          <PanelTitle title="Sales Details" />
          <LineChart values={weeklySales} />
        </article>

        <article className="vendor-panel revenue-panel">
          <PanelTitle title="Total Revenue" right="2026" />
          <h3>Rs {stats.revenue || 0}</h3>
          <BarChart values={revenueBars} />
          <p className="vendor-good">+4.5% your sales performance is 30% better compare to last month</p>
        </article>

        <article className="vendor-panel donut-panel">
          <PanelTitle title="Top Selling Movies" />
          <div className="donut-wrap">
            <div className="donut-chart" />
            <div className="donut-note">
              <strong>40%</strong>
              <span>Action</span>
            </div>
          </div>
        </article>

        <article className="vendor-panel movie-list-panel">
          <PanelTitle title="Top Selling Movies" />
          <MovieList movies={topMovies} showValue />
        </article>

        <article className="vendor-panel movie-list-panel">
          <PanelTitle title="Upcoming Movies" />
          <MovieList movies={upcomingMovies} />
        </article>
      </section>

      <section className="vendor-operations-grid">
        <article className="vendor-panel quick-actions-panel">
          <PanelTitle title="Movie Vendor Quick Actions" />
          <div className="quick-action-grid">
            <button type="button" onClick={() => navigate("/vendor/add-movie")}>Add Movie</button>
            <button type="button" onClick={() => navigate("/vendor/movies")}>Edit Movie</button>
            <button type="button" onClick={() => navigate("/vendor/movies")}>Delete Movie</button>
            <button type="button" onClick={() => navigate("/vendor/seat-management")}>Seat Management</button>
            <button type="button" onClick={() => navigate("/vendor/availability")}>Booking Availability</button>
            <button type="button" onClick={() => navigate("/vendor/bookings")}>View Bookings</button>
            <button type="button" onClick={() => navigate("/vendor/revenue")}>Revenue Report</button>
          </div>
        </article>

        <article className="vendor-panel seat-panel">
          <PanelTitle title="Seat Management" />
          <DashboardSeatPreview navigate={navigate} />
        </article>
      </section>
    </>
  );
}

function MoviesPage({ movies, reload, navigate }) {
  const deleteMovie = async (movie) => {
    if (!window.confirm(`Delete ${movie.title}?`)) return;
    try {
      await axios.delete(`${apiBase}/vendor/movies/${movie._id}`, auth());
      alert("Movie deleted");
      reload();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete movie");
    }
  };

  return (
    <section className="vendor-panel vendor-page-panel">
      <PanelTitle title="My Movies" right="Vendor" />
      <div className="vendor-table-shell">
        <table className="vendor-table">
          <thead>
            <tr>
              <th>Poster</th>
              <th>Movie</th>
              <th>Genre</th>
              <th>Language</th>
              <th>Theatre</th>
              <th>Show Time</th>
              <th>Price</th>
              <th>Seats</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => {
              const booked = Number(movie.bookedSeats?.length || 0);
              const total = Number(movie.totalSeats || 0);
              return (
                <tr key={movie._id || movie.title}>
                  <td>{movie.image ? <img className="table-poster" src={movie.image} alt={movie.title} /> : <span className="movie-thumb"><Film size={18} /></span>}</td>
                  <td>{movie.title}</td>
                  <td>{movie.genre || "-"}</td>
                  <td>{movie.language || "-"}</td>
                  <td>{movie.theatre || movie.theatreName || "-"}</td>
                  <td>{movie.showTime || movie.showTimes?.[0] || "-"}</td>
                  <td>Rs {movie.ticketPrice || 0}</td>
                  <td>Total {total}<span>Booked {booked} / Available {Math.max(total - booked, 0)}</span></td>
                  <td><span className="vendor-status">{movie.status || "active"}</span></td>
                  <td>
                    <div className="vendor-row-actions">
                      <button type="button" onClick={() => navigate("/vendor/add-movie", { state: { movie } })}>Edit</button>
                      <button type="button" onClick={() => deleteMovie(movie)}>Delete</button>
                      <button type="button" onClick={() => navigate("/vendor/seat-management", { state: { movieId: movie._id } })}>Manage Seats</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SeatManagementPage({ movies }) {
  const location = useLocation();
  const [movieId, setMovieId] = useState(location.state?.movieId || movies[0]?._id || "");
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatNumber, setSeatNumber] = useState("");
  const selectedMovie = movies.find((movie) => movie._id === movieId) || movies[0];

  const loadSeats = async (id = movieId) => {
    if (!id) return;
    try {
      const res = await axios.get(`${apiBase}/vendor/shows/${id}/seats`, auth());
      setSeats(res.data.seats || []);
      setSelectedSeat(null);
    } catch (error) {
      setSeats([]);
      alert(error.response?.data?.message || "Unable to load live seat data");
    }
  };

  useEffect(() => {
    if (movieId) loadSeats(movieId);
  }, [movieId]);

  const runSeatAction = async (action, seat = selectedSeat) => {
    if (!movieId || !seat) return;
    if (action === "delete" && seat.status === "booked") {
      alert("Booked seat cannot be removed directly.");
      return;
    }
    try {
      if (action === "block") await axios.patch(`${apiBase}/vendor/movies/${movieId}/seats/${seat.seatNumber}/block`, {}, auth());
      if (action === "unblock") await axios.patch(`${apiBase}/vendor/movies/${movieId}/seats/${seat.seatNumber}/unblock`, {}, auth());
      if (action === "delete") await axios.delete(`${apiBase}/vendor/movies/${movieId}/seats/${seat.seatNumber}`, auth());
      alert("Seat updated");
      await loadSeats(movieId);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to update seat");
    }
  };

  const addSeat = async () => {
    const nextSeat = seatNumber.trim();
    if (!nextSeat || !movieId) return;
    try {
      await axios.post(`${apiBase}/vendor/movies/${movieId}/seats`, { seatNumber: nextSeat }, auth());
      setSeatNumber("");
      alert("Seat added");
      await loadSeats(movieId);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to add seat");
    }
  };

  return (
    <section className="vendor-operations-grid seat-management-page">
      <article className="vendor-panel seat-panel">
        <PanelTitle title="Seat Management" right="Movie" />
        <div className="vendor-filter-grid">
          <label>
            <span>Movie</span>
            <select value={movieId} onChange={(event) => setMovieId(event.target.value)}>
              {movies.map((movie) => <option key={movie._id || movie.title} value={movie._id}>{movie.title}</option>)}
            </select>
          </label>
          <label><span>Theatre</span><input value={selectedMovie?.theatre || selectedMovie?.theatreName || ""} readOnly /></label>
          <label><span>Show Date</span><input value={selectedMovie?.showDate || selectedMovie?.releaseDate || ""} readOnly /></label>
          <label><span>Show Time</span><input value={selectedMovie?.showTime || selectedMovie?.showTimes?.[0] || ""} readOnly /></label>
        </div>
        <div className="seat-toolbar">
          <input value={seatNumber} onChange={(event) => setSeatNumber(event.target.value)} placeholder="Seat no. e.g. H9" />
          <button type="button" onClick={addSeat}>Add Seat</button>
          <button type="button" onClick={() => runSeatAction("delete")}>Remove Seat</button>
          <button type="button" onClick={() => runSeatAction("block")}>Block Seat</button>
          <button type="button" onClick={() => runSeatAction("unblock")}>Unblock Seat</button>
        </div>
        <SeatLegend />
        <div className="vendor-seat-grid">
          {seats.map((seat) => (
            <button
              className={`vendor-seat ${seat.status} ${selectedSeat?.seatNumber === seat.seatNumber ? "selected" : ""}`}
              key={seat.seatNumber}
              type="button"
              onClick={() => setSelectedSeat(seat)}
            >
              {seat.seatNumber}
            </button>
          ))}
        </div>
      </article>
      <SeatDetails seat={selectedSeat} onBlock={() => runSeatAction("block")} onUnblock={() => runSeatAction("unblock")} onRemove={() => runSeatAction("delete")} />
    </section>
  );
}

function SeatDetails({ seat, onBlock, onUnblock, onRemove }) {
  return (
    <article className="vendor-panel seat-details-panel">
      <PanelTitle title="Seat Details" right="Live" />
      {!seat ? <p>Select a seat to view details.</p> : (
        <div className="seat-detail-list">
          <p><strong>Seat Number</strong><span>{seat.seatNumber}</span></p>
          <p><strong>Status</strong><span>{seat.status}</span></p>
          <p><strong>Customer Name</strong><span>{seat.customerName || "-"}</span></p>
          <p><strong>Booking ID</strong><span>{seat.bookingId || "-"}</span></p>
          <p><strong>Mobile</strong><span>{seat.customerMobile || seat.mobile || "-"}</span></p>
          <p><strong>Email</strong><span>{seat.customerEmail || seat.email || "-"}</span></p>
          <p><strong>Amount</strong><span>Rs {seat.amount || 0}</span></p>
          <p><strong>Payment Status</strong><span>{seat.paymentStatus || "-"}</span></p>
          <p><strong>Booking Date</strong><span>{seat.bookingDate ? new Date(seat.bookingDate).toLocaleString() : "-"}</span></p>
          <div className="vendor-row-actions">
            <button type="button" onClick={onBlock} disabled={seat.status === "booked" || seat.status === "blocked"}>Block Seat</button>
            <button type="button" onClick={onUnblock} disabled={seat.status !== "blocked"}>Unblock Seat</button>
            <button type="button" onClick={onRemove} disabled={seat.status === "booked"}>Remove Seat</button>
          </div>
        </div>
      )}
    </article>
  );
}

function BookingsPage({ bookings }) {
  return <DataTable title="Bookings" columns={["Booking ID", "Customer Name", "Movie Name", "Theatre", "Show Date", "Show Time", "Seats", "Amount", "Payment Status", "Booking Status", "Booking Date", "View"]} rows={bookings.map((booking) => [booking.bookingCode || booking._id, booking.user?.name || booking.details?.customerName || "Customer", booking.title, booking.details?.theatre || booking.details?.movie?.theatre || "-", booking.details?.showDate || "-", booking.details?.showTime || "-", booking.seats?.join(", ") || "-", `Rs ${booking.amount || 0}`, booking.paymentStatus, booking.status, booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "-", "View"])} />;
}

function CustomersPage({ customers }) {
  return <DataTable title="Customers" columns={["Customer Name", "Email", "Mobile", "Total Bookings", "Total Spend", "Last Booking"]} rows={customers.map((customer) => [customer.customerName, customer.email || "-", customer.mobile || "-", customer.totalBookings || 0, `Rs ${customer.totalSpend || 0}`, customer.lastBooking ? new Date(customer.lastBooking).toLocaleDateString() : "-"])} />;
}

function AvailabilityPage({ rows, movies }) {
  const fallbackRows = movies.map((movie) => {
    const bookedSeats = movie.bookedSeats?.length || 0;
    const totalSeats = movie.totalSeats || 0;
    return { _id: movie._id, movie: movie.title, theatre: movie.theatre || movie.theatreName || "-", showTime: movie.showTime || "-", totalSeats, bookedSeats, availableSeats: Math.max(totalSeats - bookedSeats, 0), blockedSeats: 0, occupancy: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0 };
  });
  const source = rows.length ? rows : fallbackRows;
  return <DataTable title="Booking Availability" columns={["Movie", "Theatre", "Show Time", "Total Seats", "Booked Seats", "Available Seats", "Blocked Seats", "Occupancy %"]} rows={source.map((row) => [row.movie, row.theatre, row.showTime, row.totalSeats, row.bookedSeats, row.availableSeats, row.blockedSeats, `${row.occupancy}%`])} />;
}

function RevenuePage({ stats }) {
  const cards = [
    ["Total Revenue", stats.revenue],
    ["Today Revenue", stats.todayRevenue],
    ["Monthly Revenue", stats.monthlyRevenue],
    ["TixHub Commission", stats.tixhubCommission || stats.platformCommission],
    ["Vendor Earnings", stats.vendorEarnings],
    ["Pending Settlement", stats.pendingSettlement || stats.pendingSettlements],
    ["Settled Amount", stats.settledAmount],
  ];
  return <section className="vendor-card-grid revenue-card-grid">{cards.map(([label, value]) => <article className="vendor-kpi-card" key={label}><div><p>{label}</p><h2>Rs {value || 0}</h2><span>Updated live</span></div></article>)}</section>;
}

function AnalyticsPage({ stats, movies }) {
  return (
    <>
      <section className="vendor-card-grid">
        {[["Available Seats", stats.availableSeats], ["Booked Seats", stats.bookedSeats], ["Blocked Seats", stats.blockedSeats], ["Movies", movies.length]].map(([label, value]) => <article className="vendor-kpi-card" key={label}><div><p>{label}</p><h2>{value || 0}</h2><span>Vendor data</span></div></article>)}
      </section>
      <section className="vendor-dashboard-grid">
        <article className="vendor-panel sales-panel"><PanelTitle title="Sales Details" /><LineChart values={weeklySales} /></article>
        <article className="vendor-panel revenue-panel"><PanelTitle title="Total Revenue" right="2026" /><h3>Rs {stats.revenue || 0}</h3><BarChart values={revenueBars} /></article>
      </section>
    </>
  );
}

function SettingsPage({ details, reload }) {
  const [form, setForm] = useState(details || {});
  useEffect(() => setForm(details || {}), [details]);
  const fields = ["businessName", "businessType", "accountHolderName", "bankName", "accountNumber", "confirmAccountNumber", "ifscCode", "upiId", "panNumber", "gstNumber", "settlementPreference"];
  const labels = ["Business Name", "Business Type", "Account Holder Name", "Bank Name", "Account Number", "Confirm Account Number", "IFSC Code", "UPI ID", "PAN Number", "GST Number", "Settlement Preference"];
  const submit = async (event) => {
    event.preventDefault();
    try {
      await axios.put(`${apiBase}/vendor/payment-details`, form, auth());
      alert("Payment details saved");
      reload();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save payment details");
    }
  };
  return (
    <section className="vendor-panel vendor-page-panel">
      <PanelTitle title="Payment Details" right="Bank" />
      <p>TixHub owns Razorpay. Vendors only add settlement bank details.</p>
      <form className="vendor-settings-form" onSubmit={submit}>
        {fields.map((field, index) => <label key={field}><span>{labels[index]}</span><input value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} /></label>)}
        <button type="submit">Save Payment Details</button>
      </form>
    </section>
  );
}

function DataTable({ title, columns, rows }) {
  return (
    <section className="vendor-panel vendor-page-panel">
      <PanelTitle title={title} right="Live" />
      <div className="vendor-table-shell">
        <table className="vendor-table">
          <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>) : <tr><td colSpan={columns.length}>No data available yet.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  );
}

function DashboardSeatPreview({ navigate }) {
  const seats = ["available", "available", "booked", "available", "blocked", "available", "available", "available", "booked", "available", "available", "blocked", "available", "booked", "available", "available", "available", "available", "blocked", "available", "available", "available", "booked", "available", "available", "selected", "available", "available", "blocked", "available", "booked", "available"];
  return (
    <>
      <div className="seat-toolbar">
        <button type="button" onClick={() => navigate("/vendor/seat-management")}>Add Seat</button>
        <button type="button" onClick={() => navigate("/vendor/seat-management")}>Remove Seat</button>
        <button type="button" onClick={() => navigate("/vendor/seat-management")}>Block Seat</button>
        <button type="button" onClick={() => navigate("/vendor/seat-management")}>Unblock Seat</button>
      </div>
      <SeatLegend />
      <div className="vendor-seat-grid">
        {seats.map((status, index) => <button className={`vendor-seat ${status}`} key={`${status}-${index}`} type="button" onClick={() => navigate("/vendor/seat-management")}>{String.fromCharCode(65 + Math.floor(index / 8))}{(index % 8) + 1}</button>)}
      </div>
    </>
  );
}

function SeatLegend() {
  return <div className="seat-legend"><span className="available">Available</span><span className="booked">Booked</span><span className="blocked">Blocked</span><span className="selected">Selected</span></div>;
}

function PanelTitle({ title, right = "April" }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      <button type="button">{right}<ChevronDown size={15} /></button>
    </div>
  );
}

function MiniLine() {
  return <svg viewBox="0 0 130 52" aria-hidden="true"><path d="M0 28 C16 27 24 12 38 18 C52 25 56 44 72 34 C86 24 95 15 110 13 C118 12 124 10 130 5" /></svg>;
}

function MiniBars() {
  return <div className="mini-bars">{[28, 38, 48, 56].map((height) => <i key={height} style={{ height }} />)}</div>;
}

function MiniRevenue() {
  return <div className="mini-revenue">{[38, 52, 42, 58, 46, 50].map((height) => <i key={height} style={{ height }} />)}</div>;
}

function LineChart({ values }) {
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${92 - value}`).join(" ");
  return (
    <div className="line-chart">
      <div className="chart-tooltip">April Bookings <strong>345,678</strong></div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Sales Details line chart">
        <polyline points={points} />
        <path d={`M0,100 L${points.replaceAll(" ", " L")} L100,100 Z`} />
      </svg>
      <div className="chart-days">{["Mon 10", "Tue 11", "Wed 12", "Thu 13", "Fri 14", "Sat 15", "Sun 16"].map((day) => <span key={day}>{day}</span>)}</div>
    </div>
  );
}

function BarChart({ values }) {
  return <div className="bar-chart">{values.map((value, index) => <div className="bar-column" key={`${value}-${index}`}><span style={{ height: `${value}%` }} /><small>{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"][index]}</small></div>)}</div>;
}

function MovieList({ movies, showValue = false }) {
  return <div className="vendor-movie-list">{movies.map((movie) => <div className="vendor-movie-row" key={movie.id}>{movie.image ? <img src={movie.image} alt={movie.title} /> : <span className="movie-thumb"><Film size={18} /></span>}<div><strong>{movie.title}</strong><small>{movie.date || movie.meta}</small></div>{showValue && <b>{movie.value}%</b>}</div>)}</div>;
}

export default VendorDashboard;
