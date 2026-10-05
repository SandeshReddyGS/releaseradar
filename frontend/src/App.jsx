import { useState, useEffect } from 'react';
import Register from './components/Register';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

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
        setRole(data.role); // Save the role to state
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role); // Save the role to storage
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error connecting to server');
    }
  };

  const handleLogout = () => {
    setToken('');
    setRole('');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setProjects([]);
  };

  const handleDelete = async (id) => {
    await fetch(`/api/projects/${id}`, { 
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setProjects(projects.filter(p => p.id !== id));
  };

  const handleAddProject = async () => {
    const name = prompt("Enter project name:");
    const team = prompt("Enter team name:");
    
    if (name && team) {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name, team })
      });
      
      if (res.ok) {
        const newProject = await res.json();
        setProjects([...projects, newProject]);
      }
    }
  };

  if (!token) {
    if (showRegister) {
      return (
        <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
          <Register />
          <button onClick={() => setShowRegister(false)} style={{ marginTop: '10px' }}>Back to Login</button>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
        <h2>ReleaseRadar Login</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="email" 
            placeholder="Email (e.g. admin@company.com)" 
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
        <button onClick={() => setShowRegister(true)} style={{ marginTop: '15px' }}>Need an account? Register</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>ReleaseRadar live Dashboard</h2>
        <div>
          {role === 'Admin' && (
            <button onClick={handleAddProject} style={{ marginRight: '10px' }}>New Project</button>
          )}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <h3>Active Projects</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '10px' }}>ID</th>
            <th>Project Name</th>
            <th>Team</th>
            {role === 'Admin' && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {projects.map(proj => (
            <tr key={proj.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{proj.id}</td>
              <td>{proj.name}</td>
              <td>{proj.team}</td>
              
              {role === 'Admin' && (
                <td>
                  <button onClick={() => handleDelete(proj.id)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}