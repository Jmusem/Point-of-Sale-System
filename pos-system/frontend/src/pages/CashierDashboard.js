import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function CashierDashboard() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('');
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState({ total_sales: 0, total_items: 0 });
  const [receiptItems, setReceiptItems] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });

  const receiptRef = useRef();

  useEffect(() => {
    fetchProducts();
    fetchSummary();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/inventory");
      setProducts(res.data.products);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/sales/summary/today");
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/customers");
      setCustomers(res.data.customers);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  };

  const handleAddCustomer = async () => {
    try {
      await axios.post("http://localhost:5000/api/customers", newCustomer);
      setNewCustomer({ name: '', email: '', phone: '' });
      setShowCustomerModal(false);
      fetchCustomers();
    } catch (err) {
      console.error("Failed to add customer:", err);
    }
  };

  const addToCart = (product) => {
    const exists = cart.find(item => item.id === product.id);
    if (!exists) {
      setCart([...cart, { ...product, quantityToSell: 1 }]);
    }
  };

  const updateCartQuantity = (id, qty) => {
    setCart(cart.map(item =>
      item.id === id ? { ...item, quantityToSell: qty } : item
    ));
  };

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      alert("Please select a customer before checkout.");
      return;
    }

    for (let item of cart) {
      if (parseInt(item.quantityToSell) > item.quantity) {
        alert(`Insufficient stock for ${item.name}`);
        return;
      }
    }

    try {
      const payload = {
        customer_id: selectedCustomer,
        items: cart.map(item => ({
          product_id: item.id,
          quantity_sold: parseInt(item.quantityToSell),
          price: item.price
        }))
      };

      await axios.post("http://localhost:5000/api/sales/checkout", payload);

      setReceiptItems([...cart]);
      setShowReceipt(true);
      setMessage("✅ Sale successful!");
      setCart([]);
      setSelectedCustomer('');
      fetchProducts();
      fetchSummary();

      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert("❌ Failed to process sale.");
      console.error(err);
    }
  };

  const handleDownloadPDF = () => {
    const input = receiptRef.current;
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save("receipt.pdf");
    });
  };

  const totalAmount = receiptItems.reduce((sum, item) => sum + item.price * item.quantityToSell, 0);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="container py-4">
      <h2 className="text-center text-success mb-4">🧾 Cashier Dashboard</h2>

      <div className="text-end mb-3">
        <Link to="/sales-history" className="btn btn-outline-secondary">📜 View Sales History</Link>
      </div>

      <div className="mb-3 d-flex justify-content-between">
        <div><strong>Total Sales Today:</strong> Ksh {summary.total_sales}</div>
        <div><strong>Total Items Sold:</strong> {summary.total_items}</div>
      </div>

      {message && <div className="alert alert-success text-center">{message}</div>}

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search product..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />

      <h5>🛒 Available Products</h5>
      <div className="table-responsive mb-4">
        <table className="table table-bordered table-hover">
          <thead className="table-success">
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Qty Available</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.quantity}</td>
                <td>{product.price}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => addToCart(product)}
                    disabled={cart.find(item => item.id === product.id)}
                  >
                    Add to Cart
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h5>🧾 Cart</h5>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>Product</th>
              <th>Qty Available</th>
              <th>Qty to Sell</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    max={item.quantity}
                    value={item.quantityToSell}
                    onChange={e => updateCartQuantity(item.id, e.target.value)}
                    className="form-control"
                  />
                </td>
                <td>{item.price}</td>
                <td>{item.price * item.quantityToSell}</td>
              </tr>
            ))}
            {cart.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted">No items in cart</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {cart.length > 0 && (
        <div className="mt-3">
          <div className="mb-3 d-flex justify-content-between">
            <div style={{ flex: 1 }}>
              <label className="form-label">Select Customer</label>
              <select
                className="form-select"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="">-- Select Customer --</option>
                {customers.map(cust => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} ({cust.phone})
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-outline-secondary ms-3 align-self-end" onClick={() => setShowCustomerModal(true)}>
              ➕ Add Customer
            </button>
          </div>
          <div className="text-end">
            <button className="btn btn-success" onClick={handleCheckout}>Checkout</button>
          </div>
        </div>
      )}

      {showReceipt && (
        <div className="mt-5 border p-4 shadow bg-light">
          <div ref={receiptRef}>
            <h4 className="text-center">🧾 Receipt</h4>
            <hr />
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {receiptItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantityToSell}</td>
                    <td>{item.price}</td>
                    <td>{item.price * item.quantityToSell}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="3"><strong>Grand Total</strong></td>
                  <td><strong>Ksh {totalAmount}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-end mt-3">
            <button className="btn btn-outline-danger" onClick={handleDownloadPDF}>
              📥 Download PDF
            </button>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showCustomerModal && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Customer</h5>
                <button type="button" className="btn-close" onClick={() => setShowCustomerModal(false)}></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  placeholder="Customer Name"
                  className="form-control mb-2"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="form-control mb-2"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Phone"
                  className="form-control"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowCustomerModal(false)}>Close</button>
                <button className="btn btn-primary" onClick={handleAddCustomer}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
