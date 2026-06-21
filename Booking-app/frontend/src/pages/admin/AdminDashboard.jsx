import React, { useEffect, useState } from "react";
import { FaChartLine, FaSignOutAlt, FaTicketAlt, FaUsers } from "react-icons/fa";
import "../Dashboard.css";

const token = () => localStorage.getItem("token") || sessionStorage.getItem("token");

function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalVendors: 0, totalBookings: 0, totalRevenue: 0 });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token()}` };
    fetch("http://localhost:5000/api/admin/stats", { headers })
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {});
    fetch("http://localhost:5000/api/admin/users", { headers })
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">TH</div>
          <h2>TixHub</h2>
        </div>
        <nav className="sidebar-menu">
          <button className="active"><FaChartLine /> Admin</button>
        </nav>
        <button className="logout-btn" onClick={logout}><FaSignOutAlt /> Logout</button>
      </aside>
      <main className="main-content">
        <header className="top-header">
          <h1>Admin Dashboard</h1>
        </header>
        <div className="insight-grid">
          <div className="wallet-card"><div><p>Users</p><h2>{stats.totalUsers}</h2></div><FaUsers className="wallet-icon" /></div>
          <div className="wallet-card"><div><p>Vendors</p><h2>{stats.totalVendors}</h2></div><FaUsers className="wallet-icon" /></div>
          <div className="wallet-card"><div><p>Bookings</p><h2>{stats.totalBookings}</h2></div><FaTicketAlt className="wallet-icon" /></div>
          <div className="wallet-card"><div><p>Revenue</p><h2>Rs {stats.totalRevenue}</h2></div><FaChartLine className="wallet-icon" /></div>
        </div>
        <section className="section-block">
          <div className="section-header"><h3>User Management</h3></div>
          <div className="management-table">
            {users.map((user) => (
              <div className="transaction-card" key={user.id}>
                <div>
                  <h4>{user.name}</h4>
                  <p>{user.email} · {user.role}</p>
                </div>
                <span className="status-badge green">{user.status}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
