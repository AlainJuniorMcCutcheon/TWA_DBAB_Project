import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !password) return "All fields are required.";
    if (!emailRegex.test(email)) return "Invalid email format.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const validationError = validateInputs();
    
    if (validationError) {
      setErrorMsg(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/auth/hosts/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      // Handle non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(text || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login failed. Please check your credentials.");
      }

      setIsAuthenticated(true);
      setSuccessMsg("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg(err.message.includes("Failed to fetch") 
        ? "Could not connect to server. Please try again later." 
        : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Host Sign In</h2>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {errorMsg && <p className="error-message">{errorMsg}</p>}
          {successMsg && <p className="success-message">{successMsg}</p>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg("");
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg("");
              }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <a href="/register" className="auth-link">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}