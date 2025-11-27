import React, { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI } from '../utils/api';
import { exportProductsToPDF } from '../utils/pdfExport';
import { exportProductsToExcel } from '../utils/excelExport';
import './Products.css';

function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [formData, setFormData] = useState({
        product_code: '',
        item_name: '',
        item_category: '',
        unit: 'pcs',
        total_stock: 0,
        price: 0,
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await productsAPI.getAll();
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await categoriesAPI.getAll();
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await productsAPI.update(editingProduct.id, formData);
            } else {
                await productsAPI.create(formData);
            }
            fetchProducts();
            closeModal();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product');
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            await categoriesAPI.create({ name: newCategoryName });
            fetchCategories();
            setNewCategoryName('');
            setShowCategoryModal(false);
        } catch (error) {
            console.error('Error creating category:', error);
            alert('Error creating category');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productsAPI.delete(id);
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const handleCategoryDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await categoriesAPI.delete(id);
                fetchCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
                const errorMsg = error.response?.data?.error || 'Failed to delete category';
                alert(errorMsg);
            }
        }
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({
                product_code: '',
                item_name: '',
                item_category: '',
                unit: 'pcs',
                total_stock: 0,
                price: 0,
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
    };

    const filteredProducts = products.filter(p =>
        p.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.item_category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="products-page">
            <div className="page-header">
                <h2>Inventory Management</h2>
                <div className="header-actions">
                    <input
                        type="text"
                        placeholder="🔍 Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button className="btn btn-secondary" onClick={() => exportProductsToPDF(products)}>
                        📄 Export PDF
                    </button>
                    <button className="btn btn-secondary" onClick={() => exportProductsToExcel(products)}>
                        📊 Export Excel
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        ➕ Add Product
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Serial No</th>
                            <th>Code</th>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Unit</th>
                            <th>Total Stock</th>
                            <th>Sold</th>
                            <th>Remaining</th>
                            <th>Price (BDT )</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id} className={product.remaining_items <= 10 ? 'low-stock' : ''}>
                                <td style={{ color: 'black' }}>{product.serial_no}</td>
                                <td style={{ color: 'black' }}>{product.product_code}</td>
                                <td><strong>{product.item_name}</strong></td>
                                <td>{product.item_category}</td>
                                <td>{product.unit}</td>
                                <td style={{ color: 'black' }}>{product.total_stock}</td>
                                <td style={{ color: 'black' }}>{product.sold_items}</td>
                                <td>
                                    {product.remaining_items <= 10 ? (
                                        <span className="badge badge-warning">{product.remaining_items}</span>
                                    ) : (
                                        <span style={{ color: 'black' }}>{product.remaining_items}</span>
                                    )}
                                </td>
                                <td>BDT {product.price}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" onClick={() => openModal(product)} title="Edit">✏️</button>
                                        <button className="btn-icon" onClick={() => handleDelete(product.id)} title="Delete">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && (
                    <div className="empty-state">
                        <p>No products found</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label>Product Code *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.product_code}
                                        onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Item Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.item_name}
                                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label>Category</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select
                                            value={formData.item_category}
                                            onChange={(e) => setFormData({ ...formData, item_category: e.target.value })}
                                            style={{ flex: 1 }}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            style={{ padding: '0 12px' }}
                                            onClick={() => setShowCategoryModal(true)}
                                            title="Add New Category"
                                        >
                                            ➕
                                        </button>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="pcs">Pieces</option>
                                        <option value="set">Set</option>
                                        <option value="box">Box</option>
                                        <option value="kg">Kilogram</option>
                                        <option value="ltr">Liter</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label>Total Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.total_stock}
                                        onChange={(e) => setFormData({ ...formData, total_stock: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Price (BDT )</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingProduct ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCategoryModal && (
                <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <h3>Add New Category</h3>
                        <form onSubmit={handleCategorySubmit}>
                            <div className="input-group">
                                <label>Category Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g. Toys, Clothing"
                                    autoFocus
                                />
                            </div>

                            <div className="input-group">
                                <label>Existing Categories</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                    {categories.map(cat => (
                                        <div key={cat.id} style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', gap: '8px' }}>
                                            <span>{cat.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCategoryDelete(cat.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px', padding: '0', lineHeight: '1' }}
                                                title="Delete category"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Products;
