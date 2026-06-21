import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import jsQR from "jsqr";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Clapperboard,
  CreditCard,
  Film,
  Globe2,
  Headphones,
  Hotel,
  LayoutDashboard,
  LogOut,
  Plane,
  QrCode,
  ShieldCheck,
  Search,
  Settings,
  Ticket,
  UserCheck,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import FlightModule from "./FlightModule";
import "./VendorDashboard.css";

const apiBase = "http://localhost:5000/api";
const socketBase = "http://localhost:5000";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" } });

const getStoredUser = () => {
  const raw = localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser");
  return raw ? JSON.parse(raw) : {};
};

const getMovieShowId = (movie) => String(movie?.showId || movie?._id || "");

const sidebarItems = [
  ["Dashboard", LayoutDashboard, "/vendor-dashboard"],
  ["Bookings", Ticket, "/vendor/bookings"],
  ["Customers", Users, "/vendor/customers"],
  ["Revenue", BarChart3, "/vendor/revenue"],
  ["Settlements", CreditCard, "/vendor/settlements"],
  ["Payment Details", BriefcaseBusiness, "/vendor/payment-details"],
  ["Profile", Settings, "/vendor/profile"],
  ["Support", Headphones, "/vendor/support"],
];

const serviceMeta = {
  movies: { label: "Movies", icon: "🎬", route: "/vendor/movies" },
  flights: { label: "Flights", icon: "✈", route: "/vendor/flights" },
  hotels: { label: "Hotels", icon: "🏨", route: "/vendor/hotels" },
  events: { label: "Events", icon: "🎫", route: "/vendor/events" },
  bus: { label: "Bus", icon: "🚌", route: "/vendor/bus" },
  travel: { label: "Travel", icon: "🌍", route: "/vendor/travel" },
};

const serviceModules = ["movies", "flights", "hotels", "events", "bus", "travel"];
const commonServices = ["all", "movies", "flights", "hotels", "events", "bus", "travel"];
const fallbackStats = {
  totalBookings: 0,
  totalRevenue: 0,
  todayBookings: 0,
  revenue: 0,
  availableSeats: 0,
  bookedSeats: 0,
  blockedSeats: 0,
  todayRevenue: 0,
};

function VendorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const activeRoute = location.pathname === "/vendor-dashboard" || location.pathname === "/vendor" ? "dashboard" : location.pathname.replace("/vendor/", "");
  const [stats, setStats] = useState(fallbackStats);
  const [movies, setMovies] = useState([]);
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState({});
  const [ticketScans, setTicketScans] = useState([]);
  const [theatreOverview, setTheatreOverview] = useState({ theatres: [], screens: [], shows: [] });
  const [showAnalytics, setShowAnalytics] = useState([]);
  const [pricing, setPricing] = useState({});
  const [refunds, setRefunds] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bookingTrend, setBookingTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const enabledServices = useMemo(() => {
    const configured = user.enabledServices || user.vendorServices || user.services;
    if (Array.isArray(configured) && configured.length) {
      return configured.map((item) => String(item).toLowerCase()).filter((item) => serviceModules.includes(item));
    }
    if (String(user.service || "").toLowerCase()) {
      const service = String(user.service).toLowerCase();
      return serviceModules.includes(service) ? [service] : ["movies"];
    }
    return serviceModules;
  }, [flights.length, user]);

  const activeService = serviceModules.includes(activeRoute)
    ? activeRoute
    : activeRoute.startsWith("flight") || ["add-flight", "my-flights"].includes(activeRoute)
      ? "flights"
      : "movies";

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    const vendorId = user._id || user.id;
    const liveStatsUrl = vendorId ? `${apiBase}/dashboard/vendor/${vendorId}/stats` : `${apiBase}/vendor/dashboard-stats`;
    const [statsRes, bookingTrendRes, revenueTrendRes, moviesRes, flightsRes, bookingsRes, customersRes, availabilityRes, settlementsRes, paymentRes, userNotificationsRes] = await Promise.allSettled([
      axios.get(liveStatsUrl, auth()),
      vendorId ? axios.get(`${apiBase}/dashboard/vendor/${vendorId}/booking-trend`, auth()) : Promise.resolve({ data: [] }),
      vendorId ? axios.get(`${apiBase}/dashboard/vendor/${vendorId}/revenue-trend`, auth()) : Promise.resolve({ data: [] }),
      axios.get(`${apiBase}/vendor/movies`, auth()),
      axios.get(`${apiBase}/vendor/flights`, auth()),
      axios.get(`${apiBase}/vendor/bookings`, auth()),
      axios.get(`${apiBase}/vendor/customers`, auth()),
      axios.get(`${apiBase}/vendor/availability`, auth()),
      axios.get(`${apiBase}/vendor/settlements`, auth()),
      axios.get(`${apiBase}/vendor/payment-details`, auth()),
      vendorId ? axios.get(`${apiBase}/notifications/${vendorId}`, auth()) : Promise.resolve({ data: [] }),
    ]);

    if (statsRes.status === "fulfilled") setStats({ ...fallbackStats, ...(statsRes.value.data || {}) });
    if (bookingTrendRes.status === "fulfilled") setBookingTrend(Array.isArray(bookingTrendRes.value.data) ? bookingTrendRes.value.data : []);
    if (revenueTrendRes.status === "fulfilled") setRevenueTrend(Array.isArray(revenueTrendRes.value.data) ? revenueTrendRes.value.data : []);
    if (moviesRes.status === "fulfilled") setMovies(Array.isArray(moviesRes.value.data) ? moviesRes.value.data : []);
    if (flightsRes.status === "fulfilled") setFlights(Array.isArray(flightsRes.value.data) ? flightsRes.value.data : []);
    if (bookingsRes.status === "fulfilled") setBookings(Array.isArray(bookingsRes.value.data) ? bookingsRes.value.data : []);
    if (customersRes.status === "fulfilled") setCustomers(Array.isArray(customersRes.value.data) ? customersRes.value.data : []);
    if (availabilityRes.status === "fulfilled") setAvailability(Array.isArray(availabilityRes.value.data) ? availabilityRes.value.data : []);
    if (settlementsRes.status === "fulfilled") setSettlements(Array.isArray(settlementsRes.value.data) ? settlementsRes.value.data : []);
    if (paymentRes.status === "fulfilled") setPaymentDetails(paymentRes.value.data || {});
    if (userNotificationsRes.status === "fulfilled") setNotifications(Array.isArray(userNotificationsRes.value.data) ? userNotificationsRes.value.data : []);

    if ([statsRes, bookingTrendRes, revenueTrendRes, moviesRes, flightsRes, bookingsRes, customersRes, availabilityRes, settlementsRes, paymentRes].some((item) => item.status === "rejected")) {
      setError("Some live vendor data is unavailable. Please refresh after checking the backend connection.");
    }

    const [scansRes, theatreRes, analyticsRes, pricingRes, refundsRes, payoutsRes, staffRes, notificationsRes, customerListRes] = await Promise.allSettled([
      axios.get(`${apiBase}/vendor/ticket-scans`, auth()),
      axios.get(`${apiBase}/vendor/theatre-overview`, auth()),
      axios.get(`${apiBase}/vendor/show-analytics`, auth()),
      axios.get(`${apiBase}/vendor/pricing`, auth()),
      axios.get(`${apiBase}/vendor/refunds`, auth()),
      axios.get(`${apiBase}/vendor/payouts`, auth()),
      axios.get(`${apiBase}/vendor/staff`, auth()),
      axios.get(`${apiBase}/vendor/notifications`, auth()),
      axios.get(`${apiBase}/vendor/customer-list`, auth()),
    ]);

    if (scansRes.status === "fulfilled") setTicketScans(Array.isArray(scansRes.value.data) ? scansRes.value.data : []);
    if (theatreRes.status === "fulfilled") setTheatreOverview(theatreRes.value.data || { theatres: [], screens: [], shows: [] });
    if (analyticsRes.status === "fulfilled") setShowAnalytics(Array.isArray(analyticsRes.value.data) ? analyticsRes.value.data : []);
    if (pricingRes.status === "fulfilled") setPricing(pricingRes.value.data || {});
    if (refundsRes.status === "fulfilled") setRefunds(Array.isArray(refundsRes.value.data) ? refundsRes.value.data : []);
    if (payoutsRes.status === "fulfilled") setPayouts(Array.isArray(payoutsRes.value.data) ? payoutsRes.value.data : []);
    if (staffRes.status === "fulfilled") setStaff(Array.isArray(staffRes.value.data) ? staffRes.value.data : []);
    if (notificationsRes.status === "fulfilled" && userNotificationsRes.status !== "fulfilled") setNotifications(Array.isArray(notificationsRes.value.data) ? notificationsRes.value.data : []);
    if (customerListRes.status === "fulfilled") setCustomerList(Array.isArray(customerListRes.value.data) ? customerListRes.value.data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const vendorId = user._id || user.id;
    const socket = io(socketBase, {
      auth: { token: getToken() },
      transports: ["websocket", "polling"],
    });
    if (vendorId) socket.emit("joinVendor", vendorId);
    ["newBooking", "ticketCheckedIn", "refundUpdated", "payoutUpdated", "staffUpdated", "vendorNotification", "movieStatusUpdated", "vendorDashboardUpdated"].forEach((eventName) => {
      socket.on(eventName, loadDashboard);
    });
    return () => socket.disconnect();
  }, []);

  const cardData = [
    ["Total Bookings", stats.totalBookings || bookings.length || 0, Ticket],
    ["Total Revenue", `Rs ${stats.totalRevenue || stats.revenue || 0}`, BarChart3],
    ["Available Seats", stats.availableSeats || 0, Ticket],
    ["Booked Seats", stats.bookedSeats || 0, Ticket],
    ["Blocked Seats", stats.blockedSeats || 0, Ticket],
    ["Today Bookings", stats.todayBookings || 0, CalendarDays],
    ["Today Revenue", `Rs ${stats.todayRevenue || 0}`, BarChart3],
  ];

  const markNotificationRead = async (notification) => {
    if (notification.isRead || notification.read) return;
    await axios.patch(`${apiBase}/notifications/${notification.id || notification._id}/read`, {}, auth());
    setNotifications((current) => current.map((item) => (String(item.id || item._id) === String(notification.id || notification._id) ? { ...item, isRead: true, read: true } : item)));
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const renderPage = () => {
    if (activeRoute === "movies") return <MovieDashboard stats={stats} movies={movies} navigate={navigate} />;
    if (activeRoute === "my-movies") return <MoviesPage movies={movies} reload={loadDashboard} navigate={navigate} />;
    if (activeRoute === "seat-management") return <SeatManagementPage movies={movies} shows={theatreOverview.shows || []} />;
    if (activeRoute === "qr-scanner") return <QrScannerPage scans={ticketScans} reload={loadDashboard} />;
    if (activeRoute === "theatres") return <TheatreScreenPage overview={theatreOverview} reload={loadDashboard} movies={movies} />;
    if (activeRoute === "analytics") return <ShowAnalyticsPage rows={showAnalytics} />;
    if (activeRoute === "pricing") return <PricingPage pricing={pricing} shows={theatreOverview.shows || []} reload={loadDashboard} />;
    if (activeRoute === "refunds") return <RefundsPage refunds={refunds} reload={loadDashboard} />;
    if (activeRoute === "payouts") return <PayoutHistoryPage payouts={payouts} />;
    if (activeRoute === "staff") return <StaffPage staff={staff} reload={loadDashboard} />;
    if (activeRoute === "notification-center") return <NotificationCenterPage notifications={notifications} reload={loadDashboard} />;
    if (activeRoute === "movie-status") return <MovieStatusPage movies={movies} reload={loadDashboard} />;
    if (["flights", "add-flight", "my-flights", "flight-seat-management", "flight-bookings", "passengers", "flight-revenue", "flight-reports"].includes(activeRoute) || activeRoute.startsWith("edit-flight")) return <FlightModule page={activeRoute === "flights" ? "dashboard" : activeRoute} navigate={navigate} />;
    if (["hotels", "events", "bus", "travel"].includes(activeRoute)) return <FutureService service={activeRoute} />;
    if (activeRoute === "bookings") return <BookingsPage bookings={bookings} />;
    if (activeRoute === "customers") return <CustomersPage customers={customers} customerList={customerList} />;
    if (activeRoute === "revenue" || activeRoute === "transactions") return <RevenuePage stats={stats} />;
    if (activeRoute === "settlements") return <SettlementsPage settlements={settlements} stats={stats} />;
    if (activeRoute === "payment-details" || activeRoute === "settings") return <PaymentDetailsPage details={paymentDetails} reload={loadDashboard} />;
    if (activeRoute === "profile") return <ProfilePage user={user} />;
    if (activeRoute === "support") return <SupportPage />;
    if (activeRoute === "availability") return <AvailabilityPage rows={availability} movies={movies} />;
    return <DashboardHome cardData={cardData} stats={stats} bookings={bookings} bookingTrend={bookingTrend} revenueTrend={revenueTrend} notifications={notifications} markNotificationRead={markNotificationRead} navigate={navigate} />;
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
            <button className="vendor-language" type="button"><Globe2 size={18} />English<ChevronDown size={16} /></button>
            <div className="vendor-notification-wrap">
              <button className="vendor-icon-btn" type="button" aria-label="Notifications" onClick={() => setShowNotifications((value) => !value)}>
                <Bell size={19} />
                {notifications.some((item) => !(item.isRead || item.read)) && <span>{notifications.filter((item) => !(item.isRead || item.read)).length}</span>}
              </button>
              {showNotifications && (
                <div className="vendor-notification-menu">
                  {notifications.length ? notifications.slice(0, 6).map((item) => (
                    <button key={item.id || item._id} type="button" className={item.isRead || item.read ? "" : "unread"} onClick={() => markNotificationRead(item)}>
                      <strong>{item.title}</strong>
                      <small>{item.message}</small>
                    </button>
                  )) : <p>No notifications yet.</p>}
                </div>
              )}
            </div>
            <button className="vendor-profile" type="button">
              <span className="vendor-avatar">TV</span>
              <span><strong>TixHub Vendor</strong><small>Owner</small></span>
              <ChevronDown size={16} />
            </button>
          </div>
        </header>

        <ServiceSwitcher enabledServices={enabledServices} activeService={activeService} navigate={navigate} />
        {loading && <div className="vendor-alert">Loading vendor data...</div>}
        {error && <div className="vendor-alert warning">{error}</div>}
        {renderPage()}
      </main>
    </div>
  );
}

function ServiceSwitcher({ enabledServices, activeService, navigate }) {
  return (
    <div className="service-switcher">
      {enabledServices.map((service) => (
        <button key={service} type="button" className={activeService === service ? "active" : ""} onClick={() => navigate(serviceMeta[service].route)}>
          <span>{serviceMeta[service].icon}</span>
          {serviceMeta[service].label}
        </button>
      ))}
    </div>
  );
}

