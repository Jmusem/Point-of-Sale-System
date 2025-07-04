// Enhanced AdminDashboard.js with modals and actions
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: '' });

  useEffect(() => {
    fetchUsers();
    fetchCustomers();
    fetchSales();
  }, []);

  const fetchUsers = async () => {
    const res = await axios.get('http://localhost:5000/api/admin/users');
    setUsers(res.data);
  };

  const fetchCustomers = async () => {
    const res = await axios.get('http://localhost:5000/api/admin/customers');
    setCustomers(res.data);
  };

  const fetchSales = async () => {
    const res = await axios.get('http://localhost:5000/api/admin/sales');
    setSales(res.data);
  };

  const handleEditUser = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleEditCustomer = (customer) => {
    setEditCustomer(customer);
    setForm({ name: customer.name, email: customer.email, phone: customer.phone });
  };

  const handleDeleteUser = async (id) => {
    await axios.delete(`http://localhost:5000/api/admin/users/${id}`);
    fetchUsers();
  };

  const handleDeleteCustomer = async (id) => {
    await axios.delete(`http://localhost:5000/api/admin/customers/${id}`);
    fetchCustomers();
  };

  const handleSubmitUser = async () => {
    await axios.put(`http://localhost:5000/api/admin/users/${editUser.id}`, form);
    setEditUser(null);
    fetchUsers();
  };

  const handleSubmitCustomer = async () => {
    await axios.put(`http://localhost:5000/api/admin/customers/${editCustomer.id}`, form);
    setEditCustomer(null);
    fetchCustomers();
  };

  return (
    <div className="container py-4">
      <h2 className="text-center text-primary mb-4">Admin Dashboard</h2>

      {/* Users Table */}
      <section className="mb-5">
        <h4>Users</h4>
        <table className="table table-bordered">
          <thead className="table-info">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditUser(user)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* User Edit Modal */}
        {editUser && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit User</h5>
                  <button className="btn-close" onClick={() => setEditUser(null)}></button>
                </div>
                <div className="modal-body">
                  <input type="text" className="form-control mb-2" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <input type="email" className="form-control mb-2" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  <select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="admin">Admin</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={handleSubmitUser}>Save</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Customers Table */}
      <section className="mb-5">
        <h4>Customers</h4>
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>
                  <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditCustomer(customer)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCustomer(customer.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Customer Edit Modal */}
        {editCustomer && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Customer</h5>
                  <button className="btn-close" onClick={() => setEditCustomer(null)}></button>
                </div>
                <div className="modal-body">
                  <input type="text" className="form-control mb-2" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <input type="email" className="form-control mb-2" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  <input type="text" className="form-control" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={handleSubmitCustomer}>Save</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Sales */}
      <section>
        <h4>Sales</h4>
        <table className="table table-bordered">
          <thead className="table-success">
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Cashier</th>
              <th>Customer</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td>{sale.product_name}</td>
                <td>{sale.quantity_sold}</td>
                <td>{sale.total_price}</td>
                <td>{sale.cashier || 'N/A'}</td>
                <td>{sale.customer_name || 'Walk-in'}</td>
                <td>{new Date(sale.sale_date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
