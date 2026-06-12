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

import MoviesContent from "./components/MoviesContent";
import UpcomingMovies from "./components/UpcomingMovies";

import VendorDashboard from "./pages/vendor/VendorDashboard";
import AddMovie from "./pages/vendor/AddMovie";

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

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
