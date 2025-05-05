import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    hostId: "",
  });
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Invalid email format';
        } else {
          delete newErrors.email;
        }
        break;
        
      case 'password':
        if (!/\d/.test(value)) {
          newErrors.password = 'Must contain a number';
        } else if (!/[A-Z]/.test(value)) {
          newErrors.password = 'Must contain an uppercase letter';
        } else if (value.length < 8) {
          newErrors.password = 'Must be at least 8 characters';
        } else {
          delete newErrors.password;
        }
        break;
        
      case 'confirmPassword':
        if (value !== form.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
        
      default:
        if (!value) {
          newErrors[name] = 'This field is required';
        } else {
          delete newErrors[name];
        }
    }
    
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    Object.entries(form).forEach(([name, value]) => {
      validateField(name, value);
    });
    
    if (Object.keys(errors).length > 0) return;

    try {
      const res = await fetch("http://localhost:5000/api/hosts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setErrors({ server: data.message || "Registration failed" });
      }
    } catch (err) {
      console.error("Registration error:", err);
      setErrors({ server: "Server error. Please try again." });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Host Registration</h2>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {errors.server && <p className="error-message">{errors.server}</p>}
          {successMsg && <p className="success-message">{successMsg}</p>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="hostId">Host ID</label>
            <input
              id="hostId"
              type="text"
              name="hostId"
              value={form.hostId}
              onChange={handleChange}
              required
              className={errors.hostId ? 'error' : ''}
            />
            {errors.hostId && <span className="error-message">{errors.hostId}</span>}
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={Object.keys(errors).length > 0}
          >
            Register
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <a href="/login" className="auth-link">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}