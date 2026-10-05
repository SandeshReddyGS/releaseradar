import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login({ setToken, setRole }) {
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
        setRole(data.user.role);
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error connecting to server');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>ReleaseRadar Login</h2>
        
        {error && <div className="error-banner">{error}</div>}
        
        <form className="auth-form" onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Email Address" 
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
          <button type="submit" className="btn-submit">Sign In</button>
        </form>
        
        <div className="auth-link">
          Need an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}