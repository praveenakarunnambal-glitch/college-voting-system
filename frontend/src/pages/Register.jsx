import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import API from "../api";


function Register() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  const handleRegister = async (e) => {

    e.preventDefault();

    setMessage("");
    setError("");

    try {

      const response = await API.post(
        "/auth/register",
        {
          name,
          email,
          password
        }
      );

      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Registration failed"
      );
    }
  };


  return (

    <div className="auth-container">

      <div className="auth-card">

        <h1>Student Registration</h1>

        <form onSubmit={handleRegister}>

          <label>Full Name</label>

          <input
            type="text"
            placeholder="Enter full name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            minLength="6"
            required
          />

          <button type="submit">
            Register
          </button>

        </form>

        {message && (
          <p className="success">
            {message}
          </p>
        )}

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <p>
          Already registered?{" "}
          <Link to="/">
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}

export default Register;
