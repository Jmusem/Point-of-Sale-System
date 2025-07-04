import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function SalesHistory() {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    fetchSalesHistory();
  }, []);

  const fetchSalesHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/sales/history");
      setSales(res.data.sales);
    } catch (err) {
      console.error("Failed to fetch sales history:", err);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="text-center text-info mb-4">📜 Sales History</h2>
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-primary">
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Qty Sold</th>
              <th>Total (Ksh)</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-muted">No sales found.</td>
              </tr>
            ) : (
              sales.map((sale, index) => (
                <tr key={sale.id}>
                  <td>{index + 1}</td>
                  <td>{sale.product_name}</td>
                  <td>{sale.quantity_sold}</td>
                  <td>{sale.total_price}</td>
                  <td>{new Date(sale.sale_date).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
