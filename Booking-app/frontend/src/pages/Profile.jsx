import React from "react";
import "./Dashboard.css";

const getSavedUser = () => {
  const raw = localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser");
  return raw ? JSON.parse(raw) : null;
};

function Profile() {
  const user = getSavedUser() || {
    name: "Guest User",
    email: "",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
  };

  return (
    <section className="section-block">
      <div className="section-header"><h3>Profile</h3></div>
      <div className="wallet-card profile-panel">
        <img src={user.image} alt={user.name} />
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <p>Notification, privacy, and password settings are enabled for this account.</p>
        </div>
      </div>
    </section>
  );
}

export default Profile;
