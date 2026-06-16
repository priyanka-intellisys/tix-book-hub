import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./layouts/DashboardLayout";
import HomeContent from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MovieDetailsPage from "./pages/MovieDetails";
import TheatreShows from "./pages/TheatreShows";
import SeatSelectionPage from "./pages/SeatSelection";
import MoviePayment from "./pages/MoviePayment";
import BookingConfirmation from "./pages/BookingConfirmation";
import FlightDetails from "./pages/FlightDetails";
import FlightTravellerSelection from "./pages/FlightTravellerSelection";
import FlightSeatSelection from "./pages/FlightSeatSelection";
import FlightReviewBooking from "./pages/FlightReviewBooking";
import FlightPayment from "./pages/FlightPayment";
import MyBookings from "./pages/MyBookings";
import TixWallet from "./pages/TixWallet";
import Profile from "./pages/Profile";
import CatalogContent from "./pages/CatalogContent";

import UpcomingMovies from "./components/UpcomingMovies";
import MovieContent from "./components/MovieContent";
import FlightContent from "./components/FlightContent";

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
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeContent />} />
        <Route path="movies" element={<MovieContent />} />
        <Route path="movies/:id" element={<MovieDetailsPage />} />
        <Route path="movies/:id/theatres" element={<TheatreShows />} />
        <Route path="movies/:id/seats" element={<SeatSelectionPage />} />
        <Route path="movies/:id/payment" element={<MoviePayment />} />
        <Route path="movies/:id/confirmation" element={<BookingConfirmation type="movie" />} />
        <Route path="upcoming-movies" element={<UpcomingMovies />} />
        <Route path="flights" element={<FlightContent />} />
        <Route path="flights/:id" element={<FlightDetails />} />
        <Route path="flights/:id/passengers" element={<FlightTravellerSelection />} />
        <Route path="flights/:id/seats" element={<FlightSeatSelection />} />
        <Route path="flights/:id/review" element={<FlightReviewBooking />} />
        <Route path="flights/:id/payment" element={<FlightPayment />} />
        <Route path="flights/:id/confirmation" element={<BookingConfirmation type="flight" />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="wallet" element={<TixWallet />} />
        <Route path="profile" element={<Profile />} />
        <Route path="browse" element={<CatalogContent module="browse" />} />
        <Route path="wishlist" element={<CatalogContent module="browse" />} />
        <Route path="notifications" element={<CatalogContent module="browse" />} />
        <Route path=":module" element={<CatalogContent />} />
      </Route>

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/movies" element={<Navigate to="/dashboard/movies" replace />} />
      <Route path="/movie-details" element={<Navigate to="/dashboard/movies" replace />} />
      <Route path="/theatre-shows" element={<Navigate to="/dashboard/movies" replace />} />
      <Route path="/upcoming-movies" element={<Navigate to="/dashboard/upcoming-movies" replace />} />
      <Route path="/seat-selection" element={<Navigate to="/dashboard/movies" replace />} />
      <Route path="/flights" element={<Navigate to="/dashboard/flights" replace />} />
      <Route path="/flight-details" element={<Navigate to="/dashboard/flights" replace />} />
      <Route path="/flight-travellers" element={<Navigate to="/dashboard/flights" replace />} />
      <Route path="/flight-seat-selection" element={<Navigate to="/dashboard/flights" replace />} />
      <Route path="/flight-review-booking" element={<Navigate to="/dashboard/flights" replace />} />
      <Route path="/flight-payment" element={<Navigate to="/dashboard/flights" replace />} />

      <Route
        path="/vendor-dashboard"
        element={
          <ProtectedRoute roles={["vendor", "admin"]}>
            <VendorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/add-movie"
        element={
          <ProtectedRoute roles={["vendor", "admin"]}>
            <AddMovie />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/*"
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
