import React, { useEffect, useState } from "react";
import axios from "axios";

const apiBase = "http://localhost:5000/api";

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

function VendorReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${apiBase}/vendor-reports`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      .then((res) => setReport(res.data))
      .catch(() => setError("Unable to load reports."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="vendor-state-card">Loading reports...</div>;
  if (error) return <div className="vendor-state-card error">{error}</div>;

  const moduleCounts = report?.moduleCounts || {};

  return (
    <div className="vendor-reports-shell">
      <div className="stats-grid">
        <div className="stat-card"><h2>{report.totalListings}</h2><p>Total Listings</p></div>
        <div className="stat-card"><h2>{report.activeListings}</h2><p>Active Listings</p></div>
        <div className="stat-card"><h2>{report.totalBookings}</h2><p>Total Bookings</p></div>
        <div className="stat-card"><h2>Rs {report.revenue}</h2><p>Total Revenue</p></div>
      </div>

      <div className="vendor-module-report">
        {["flight", "hotel", "event", "bus", "travel-package"].map((module) => (
          <div className="module-report-row" key={module}>
            <span>{module.replace("-", " ")}</span>
            <strong>{moduleCounts[module] || 0}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorReports;
