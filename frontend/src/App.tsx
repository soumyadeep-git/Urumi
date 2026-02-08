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

  const fetchStores = async () => {
    try {
      const response = await fetch(`${API_URL}/stores`);
      if (response.ok) {
        const data = await response.json();
        setStores(data);
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

  return (
    <div className="container">
      <h1>Urumi Store Orchestrator</h1>
      
      <div className="card create-store-form">
        <h2>Create New Store</h2>
        <form onSubmit={handleCreateStore}>
          <input
            type="text"
            placeholder="Store Name"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            disabled={creating}
          />
          <button type="submit" disabled={creating || !newStoreName}>
            {creating ? 'Creating...' : 'Create Store'}
          </button>
        </form>
      </div>

      <div className="store-list">
        <h2>Existing Stores</h2>
        {error && <div className="error-message">{error}</div>}
        {loading && stores.length === 0 ? (
          <p>Loading...</p>
        ) : stores.length === 0 ? (
          <p>No stores found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name / ID</th>
                <th>Status</th>
                <th>URL</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id}>
                  <td>
                    <div className="store-name">{store.name}</div>
                    <small>{store.id}</small>
                  </td>
                  <td>
                    <span className={`status-badge status-${store.status.toLowerCase()}`}>
                      {store.status}
                    </span>
                  </td>
                  <td>
                    <a href={store.url} target="_blank" rel="noreferrer">
                      Open Store
                    </a>
                  </td>
                  <td>{new Date(store.created_at).toLocaleString()}</td>
                  <td>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteStore(store.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
