import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers["Content-Type"] === undefined) {
      config.headers["Content-Type"] = "application/json";
    }
    config.headers["Accept"] = "application/json";
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    if (response) {
      if (response.status === 401) {
        const isLoginRequest = error.config?.url?.includes("/auth/login");
        const isRegisterRequest = error.config?.url?.includes("/auth/register");
        const isPasswordResetRequest = error.config?.url?.includes(
          "/auth/reset-password"
        );
        const isOtpRequest =
          error.config?.url?.includes("/auth/verify") ||
          error.config?.url?.includes("/auth/resend-otp");

        const isPublicAuthRequest =
          isLoginRequest ||
          isRegisterRequest ||
          isPasswordResetRequest ||
          isOtpRequest;

        if (!isPublicAuthRequest) {
          const errorMessage =
            response.data?.message || response.data?.error || "";
          const isTokenExpired =
            errorMessage.toLowerCase().includes("token") &&
            (errorMessage.toLowerCase().includes("expired") ||
              errorMessage.toLowerCase().includes("invalid") ||
              errorMessage.toLowerCase().includes("malformed"));

          if (isTokenExpired) {
            localStorage.removeItem("token");
            toast.error("Session expired. Please login again.");
            window.location.href = "/login";
          }
        }
      }
      if (response.status === 403) {
        const errorMessage =
          response.data?.message ||
          "You don't have permission to access this resource";
        toast.error(errorMessage);
      }
      if (response.status >= 500) {
        const errorMessage =
          response.data?.message ||
          response.statusText ||
          "Internal server error";
        toast.error(`Server Error: ${errorMessage}`);
        console.error("Server error:", errorMessage);
      }
    } else {
      toast.error("Network error. Please check your connection.");
    }
    return Promise.reject(error);
  }
);

export default api;
