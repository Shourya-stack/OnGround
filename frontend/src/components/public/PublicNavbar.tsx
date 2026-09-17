import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Layers, Menu, X } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="public-navbar">
      <div className="public-nav-container">
        {/* Brand */}
        <Link to="/" className="public-nav-brand">
          <div className="brand-icon-box">
            <Layers size={22} />
          </div>
          <span className="brand-name-text">OnGround</span>
        </Link>

        {/* Desktop Links */}
        <nav className="public-nav-links">
          <NavLink to="/features" className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
            Features
          </NavLink>
          <NavLink to="/how-it-works" className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
            How It Works
          </NavLink>
          <NavLink to="/solutions" className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
            Solutions
          </NavLink>
          <NavLink to="/pricing" className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
            Pricing
          </NavLink>
          <NavLink to="/docs" className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
            Documentation
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
            About
          </NavLink>
        </nav>

        {/* Action CTAs */}
        <div className="public-nav-actions">
          <Link to="/login" className="btn btn-ghost btn-sm">
            Log in
          </Link>
          <Link to="/signup" className="btn btn-primary btn-sm">
            Get Started
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="btn btn-ghost btn-sm mobile-menu-btn"
            style={{ padding: '6px' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer if open */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '72px',
            left: 0,
            right: 0,
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <Link to="/features" className="public-nav-link" onClick={() => setMobileMenuOpen(false)}>
            Features
          </Link>
          <Link to="/how-it-works" className="public-nav-link" onClick={() => setMobileMenuOpen(false)}>
            How It Works
          </Link>
          <Link to="/solutions" className="public-nav-link" onClick={() => setMobileMenuOpen(false)}>
            Solutions
          </Link>
          <Link to="/pricing" className="public-nav-link" onClick={() => setMobileMenuOpen(false)}>
            Pricing
          </Link>
          <Link to="/docs" className="public-nav-link" onClick={() => setMobileMenuOpen(false)}>
            Documentation
          </Link>
          <Link to="/about" className="public-nav-link" onClick={() => setMobileMenuOpen(false)}>
            About
          </Link>
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }} />
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/login" className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }} onClick={() => setMobileMenuOpen(false)}>
              Log in
            </Link>
            <Link to="/signup" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }} onClick={() => setMobileMenuOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