function DashboardHome({ cardData, stats, bookings, bookingTrend, revenueTrend, notifications, markNotificationRead, navigate }) {
  const recentNotifications = notifications.slice(0, 5);
  return (
    <>
      <section className="vendor-card-grid">
        {cardData.map(([label, value, Icon]) => (
          <article className="vendor-kpi-card" key={label}>
            <div><p>{label}</p><h2>{value}</h2><span>Updated live</span></div>
            <div className="flight-kpi-icon"><Icon size={22} /></div>
          </article>
        ))}
      </section>

      <section className="vendor-dashboard-grid">
        <article className="vendor-panel sales-panel"><PanelTitle title="Booking Trend" right="Live" /><LineChart values={bookingTrend} /></article>
        <article className="vendor-panel revenue-panel"><PanelTitle title="Revenue Trend" right="Live" /><h3>Rs {stats.totalRevenue || stats.revenue || 0}</h3><BarChart values={revenueTrend} /></article>
        <article className="vendor-panel"><PanelTitle title="Notifications" right="Latest" /><NotificationList rows={recentNotifications} onRead={markNotificationRead} /></article>
        <article className="vendor-panel"><PanelTitle title="Quick Actions" right="Vendor" /><div className="quick-action-grid"><button onClick={() => navigate("/vendor/add-movie")}>Add Movie</button><button onClick={() => navigate("/vendor/bookings")}>View Bookings</button><button onClick={() => navigate("/vendor/seat-management")}>Manage Seats</button><button onClick={() => navigate("/vendor/movies")}>Manage Movies</button></div></article>
      </section>

      <section className="vendor-operations-grid">
        <BookingsTable title="Recent Bookings" bookings={bookings.slice(0, 6)} compact />
      </section>
    </>
  );
}

function MovieDashboard({ stats, movies, navigate }) {
  const movieRevenue = movies.reduce((sum, movie) => sum + Number(movie.revenue || 0), 0) || stats.revenue || 0;
  const cards = [["Total Movies", movies.length], ["Total Shows", movies.reduce((sum, movie) => sum + (movie.showTimes?.length || (movie.showTime ? 1 : 0)), 0)], ["Total Bookings", stats.totalBookings || 0], ["Movie Revenue", `Rs ${movieRevenue}`]];
  return (
    <>
      <section className="vendor-card-grid">{cards.map(([label, value]) => <article className="vendor-kpi-card" key={label}><div><p>{label}</p><h2>{value}</h2><span>Movie module</span></div></article>)}</section>
      <section className="vendor-operations-grid">
        <article className="vendor-panel quick-actions-panel"><PanelTitle title="Movie Quick Actions" /><MovieQuickActions navigate={navigate} /></article>
        <article className="vendor-panel movie-list-panel"><PanelTitle title="My Movies" /><MovieList movies={movies.slice(0, 5).map((movie, index) => ({ id: movie._id || index, title: movie.title, meta: `${movie.genre || "Movie"} · ${movie.language || ""}`, image: movie.image }))} /></article>
      </section>
      <section className="vendor-panel vendor-page-panel movie-production-panel">
        <PanelTitle title="Movie Production Modules" right="Movie" />
        <MovieProductionModules navigate={navigate} />
      </section>
    </>
  );
}

function DashboardMovieQuickActions({ navigate }) {
  return <div className="quick-action-grid"><button onClick={() => navigate("/vendor/add-movie")}>Add Movie</button><button onClick={() => navigate("/vendor/my-movies")}>My Movies</button><button onClick={() => navigate("/vendor/movies")}>Manage Shows</button><button onClick={() => navigate("/vendor/seat-management")}>Seat Management</button></div>;
}

function MovieQuickActions({ navigate }) {
  return <div className="quick-action-grid"><button onClick={() => navigate("/vendor/add-movie")}>Add Movie</button><button onClick={() => navigate("/vendor/my-movies")}>My Movies</button><button onClick={() => navigate("/vendor/theatres")}>Manage Shows</button><button onClick={() => navigate("/vendor/seat-management")}>Seat Management</button></div>;
}

function MovieProductionModules({ navigate }) {
  const modules = [
    ["QR Ticket Scanner", "/vendor/qr-scanner"],
    ["Theatre & Screen Management", "/vendor/theatres"],
    ["Show Analytics", "/vendor/analytics"],
    ["Pricing Management", "/vendor/pricing"],
    ["Refund & Cancellation", "/vendor/refunds"],
    ["Payout History", "/vendor/payouts"],
    ["Staff Management", "/vendor/staff"],
    ["Notification Center", "/vendor/notification-center"],
    ["Customer List", "/vendor/customers"],
    ["Movie Status Control", "/vendor/movie-status"],
  ];

  return <div className="movie-module-grid">{modules.map(([label, path]) => <button key={label} type="button" onClick={() => navigate(path)}><QrCode size={18} /><span>{label}</span></button>)}</div>;
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
          <thead><tr><th>Poster</th><th>Movie Name</th><th>Genre</th><th>Language</th><th>Theatre</th><th>Bookings</th><th>Revenue</th><th>Status</th><th>Actions</th></tr></thead>
<tbody>
  {movies.map((movie) => (
    <tr key={movie._id || movie.title}>
      <td>
        {movie.image ? (
          <img
            className="table-poster"
            src={movie.image}
            alt={movie.title}
          />
        ) : (
          <span className="movie-thumb">
            <Film size={18} />
          </span>
        )}
      </td>

      <td>{movie.title}</td>

      <td>{movie.genre || "-"}</td>

      <td>{movie.language || "-"}</td>

      <td>{movie.theatre || movie.theatreName || "-"}</td>

      <td>{movie.bookedSeats?.length || 0}</td>

      <td>Rs {movie.revenue || 0}</td>

      <td>
        <span className="vendor-status">
          {movie.status || "active"}
        </span>
      </td>

      <td>
        <div className="vendor-row-actions">
          <button type="button">
            View
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/vendor/add-movie", {
                state: { movie },
              })
            }
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => hideMovie(movie)}
          >
            Hide
          </button>

          <button
            type="button"
            onClick={() => deleteMovie(movie)}
          >
            Delete
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/vendor/seat-management", {
                state: {
                  movieId: movie._id,
                },
              })
            }
          >
            Manage Seats
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>        </table>
      </div>
    </section>
  );
}

