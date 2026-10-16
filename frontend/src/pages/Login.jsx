
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

function Login() {
  const navigate = useNavigate();

  const [loginMode, setLoginMode] = useState("choose");

  // Online student login
  const [name, setName] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Admin login
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const resetMessage = () => {
    setMessage("");
    setMessageType("");
  };

  // =========================================
  // OPEN LOGIN OPTIONS
  // =========================================

  const openMode = (mode) => {
    setLoginMode(mode);
    setOtpSent(false);
    setOtp("");
    resetMessage();
  };

  // =========================================
  // CAMPUS LOGIN
  // Keep existing staff authorization flow.
  // =========================================

  const openCampusLogin = () => {
    navigate("/campus");
  };

  // =========================================
  // SEND ONLINE OTP
  // =========================================

  const handleSendOTP = async (e) => {
    e.preventDefault();
    resetMessage();

    if (!name.trim() || !registerNumber.trim() || !mobile.trim()) {
      showMessage("Please fill all student details");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/send-otp", {
        name: name.trim(),
        register_number: registerNumber.trim(),
        mobile: mobile.trim()
      });

      setOtpSent(true);
      showMessage(
        response.data.message || "OTP sent successfully",
        "success"
      );
    } catch (error) {
      console.error("SEND OTP ERROR:", error);

      showMessage(
        error.response?.data?.message || "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // VERIFY OTP AND LOGIN
  // =========================================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    resetMessage();

    if (!otp.trim()) {
      showMessage("Please enter OTP");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/verify-otp", {
        name: name.trim(),
        register_number: registerNumber.trim(),
        mobile: mobile.trim(),
        otp: otp.trim()
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      showMessage("OTP verified successfully", "success");
      navigate("/student");
    } catch (error) {
      console.error("VERIFY OTP ERROR:", error);

      showMessage(
        error.response?.data?.message || "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // ADMIN LOGIN
  // =========================================

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    resetMessage();

    if (!adminEmail.trim() || !adminPassword) {
      showMessage("Enter admin email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/login", {
        email: adminEmail.trim(),
        password: adminPassword
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/admin");
    } catch (error) {
      console.error("ADMIN LOGIN ERROR:", error);

      showMessage(
        error.response?.data?.message || "Admin login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // LOGIN PAGE UI
  // =========================================

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>College Voting System</h1>
        <p className="subtitle">Student Election Portal</p>

        {/* LOGIN CHOICES */}
        {loginMode === "choose" && (
          <>
            <h2>Select Login Type</h2>

            <button
              type="button"
              onClick={openCampusLogin}
              disabled={loading}
            >
              Campus Login
            </button>

            <button
              type="button"
              onClick={() => openMode("online")}
              disabled={loading}
            >
              Online Login
            </button>

            <button
              type="button"
              onClick={() => openMode("admin")}
              disabled={loading}
            >
              Admin Login
            </button>

            <p>
              New student? <Link to="/register">Register here</Link>
            </p>
          </>
        )}

        {/* ONLINE STUDENT LOGIN */}
        {loginMode === "online" && (
          <>
            <h2>Online Student Login</h2>

            {!otpSent ? (
              <form onSubmit={handleSendOTP}>
                <label>Student Name</label>
                <input
                  type="text"
                  placeholder="Enter student name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <label>Register Number</label>
                <input
                  type="text"
                  placeholder="Enter register number"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  required
                />

                <label>Registered Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter registered phone number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />

                <button type="submit" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <p>Enter the OTP sent to your registered phone.</p>

                <label>OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  required
                />

                <button type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP & Login"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    resetMessage();
                  }}
                  disabled={loading}
                >
                  Change Details
                </button>
              </form>
            )}

            {message && (
              <p className={messageType === "success" ? "success" : "error"}>
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={() => openMode("choose")}
              disabled={loading}
            >
              Back to Login Options
            </button>
          </>
        )}

        {/* ADMIN LOGIN */}
        {loginMode === "admin" && (
          <>
            <h2>Admin Login</h2>

            <form onSubmit={handleAdminLogin}>
              <label>Admin Email</label>
              <input
                type="email"
                placeholder="Enter admin email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />

              <label>Admin Password</label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login as Admin"}
              </button>
            </form>

            {message && (
              <p className={messageType === "success" ? "success" : "error"}>
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={() => openMode("choose")}
              disabled={loading}
            >
              Back to Login Options
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
