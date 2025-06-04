/* eslint-disable no-unused-vars */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, {
  handleApiError,
  setAuthToken,
  clearAuthData,
} from "@/utils/axios";
import toast from "react-hot-toast";

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("accessToken") || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  isLoading: false,
  error: null,

  registrationStep: "register",
  registrationData: null,

  resetPasswordStep: "request",
  resetEmail: null,

  profileLoading: false,
  imageUploadLoading: false,

  deactivatedUserData: null,
  needsReactivation: false,
  reactivationLoading: false,
  reactivationStatus: null,
  reactivationStatusLoading: false,
  reactivationRequestData: null,
};

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

export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/verify-otp", otpData);

      const { user, token } = response.data;

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      if (token) {
        setAuthToken(token);
      }

      console.log("API Response:", response.data);

      return response.data;
    } catch (error) {
      const message = handleApiError(error, "OTP verification failed");
      return rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { user, token } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      setAuthToken(token);

      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData.errorType === "ACCOUNT_DEACTIVATED") {
          return rejectWithValue({
            type: "ACCOUNT_DEACTIVATED",
            message: errorData.message,
            userData: {
              userId: errorData.userId,
              userEmail: errorData.userEmail,
              userName: errorData.userName,
              existingRequest: errorData.existingRequest,
            },
          });
        } else if (errorData.errorType === "EMAIL_NOT_VERIFIED") {
          return rejectWithValue({
            type: "EMAIL_NOT_VERIFIED",
            message: errorData.message,
            needsVerification: true,
            userId: errorData.userId,
          });
        }
      }
      const message = handleApiError(error, "Login failed");
      return rejectWithValue(message);
    }
  }
);

export const requestAccountReactivation = createAsyncThunk(
  "auth/requestAccountReactivation",
  async (reactivationData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/auth/request-reactivation",
        reactivationData
      );
      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Reactivation request failed");
      return rejectWithValue(message);
    }
  }
);

