import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  user: null,
  token: null,
  error: null,
  loading: false,
  profileLoading: false,
  logoutLoading: false,
  imageLoading: false,
  sessionsLoading: false,
  isAuthenticated: false,
  otpStatus: null,
  sessions: [],
  accountSummary: null,
  reactivationStatus: null,
};

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.keys(userData).forEach((key) => {
        if (userData[key] !== null && userData[key] !== undefined) {
          formData.append(key, userData[key]);
        }
      });
      const response = await api.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (loginData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", loginData);
      const token = response.data.data.token;
      localStorage.setItem("token", token);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/logout");
      localStorage.removeItem("token");
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const verifyUser = createAsyncThunk(
  "auth/verifyUser",
  async (verificationData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/verify", verificationData);
      if (response.data.data?.token) {
        localStorage.setItem("token", response.data.data.token);
      }
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  "auth/requestPasswordReset",
  async (emailData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/auth/request-password-reset",
        emailData
      );
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (resetData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/reset-password", resetData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const resendOTP = createAsyncThunk(
  "auth/resendOTP",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/resend-otp", otpData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const checkOTPStatus = createAsyncThunk(
  "auth/checkOTPStatus",
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.get(`/auth/otp-status/${email}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const exchangeAuthCode = createAsyncThunk(
  "auth/exchangeAuthCode",
  async (codeData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/exchange-code", codeData);
      const token = response.data.data.token;
      localStorage.setItem("token", token);
      toast.success(response.data.message || "User logged in Successfully!");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getUserProfile = createAsyncThunk(
  "auth/getUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/profile");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.keys(profileData).forEach((key) => {
        if (profileData[key] !== null && profileData[key] !== undefined) {
          if (key === "profileData" && typeof profileData[key] === "object") {
            formData.append(key, JSON.stringify(profileData[key]));
          } else {
            formData.append(key, profileData[key]);
          }
        }
      });
      const response = await api.put("/auth/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
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
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const removeProfileImage = createAsyncThunk(
  "auth/removeProfileImage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete("/auth/profile/image");
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getUserSessions = createAsyncThunk(
  "auth/getUserSessions",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/sessions", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const invalidateAllSessions = createAsyncThunk(
  "auth/invalidateAllSessions",
  async (sessionData, { rejectWithValue }) => {
    try {
      const response = await api.delete("/auth/sessions", {
        data: sessionData,
      });
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
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
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
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
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getAccountSummary = createAsyncThunk(
  "auth/getAccountSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/account-summary");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const deleteAccount = createAsyncThunk(
  "auth/deleteAccount",
  async (deleteData, { rejectWithValue }) => {
    try {
      const response = await api.delete("/auth/account", { data: deleteData });
      localStorage.removeItem("token");
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.loading = false;
      state.profileLoading = false;
      state.logoutLoading = false;
      state.imageLoading = false;
      state.sessionsLoading = false;
      state.isAuthenticated = false;
      state.otpStatus = null;
      state.sessions = [];
      state.accountSummary = null;
      state.reactivationStatus = null;
      localStorage.removeItem("token");
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      if (action.payload) {
        state.isAuthenticated = true;
        state.error = null;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearOtpStatus: (state) => {
      state.otpStatus = null;
    },
    clearSessions: (state) => {
      state.sessions = [];
    },
    clearAccountSummary: (state) => {
      state.accountSummary = null;
    },
    clearReactivationStatus: (state) => {
      state.reactivationStatus = null;
    },
    resetAuthState: () => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action.payload.data?.userId) {
          state.user = action.payload.data;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed";
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.pending, (state) => {
        state.logoutLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.logoutLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.otpStatus = null;
        state.sessions = [];
        state.accountSummary = null;
        state.reactivationStatus = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.logoutLoading = false;
        state.error = action.payload?.message || "Logout failed";
      })
      .addCase(verifyUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action.payload.data?.token) {
          state.token = action.payload.data.token;
          state.isAuthenticated = true;
          if (action.payload.data?.user) {
            state.user = action.payload.data.user;
          }
        }
      })
      .addCase(verifyUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Verification failed";
      })
      .addCase(requestPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Password reset request failed";
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Password reset failed";
      })
      .addCase(resendOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOTP.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Resend OTP failed";
      })
      .addCase(checkOTPStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkOTPStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.otpStatus = action.payload.data;
        state.error = null;
      })
      .addCase(checkOTPStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "OTP status check failed";
      })
      .addCase(exchangeAuthCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exchangeAuthCode.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(exchangeAuthCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "OAuth authentication failed";
      })
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.error = null;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to get profile";
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = action.payload.data.user;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload?.message || "Profile update failed";
      })
      .addCase(updateProfileImage.pending, (state) => {
        state.imageLoading = true;
        state.error = null;
      })
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        state.imageLoading = false;
        state.user = action.payload.data.user;
        state.error = null;
      })
      .addCase(updateProfileImage.rejected, (state, action) => {
        state.imageLoading = false;
        state.error = action.payload?.message || "Profile image update failed";
      })
      .addCase(removeProfileImage.pending, (state) => {
        state.imageLoading = true;
        state.error = null;
      })
      .addCase(removeProfileImage.fulfilled, (state) => {
        state.imageLoading = false;
        if (state.user) {
          state.user.profileImage = null;
        }
        state.error = null;
      })
      .addCase(removeProfileImage.rejected, (state, action) => {
        state.imageLoading = false;
        state.error = action.payload?.message || "Profile image removal failed";
      })
      .addCase(getUserSessions.pending, (state) => {
        state.sessionsLoading = true;
        state.error = null;
      })
      .addCase(getUserSessions.fulfilled, (state, action) => {
        state.sessionsLoading = false;
        state.sessions = action.payload.data.sessions;
        state.error = null;
      })
      .addCase(getUserSessions.rejected, (state, action) => {
        state.sessionsLoading = false;
        state.error = action.payload?.message || "Failed to get sessions";
      })
      .addCase(invalidateAllSessions.pending, (state) => {
        state.sessionsLoading = true;
        state.error = null;
      })
      .addCase(invalidateAllSessions.fulfilled, (state) => {
        state.sessionsLoading = false;
        state.sessions = [];
        state.error = null;
      })
      .addCase(invalidateAllSessions.rejected, (state, action) => {
        state.sessionsLoading = false;
        state.error = action.payload?.message || "Session invalidation failed";
      })
      .addCase(requestAccountReactivation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestAccountReactivation.fulfilled, (state, action) => {
        state.loading = false;
        state.reactivationStatus = action.payload.data;
        state.error = null;
      })
      .addCase(requestAccountReactivation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Reactivation request failed";
      })
      .addCase(checkReactivationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkReactivationStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.reactivationStatus = action.payload.data;
        state.error = null;
      })
      .addCase(checkReactivationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Reactivation status check failed";
      })
      .addCase(getAccountSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAccountSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.accountSummary = action.payload.data;
        state.error = null;
      })
      .addCase(getAccountSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Account summary failed";
      })
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.otpStatus = null;
        state.sessions = [];
        state.accountSummary = null;
        state.reactivationStatus = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Account deletion failed";
      });
  },
});

export const {
  logout,
  setUser,
  setToken,
  clearError,
  clearOtpStatus,
  clearSessions,
  clearAccountSummary,
  clearReactivationStatus,
  resetAuthState,
} = authSlice.actions;

const authReducer = authSlice.reducer;

export default authReducer;
