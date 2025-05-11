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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    
    // Remove server error when user starts typing
    if (newErrors.server && name !== 'server') {
      delete newErrors.server;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate all fields
    let isValid = true;
    Object.entries(form).forEach(([name, value]) => {
      if (!validateField(name, value)) isValid = false;
    });
    
    if (!isValid) {
      setIsSubmitting(false);
      return;
    }
  
    try {
      const res = await fetch("http://localhost:5000/auth/hosts/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          hostId: form.hostId
        }),
      });
  
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(text || `HTTP error! status: ${res.status}`);
      }
  
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `HTTP error! status: ${res.status}`);
      }
  
      setSuccessMsg("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setErrors(prev => ({ 
        ...prev,
        server: err.message.includes("Failed to fetch") 
          ? "Could not connect to server. Please try again later." 
          : err.message 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only disable button during submission, not after errors
  const isFormValid = Object.keys(errors).filter(k => k !== 'server').length === 0;

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
              onBlur={(e) => validateField('email', e.target.value)}
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
              onBlur={(e) => validateField('password', e.target.value)}
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
              onBlur={(e) => validateField('confirmPassword', e.target.value)}
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
              onBlur={(e) => validateField('firstName', e.target.value)}
              required
            />
            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              onBlur={(e) => validateField('lastName', e.target.value)}
              required
            />
            {errors.lastName && <span className="error-message">{errors.lastName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="hostId">Host ID</label>
            <input
              id="hostId"
              type="text"
              name="hostId"
              value={form.hostId}
              onChange={handleChange}
              onBlur={(e) => validateField('hostId', e.target.value)}
              required
              className={errors.hostId ? 'error' : ''}
            />
            {errors.hostId && <span className="error-message">{errors.hostId}</span>}
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? 'Registering...' : 'Register'}
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