export const checkReactivationStatus = createAsyncThunk(
  "auth/checkReactivationStatus",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/auth/reactivation-status/${userId}`);
      return response.data;
    } catch (error) {
      const message = handleApiError(
        error,
        "Failed to check reactivation status"
      );
      return rejectWithValue(message);
    }
  }
);

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

export const initiateGoogleAuth = createAsyncThunk(
  "auth/initiateGoogleAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/google");
      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Google auth initiation failed");
      return rejectWithValue(message);
    }
  }
);

export const initiateGitHubAuth = createAsyncThunk(
  "auth/initiateGitHubAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/github");
      return response.data;
    } catch (error) {
      const message = handleApiError(error, "GitHub auth initiation failed");
      return rejectWithValue(message);
    }
  }
);

export const exchangeAuthCode = createAsyncThunk(
  "auth/exchangeAuthCode",
  async (codeData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/exchange-code", codeData);
      const { user, token } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      setAuthToken(token);

      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Auth code exchange failed");
      return rejectWithValue(message);
    }
  }
);

export const getUserProfile = createAsyncThunk(
  "auth/getUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/profile");
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Failed to fetch profile");
      return rejectWithValue(message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put("/auth/update-profile", profileData);
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
        timeout: 60000,
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

export const removeProfileImage = createAsyncThunk(
  "auth/removeProfileImage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete("/auth/profile/image");
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      const message = handleApiError(error, "Failed to remove profile image");
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
      clearAuthData();
      return {};
    } catch (error) {
      clearAuthData();
      const message = handleApiError(error, "Logout failed");
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    clearAuthState: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.registrationStep = "register";
      state.registrationData = null;
      state.resetPasswordStep = "request";
      state.resetEmail = null;
      state.deactivatedUserData = null;
      state.needsReactivation = false;
      state.reactivationStatus = null;
      state.reactivationRequestData = null;
      clearAuthData();
    },

    setRegistrationStep: (state, action) => {
      state.registrationStep = action.payload;
    },

    setResetPasswordStep: (state, action) => {
      state.resetPasswordStep = action.payload;
    },

    updateUserData: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },

    clearDeactivatedUserData: (state) => {
      state.deactivatedUserData = null;
      state.needsReactivation = false;
      state.reactivationStatus = null;
      state.reactivationRequestData = null;
    },

    setDeactivatedUserData: (state, action) => {
      state.deactivatedUserData = action.payload;
      state.needsReactivation = true;
    },

    clearReactivationStatus: (state) => {
      state.reactivationStatus = null;
      state.reactivationRequestData = null;
    },

    setReactivationRequestData: (state, action) => {
      state.reactivationRequestData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
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

      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;

        const userData = action.payload?.user;
        const token = action.payload?.token;

        console.log("OTP Response payload:", action.payload);
        console.log("Extracted user data:", userData);
        console.log("User role:", userData?.role);

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

      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.deactivatedUserData = null;
        state.needsReactivation = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        toast.success(
          `Welcome back, ${action.payload.user.firstName || "User"}!`
        );
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;

        if (typeof action.payload === "object" && action.payload.type) {
          if (action.payload.type === "ACCOUNT_DEACTIVATED") {
            state.deactivatedUserData = action.payload.userData;
            state.needsReactivation = true;
            state.error = action.payload.message;
            if (action.payload.userData.existingRequest) {
              state.reactivationRequestData =
                action.payload.userData.existingRequest;
            }
          } else if (action.payload.type === "EMAIL_NOT_VERIFIED") {
            state.error = action.payload.message;
            state.registrationStep = "verify-otp";
          }
        } else {
          state.error = action.payload;
        }

        if (typeof action.payload === "string") {
          toast.error(action.payload);
        } else {
          toast.error(action.payload.message);
        }
      })

      .addCase(requestAccountReactivation.pending, (state) => {
        state.reactivationLoading = true;
        state.error = null;
      })
      .addCase(requestAccountReactivation.fulfilled, (state, action) => {
        state.reactivationLoading = false;
        state.reactivationRequestData = action.payload.data;
        toast.success(
          "Reactivation request sent successfully! You will be notified once reviewed."
        );
      })
      .addCase(requestAccountReactivation.rejected, (state, action) => {
        state.reactivationLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      .addCase(checkReactivationStatus.pending, (state) => {
        state.reactivationStatusLoading = true;
        state.error = null;
      })
      .addCase(checkReactivationStatus.fulfilled, (state, action) => {
        state.reactivationStatusLoading = false;
        state.reactivationStatus = action.payload.data;
      })
      .addCase(checkReactivationStatus.rejected, (state, action) => {
        state.reactivationStatusLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

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

      .addCase(exchangeAuthCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exchangeAuthCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        toast.success(`Welcome, ${action.payload.user.firstName || "User"}!`);
      })
      .addCase(exchangeAuthCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

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
        state.deactivatedUserData = null;
        state.needsReactivation = false;
        state.reactivationStatus = null;
        state.reactivationRequestData = null;
        toast.success("Logged out successfully!");
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.registrationStep = "register";
        state.registrationData = null;
        state.resetPasswordStep = "request";
        state.resetEmail = null;
        state.deactivatedUserData = null;
        state.needsReactivation = false;
        state.reactivationStatus = null;
        state.reactivationRequestData = null;
        toast.success("Logged out successfully!");
      });
  },
});

export const {
  clearError,
  clearAuthState,
  setRegistrationStep,
  setResetPasswordStep,
  updateUserData,
  clearDeactivatedUserData,
  setDeactivatedUserData,
  clearReactivationStatus,
  setReactivationRequestData,
} = authSlice.actions;

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
export const selectDeactivatedUserData = (state) =>
  state.auth.deactivatedUserData;
export const selectNeedsReactivation = (state) => state.auth.needsReactivation;
export const selectReactivationLoading = (state) =>
  state.auth.reactivationLoading;
export const selectReactivationStatus = (state) =>
  state.auth.reactivationStatus;
export const selectReactivationStatusLoading = (state) =>
  state.auth.reactivationStatusLoading;
export const selectReactivationRequestData = (state) =>
  state.auth.reactivationRequestData;

export default authSlice.reducer;
