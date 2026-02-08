import React, { useState, useEffect } from 'react';
import './App.css';

interface Store {
  id: string;
  name: string;
  status: string;
  url: string;
  created_at: string;
}

const API_URL = 'http://127.0.0.1:8000';

function App() {
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
        
        // Merge strategy: Keep locally "Provisioning" stores if they are missing from backend
        // This prevents the "vanishing" effect when helm list hasn't updated yet
        setStores((prevStores) => {
          const backendStoreIds = new Set(data.map((s: Store) => s.id));
          const missingProvisioningStores = prevStores.filter(s => 
            s.status === 'Provisioning' && 
            !backendStoreIds.has(s.id) &&
            // Only keep them for 60 seconds to avoid zombie stores if they truly fail to create
            (new Date().getTime() - new Date(s.created_at).getTime() < 60000)
          );
          
          // Combine backend data with kept local stores
          // Sort by creation date descending to keep UI consistent
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
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Urumi
        </div>
        <nav>
          <div className="nav-item active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </div>
          <div className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
            </svg>
            Billing
          </div>
          <div className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Settings
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1>Store Orchestrator</h1>
            <p style={{color: '#6b7280', marginTop: '0.5rem'}}>Manage your e-commerce fleet</p>
          </div>
          <button className="create-btn" onClick={() => setIsModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Store
          </button>
        </header>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Stores</div>
            <div className="stat-value">{stores.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Stores</div>
            <div className="stat-value" style={{color: '#10b981'}}>{activeStores}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Provisioning</div>
            <div className="stat-value" style={{color: '#f59e0b'}}>{stores.length - activeStores}</div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        {/* Store Grid */}
        <div className="store-grid">
          {stores.map((store) => (
            <div key={store.id} className="store-card">
              <div className="store-header">
                <div>
                  <h3 className="store-title">{store.name}</h3>
                  <span className="store-id">{store.id}</span>
                </div>
                <span className={`status-badge status-${store.status.toLowerCase()}`}>
                  {store.status}
                </span>
              </div>
              
              <div style={{color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem'}}>
                Created {new Date(store.created_at).toLocaleDateString()}
              </div>

              <div className="store-footer">
                <a 
                  href={store.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-primary-ghost"
                  style={{textDecoration: 'none'}}
                >
                  Open Store
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
                <button 
                  className="btn-icon"
                  onClick={() => handleDeleteStore(store.id)}
                  title="Delete Store"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {loading && stores.length === 0 && (
            <div className="empty-state">
              <div className="loading-spinner" style={{borderColor: '#6366f1', borderTopColor: 'transparent', width: 40, height: 40, margin: '0 auto'}}></div>
              <p style={{marginTop: '1rem'}}>Loading stores...</p>
            </div>
          )}
          {!loading && stores.length === 0 && (
             <div className="empty-state" style={{gridColumn: '1 / -1'}}>
               <p>No stores found. Create your first store!</p>
             </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Launch New Store</h2>
              <p style={{color: '#6b7280', fontSize: '0.875rem'}}>Deploy a fully managed Medusa e-commerce store in seconds.</p>
            </div>
            <form onSubmit={handleCreateStore}>
              <div className="form-group">
                <label>Store Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Fashion Boutique"
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
                  style={{width: 'auto'}}
                >
                  {creating ? (
                    <>
                      <div className="loading-spinner"></div>
                      Deploying...
                    </>
                  ) : (
                    'Launch Store'
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

export default App;