function SeatManagementPage({ movies, shows = [] }) {
  const location = useLocation();
  const [movieId, setMovieId] = useState(location.state?.movieId || movies[0]?._id || "");
  const movieShows = shows.filter((show) => String(show.movie_id || show.movieId) === String(movieId));
  const [selectedShowId, setSelectedShowId] = useState(location.state?.showId || movieShows[0]?._id || movieShows[0]?.id || "");
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const selectedMovie = movies.find((movie) => movie._id === movieId) || movies[0];
  const selectedShow = movieShows.find((show) => String(show._id || show.id) === String(selectedShowId));
  const showId = selectedShow?._id || selectedShow?.id || getMovieShowId(selectedMovie);
  const seatContext = {
    showId,
    movieId,
    theatre: selectedMovie?.theatre || selectedMovie?.theatreName || "",
    screenId: selectedShow?.screen_id || selectedShow?.screenId || selectedMovie?.screenNumber || "Screen 1",
    showDate: selectedShow?.show_date || selectedShow?.showDate || selectedMovie?.showDate || selectedMovie?.releaseDate || "",
    showTime: selectedShow?.show_time || selectedShow?.showTime || selectedMovie?.showTime || selectedMovie?.showTimes?.[0] || "",
    totalSeats: selectedShow?.total_seats || selectedShow?.totalSeats || selectedMovie?.totalSeats || 0,
    rows: selectedShow?.rows_count || selectedShow?.rows,
    seatsPerRow: selectedShow?.seats_per_row || selectedShow?.seatsPerRow,
    price: selectedShow?.price || selectedMovie?.ticketPrice || 240,
  };

  useEffect(() => {
    const nextShows = shows.filter((show) => String(show.movie_id || show.movieId) === String(movieId));
    setSelectedShowId((current) => current || nextShows[0]?._id || nextShows[0]?.id || "");
  }, [movieId, shows.length]);

  const loadSeats = async () => {
    if (!showId) return;
    try {
      const res = await axios.get(`${apiBase}/seats/${encodeURIComponent(showId)}`, {
        ...auth(),
        params: seatContext,
      });
      setSeats(res.data.seats || []);
      setSelectedSeat(null);
    } catch (error) {
      setSeats([]);
      alert(error.response?.data?.message || "Unable to load live seat data");
    }
  };

  useEffect(() => {
    if (showId) loadSeats();
  }, [showId]);

  useEffect(() => {
    if (!showId) return undefined;
    const socket = io(socketBase, {
      auth: { token: getToken() },
      transports: ["websocket", "polling"],
    });

    socket.emit("joinShow", showId);
    socket.on("seatUpdated", (updatedSeat) => {
      setSeats((current) => current.map((seat) => (
        seat.seatNo === updatedSeat.seatNo || seat.seatNumber === updatedSeat.seatNumber ? { ...seat, ...updatedSeat } : seat
      )));
      setSelectedSeat((current) => (
        current && (current.seatNo === updatedSeat.seatNo || current.seatNumber === updatedSeat.seatNumber) ? { ...current, ...updatedSeat } : current
      ));
    });

    return () => socket.disconnect();
  }, [showId]);

  const runSeatAction = async (action, seat = selectedSeat) => {
    if (!showId || !seat) return;
    try {
      if (action === "block") {
        const blockedReason = window.prompt("Blocked reason", seat.blockedReason || "Blocked by vendor") || "Blocked by vendor";
        await axios.patch(`${apiBase}/seats/block`, { ...seatContext, seatNo: seat.seatNo || seat.seatNumber, blockedReason }, auth());
      }
      if (action === "unblock") await axios.patch(`${apiBase}/seats/unblock`, { ...seatContext, seatNo: seat.seatNo || seat.seatNumber }, auth());
    } catch (error) {
      alert(error.response?.data?.message || "Unable to update seat");
    }
  };

  return (
    <section className="vendor-operations-grid seat-management-page">
      <article className="vendor-panel seat-panel">
        <PanelTitle title="Movie Seat Management" right="Movie" />
        <div className="vendor-filter-grid">
          <label><span>Movie</span><select value={movieId} onChange={(event) => { setMovieId(event.target.value); setSelectedShowId(""); }}>{movies.map((movie) => <option key={movie._id || movie.title} value={movie._id}>{movie.title}</option>)}</select></label>
          <label><span>Show</span><select value={selectedShowId} onChange={(event) => setSelectedShowId(event.target.value)}>{movieShows.map((show) => <option key={show._id || show.id} value={show._id || show.id}>{show.show_date || show.showDate} {show.show_time || show.showTime}</option>)}</select></label>
          <label><span>Theatre</span><input value={selectedMovie?.theatre || selectedMovie?.theatreName || ""} readOnly /></label>
          <label><span>Screen</span><input value={selectedShow?.screen_name || selectedShow?.screenName || selectedShow?.screen_id || selectedShow?.screenId || selectedMovie?.screenNumber || "Screen 1"} readOnly /></label>
        </div>
        <SeatLegend />
        <div className="vendor-seat-grid">{seats.map((seat) => <button className={`vendor-seat ${seat.status} ${selectedSeat?.seatNumber === seat.seatNumber ? "selected" : ""}`} key={seat.seatNumber || seat.seatNo} type="button" onClick={() => setSelectedSeat(seat)}>{seat.seatNumber || seat.seatNo}</button>)}</div>
      </article>
      <SeatDetails seat={selectedSeat} onBlock={() => runSeatAction("block")} onUnblock={() => runSeatAction("unblock")} />
    </section>
  );
}

function SeatDetails({ seat, onBlock, onUnblock }) {
  return (
    <article className="vendor-panel seat-details-panel">
      <PanelTitle title="Seat Details" right="Live" />
      {!seat ? <p>Select a seat to view details.</p> : <div className="seat-detail-list">{[["Seat Number", seat.seatNumber || seat.seatNo], ["Status", seat.status], ["Customer Name", seat.customerName], ["Booking ID", seat.bookingId], ["Mobile", seat.customerMobile || seat.mobile], ["Email", seat.customerEmail || seat.email], ["Amount", seat.amount ? `Rs ${seat.amount}` : ""], ["Payment Status", seat.paymentStatus], ["Booking Status", seat.bookingStatus], ["Blocked By", seat.blockedBy], ["Blocked Reason", seat.blockedReason], ["Updated At", seat.updatedAt ? new Date(seat.updatedAt).toLocaleString() : ""]].map(([label, value]) => <p key={label}><strong>{label}</strong><span>{value || "-"}</span></p>)}<div className="vendor-row-actions"><button type="button" onClick={onBlock} disabled={seat.status !== "available"}>Block Seat</button><button type="button" onClick={onUnblock} disabled={seat.status !== "blocked"}>Unblock Seat</button><button type="button" disabled={seat.status !== "booked"}>View Customer</button></div></div>}
    </article>
  );
}

function QrScannerPage({ scans, reload }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const [ticketCode, setTicketCode] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [cameraState, setCameraState] = useState("");

  const submitScan = async (code = ticketCode) => {
    if (!String(code || "").trim()) return;
    try {
      const res = await axios.post(`${apiBase}/bookings/verify-qr`, { qr: code, ticketCode: code }, auth());
      setScanResult(res.data);
      setTicketCode("");
      reload();
    } catch (error) {
      setScanResult(error.response?.data || { status: "invalid", message: "Ticket scan failed" });
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraState("Scanning...");
      const detector = "BarcodeDetector" in window ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        let rawValue = "";
        if (detector) {
          const codes = await detector.detect(videoRef.current).catch(() => []);
          rawValue = codes[0]?.rawValue || "";
        } else if (context && videoRef.current.readyState >= 2) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          rawValue = jsQR(imageData.data, imageData.width, imageData.height)?.data || "";
        }
        if (rawValue) {
          stopCamera();
          submitScan(rawValue);
          return;
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (error) {
      setCameraState("Camera permission was blocked or unavailable.");
    }
  };

  const stopCamera = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraState("");
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <section className="vendor-operations-grid scanner-page">
      <article className="vendor-panel">
        <PanelTitle title="QR Ticket Scanner" right="Live" />
        <div className="scanner-box">
          <video ref={videoRef} muted playsInline />
          <div className="scanner-frame"><QrCode size={42} /></div>
        </div>
        <div className="seat-toolbar">
          <button type="button" onClick={startCamera}>Start Camera</button>
          <button type="button" onClick={stopCamera}>Stop</button>
          <input value={ticketCode} onChange={(event) => setTicketCode(event.target.value)} placeholder="Paste QR or booking code" />
          <button type="button" onClick={() => submitScan()}>Check In</button>
        </div>
        {cameraState && <div className="vendor-alert">{cameraState}</div>}
        {scanResult && <div className={`scan-result ${scanResult.status}`}><ShieldCheck size={22} /><strong>{scanResult.status?.replace("_", " ") || "Result"}</strong><span>{scanResult.message}</span></div>}
      </article>
      <DataTable title="Recent Ticket Scans" columns={["Booking", "Customer", "Movie", "Seat", "Status", "Checked In"]} rows={scans.map((scan) => [scan.bookingCode, scan.customerName, scan.movieTitle, scan.seatNumber, scan.status, scan.checkedInAt ? new Date(scan.checkedInAt).toLocaleString() : "-"])} />
    </section>
  );
}

