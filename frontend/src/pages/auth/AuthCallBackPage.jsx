import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { exchangeCode } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution
    if (hasProcessed.current) return;

    const code = searchParams.get("code");
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    console.log("=== AUTH CALLBACK DEBUG ===");
    console.log("Code:", code);
    console.log("Success:", success);
    console.log("Error:", error);
    console.log("Has processed:", hasProcessed.current);
    console.log("==========================");

    if (error) {
      console.error("OAuth error:", error);
      navigate("/auth/login?error=" + error);
      return;
    }

    if (success === "true" && code) {
      hasProcessed.current = true; // Mark as processed
      console.log("Attempting to exchange code:", code);
      exchangeCode({ code })
        .then((result) => {
          console.log("Code exchange successful:", result);
          navigate("/dashboard");
        })
        .catch((err) => {
          console.error("Code exchange failed:", err);
          console.error("Error details:", err.response?.data || err.message);
          hasProcessed.current = false; // Reset on error to allow retry
          navigate("/auth/login?error=exchange_failed");
        });
    } else {
      console.log("Invalid callback - missing code or success flag");
      navigate("/auth/login?error=invalid_callback");
    }
  }, [searchParams, exchangeCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
        <p className="text-slate-600 dark:text-slate-300">
          Completing authentication...
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
