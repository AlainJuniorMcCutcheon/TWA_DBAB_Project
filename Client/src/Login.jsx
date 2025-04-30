import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !password) return "All fields are required.";
    if (!emailRegex.test(email)) return "Invalid email format.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateInputs();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/hosts/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // for cookies if using sessions
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Login successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setErrorMsg(data.message || "Login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Server error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-700">Host Sign In</h2>

        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
        {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            required
            className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            required
            className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Sign In
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don’t have an account?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Register here
          </a>
        </p>
      </form>
    </div>
  );
}
