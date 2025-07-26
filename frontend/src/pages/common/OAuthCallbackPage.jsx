import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { exchangeAuthCode } from "@/features/common/authSlice";

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Processing your login...");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const success = searchParams.get("success");
      const provider = searchParams.get("provider");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage("Authentication failed. Please try again.");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      if (!code || success !== "true") {
        setStatus("error");
        setMessage("Invalid authentication response.");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      try {
        await dispatch(exchangeAuthCode({ code })).unwrap();
        setStatus("success");
        setMessage(`Successfully logged in with ${provider}!`);
        setTimeout(() => navigate("/"), 1500);
      } catch (error) {
        console.error("Auth code exchange failed:", error);
        setStatus("error");
        setMessage("Failed to complete authentication. Please try again.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {status === "processing" && (
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-blue-500" />
          )}
          {status === "success" && (
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
          )}
          {status === "error" && (
            <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          {status === "processing" && "Processing Login"}
          {status === "success" && "Login Successful"}
          {status === "error" && "Login Failed"}
        </h2>

        <p className="text-slate-600 dark:text-slate-300 mb-6">{message}</p>

        {status === "processing" && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
