
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function CampusStaff() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [staffToken, setStaffToken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Admin login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await API.post("/campus/staff-login", {
        email: email.trim(),
        password,
      });

      setStaffToken(response.data.access_token);
      setMessage(
        "Login successful! Enter the student's register number."
      );
      setPassword("");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Login failed. Check backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify student and open voting page
  const handleVerifyStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await API.post(
        "/campus/authorize",
        { register_number: registerNumber.trim() },
        {
          headers: {
            Authorization: `Bearer ${staffToken}`,
          },
        }
      );

      const campusToken = response.data.campus_token;

      if (!campusToken) {
        setMessage("Campus authorization token was not received.");
        return;
      }

      navigate("/campus/student-vote", {
        state: { campusToken },
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Student verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    boxSizing: "border-box",
    background:
      "linear-gradient(135deg, #111827 0%, #3730a3 50%, #7c3aed 100%)",
    fontFamily: "Arial, sans-serif",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "430px",
    padding: "36px",
    boxSizing: "border-box",
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  };

  const inputStyle = {
    width: "100%",
    display: "block",
    padding: "13px 14px",
    marginTop: "8px",
    marginBottom: "20px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    boxSizing: "border-box",
    fontSize: "15px",
    outlineColor: "#4f46e5",
  };

  const labelStyle = {
    display: "block",
    color: "#334155",
    fontWeight: "600",
    fontSize: "14px",
  };

  const buttonStyle = {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "9px",
    background: loading ? "#94a3b8" : "#4f46e5",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: loading ? "not-allowed" : "pointer",
  };

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div
          style={{
            textAlign: "center",
            fontSize: "48px",
            marginBottom: "8px",
          }}
        >
          🗳️
        </div>

        <h1
          style={{
            textAlign: "center",
            color: "#172554",
            fontSize: "28px",
            margin: "0 0 8px",
          }}
        >
          Campus Voting
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            fontSize: "14px",
            lineHeight: 1.6,
            marginBottom: "30px",
          }}
        >
          Secure Campus Election Portal
        </p>

        {!staffToken ? (
          <form onSubmit={handleLogin}>
            <h2
              style={{
                color: "#1e293b",
                fontSize: "21px",
                marginBottom: "24px",
              }}
            >
              Admin Login
            </h2>

            <label style={labelStyle} htmlFor="campus-email">
              Email Address
            </label>
            <input
              id="campus-email"
              style={inputStyle}
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />

            <label style={labelStyle} htmlFor="campus-password">
              Password
            </label>
            <input
              id="campus-password"
              style={inputStyle}
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              type="submit"
              style={buttonStyle}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login Securely →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyStudent}>
            <h2
              style={{
                color: "#1e293b",
                fontSize: "21px",
                marginBottom: "12px",
              }}
            >
              Verify Student
            </h2>

            <p
              style={{
                color: "#64748b",
                fontSize: "14px",
                lineHeight: 1.6,
                marginBottom: "24px",
              }}
            >
              Enter the student's register number to authorize campus voting.
            </p>

            <label style={labelStyle} htmlFor="register-number">
              Register Number
            </label>
            <input
              id="register-number"
              style={inputStyle}
              type="text"
              placeholder="Enter register number"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              required
            />

            <button
              type="submit"
              style={buttonStyle}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Student →"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStaffToken("");
                setRegisterNumber("");
                setMessage("");
              }}
              style={{
                ...buttonStyle,
                marginTop: "12px",
                background: "#e2e8f0",
                color: "#334155",
              }}
              disabled={loading}
            >
              Logout
            </button>
          </form>
        )}

        {message && (
          <div
            role="status"
            style={{
              marginTop: "20px",
              padding: "12px",
              borderRadius: "9px",
              background: "#f1f5f9",
              color: "#334155",
              fontSize: "14px",
              lineHeight: 1.5,
              overflowWrap: "anywhere",
            }}
          >
            {message}
          </div>
        )}

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            fontSize: "12px",
            marginTop: "28px",
            marginBottom: 0,
          }}
        >
          🔒 Authorized campus access only
        </p>
      </section>
    </main>
  );
}
