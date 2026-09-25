import { useState, useEffect } from 'react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) setError(data.error);
          else setProjects(data);
        })
        .catch(err => setError(err.message));
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error connecting to server');
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setProjects([]);
  };

  if (!token) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
        <h2>ReleaseRadar Login</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="email" 
            placeholder="Email (e.g., admin@company.com)" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password (e.g., admin123)" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit">Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>ReleaseRadar Dashboard</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <h3>Active Projects</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '10px' }}>ID</th>
            <th>Project Name</th>
            <th>Team</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(proj => (
            <tr key={proj.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{proj.id}</td>
              <td>{proj.name}</td>
              <td>{proj.team}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}