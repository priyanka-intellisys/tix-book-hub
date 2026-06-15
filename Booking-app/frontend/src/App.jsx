import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MovieDetailsPage from "./pages/MovieDetails";
import TheatreShows from "./pages/TheatreShows";
import SeatSelectionPage from "./pages/SeatSelection";
import FlightContent from "./pages/FlightContent";
import FlightDetails from "./pages/FlightDetails";
import FlightTravellerSelection from "./pages/FlightTravellerSelection";
import FlightSeatSelection from "./pages/FlightSeatSelection";
import FlightReviewBooking from "./pages/FlightReviewBooking";
import FlightPayment from "./pages/FlightPayment";

import MoviesContent from "./components/MoviesContent";
import UpcomingMovies from "./components/UpcomingMovies";

import VendorDashboard from "./pages/vendor/VendorDashboard";
import AddMovie from "./pages/vendor/AddMovie";
import AddFlight from "./pages/vendor/AddFlight";
import AddHotel from "./pages/vendor/AddHotel";
import AddEvent from "./pages/vendor/AddEvent";
import AddBus from "./pages/vendor/AddBus";
import AddTravelPackage from "./pages/vendor/AddTravelPackage";

const getSession = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const rawUser = localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser");
  const user = rawUser ? JSON.parse(rawUser) : null;
  return { token, user };
};

function ProtectedRoute({ children, roles }) {
  const { token, user } = getSession();

  if (!token || !user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["user", "vendor", "admin"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/movies" element={<MoviesContent />} />
      <Route path="/movie-details" element={<MovieDetailsPage />} />
      <Route path="/theatre-shows" element={<TheatreShows />} />
      <Route path="/upcoming-movies" element={<UpcomingMovies />} />
      <Route path="/seat-selection" element={<SeatSelectionPage />} />
      <Route path="/flights" element={<FlightContent />} />
      <Route path="/flight-details" element={<FlightDetails />} />
      <Route path="/flight-travellers" element={<FlightTravellerSelection />} />
      <Route path="/flight-seat-selection" element={<FlightSeatSelection />} />
      <Route path="/flight-review-booking" element={<FlightReviewBooking />} />
      <Route path="/flight-payment" element={<FlightPayment />} />

      <Route
        path="/vendor-dashboard"
        element={
          <ProtectedRoute roles={["vendor", "admin"]}>
            <VendorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-movie"
        element={
          <ProtectedRoute roles={["vendor", "admin"]}>
            <AddMovie />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-flight"
        element={
          <ProtectedRoute roles={["vendor", "admin"]}>
            <AddFlight />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-hotel"
        element={
          <ProtectedRoute roles={["vendor", "admin"]}>
            <AddHotel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-event"
        element={
          <ProtectedRoute roles={["vendor", "admin"]}>
            <AddEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-bus"
        element={
          <ProtectedRoute roles={["vendor", "admin"]}>
            <AddBus />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-travel-package"
        element={
          <ProtectedRoute roles={["vendor", "admin"]}>
            <AddTravelPackage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
