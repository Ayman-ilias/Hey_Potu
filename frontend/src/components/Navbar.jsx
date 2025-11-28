import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
import logo from '/logo.png';

function Navbar({ onLogout }) {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <img src={logo} alt="Hey Potu" className="navbar-logo" />
                    <div className="navbar-title">
                        <h1>Hey Potu</h1>
                        <p>POS System</p>
                    </div>
                </div>

                <div className="navbar-menu">
                    <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                        📊 Dashboard
                    </NavLink>

                    <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
                        📦 Inventory
                    </NavLink>

                    <NavLink to="/orders" className={({ isActive }) => isActive ? 'active' : ''}>
                        🛒 Orders
                    </NavLink>

                    <NavLink to="/customers" className={({ isActive }) => isActive ? 'active' : ''}>
                        👥 Customers
                    </NavLink>

                    <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
                        📈 Reports
                    </NavLink>

                    <button onClick={onLogout} className="logout-button">
                        🚪 Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
