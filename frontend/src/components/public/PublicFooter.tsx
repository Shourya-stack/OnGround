import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ShieldCheck } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="public-footer">
      <div className="footer-container">
        {/* Brand Column */}
        <div className="footer-brand-col">
          <Link to="/" className="public-nav-brand">
            <div className="brand-icon-box" style={{ width: '32px', height: '32px' }}>
              <Layers size={18} />
            </div>
            <span className="brand-name-text" style={{ fontSize: '1.1rem' }}>OnGround</span>
          </Link>
          <p>
            Infrastructure Progress Intelligence System (IPIS). Converting daily site progress reports into structured, verified Primavera P6 baseline schedule links.
          </p>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--confidence-high)' }} />
            <span>Role-governed verification & immutable audit trail</span>
          </div>
        </div>

        {/* Product Column */}
        <div className="footer-col">
          <h4>Product</h4>
          <ul>
            <li><Link to="/features">Features</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
            <li><Link to="/solutions">Solutions</Link></li>
            <li><Link to="/pricing">Pricing Plans</Link></li>
            <li><Link to="/dashboard">App Dashboard</Link></li>
          </ul>
        </div>

        {/* Resources Column */}
        <div className="footer-col">
          <h4>Resources</h4>
          <ul>
            <li><Link to="/docs">Documentation</Link></li>
            <li><Link to="/faq">Frequently Asked Questions</Link></li>
            <li><Link to="/security">Security Architecture</Link></li>
          </ul>
        </div>

        {/* Company Column */}
        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Sales / Support</Link></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div className="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/cookies">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>
          © {new Date().getFullYear()} OnGround Technologies Inc. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/cookies">Cookies</Link>
          <Link to="/security">Security</Link>
        </div>
      </div>
    </footer>
  );
};
