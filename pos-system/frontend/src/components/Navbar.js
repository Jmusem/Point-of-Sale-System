import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light px-4">
      <Link className="navbar-brand text-primary fw-bold" to="/">POSify</Link>
      <div className="ms-auto">
        <Link className="btn btn-outline-primary me-2" to="/login">Login</Link>
        <Link className="btn btn-primary" to="/register">Register</Link>
      </div>
    </nav>
  );
}
