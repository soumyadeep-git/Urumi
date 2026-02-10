import React, { useState, useEffect } from 'react';
import '../App.css';

import Logo from '../components/Logo';

interface Store {
  id: string;
  name: string;
  status: string;
  url: string;
  created_at: string;
}

const API_URL = 'http://127.0.0.1:8000';

function Dashboard() {
  const [stores, setStores] = useState<Store[]>([]);
  const [newStoreName, setNewStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStores = async () => {
    try {
      const response = await fetch(`${API_URL}/stores`);
      if (response.ok) {
        const data = await response.json();
        
        setStores((prevStores) => {
          const backendStoreIds = new Set(data.map((s: Store) => s.id));
          const missingProvisioningStores = prevStores.filter(s => 
            s.status === 'Provisioning' && 
            !backendStoreIds.has(s.id) &&
            (new Date().getTime() - new Date(s.created_at).getTime() < 60000)
          );
          
          const combined = [...data, ...missingProvisioningStores];
          return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });
        
        setError(null);
      } else {
        setError(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      setError(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStores();
    const interval = setInterval(fetchStores, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName) return;
    setCreating(true);
    try {
      const response = await fetch(`${API_URL}/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStoreName }),
      });
      if (response.ok) {
        const newStore = await response.json();
        setStores([...stores, newStore]);
        setNewStoreName('');
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create store:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;
    try {
      await fetch(`${API_URL}/stores/${id}`, { method: 'DELETE' });
      setStores(stores.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete store:', error);
    }
  };

  const activeStores = stores.filter(s => s.status === 'Ready').length;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Logo size={24} className="mb-8" />
        <nav style={{ marginTop: '2rem' }}>
          <div className="nav-item active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Stores
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <div>
            <h1>STORE ORCHESTRATOR</h1>
            <p>Manage your e-commerce infrastructure</p>
          </div>
          <button className="create-btn" onClick={() => setIsModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Store
          </button>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-value">{stores.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active</div>
            <div className="stat-value" style={{color: '#10b981'}}>{activeStores}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Provisioning</div>
            <div className="stat-value" style={{color: '#f59e0b'}}>{stores.length - activeStores}</div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <div className="store-grid">
          {stores.map((store) => (
            <div key={store.id} className="store-card">
              <div className="store-header">
                <div style={{flex: 1}}>
                  <h3 className="store-title">{store.name}</h3>
                  <div className="store-id">{store.id}</div>
                </div>
                <span className={`status-badge status-${store.status.toLowerCase()}`}>
                  {store.status}
                </span>
              </div>
              
              <div style={{color: '#737373', fontSize: '0.875rem', marginBottom: '1.5rem', fontWeight: 300}}>
                {new Date(store.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>

              <div className="store-footer">
                <a 
                  href={store.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-primary-ghost"
                >
                  Open
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
                <button 
                  className="btn-icon"
                  onClick={() => handleDeleteStore(store.id)}
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {loading && stores.length === 0 && (
            <div className="empty-state">
              <div className="loading-spinner" style={{borderColor: 'rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', width: 32, height: 32, margin: '0 auto', borderWidth: '1px'}}></div>
              <p style={{marginTop: '1.5rem', fontWeight: 300}}>Loading</p>
            </div>
          )}
          {!loading && stores.length === 0 && (
             <div className="empty-state">
               <p style={{fontSize: '0.875rem', fontWeight: 300}}>No stores deployed</p>
             </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Deploy New Store</h2>
              <p>Create a new Medusa e-commerce instance</p>
            </div>
            <form onSubmit={handleCreateStore}>
              <div className="form-group">
                <label>Store Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Enter store name"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  disabled={creating}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="create-btn"
                  disabled={creating || !newStoreName}
                >
                  {creating ? (
                    <>
                      <div className="loading-spinner"></div>
                      Deploying
                    </>
                  ) : (
                    'Deploy'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
