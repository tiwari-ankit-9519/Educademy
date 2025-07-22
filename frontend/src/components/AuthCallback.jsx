/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { exchangeAuthCode } from "@/features/authSlice";

const AuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  const { loading, error: authError } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get("code");
      const success = searchParams.get("success");
      const error = searchParams.get("error");
      if (error) {
        console.error("OAuth error from URL:", error);
        setError(error);
        setTimeout(() => navigate("/login?error=" + error), 2000);
        return;
      }

      if (!code || success !== "true") {
        console.error("Missing code or success flag:", {
          hasCode: !!code,
          success,
        });
        setError("Missing authorization code");
        setTimeout(() => navigate("/login?error=missing_code"), 2000);
        return;
      }

      try {
        const result = await dispatch(exchangeAuthCode({ code })).unwrap();

        navigate("/dashboard");
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Authentication failed: " + (err.message || "Unknown error"));
        setTimeout(() => navigate("/login?error=exchange_failed"), 3000);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error || authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Authentication Failed
          </h2>
          <p className="text-gray-600 mb-4">Error: {error || authError}</p>
          <p className="text-sm text-gray-500 mb-4">Redirecting to login...</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
