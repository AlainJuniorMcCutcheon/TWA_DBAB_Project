import { useNavigate } from 'react-router-dom';

export default function Dashboard({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In a real app, you would also clear the session/token
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="card">
      <h1>Host Dashboard</h1>
      <button onClick={handleLogout}>Sign Out</button>
      <p>Welcome to your dashboard</p>
    </div>
  );
}