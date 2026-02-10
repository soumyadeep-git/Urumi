import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './LandingPage.css';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
];

const PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1551028919-ac6635f0e5c9?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=300&q=80',
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="landing-container">
      <nav className={`landing-nav ${mounted ? 'visible' : ''}`}>
        <Logo size={28} />
        <button className="nav-cta" onClick={() => navigate('/dashboard')}>
          Launch Console
        </button>
      </nav>

      <main className="hero-section">
        <div className={`hero-text ${mounted ? 'visible' : ''}`}>
          <h1 className="hero-title">
            <span className="title-line">Deploy</span>
            <span className="title-line">E-Commerce</span>
            <span className="title-line highlight">At Scale</span>
          </h1>
          <p className="hero-subtitle">
            Kubernetes-native store orchestration. 
            Zero-touch provisioning for Medusa storefronts.
          </p>
          <div className="hero-actions">
            <button className="cta-primary" onClick={() => navigate('/dashboard')}>
              Enter App
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="scrolling-visual">
          <div className="scroll-track-container">
            <div className="scroll-track">
              {/* Repeated Store Cards for Infinite Scroll Effect */}
              {[0, 1, 2, 3].map((set) => (
                <div key={set} className="scroll-group">
                  <div className="visual-card">
                    <div className="card-header">
                      <div className="card-dots"><span></span><span></span><span></span></div>
                      <div className="card-url">store-alpha.urumi.io</div>
                    </div>
                    <div className="card-hero" style={{ backgroundImage: `url(${HERO_IMAGES[0]})` }}>
                      <div className="card-hero-overlay">
                        <span>New Arrivals</span>
                        <h3>Summer Collection</h3>
                      </div>
                    </div>
                    <div className="card-grid">
                      {PRODUCT_IMAGES.map((img, i) => (
                        <div key={i} className="card-product" style={{ backgroundImage: `url(${img})` }}></div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="visual-card alt">
                    <div className="card-header">
                      <div className="card-dots"><span></span><span></span><span></span></div>
                      <div className="card-url">store-beta.urumi.io</div>
                    </div>
                    <div className="card-hero" style={{ backgroundImage: `url(${HERO_IMAGES[1]})` }}>
                      <div className="card-hero-overlay">
                        <span>Limited Edition</span>
                        <h3>Urban Series</h3>
                      </div>
                    </div>
                    <div className="card-grid two-col">
                      <div className="card-product" style={{ backgroundImage: `url(${PRODUCT_IMAGES[2]})` }}></div>
                      <div className="card-product" style={{ backgroundImage: `url(${PRODUCT_IMAGES[3]})` }}></div>
                    </div>
                  </div>
                  
                  <div className="visual-card">
                    <div className="card-header">
                      <div className="card-dots"><span></span><span></span><span></span></div>
                      <div className="card-url">store-gamma.urumi.io</div>
                    </div>
                    <div className="card-hero" style={{ backgroundImage: `url(${HERO_IMAGES[2]})` }}>
                       <div className="card-hero-overlay">
                        <span>Exclusive</span>
                        <h3>Winter Drop</h3>
                      </div>
                    </div>
                    <div className="card-grid">
                      {PRODUCT_IMAGES.slice(0, 3).map((img, i) => (
                        <div key={i} className="card-product" style={{ backgroundImage: `url(${img})` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="visual-overlay"></div>
        </div>
      </main>
      
      <div className="background-gradient"></div>
    </div>
  );
};

export default LandingPage;
