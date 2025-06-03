/* eslint-disable no-unused-vars */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, {
  handleApiError,
  setAuthToken,
  clearAuthData,
} from "@/utils/axios";
import toast from "react-hot-toast";

// Initial state
const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("accessToken") || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  isLoading: false,
  error: null,

  // Registration state
  registrationStep: "register", // 'register', 'verify-otp'
  registrationData: null,

  // Password reset state
  resetPasswordStep: "request", // 'request', 'reset'
  resetEmail: null,

  // Profile update states
  profileLoading: false,
  imageUploadLoading: false,
};

// Async thunks for auth operations

// Register user
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Registration failed");
      return rejectWithValue(message);
    }
  }
);

// Verify OTP
export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/verify-otp", otpData);

      // Extract user and token from the response
      const { user, token } = response.data;

      // Store auth data
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      if (token) {
        setAuthToken(token);
      }

      console.log("API Response:", response.data); // Debug

      return response.data; // This will be action.payload in the fulfilled case
    } catch (error) {
      const message = handleApiError(error, "OTP verification failed");
      return rejectWithValue(message);
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { user, token } = response.data;

      // Store auth data
      localStorage.setItem("user", JSON.stringify(user));
      setAuthToken(token);

      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Login failed");
      return rejectWithValue(message);
    }
  }
);

// Request password reset
export const requestPasswordReset = createAsyncThunk(
  "auth/requestPasswordReset",
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/request-password-reset", {
        email,
      });
      return { ...response.data, email };
    } catch (error) {
      const message = handleApiError(error, "Password reset request failed");
      return rejectWithValue(message);
    }
  }
);

// Reset password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (resetData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/reset-password", resetData);
      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Password reset failed");
      return rejectWithValue(message);
    }
  }
);

// Google Auth
export const initiateGoogleAuth = createAsyncThunk(
  "auth/initiateGoogleAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/google");
      // This will typically return a redirect URL
      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Google auth initiation failed");
      return rejectWithValue(message);
    }
  }
);

// GitHub Auth
export const initiateGitHubAuth = createAsyncThunk(
  "auth/initiateGitHubAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/github");
      // This will typically return a redirect URL
      return response.data;
    } catch (error) {
      const message = handleApiError(error, "GitHub auth initiation failed");
      return rejectWithValue(message);
    }
  }
);

// Exchange auth code (for social login callbacks)
export const exchangeAuthCode = createAsyncThunk(
  "auth/exchangeAuthCode",
  async (codeData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/exchange-code", codeData);
      const { user, token } = response.data;

      // Store auth data
      localStorage.setItem("user", JSON.stringify(user));
      setAuthToken(token);

      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Auth code exchange failed");
      return rejectWithValue(message);
    }
  }
);

// Get user profile
export const getUserProfile = createAsyncThunk(
  "auth/getUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/profile");
      // Update stored user data
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Failed to fetch profile");
      return rejectWithValue(message);
    }
  }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put("/auth/update-profile", profileData);
      // Update stored user data
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Profile update failed");
      return rejectWithValue(message);
    }
  }
);

export const updateProfileImage = createAsyncThunk(
  "auth/updateProfileImage",
  async (imageData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("profileImage", imageData);

      const response = await api.post("/auth/profile/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // ✅ Increase to 60 seconds (60000ms)
      });

      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Image upload failed");
      return rejectWithValue(message);
    }
  }
);

// Remove profile image
export const removeProfileImage = createAsyncThunk(
  "auth/removeProfileImage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete("/auth/profile/image");
      // Update stored user data
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Failed to remove profile image");
      return rejectWithValue(message);
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
      // Clear auth data regardless of server response
      clearAuthData();
      return {};
    } catch (error) {
      // Even if server request fails, clear local data
      clearAuthData();
      const message = handleApiError(error, "Logout failed");
      return rejectWithValue(message);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Clear auth state (for manual logout)
    clearAuthState: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.registrationStep = "register";
      state.registrationData = null;
      state.resetPasswordStep = "request";
      state.resetEmail = null;
      clearAuthData();
    },

    // Set registration step
    setRegistrationStep: (state, action) => {
      state.registrationStep = action.payload;
    },

    // Set reset password step
    setResetPasswordStep: (state, action) => {
      state.resetPasswordStep = action.payload;
    },

    // Update user data locally
    updateUserData: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register user
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.registrationData = action.payload;
        state.registrationStep = "verify-otp";
        toast.success("Registration successful! Please verify your OTP.");
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;

        const userData = action.payload?.user;
        const token = action.payload?.token;

        console.log("OTP Response payload:", action.payload); // Debug
        console.log("Extracted user data:", userData); // Debug
        console.log("User role:", userData?.role); // Debug

        if (userData) {
          state.user = userData;
          state.token = token;
          state.isAuthenticated = true;
          localStorage.setItem("user", JSON.stringify(userData));
          if (token) {
            state.token = token;
            localStorage.setItem("accessToken", token);
          }
        }

        state.registrationStep = "register";
        state.registrationData = null;
        toast.success("Account verified successfully!");
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Login user
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        toast.success(`Welcome back, ${action.payload.user.name || "User"}!`);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Request password reset
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resetEmail = action.payload.email;
        state.resetPasswordStep = "reset";
        toast.success("Password reset instructions sent to your email!");
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resetPasswordStep = "request";
        state.resetEmail = null;
        toast.success(
          "Password reset successful! Please login with your new password."
        );
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Exchange auth code
      .addCase(exchangeAuthCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exchangeAuthCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        toast.success(`Welcome, ${action.payload.user.name || "User"}!`);
      })
      .addCase(exchangeAuthCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Get user profile
      .addCase(getUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = action.payload.user;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      })

      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = action.payload.user;
        toast.success("Profile updated successfully!");
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Update profile image
      .addCase(updateProfileImage.pending, (state) => {
        state.imageUploadLoading = true;
        state.error = null;
      })
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        state.imageUploadLoading = false;
        if (action.payload.profileImage) {
          state.user.profileImage = action.payload.profileImage;
        }
        toast.success("Profile image updated successfully!");
      })
      .addCase(updateProfileImage.rejected, (state, action) => {
        state.imageUploadLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Remove profile image
      .addCase(removeProfileImage.pending, (state) => {
        state.imageUploadLoading = true;
        state.error = null;
      })
      .addCase(removeProfileImage.fulfilled, (state, action) => {
        state.imageUploadLoading = false;
        state.user = action.payload.user;
        toast.success("Profile image removed successfully!");
      })
      .addCase(removeProfileImage.rejected, (state, action) => {
        state.imageUploadLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Logout user
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.registrationStep = "register";
        state.registrationData = null;
        state.resetPasswordStep = "request";
        state.resetEmail = null;
        toast.success("Logged out successfully!");
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        // Still clear auth data even if server request failed
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.registrationStep = "register";
        state.registrationData = null;
        state.resetPasswordStep = "request";
        state.resetEmail = null;
        toast.success("Logged out successfully!");
      });
  },
});

// Export actions
export const {
  clearError,
  clearAuthState,
  setRegistrationStep,
  setResetPasswordStep,
  updateUserData,
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectRegistrationStep = (state) => state.auth.registrationStep;
export const selectResetPasswordStep = (state) => state.auth.resetPasswordStep;
export const selectProfileLoading = (state) => state.auth.profileLoading;
export const selectImageUploadLoading = (state) =>
  state.auth.imageUploadLoading;

export default authSlice.reducer;
