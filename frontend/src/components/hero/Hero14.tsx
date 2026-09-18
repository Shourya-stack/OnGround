import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  Layers,
  Menu,
  X,
  FileText,
  Cpu,
  GitCompare,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { motion, type Variants } from 'motion/react';
import heroBgImage from '../../assets/hero-bg.jpg';
import './Hero14.css';

interface NavItem {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

interface CapabilityItem {
  name: string;
  icon: React.ElementType;
}

const defaultNavLinks: NavItem[] = [
  { label: 'Product', href: '/features' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Resources', href: '/docs' },
];

const capabilitiesDefault: CapabilityItem[] = [
  { name: 'Daily Reports', icon: FileText },
  { name: 'Activity Extraction', icon: Cpu },
  { name: 'Schedule Matching', icon: GitCompare },
  { name: 'Human Review', icon: CheckCircle2 },
  { name: 'Audit Trail', icon: ShieldCheck },
];

// Motion animation variants matching Hero14 specification
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.12,
    },
  },
};

const riseVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      bounce: 0.25,
      duration: 1.2,
    },
  },
};

const capabilityVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.96, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      bounce: 0.25,
      duration: 1.2,
    },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 1.1, filter: 'blur(10px)' },
  visible: {
    opacity: 0.42,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      bounce: 0.1,
      duration: 1.6,
    },
  },
};

export interface Hero14Props {
  brandName?: string;
  navLinks?: NavItem[];
  badgeText?: string;
  headingLine1?: string;
  headingLine2?: string;
  description?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  capabilityEyebrow?: string;
  capabilities?: CapabilityItem[];
  backgroundImage?: string;
}

export const Hero14: React.FC<Hero14Props> = ({
  brandName = 'OnGround',
  navLinks = defaultNavLinks,
  badgeText = 'AI-Powered Project Intelligence',
  headingLine1 = 'Turn Daily Site Reports',
  headingLine2 = 'Into Actionable Project Data',
  description = 'Transform daily site reports into structured project data, reconcile field activity with the master schedule, and keep human verification at the center of every important match.',
  primaryCtaLabel = 'Get Started',
  primaryCtaHref = '/signup',
  secondaryCtaLabel = 'See How It Works',
  secondaryCtaHref = '/how-it-works',
  capabilityEyebrow = 'Built for the project reporting workflow',
  capabilities = capabilitiesDefault,
  backgroundImage = heroBgImage,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section className="hero14-section">
      <motion.div
        className="hero14-wrapper"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={containerVariants}
      >
        {/* Cinematic Atmospheric Background Visual */}
        <div className="hero14-bg-container" aria-hidden="true">
          <motion.img
            variants={imageVariants}
            src={backgroundImage}
            alt=""
            className="hero14-bg-image"
          />
          <div className="hero14-bg-overlay-gradient" />
          <div className="hero14-bg-overlay-noise" />
        </div>

        {/* Public Header / Navigation */}
        <motion.nav variants={riseVariants} className="hero14-nav" aria-label="Main Navigation">
          {/* Brand Logo */}
          <Link to="/" className="hero14-brand" aria-label="OnGround Home">
            <div className="hero14-brand-icon">
              <Layers size={20} strokeWidth={2.2} />
            </div>
            <span className="hero14-brand-text">{brandName}</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hero14-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="hero14-nav-link"
              >
                <span>{link.label}</span>
                {link.hasDropdown && (
                  <ChevronDown size={13} strokeWidth={2.4} opacity={0.7} />
                )}
              </Link>
            ))}
          </div>

          {/* Nav Actions */}
          <div className="hero14-nav-actions">
            <Link to="/login" className="hero14-nav-login">
              Log in
            </Link>
            <Link to={primaryCtaHref} className="hero14-btn-demo">
              <span>{primaryCtaLabel}</span>
              <ArrowRight size={14} className="hero14-arrow-icon" strokeWidth={2.2} />
            </Link>
            <button
              type="button"
              className="hero14-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Responsive Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="hero14-mobile-drawer" role="dialog" aria-modal="true">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
              >
                Log in
              </Link>
              <Link
                to={primaryCtaHref}
                className="hero14-btn-demo"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{primaryCtaLabel}</span>
                <ArrowRight size={14} className="hero14-arrow-icon" />
              </Link>
            </div>
          )}
        </motion.nav>

        {/* Center Hero Content */}
        <div className="hero14-content">
          {/* Pill Badge */}
          <motion.div variants={riseVariants} className="hero14-badge">
            <span className="hero14-badge-dot" />
            <span>{badgeText}</span>
          </motion.div>

          {/* High-Contrast Typographic Heading */}
          <motion.h1 variants={riseVariants} className="hero14-heading">
            <span className="hero14-heading-primary">{headingLine1}</span>
            <span className="hero14-heading-secondary">{headingLine2}</span>
          </motion.h1>

          {/* Factual, Capability-Based Description */}
          <motion.p variants={riseVariants} className="hero14-description">
            {description}
          </motion.p>

          {/* Interactive CTA Group */}
          <motion.div variants={riseVariants} className="hero14-cta-group">
            <Link to={primaryCtaHref} className="hero14-btn-primary">
              <span>{primaryCtaLabel}</span>
              <ArrowRight size={15} className="hero14-arrow-icon" strokeWidth={2.2} />
            </Link>
            <Link to={secondaryCtaHref} className="hero14-btn-secondary">
              <span>{secondaryCtaLabel}</span>
            </Link>
          </motion.div>

          {/* Bottom Capability Proof Strip */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.7 }}
            className="hero14-bottom-strip"
          >
            <motion.p variants={riseVariants} className="hero14-strip-eyebrow">
              {capabilityEyebrow}
            </motion.p>
            <div className="hero14-strip-list">
              {capabilities.map((cap) => {
                const IconComponent = cap.icon;
                return (
                  <motion.div
                    key={cap.name}
                    variants={capabilityVariants}
                    className="hero14-strip-item"
                  >
                    <IconComponent size={16} className="hero14-strip-icon" strokeWidth={2} />
                    <span>{cap.name}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero14;
