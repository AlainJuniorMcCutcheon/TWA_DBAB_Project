import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout({ setIsAuthenticated }) {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/hosts/logout", {
          method: "POST",
          credentials: "include",
        });

        if (res.ok) {
          setIsAuthenticated(false);
          navigate("/login");
        }
      } catch (err) {
        console.error("Logout error:", err);
      }
    };

    logout();
  }, [navigate, setIsAuthenticated]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Logging out...</h2>
      </div>
    </div>
  );
}