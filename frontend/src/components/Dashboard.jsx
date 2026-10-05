import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ token, setToken, role, setRole }) {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    fetch('/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProjects(data);
      })
      .catch((err) => setError(err.message));
  }, [token]);

  const handleLogout = () => {
    setToken('');
    setRole('');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete project');
        return;
      }
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddProject = async () => {
    const name = prompt('Enter project name:');
    const team = prompt('Enter team name:');
    const last_deploy_date = prompt('Enter last deploy date (YYYY-MM-DD):');
    const deploy_message = prompt('Enter deployment message:');

    if (!name || !team) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, team, last_deploy_date, deploy_message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create project');
        return;
      }
      setProjects((prev) => [...prev, data]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = async (project) => {
    const name = prompt('Edit project name:', project.name);
    const team = prompt('Edit team name:', project.team);
    const last_deploy_date = prompt('Edit last deploy date (YYYY-MM-DD):', project.last_deploy_date || '');
    const deploy_message = prompt('Edit deployment message:', project.deploy_message || '');

    if (!name || !team) return;

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, team, last_deploy_date, deploy_message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update project');
        return;
      }
      setProjects((prev) => prev.map((p) => (p.id === project.id ? data : p)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>ReleaseRadar Live Dashboard</h2>
          <p>Logged in as: <strong>{role}</strong></p>
        </div>
        <div className="header-buttons">
          {role === 'Admin' && (
            <button onClick={handleAddProject} className="btn-add">+ New Project</button>
          )}
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-container">
        <table className="projects-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Project Name</th>
              <th>Team</th>
              <th>Last Deploy Date</th>
              <th>Deploy Message</th>
              {role === 'Admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {projects.map((proj) => (
              <tr key={proj.id}>
                <td>{proj.id}</td>
                <td style={{ fontWeight: '500', color: '#2c3e50' }}>{proj.name}</td>
                <td><span className="team-badge">{proj.team}</span></td>
                <td>
                  {proj.last_deploy_date 
                    ? new Date(proj.last_deploy_date).toLocaleDateString() 
                    : 'N/A'}
                </td>
                <td>{proj.deploy_message || 'N/A'}</td>
                
                {role === 'Admin' && (
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(proj)} className="btn-edit">Edit</button>
                      <button onClick={() => handleDelete(proj.id)} className="btn-delete">Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}