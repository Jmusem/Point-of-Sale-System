import React from "react";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-light vh-100 d-flex align-items-center">
        <div className="container text-center">
          <h1 className="display-3 fw-bold text-primary mb-3">Welcome to <span className="text-dark">POSify</span></h1>
          <p className="lead text-secondary mb-4">
            A smart, fast and reliable Point of Sale system that helps you manage your business with ease.
            Track inventory, monitor sales, and generate insightful reports — all from one dashboard.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <a href="/login" className="btn btn-primary btn-lg px-5">Get Started</a>
            <a href="/register" className="btn btn-outline-primary btn-lg px-5">Create Account</a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-5">
        <div className="container text-center">
          <h2 className="fw-bold mb-4 text-dark">Why Choose POSify?</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="border rounded p-4 h-100 shadow-sm">
                <h5 className="text-primary">Inventory Management</h5>
                <p className="text-muted">Keep track of stock levels, product info, and low-stock alerts.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border rounded p-4 h-100 shadow-sm">
                <h5 className="text-primary">Sales Analytics</h5>
                <p className="text-muted">View sales trends and reports by date, product, or cashier.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border rounded p-4 h-100 shadow-sm">
                <h5 className="text-primary">User-Friendly</h5>
                <p className="text-muted">Simple interface for admins and cashiers with secure access.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary text-white py-3 mt-auto">
        <div className="container text-center">
          <small>&copy; {new Date().getFullYear()} POSify. All rights reserved.</small>
        </div>
      </footer>
    </div>
  );
}