function TheatreScreenPage({ overview, reload, movies }) {
  const theatres = overview.theatres || [];
  const screens = overview.screens || [];
  const shows = overview.shows || [];
  const [theatreForm, setTheatreForm] = useState({ name: "", city: "", address: "", status: "active" });
  const defaultScreenForm = {
    theatreId: "",
    movieId: "",
    name: "Screen 1",
    vipRowsStart: "AG",
    vipRowsEnd: "AJ",
    vipSeatsPerRow: 8,
    vipPrice: 50,
    premiumRowsStart: "AA",
    premiumRowsEnd: "AF",
    premiumSeatsPerRow: 10,
    premiumPrice: 150,
    regularRowsStart: "A",
    regularRowsEnd: "Z",
    regularSeatsPerRow: 20,
    regularPrice: 250,
    todayVisibleRowStart: "A",
    todayVisibleRowEnd: "Z",
    status: "active",
  };
  const [screenForm, setScreenForm] = useState(defaultScreenForm);
  const [selectedScreenId, setSelectedScreenId] = useState("");
  const [showForm, setShowForm] = useState({ theatreId: "", screenId: "", movieId: "", showDate: "", showTime: "", price: 250, status: "active" });

  useEffect(() => {
    setScreenForm((current) => ({ ...current, theatreId: current.theatreId || theatres[0]?._id || "", movieId: current.movieId || movies[0]?._id || "" }));
    setSelectedScreenId((current) => current || screens[0]?._id || "");
    setShowForm((current) => ({ ...current, theatreId: current.theatreId || theatres[0]?._id || "", screenId: current.screenId || screens[0]?._id || "", movieId: current.movieId || movies[0]?._id || "" }));
  }, [theatres.length, screens.length, movies.length]);

  const rowIndex = (label) => String(label || "").toUpperCase().split("").reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
  const generatedRows = (start, end) => {
    const from = rowIndex(start);
    const to = rowIndex(end);
    return from >= 0 && to >= from ? to - from + 1 : 0;
  };
  const generatedSeats = (start, end, seatsPerRow) => generatedRows(start, end) * Number(seatsPerRow || 0);
  const generatedTotal =
    generatedSeats(screenForm.vipRowsStart, screenForm.vipRowsEnd, screenForm.vipSeatsPerRow) +
    generatedSeats(screenForm.premiumRowsStart, screenForm.premiumRowsEnd, screenForm.premiumSeatsPerRow) +
    generatedSeats(screenForm.regularRowsStart, screenForm.regularRowsEnd, screenForm.regularSeatsPerRow);
  const regularGenerated = generatedSeats(screenForm.regularRowsStart, screenForm.regularRowsEnd, screenForm.regularSeatsPerRow);
  const primeGenerated = generatedSeats(screenForm.premiumRowsStart, screenForm.premiumRowsEnd, screenForm.premiumSeatsPerRow);
  const vipGenerated = generatedSeats(screenForm.vipRowsStart, screenForm.vipRowsEnd, screenForm.vipSeatsPerRow);
  const rangesOverlap = () => {
    const ranges = [
      [screenForm.vipRowsStart, screenForm.vipRowsEnd],
      [screenForm.premiumRowsStart, screenForm.premiumRowsEnd],
      [screenForm.regularRowsStart, screenForm.regularRowsEnd],
    ].map(([start, end]) => [rowIndex(start), rowIndex(end)]);
    const rows = new Set();
    return ranges.some(([start, end]) => {
      if (start < 0 || end < start) return true;
      for (let row = start; row <= end; row += 1) {
        if (rows.has(row)) return true;
        rows.add(row);
      }
      return false;
    });
  };

  const submit = async (event, endpoint, body, reset) => {
    event.preventDefault();
    if (endpoint === "screens") {
      if (Number(body.vipSeatsPerRow || 0) <= 0 || Number(body.premiumSeatsPerRow || 0) <= 0 || Number(body.regularSeatsPerRow || 0) <= 0 || rangesOverlap()) {
        alert("Seat count mismatch. Generated seats do not match total seats.");
        return;
      }
      body = { ...body, totalSeats: generatedTotal, regularSeatCount: regularGenerated, primeSeatCount: primeGenerated, vipSeatCount: vipGenerated };
    }
    try {
      await axios.post(`${apiBase}/vendor/${endpoint}`, body, auth());
      reset();
      reload();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save");
    }
  };

  const screenTotalMismatch = rangesOverlap();
  const previewSeats = [
    ["VIP", vipGenerated],
    ["Prime", primeGenerated],
    ["Regular", regularGenerated],
  ];
  const layoutPreview = previewSeats.flatMap(([label, count]) =>
    Array.from({ length: count }).map((__, index) => `${label[0]}${index + 1}`)
  );

  return (
    <>
      <section className="vendor-card-grid">
        <MiniCount label="Theatres" value={theatres.length} />
        <MiniCount label="Screens" value={screens.length} />
        <MiniCount label="Shows" value={shows.length} />
        <MiniCount label="Active Screens" value={screens.filter((screen) => screen.status !== "inactive").length} />
      </section>
      <section className="vendor-dashboard-grid">
        <article className="vendor-panel">
          <PanelTitle title="Add Theatre" right="Theatre" />
          <form className="vendor-settings-form compact-form" onSubmit={(event) => submit(event, "theatres", theatreForm, () => setTheatreForm({ name: "", city: "", address: "", status: "active" }))}>
            <Field label="Theatre name" value={theatreForm.name} onChange={(value) => setTheatreForm({ ...theatreForm, name: value })} />
            <Field label="City" value={theatreForm.city} onChange={(value) => setTheatreForm({ ...theatreForm, city: value })} />
            <Field label="Address" value={theatreForm.address} onChange={(value) => setTheatreForm({ ...theatreForm, address: value })} />
            <SelectField label="Status" value={theatreForm.status} options={["active", "inactive"]} onChange={(value) => setTheatreForm({ ...theatreForm, status: value })} />
            <button type="submit">Add Theatre</button>
          </form>
        </article>
        <article className="vendor-panel">
          <PanelTitle title="Add Screen" right="Layout" />
          <form className="vendor-settings-form compact-form" onSubmit={(event) => submit(event, "screens", screenForm, () => setScreenForm({ ...defaultScreenForm, theatreId: theatres[0]?._id || "" }))}>
            <SelectField label="Theatre" value={screenForm.theatreId} options={theatres.map((item) => ({ value: item._id, label: item.name }))} onChange={(value) => setScreenForm({ ...screenForm, theatreId: value })} />
            <SelectField label="Movie" value={screenForm.movieId} options={movies.map((item) => ({ value: item._id, label: item.title }))} onChange={(value) => setScreenForm({ ...screenForm, movieId: value })} />
            <SelectField label="Select screen" value={selectedScreenId} options={screens.map((item) => ({ value: item._id, label: item.name || item.screen_name || item._id }))} onChange={setSelectedScreenId} />
            <Field label="Screen name" value={screenForm.name} onChange={(value) => setScreenForm({ ...screenForm, name: value })} />
            <Field label="VIP rows start" value={screenForm.vipRowsStart} onChange={(value) => setScreenForm({ ...screenForm, vipRowsStart: value })} />
            <Field label="VIP rows end" value={screenForm.vipRowsEnd} onChange={(value) => setScreenForm({ ...screenForm, vipRowsEnd: value })} />
            <Field label="VIP seats per row" type="number" value={screenForm.vipSeatsPerRow} onChange={(value) => setScreenForm({ ...screenForm, vipSeatsPerRow: value })} />
            <Field label="VIP price" type="number" value={screenForm.vipPrice} onChange={(value) => setScreenForm({ ...screenForm, vipPrice: value })} />
            <Field label="Premium rows start" value={screenForm.premiumRowsStart} onChange={(value) => setScreenForm({ ...screenForm, premiumRowsStart: value })} />
            <Field label="Premium rows end" value={screenForm.premiumRowsEnd} onChange={(value) => setScreenForm({ ...screenForm, premiumRowsEnd: value })} />
            <Field label="Premium seats per row" type="number" value={screenForm.premiumSeatsPerRow} onChange={(value) => setScreenForm({ ...screenForm, premiumSeatsPerRow: value })} />
            <Field label="Premium price" type="number" value={screenForm.premiumPrice} onChange={(value) => setScreenForm({ ...screenForm, premiumPrice: value })} />
            <Field label="Regular rows start" value={screenForm.regularRowsStart} onChange={(value) => setScreenForm({ ...screenForm, regularRowsStart: value })} />
            <Field label="Regular rows end" value={screenForm.regularRowsEnd} onChange={(value) => setScreenForm({ ...screenForm, regularRowsEnd: value })} />
            <Field label="Regular seats per row" type="number" value={screenForm.regularSeatsPerRow} onChange={(value) => setScreenForm({ ...screenForm, regularSeatsPerRow: value })} />
            <Field label="Regular price" type="number" value={screenForm.regularPrice} onChange={(value) => setScreenForm({ ...screenForm, regularPrice: value })} />
            <Field label="Today visible row start" value={screenForm.todayVisibleRowStart} onChange={(value) => setScreenForm({ ...screenForm, todayVisibleRowStart: value })} />
            <Field label="Today visible row end" value={screenForm.todayVisibleRowEnd} onChange={(value) => setScreenForm({ ...screenForm, todayVisibleRowEnd: value })} />
            <SelectField label="Status" value={screenForm.status} options={["active", "inactive"]} onChange={(value) => setScreenForm({ ...screenForm, status: value })} />
            <div className="vendor-alert">
              <strong>Seat Summary</strong><br />
              Regular: {regularGenerated}<br />
              Prime: {primeGenerated}<br />
              VIP: {vipGenerated}<br />
              Total: {generatedTotal}
            </div>
            {screenTotalMismatch && <div className="vendor-alert">Row ranges should not overlap.</div>}
            <button type="submit">Add New Screen</button>
          </form>
          <div className="mini-seat-layout">{layoutPreview.slice(0, 96).map((seat) => <span key={seat}>{seat}</span>)}</div>
        </article>
      </section>
      <section className="vendor-panel vendor-page-panel">
        <PanelTitle title="Manage Shows" right="Shows" />
        <form className="vendor-settings-form compact-form" onSubmit={(event) => submit(event, "shows", showForm, () => setShowForm({ theatreId: theatres[0]?._id || "", screenId: screens[0]?._id || "", movieId: movies[0]?._id || "", showDate: "", showTime: "", price: 250, status: "active" }))}>
          <SelectField label="Movie" value={showForm.movieId} options={movies.map((item) => ({ value: item._id, label: item.title }))} onChange={(value) => setShowForm({ ...showForm, movieId: value })} />
          <SelectField label="Theatre" value={showForm.theatreId} options={theatres.map((item) => ({ value: item._id, label: item.name }))} onChange={(value) => setShowForm({ ...showForm, theatreId: value })} />
          <SelectField label="Screen" value={showForm.screenId} options={screens.map((item) => ({ value: item._id, label: item.name }))} onChange={(value) => setShowForm({ ...showForm, screenId: value })} />
          <Field label="Show date" type="date" value={showForm.showDate} onChange={(value) => setShowForm({ ...showForm, showDate: value })} />
          <Field label="Show time" type="time" value={showForm.showTime} onChange={(value) => setShowForm({ ...showForm, showTime: value })} />
          <Field label="Price" type="number" value={showForm.price} onChange={(value) => setShowForm({ ...showForm, price: value })} />
          <button type="submit">Add Show</button>
        </form>
        <DataTable title="Shows" columns={["Movie", "Theatre", "Screen", "Date", "Time", "Price", "Status"]} rows={shows.map((show) => [show.movieId?.title || show.movieTitle || show.movieId, show.theatreId?.name || show.theatreId, show.screenId?.name || show.screenId, show.showDate, show.showTime, `Rs ${show.price || 0}`, show.status])} />
      </section>
    </>
  );
}

