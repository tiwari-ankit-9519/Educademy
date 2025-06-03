import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 60000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.metadata = { startTime: new Date() };

    console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`, {
      headers: config.headers,
      data: config.data,
    });

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata?.startTime;

    console.log(
      `✅ [${response.config.method?.toUpperCase()}] ${response.config.url} - ${
        response.status
      } (${duration}ms)`,
      {
        data: response.data,
        headers: response.headers,
      }
    );

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const duration = new Date() - originalRequest?.metadata?.startTime;

    console.error(
      `❌ [${originalRequest?.method?.toUpperCase()}] ${
        originalRequest?.url
      } - ${error.response?.status} (${duration}ms)`,
      {
        error: error.response?.data,
        status: error.response?.status,
      }
    );

    switch (error.response?.status) {
      case 401:
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        if (!window.location.pathname.includes("/auth")) {
          toast.error("Session expired. Please login again.");
          window.location.href = "/auth/login";
        }
        break;

      case 403:
        toast.error(
          "Access denied. You don't have permission to perform this action."
        );
        break;

      case 404:
        if (!originalRequest.url.includes("/profile")) {
          toast.error("Resource not found.");
        }
        break;

      case 429:
        toast.error("Too many requests. Please try again later.");
        break;

      case 500:
        toast.error("Server error. Please try again later.");
        break;

      case 502:
      case 503:
      case 504:
        toast.error("Service temporarily unavailable. Please try again.");
        break;

      default:
        if (!error.response) {
          toast.error("Network error. Please check your internet connection.");
        } else {
          const message =
            error.response?.data?.message || "An unexpected error occurred.";
          toast.error(message);
        }
        break;
    }

    return Promise.reject(error);
  }
);

export const handleApiError = (
  error,
  defaultMessage = "Something went wrong"
) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return defaultMessage;
  }
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("accessToken", token);
  } else {
    localStorage.removeItem("accessToken");
  }
};

export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

export default api;
