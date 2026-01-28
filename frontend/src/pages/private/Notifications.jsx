import React from "react";
import { Link } from "react-router-dom";

export default function Notifications() {
  return (
    <div className="dash-page">
      <h1>Notifications</h1>
      <p>No notifications yet.</p>
      <Link to="/dashboard">Back to Dashboard</Link>
    </div>
  );
}