function ShowAnalyticsPage({ rows }) {
  return <DataTable title="Show Analytics" columns={["Movie", "Theatre", "Show Time", "Total Seats", "Booked", "Available", "Occupancy", "Revenue"]} rows={rows.map((row) => [row.movieTitle, row.theatre, row.showTime, row.totalSeats, row.bookedSeats, row.availableSeats, `${row.occupancyPercentage}%`, `Rs ${row.revenuePerShow || row.revenue || 0}`])} />;
}

function PricingPage({ pricing, shows, reload }) {
  const [form, setForm] = useState(pricing || {});
  const [showPrice, setShowPrice] = useState({ showId: "", price: "" });
  useEffect(() => setForm(pricing || {}), [pricing]);
  useEffect(() => setShowPrice((current) => ({ ...current, showId: current.showId || shows[0]?._id || "" })), [shows.length]);

  const save = async (event) => {
    event.preventDefault();
    await axios.put(`${apiBase}/vendor/pricing`, form, auth());
    reload();
  };

  const saveShowPrice = async (event) => {
    event.preventDefault();
    if (!showPrice.showId) return;
    await axios.patch(`${apiBase}/vendor/shows/${showPrice.showId}/price`, { price: showPrice.price }, auth());
    reload();
  };

  return (
    <section className="vendor-dashboard-grid">
      <article className="vendor-panel">
        <PanelTitle title="Pricing Management" right="Base" />
        <form className="vendor-settings-form" onSubmit={save}>
          {["morningPrice", "afternoonPrice", "eveningPrice", "weekendPrice", "premiumSeatPrice"].map((field) => <Field key={field} label={labelize(field)} type="number" value={form[field] || ""} onChange={(value) => setForm({ ...form, [field]: value })} />)}
          <button type="submit">Save Prices</button>
        </form>
      </article>
      <article className="vendor-panel">
        <PanelTitle title="Update Price By Show" right="Show" />
        <form className="vendor-settings-form compact-form" onSubmit={saveShowPrice}>
          <SelectField label="Show" value={showPrice.showId} options={shows.map((show) => ({ value: show._id, label: `${show.movieId?.title || show.movieId || "Show"} - ${show.showDate || ""} ${show.showTime || ""}` }))} onChange={(value) => setShowPrice({ ...showPrice, showId: value })} />
          <Field label="Show price" type="number" value={showPrice.price} onChange={(value) => setShowPrice({ ...showPrice, price: value })} />
          <button type="submit">Update Show Price</button>
        </form>
      </article>
    </section>
  );
}

function RefundsPage({ refunds, reload }) {
  const update = async (refund, status) => {
    try {
      await axios.patch(`${apiBase}/vendor/refunds/${refund._id || refund.bookingId}`, { refundStatus: status }, auth());
      reload();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to update refund");
    }
  };
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title="Refund & Cancellation Management" right="Refunds" /><div className="vendor-table-shell"><table className="vendor-table"><thead><tr><th>Booking</th><th>Customer</th><th>Movie</th><th>Amount</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>{refunds.length ? refunds.map((refund) => <tr key={refund._id}><td>{refund.bookingCode || refund.bookingId}</td><td>{refund.customerName}</td><td>{refund.movieTitle}</td><td>Rs {refund.amount || 0}</td><td>{refund.reason}</td><td><span className="vendor-status">{refund.refundStatus}</span></td><td><div className="vendor-row-actions"><button onClick={() => update(refund, "approved")}>Approve</button><button onClick={() => update(refund, "rejected")}>Reject</button><button onClick={() => update(refund, "paid")}>Paid</button></div></td></tr>) : <tr><td colSpan="7">No cancellation requests.</td></tr>}</tbody></table></div></section>;
}

function PayoutHistoryPage({ payouts }) {
  return <DataTable title="Payout History" columns={["Settlement ID", "Total Revenue", "Platform Commission", "Vendor Payable", "Status", "Settlement Date"]} rows={payouts.map((item) => [item.settlementId || item._id, `Rs ${item.totalRevenue || item.grossRevenue || 0}`, `Rs ${item.platformCommission || item.commission || 0}`, `Rs ${item.vendorPayableAmount || item.netPayable || item.amount || 0}`, item.settlementStatus || item.status, item.settlementDate || item.date ? new Date(item.settlementDate || item.date).toLocaleDateString() : "-"])} />;
}

