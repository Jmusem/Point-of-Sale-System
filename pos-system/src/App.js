import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Otp from "./pages/Otp";
import AdminDashboard from "./pages/AdminDashboard";
import CashierDashboard from "./pages/CashierDashboard";
import InventoryDashboard from "./pages/InventoryDashboard";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Otp />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/cashier-dashboard" element={<CashierDashboard />} />
        <Route path="/inventory-dashboard" element={<InventoryDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
