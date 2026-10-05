import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css'; // Import your new global styles

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        
        <Route 
          path="/login" 
          element={<Login setToken={setToken} setRole={setRole} />} 
        />
        
        <Route 
          path="/register" 
          element={<Register />} 
        />
        
        <Route 
          path="/dashboard" 
          element={token ? <Dashboard token={token} setToken={setToken} role={role} setRole={setRole} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}