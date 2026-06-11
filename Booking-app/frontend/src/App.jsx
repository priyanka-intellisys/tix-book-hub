import { Routes, Route } from "react-router-dom";

/* USER PAGES */

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

/* MOVIE COMPONENTS */

import MoviesContent from "./components/MoviesContent";
import MovieDetails from "./components/MovieDetails";
import UpcomingMovies from "./components/UpcomingMovies";
import SeatSelection from "./components/SeatSelection";

/* VENDOR */

import VendorDashboard from "./pages/vendor/VendorDashboard";
import AddMovie from "./pages/vendor/AddMovie";
``

function App() {

  return (

    <Routes>

      {/* LOGIN */}

      <Route
        path="/"
        element={<Login />}
      />

      {/* REGISTER */}

      <Route
        path="/register"
        element={<Register />}
      />

      {/* USER DASHBOARD */}

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      {/* MOVIES */}

      <Route
        path="/movies"
        element={<MoviesContent />}
      />

      {/* MOVIE DETAILS */}

      <Route
        path="/movie-details"
        element={<MovieDetails />}
      />

      {/* UPCOMING MOVIES */}

      <Route
        path="/upcoming-movies"
        element={<UpcomingMovies />}
      />

      {/* SEAT SELECTION */}

      <Route
        path="/seat-selection"
        element={<SeatSelection />}
      />

      {/* VENDOR PANEL */}

      <Route
        path="/vendor-dashboard"
        element={<VendorDashboard />}
      />
      <Route
  path="/add-movie"
  element={<AddMovie />}
/>

    </Routes>
    

  );
}

export default App;