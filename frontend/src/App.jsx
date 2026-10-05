import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import Register from './components/Register';

// --- DASHBOARD COMPONENT ---
function Dashboard({ token, setToken, role, setRole }) {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    fetch('/api/projects', { 
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setProjects(data);
      })
      .catch(err => setError(err.message));
  }, [token]);

  const handleLogout = () => {
    setToken('');
    setRole('');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
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

// --- LOGIN COMPONENT ---
function Login({ setToken, setRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
        setRole(data.role);
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error connecting to server');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>ReleaseRadar Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit">Sign In</button>
      </form>
      <p style={{ marginTop: '15px' }}>Need an account? <Link to="/register">Register here</Link></p>
    </div>
  );
}

// --- MAIN APP COMPONENT (ROUTER SETUP) ---
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to dashboard if logged in, otherwise login */}
        <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        <Route path="/login" element={<Login setToken={setToken} setRole={setRole} />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protect the dashboard route */}
        <Route 
          path="/dashboard" 
          element={token ? <Dashboard token={token} setToken={setToken} role={role} setRole={setRole} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}