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
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const validateForm = async () => {
    const { email, password, confirmPassword, firstName, lastName, hostId } = form;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasNumber = /\d/;
    const hasUpperCase = /[A-Z]/;

    if (!email || !password || !confirmPassword || !firstName || !lastName || !hostId) {
      return "All fields are required.";
    }
    if (!emailRegex.test(email)) return "Invalid email format.";
    if (!hasNumber.test(password) || !hasUpperCase.test(password))
      return "Password must contain a number and an uppercase letter.";
    if (password !== confirmPassword) return "Passwords do not match.";

    // Host ID validation (simulate a call to the server for now)
    const res = await fetch("http://localhost:3000/api/hosts/validate-host-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId }),
    });
    const data = await res.json();
    if (!res.ok || !data.valid) return data.message || "Invalid Host ID.";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validationError = await validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/hosts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Account created! Redirecting to sign in...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setErrorMsg(data.message || "Registration failed.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setErrorMsg("Server error. Please try again.");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMsg("");
    setSuccessMsg("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-bold text-center text-gray-700">Host Registration</h2>

        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
        {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

        {["email", "firstName", "lastName", "hostId"].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium capitalize">{field}</label>
            <input
              type="text"
              name={field}
              value={form[field]}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded border-gray-300 shadow-sm focus:ring focus:ring-blue-300"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded border-gray-300 shadow-sm focus:ring focus:ring-blue-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded border-gray-300 shadow-sm focus:ring focus:ring-blue-300"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Register
        </button>

        <p className="text-center text-sm text-gray-500 mt-2">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}