function StaffPage({ staff, reload }) {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", role: "Ticket Checker", loginPermission: false, status: "active" });
  const save = async (event) => {
    event.preventDefault();
    await axios.post(`${apiBase}/vendor/staff`, form, auth());
    setForm({ name: "", mobile: "", email: "", role: "Ticket Checker", loginPermission: false, status: "active" });
    reload();
  };
  const toggle = async (person, patch) => {
    await axios.patch(`${apiBase}/vendor/staff/${person._id}`, patch, auth());
    reload();
  };
  return (
    <section className="vendor-dashboard-grid">
      <article className="vendor-panel">
        <PanelTitle title="Add Staff" right="Team" />
        <form className="vendor-settings-form compact-form" onSubmit={save}>
          <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Field label="Mobile" value={form.mobile} onChange={(value) => setForm({ ...form, mobile: value })} />
          <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <SelectField label="Role" value={form.role} options={["Manager", "Ticket Checker", "Cashier"]} onChange={(value) => setForm({ ...form, role: value })} />
          <label className="toggle-row"><input type="checkbox" checked={form.loginPermission} onChange={(event) => setForm({ ...form, loginPermission: event.target.checked })} /> Staff login permission</label>
          <button type="submit">Add Staff</button>
        </form>
      </article>
      <section className="vendor-panel vendor-page-panel">
        <PanelTitle title="Staff Management" right="Access" />
        <div className="staff-list">{staff.map((person) => <div className="staff-card" key={person._id}><UserCheck size={24} /><div><strong>{person.name}</strong><span>{person.role} · {person.mobile || person.email || "-"}</span></div><div className="vendor-row-actions"><button onClick={() => toggle(person, { status: person.status === "active" ? "inactive" : "active" })}>{person.status === "active" ? "Deactivate" : "Activate"}</button><button onClick={() => toggle(person, { loginPermission: !person.loginPermission })}>{person.loginPermission ? "Disable Login" : "Enable Login"}</button></div></div>)}</div>
      </section>
    </section>
  );
}

function NotificationCenterPage({ notifications, reload }) {
  const [form, setForm] = useState({ type: "new_booking", title: "", message: "" });
  const save = async (event) => {
    event.preventDefault();
    await axios.post(`${apiBase}/vendor/notifications`, form, auth());
    setForm({ type: "new_booking", title: "", message: "" });
    reload();
  };
  return (
    <section className="vendor-dashboard-grid">
      <article className="vendor-panel">
        <PanelTitle title="Notification Center" right="Alerts" />
        <div className="notification-list">{notifications.map((item) => <div className="notification-row" key={item._id}><Bell size={18} /><div><strong>{item.title}</strong><span>{item.message}</span></div><small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small></div>)}</div>
      </article>
      <article className="vendor-panel">
        <PanelTitle title="Create Alert" right="Vendor" />
        <form className="vendor-settings-form compact-form" onSubmit={save}>
          <SelectField label="Alert type" value={form.type} options={["new_booking", "low_seat", "show_cancelled", "settlement_paid", "refund_request"]} onChange={(value) => setForm({ ...form, type: value })} />
          <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <Field label="Message" value={form.message} onChange={(value) => setForm({ ...form, message: value })} />
          <button type="submit">Send Alert</button>
        </form>
      </article>
    </section>
  );
}

function MovieStatusPage({ movies, reload }) {
  const statuses = ["upcoming", "now_showing", "house_full", "ended", "cancelled", "hidden"];
  const update = async (movie, status) => {
    await axios.patch(`${apiBase}/vendor/movies/${movie._id}/status`, { status }, auth());
    reload();
  };
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title="Movie Status Control" right="Visibility" /><div className="vendor-table-shell"><table className="vendor-table"><thead><tr><th>Movie</th><th>Theatre</th><th>Current Status</th><th>Change Status</th></tr></thead><tbody>{movies.map((movie) => <tr key={movie._id}><td>{movie.title}</td><td>{movie.theatre || movie.theatreName || "-"}</td><td><span className="vendor-status">{movie.status || "active"}</span></td><td><div className="status-button-grid">{statuses.map((status) => <button key={status} type="button" className={movie.status === status ? "active" : ""} onClick={() => update(movie, status)}>{status.replace("_", " ")}</button>)}</div></td></tr>)}</tbody></table></div></section>;
}

function BookingsPage({ bookings }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const rows = filter === "all" ? bookings : bookings.filter((booking) => normalizeService(booking.module) === filter);
  return (
    <>
      <ServiceTabs active={filter} setActive={setFilter} />
      <BookingsTable title="Bookings" bookings={rows} onSelect={setSelected} />
      {selected && <BookingDrawer booking={selected} close={() => setSelected(null)} />}
    </>
  );
}

function BookingsTable({ title, bookings, compact = false, onSelect }) {
  return (
    <section className="vendor-panel vendor-page-panel">
      <PanelTitle title={title} right="Live" />
      <div className="vendor-table-shell"><table className="vendor-table"><thead><tr><th>Booking ID</th><th>Service Type</th><th>Customer Name</th><th>Listing Name</th><th>Date</th><th>Amount</th><th>Payment Status</th><th>Booking Status</th><th>Action</th></tr></thead><tbody>{bookings.length ? bookings.map((booking) => <tr key={booking._id}><td>{booking.bookingCode || booking._id}</td><td>{booking.module}</td><td>{booking.user?.name || booking.customerName || booking.details?.customerName || "Customer"}</td><td>{booking.title}</td><td>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "-"}</td><td>Rs {booking.amount || 0}</td><td>{booking.paymentStatus}</td><td>{booking.status}</td><td><button className="table-action-btn" type="button" onClick={() => onSelect?.(booking)}>{compact ? "Open" : "View"}</button></td></tr>) : <tr><td colSpan="9">No bookings yet.</td></tr>}</tbody></table></div>
    </section>
  );
}

function BookingDrawer({ booking, close }) {
  return <aside className="booking-drawer"><button className="drawer-close" onClick={close}>Close</button><h2>{booking.title}</h2><InfoGroup title="Customer Info" rows={[["Name", booking.user?.name || booking.customerName], ["Mobile", booking.user?.mobile || booking.customerMobile], ["Email", booking.user?.email || booking.customerEmail]]} /><InfoGroup title="Payment Info" rows={[["Amount", `Rs ${booking.amount || 0}`], ["Payment", booking.paymentStatus], ["Status", booking.status]]} /><InfoGroup title="Seat Info" rows={[["Seats", booking.seats?.join(", ")], ["Service", booking.module]]} /><InfoGroup title="Booking Timeline" rows={[["Created", booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "-"], ["Updated", booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : "-"]]} /></aside>;
}

function CustomersPage({ customers, customerList = [] }) {
  if (customerList.length) {
    return <DataTable title="Customer List" columns={["Customer Name", "Mobile", "Email", "Movie Booked", "Seat Number", "Booking Date", "Payment Status"]} rows={customerList.map((customer) => [customer.customerName, customer.mobile, customer.email, customer.movieBooked, customer.seatNumber, customer.bookingDate ? new Date(customer.bookingDate).toLocaleDateString() : "-", customer.paymentStatus])} />;
  }
  return <DataTable title="Customers" columns={["Customer Name", "Mobile", "Email", "Total Bookings", "Last Booking", "Total Spend"]} rows={customers.map((customer) => [customer.customerName, customer.mobile || "-", customer.email || "-", customer.totalBookings || 0, customer.lastBooking ? new Date(customer.lastBooking).toLocaleDateString() : "-", `Rs ${customer.totalSpend || 0}`])} />;
}

