import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function InventoryDashboard() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    category: '',
    quantity: '',
    price: '',
    supplier: '',
    image: ''
  });
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalItems: 0,
    totalCategories: 0
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/inventory");
      setProducts(res.data.products);

      // Update summary
      const totalItems = res.data.products.reduce((sum, p) => sum + parseInt(p.quantity), 0);
      const uniqueCategories = new Set(res.data.products.map(p => p.category)).size;

      setSummary({
        totalProducts: res.data.products.length,
        totalItems,
        totalCategories: uniqueCategories
      });
    } catch (err) {
      console.error("Error fetching inventory data", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setForm({ ...form, image: files[0] });
      setPreviewImage(URL.createObjectURL(files[0]));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => formData.append(key, val));

      if (editing) {
        await axios.put(`http://localhost:5000/api/inventory/${editing}`, formData);
        setMessage("✅ Product updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/inventory", formData);
        setMessage("✅ Product added successfully!");
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setForm({ name: '', category: '', quantity: '', price: '', supplier: '', image: '' });
      setEditing(null);
      setPreviewImage(null);
      setShowModal(false);
      fetchInventoryData();
    } catch (err) {
      console.error(err);
      setMessage("❌ Operation failed. Try again.");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      price: product.price,
      supplier: product.supplier,
      image: ''
    });
    setEditing(product.id);
    setPreviewImage(`http://localhost:5000/uploads/${product.image}`);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`http://localhost:5000/api/inventory/${id}`);
        setMessage("🗑️ Product deleted successfully!");
        fetchInventoryData();
      } catch (err) {
        console.error(err);
        setMessage("❌ Failed to delete product.");
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleExport = () => {
    const exportData = products.map(({ image, ...p }) => p);
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, 'inventory_export.xlsx');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const imported = XLSX.utils.sheet_to_json(sheet);
      imported.forEach(async (item) => {
        try {
          await axios.post("http://localhost:5000/api/inventory", item);
          fetchInventoryData();
        } catch (err) {
          console.error("Import error:", err);
        }
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="container py-4">
      <h2 className="mb-3 text-center text-primary">📦 Inventory Manager Dashboard</h2>

      {showSuccess && <div className="alert alert-info text-center">{message}</div>}

      {/* Summary Cards */}
      <div className="row text-center mb-4">
        <div className="col-md-4">
          <div className="card border-primary shadow-sm">
            <div className="card-body">
              <h5>Total Products</h5>
              <h3 className="text-primary">{summary.totalProducts}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-success shadow-sm">
            <div className="card-body">
              <h5>Total Items in Stock</h5>
              <h3 className="text-success">{summary.totalItems}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-warning shadow-sm">
            <div className="card-body">
              <h5>Total Categories</h5>
              <h3 className="text-warning">{summary.totalCategories}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Actions */}
      <div className="mb-3 row">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search by product name or category..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="col-md-6 text-end">
         <label className="btn btn-outline-secondary mb-0">
  Import
  <input
    type="file"
    accept=".xlsx, .xls, .csv"
    onChange={handleImport}
    hidden
  />
</label>
<button onClick={handleExport} className="btn btn-outline-secondary ms-2">Export</button>


          <button className="btn btn-primary ms-2" onClick={() => setShowModal(true)}>➕ Add Product</button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? '✏️ Edit Product' : '➕ Add Product'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); setEditing(null); }}></button>
              </div>
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="Name" required />
                  </div>
                  <div className="col-md-4">
                    <input name="category" value={form.category} onChange={handleChange} className="form-control" placeholder="Category" required />
                  </div>
                  <div className="col-md-4">
                    <input name="quantity" value={form.quantity} onChange={handleChange} type="number" className="form-control" placeholder="Qty" required />
                  </div>
                  <div className="col-md-4">
                    <input name="price" value={form.price} onChange={handleChange} type="number" className="form-control" placeholder="Price" required />
                  </div>
                  <div className="col-md-4">
                    <input name="supplier" value={form.supplier} onChange={handleChange} className="form-control" placeholder="Supplier" required />
                  </div>
                  <div className="col-md-4">
                    <input type="file" name="image" accept="image/*" onChange={handleChange} className="form-control" />
                    {previewImage && (
                      <img
                        src={previewImage}
                        alt="preview"
                        width={50}
                        height={50}
                        className="mt-1"
                        style={{ objectFit: 'cover', borderRadius: '4px' }}
                      />
                    )}
                  </div>
                </div>
                <div className="text-end mt-3">
                  <button type="submit" className={`btn ${editing ? 'btn-warning' : 'btn-success'}`}>
                    {editing ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product Table */}
      <h4 className="mb-3 text-secondary">📋 Product Inventory</h4>
      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((item) => (
              <tr key={item.id} className={item.quantity <= 5 ? 'table-danger' : ''}>
                <td>
                  {item.image ? (
                    <img
                      src={`http://localhost:5000/uploads/${item.image}`}
                      alt={item.name}
                      width="50"
                      height="50"
                      style={{ objectFit: 'cover', borderRadius: '5px' }}
                    />
                  ) : 'No Image'}
                </td>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.quantity}</td>
                <td>{item.price}</td>
                <td>{item.supplier}</td>
                <td>{item.quantity <= 5 ? '⚠️ Low Stock' : '✔️ In Stock'}</td>
                <td>
                  <div className="d-flex">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center text-muted">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
