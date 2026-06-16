import React, { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../pages/Dashboard.css";
import "./DashboardLayout.css";

const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

const getSavedUser = () => {
  const raw = localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser");
  return raw ? JSON.parse(raw) : null;
};

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useState(() => getSavedUser() || {
    name: "Guest User",
    email: "",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
  });

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }), []);

  const handleLogout = async () => {
    try {
      await fetch(`${apiBase}/auth/logout`, { method: "POST", headers: authHeaders });
    } catch (error) {
      // Local logout should still succeed if the API is offline.
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  const goTo = (path) => navigate(path);

  return (
    <div className="dashboard-layout">
      <Sidebar currentPath={location.pathname} goTo={goTo} handleLogout={handleLogout} />
      <main className="dashboard-main">
        <Header user={user} goTo={goTo} />
        <div className="dashboard-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