function RevenuePage({ stats }) {
  const [filter, setFilter] = useState("all");
  const cards = [["Gross Revenue", stats.totalRevenue || stats.revenue], ["Vendor Earnings", stats.vendorEarnings], ["Platform Commission", stats.tixhubCommission || stats.platformCommission], ["Settled Amount", stats.settledAmount]];
  return <><ServiceTabs active={filter} setActive={setFilter} /><section className="vendor-card-grid revenue-card-grid">{cards.map(([label, value]) => <article className="vendor-kpi-card" key={label}><div><p>{label}</p><h2>Rs {value || 0}</h2><span>{filter === "all" ? "All services" : serviceMeta[filter]?.label}</span></div></article>)}</section></>;
}

function SettlementsPage({ settlements, stats }) {
  const rows = settlements.length ? settlements.map((item) => [item._id, `Rs ${item.netPayable || item.amount || 0}`, item.createdAt ? new Date(item.createdAt).toLocaleDateString() : item.cycle || "Current cycle", item.status, item.transactionId || "-"]) : [["current-cycle", `Rs ${stats.pendingSettlement || stats.pendingSettlements || 0}`, "Current cycle", "pending", "-"]];
  return <DataTable title="Settlements" columns={["Settlement ID", "Amount", "Date", "Status", "Transaction ID"]} rows={rows} />;
}

function PaymentDetailsPage({ details, reload }) {
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
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title="Payment Details" right="Bank" /><p>TixHub owns Razorpay. Vendors only add settlement bank details.</p><form className="vendor-settings-form" onSubmit={submit}>{fields.map((field, index) => <label key={field}><span>{labels[index]}</span><input value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} /></label>)}<button type="submit">Save Payment Details</button></form></section>;
}

function ProfilePage({ user }) {
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title="Profile" right="Vendor" /><InfoGroup title="Account" rows={[["Name", user.name], ["Email", user.email], ["Role", user.role], ["Status", user.status]]} /></section>;
}

function SupportPage() {
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title="Support" right="TixHub" /><InfoList rows={["Raise payment, booking, listing, or settlement issues from this section.", "Support tickets can be connected here when the support API is added.", "For now, keep vendor operational notes visible here."]} /></section>;
}

function AvailabilityPage({ rows }) {
  const source = rows;
  return <DataTable title="Booking Availability" columns={["Movie", "Theatre", "Show Time", "Total Seats", "Booked Seats", "Available Seats", "Blocked Seats", "Occupancy %"]} rows={source.map((row) => [row.movie, row.theatre, row.showTime, row.totalSeats, row.bookedSeats, row.availableSeats, row.blockedSeats, `${row.occupancy}%`])} />;
}

function FutureService({ service }) {
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title={serviceMeta[service]?.label || "Service"} right="Future" /><p>{serviceMeta[service]?.label} support is ready for navigation and can be enabled when listings/API are added.</p></section>;
}

function ServiceTabs({ active, setActive }) {
  return <div className="booking-service-tabs">{commonServices.map((service) => <button className={active === service ? "active" : ""} type="button" onClick={() => setActive(service)} key={service}>{service === "all" ? "All" : serviceMeta[service]?.label}</button>)}</div>;
}

function DataTable({ title, columns, rows }) {
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title={title} right="Live" /><div className="vendor-table-shell"><table className="vendor-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell || "-"}</td>)}</tr>) : <tr><td colSpan={columns.length}>No data available yet.</td></tr>}</tbody></table></div></section>;
}

function MiniCount({ label, value }) {
  return <article className="vendor-kpi-card"><div><p>{label}</p><h2>{value || 0}</h2><span>Production module</span></div></article>;
}

function Field({ label, value, onChange, type = "text" }) {
  return <label><span>{label}</span><input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ label, value, options, onChange }) {
  const normalized = options.map((option) => (typeof option === "string" ? { value: option, label: option.replace(/_/g, " ") } : option));
  return <label><span>{label}</span><select value={value || ""} onChange={(event) => onChange(event.target.value)}>{normalized.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function labelize(value) {
  return String(value || "").replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function InfoGroup({ title, rows }) {
  return <div className="info-group"><h3>{title}</h3>{rows.map(([label, value]) => <p key={label}><strong>{label}</strong><span>{value || "-"}</span></p>)}</div>;
}

function InfoList({ rows }) {
  return <div className="info-list">{rows.map((row) => <p key={row}>{row}</p>)}</div>;
}

function NotificationList({ rows, onRead }) {
  if (!rows.length) return <div className="info-list"><p>No notifications yet.</p></div>;
  return (
    <div className="notification-list">
      {rows.map((item) => (
        <button className={`notification-row notification-button ${item.isRead || item.read ? "" : "unread"}`} key={item.id || item._id} type="button" onClick={() => onRead(item)}>
          <Bell size={18} />
          <div><strong>{item.title}</strong><span>{item.message}</span></div>
          <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small>
        </button>
      ))}
    </div>
  );
}

function PanelTitle({ title, right = "April" }) {
  return <div className="panel-title"><h2>{title}</h2><button type="button">{right}<ChevronDown size={15} /></button></div>;
}

function SeatLegend() {
  return <div className="seat-legend"><span className="available">Available</span><span className="booked">Booked</span><span className="blocked">Blocked</span></div>;
}

function occupancy(stats) {
  const total = Number(stats.availableSeats || 0) + Number(stats.bookedSeats || 0) + Number(stats.blockedSeats || 0);
  return total ? Math.round((Number(stats.bookedSeats || 0) / total) * 100) : 0;
}

function normalizeService(module) {
  const value = String(module || "").toLowerCase();
  if (value === "movie") return "movies";
  if (value === "flight") return "flights";
  if (value === "hotel") return "hotels";
  if (value === "event") return "events";
  if (value === "travel-package") return "travel";
  return value;
}

function LineChart({ values }) {
  const rows = values.map((item) => (typeof item === "number" ? { label: "", value: item } : item));
  const max = Math.max(...rows.map((item) => Number(item.value || 0)), 1);
  const points = rows.map((item, index) => `${rows.length === 1 ? 50 : (index / (rows.length - 1)) * 100},${92 - (Number(item.value || 0) / max) * 70}`).join(" ");
  if (!rows.length || rows.every((item) => Number(item.value || 0) === 0)) return <div className="line-chart empty-chart">No booking data available yet</div>;
  return <div className="line-chart"><div className="chart-tooltip">Bookings <strong>{rows.reduce((sum, item) => sum + Number(item.value || 0), 0)}</strong></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Booking trend line chart"><polyline points={points} /><path d={`M0,100 L${points.replaceAll(" ", " L")} L100,100 Z`} /></svg><div className="chart-days">{rows.map((item, index) => <span key={`${item.label}-${index}`}>{item.label || item.date || ""}</span>)}</div></div>;
}

function BarChart({ values }) {
  const rows = values.map((item) => (typeof item === "number" ? { label: "", value: item } : item));
  const max = Math.max(...rows.map((item) => Number(item.value || 0)), 1);
  if (!rows.length) return <div className="bar-chart empty-chart">No revenue data yet.</div>;
  return <div className="bar-chart">{rows.map((item, index) => <div className="bar-column" key={`${item.label}-${index}`}><span style={{ height: `${Math.max((Number(item.value || 0) / max) * 100, Number(item.value || 0) ? 8 : 0)}%` }} /><small>{item.label || item.date || ""}</small></div>)}</div>;
}

function MovieList({ movies, showValue = false }) {
  return <div className="vendor-movie-list">{movies.map((movie) => <div className="vendor-movie-row" key={movie.id || movie._id}>{movie.image ? <img src={movie.image} alt={movie.title} /> : <span className="movie-thumb"><Film size={18} /></span>}<div><strong>{movie.title}</strong><small>{movie.date || movie.meta || movie.genre}</small></div>{showValue && <b>{movie.value}%</b>}</div>)}</div>;
}

export default VendorDashboard;
