import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function Verify() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userId) {
      setMessage("Missing user ID. Please register again.");
    }
  }, [userId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!userId || !otp) {
      setMessage("User ID or OTP is missing.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        userId,
        otp,
      });

      const role = res.data?.role;
      alert("OTP verified successfully!");

      // Role-based redirection
      switch (role) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "cashier":
          navigate("/cashier-dashboard");
          break;
        case "inventory":
          navigate("/inventory-dashboard");
          break;
        default:
          navigate("/");
          break;
      }
    } catch (err) {
      console.error("Verification failed:", err.response?.data || err.message);
      setMessage(err.response?.data?.message || "Invalid or expired OTP.");
    }
  };

  const handleResend = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/resend-otp", { userId });
      setTimeLeft(60);
      setCanResend(false);
      setMessage("A new OTP has been sent to your email.");
    } catch (err) {
      console.error("Resend failed:", err.response?.data || err.message);
      setMessage("Failed to resend OTP.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center text-primary mb-4">Verify OTP</h2>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <form onSubmit={handleVerify} className="border p-4 shadow rounded bg-white">
            {message && <div className="alert alert-info">{message}</div>}

            <div className="mb-3">
              <label className="form-label">Enter the OTP sent to your email</label>
              <input
                type="text"
                name="otp"
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-success w-100 mb-2">Verify OTP</button>

            <div className="text-center text-muted mb-2">
              {timeLeft > 0 ? (
                <>Resend OTP in <strong>{timeLeft}s</strong></>
              ) : (
                <span className="text-success">You can now resend the OTP</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleResend}
              className="btn btn-outline-primary w-100"
              disabled={!canResend}
            >
              Resend OTP
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
