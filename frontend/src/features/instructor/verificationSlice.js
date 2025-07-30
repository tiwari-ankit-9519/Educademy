import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  verificationRequests: [],
  currentRequest: null,
  requestDetails: null,
  error: null,
  loading: false,
  requestVerificationLoading: false,
  getMyRequestsLoading: false,
  getRequestDetailsLoading: false,
  updateRequestLoading: false,
  cancelRequestLoading: false,
  needsRefresh: false,
  currentStatus: {
    isVerified: false,
    verificationBadge: null,
  },
  totalRequests: 0,
};

export const requestVerification = createAsyncThunk(
  "verification/requestVerification",
  async (formData, { rejectWithValue }) => {
    const optimisticRequest = {
      id: `temp_${Date.now()}`,
      requestId: `verification_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      status: "PENDING",
      verificationLevel: formData.get("verificationLevel") || "BASIC",
      submittedAt: new Date().toISOString(),
      estimatedReviewTime: "3-5 business days",
    };

    try {
      const response = await api.post(
        "/instructor/verification/request",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success(response.data.message);
      return {
        data: response.data.data,
        optimisticRequest,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        optimisticRequest,
      });
    }
  }
);

export const getMyVerificationRequests = createAsyncThunk(
  "verification/getMyVerificationRequests",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/verification/my-requests");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getVerificationRequestDetails = createAsyncThunk(
  "verification/getVerificationRequestDetails",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/instructor/verification/${requestId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const updateVerificationRequest = createAsyncThunk(
  "verification/updateVerificationRequest",
  async ({ requestId, updateData }, { rejectWithValue, getState }) => {
    const state = getState();
    const existingRequest = state.verification.verificationRequests.find(
      (r) => r.requestId === requestId
    );

    const optimisticUpdate = {
      ...existingRequest,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await api.put(
        `/instructor/verification/${requestId}`,
        updateData
      );
      toast.success(response.data.message);
      return {
        data: response.data.data,
        requestId,
        optimisticUpdate,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        requestId,
        originalRequest: existingRequest,
      });
    }
  }
);

export const cancelVerificationRequest = createAsyncThunk(
  "verification/cancelVerificationRequest",
  async (requestId, { rejectWithValue, getState }) => {
    const state = getState();
    const existingRequest = state.verification.verificationRequests.find(
      (r) => r.requestId === requestId
    );

    const optimisticUpdate = {
      ...existingRequest,
      status: "CANCELLED",
      cancelledAt: new Date().toISOString(),
    };

    try {
      const response = await api.delete(
        `/instructor/verification/${requestId}`
      );
      toast.success(response.data.message);
      return {
        data: response.data.data,
        requestId,
        optimisticUpdate,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        requestId,
        originalRequest: existingRequest,
      });
    }
  }
);

const verificationSlice = createSlice({
  name: "verification",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearVerificationRequests: (state) => {
      state.verificationRequests = [];
    },
    clearCurrentRequest: (state) => {
      state.currentRequest = null;
    },
    clearRequestDetails: (state) => {
      state.requestDetails = null;
    },
    resetVerificationState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    optimisticRequestUpdate: (state, action) => {
      const { requestId, updates } = action.payload;
      state.verificationRequests = state.verificationRequests.map((request) =>
        request.requestId === requestId ? { ...request, ...updates } : request
      );

      if (
        state.currentRequest &&
        state.currentRequest.requestId === requestId
      ) {
        state.currentRequest = { ...state.currentRequest, ...updates };
      }

      if (
        state.requestDetails &&
        state.requestDetails.requestId === requestId
      ) {
        state.requestDetails = { ...state.requestDetails, ...updates };
      }
    },
    optimisticRequestRemove: (state, action) => {
      const requestId = action.payload;
      state.verificationRequests = state.verificationRequests.filter(
        (request) => request.requestId !== requestId
      );

      if (
        state.currentRequest &&
        state.currentRequest.requestId === requestId
      ) {
        state.currentRequest = null;
      }

      if (
        state.requestDetails &&
        state.requestDetails.requestId === requestId
      ) {
        state.requestDetails = null;
      }

      state.totalRequests = Math.max(0, state.totalRequests - 1);
    },
    optimisticRequestAdd: (state, action) => {
      const newRequest = action.payload;
      state.verificationRequests.unshift(newRequest);
      state.totalRequests += 1;
    },
    updateCurrentStatus: (state, action) => {
      state.currentStatus = { ...state.currentStatus, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestVerification.pending, (state, action) => {
        state.requestVerificationLoading = true;
        state.loading = true;
        state.error = null;

        const optimisticRequest = {
          id: `temp_${Date.now()}`,
          requestId: `verification_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          status: "PENDING",
          verificationLevel:
            action.meta.arg.get?.("verificationLevel") || "BASIC",
          submittedAt: new Date().toISOString(),
          estimatedReviewTime: "3-5 business days",
          documents: [],
          qualifications: [],
          experience: [],
          portfolio: [],
          references: [],
        };

        state.verificationRequests.unshift(optimisticRequest);
        state.currentRequest = optimisticRequest;
        state.totalRequests += 1;
      })
      .addCase(requestVerification.fulfilled, (state, action) => {
        state.requestVerificationLoading = false;
        state.loading = false;

        const { data } = action.payload;

        state.verificationRequests = state.verificationRequests.filter(
          (req) => !req.id?.startsWith("temp_")
        );

        const newRequest = {
          requestId: data.requestId,
          status: data.status,
          verificationLevel: data.verificationLevel,
          submittedAt: data.submittedAt,
          estimatedReviewTime: data.estimatedReviewTime,
          documentsUploaded: data.documentsUploaded,
          documents: data.documents,
        };

        state.verificationRequests.unshift(newRequest);
        state.currentRequest = newRequest;
        state.needsRefresh = false;
        state.error = null;
      })
      .addCase(requestVerification.rejected, (state, action) => {
        state.requestVerificationLoading = false;
        state.loading = false;

        state.verificationRequests = state.verificationRequests.filter(
          (req) => !req.id?.startsWith("temp_")
        );
        state.currentRequest = null;
        state.totalRequests = Math.max(0, state.totalRequests - 1);

        state.error =
          action.payload?.error?.message ||
          "Failed to submit verification request";
      })

      .addCase(getMyVerificationRequests.pending, (state) => {
        state.getMyRequestsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyVerificationRequests.fulfilled, (state, action) => {
        state.getMyRequestsLoading = false;
        state.loading = false;
        state.verificationRequests = action.payload.data.requests || [];
        state.currentStatus =
          action.payload.data.currentStatus || state.currentStatus;
        state.totalRequests = action.payload.data.totalRequests || 0;
        state.needsRefresh = false;
        state.error = null;
      })
      .addCase(getMyVerificationRequests.rejected, (state, action) => {
        state.getMyRequestsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch verification requests";
      })

      .addCase(getVerificationRequestDetails.pending, (state) => {
        state.getRequestDetailsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getVerificationRequestDetails.fulfilled, (state, action) => {
        state.getRequestDetailsLoading = false;
        state.loading = false;
        state.requestDetails = action.payload.data;
        state.error = null;
      })
      .addCase(getVerificationRequestDetails.rejected, (state, action) => {
        state.getRequestDetailsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message ||
          "Failed to fetch verification request details";
      })

      .addCase(updateVerificationRequest.pending, (state, action) => {
        state.updateRequestLoading = true;
        state.loading = true;
        state.error = null;

        const { requestId, updateData } = action.meta.arg;

        state.verificationRequests = state.verificationRequests.map((request) =>
          request.requestId === requestId
            ? {
                ...request,
                ...updateData,
                updatedAt: new Date().toISOString(),
              }
            : request
        );

        if (
          state.currentRequest &&
          state.currentRequest.requestId === requestId
        ) {
          state.currentRequest = {
            ...state.currentRequest,
            ...updateData,
            updatedAt: new Date().toISOString(),
          };
        }

        if (
          state.requestDetails &&
          state.requestDetails.requestId === requestId
        ) {
          state.requestDetails = {
            ...state.requestDetails,
            ...updateData,
            updatedAt: new Date().toISOString(),
          };
        }
      })
      .addCase(updateVerificationRequest.fulfilled, (state, action) => {
        state.updateRequestLoading = false;
        state.loading = false;

        const { data, requestId } = action.payload;

        state.verificationRequests = state.verificationRequests.map((request) =>
          request.requestId === requestId
            ? {
                ...request,
                updatedAt: data.updatedAt,
                status: data.status || request.status,
              }
            : request
        );

        if (
          state.currentRequest &&
          state.currentRequest.requestId === requestId
        ) {
          state.currentRequest = {
            ...state.currentRequest,
            updatedAt: data.updatedAt,
            status: data.status || state.currentRequest.status,
          };
        }

        if (
          state.requestDetails &&
          state.requestDetails.requestId === requestId
        ) {
          state.requestDetails = {
            ...state.requestDetails,
            updatedAt: data.updatedAt,
            status: data.status || state.requestDetails.status,
          };
        }

        state.error = null;
      })
      .addCase(updateVerificationRequest.rejected, (state, action) => {
        state.updateRequestLoading = false;
        state.loading = false;

        if (action.payload?.originalRequest) {
          const { requestId, originalRequest } = action.payload;

          state.verificationRequests = state.verificationRequests.map(
            (request) =>
              request.requestId === requestId ? originalRequest : request
          );

          if (
            state.currentRequest &&
            state.currentRequest.requestId === requestId
          ) {
            state.currentRequest = originalRequest;
          }

          if (
            state.requestDetails &&
            state.requestDetails.requestId === requestId
          ) {
            state.requestDetails = originalRequest;
          }
        }

        state.error =
          action.payload?.error?.message ||
          "Failed to update verification request";
      })

      .addCase(cancelVerificationRequest.pending, (state, action) => {
        state.cancelRequestLoading = true;
        state.loading = true;
        state.error = null;

        const requestId = action.meta.arg;

        state.verificationRequests = state.verificationRequests.map((request) =>
          request.requestId === requestId
            ? {
                ...request,
                status: "CANCELLED",
                cancelledAt: new Date().toISOString(),
              }
            : request
        );

        if (
          state.currentRequest &&
          state.currentRequest.requestId === requestId
        ) {
          state.currentRequest = {
            ...state.currentRequest,
            status: "CANCELLED",
            cancelledAt: new Date().toISOString(),
          };
        }

        if (
          state.requestDetails &&
          state.requestDetails.requestId === requestId
        ) {
          state.requestDetails = {
            ...state.requestDetails,
            status: "CANCELLED",
            cancelledAt: new Date().toISOString(),
          };
        }
      })
      .addCase(cancelVerificationRequest.fulfilled, (state, action) => {
        state.cancelRequestLoading = false;
        state.loading = false;

        const { data, requestId } = action.payload;

        state.verificationRequests = state.verificationRequests.map((request) =>
          request.requestId === requestId
            ? {
                ...request,
                status: data.status,
                cancelledAt: data.cancelledAt,
              }
            : request
        );

        if (
          state.currentRequest &&
          state.currentRequest.requestId === requestId
        ) {
          state.currentRequest = {
            ...state.currentRequest,
            status: data.status,
            cancelledAt: data.cancelledAt,
          };
        }

        if (
          state.requestDetails &&
          state.requestDetails.requestId === requestId
        ) {
          state.requestDetails = {
            ...state.requestDetails,
            status: data.status,
            cancelledAt: data.cancelledAt,
          };
        }

        state.error = null;
      })
      .addCase(cancelVerificationRequest.rejected, (state, action) => {
        state.cancelRequestLoading = false;
        state.loading = false;

        if (action.payload?.originalRequest) {
          const { requestId, originalRequest } = action.payload;

          state.verificationRequests = state.verificationRequests.map(
            (request) =>
              request.requestId === requestId ? originalRequest : request
          );

          if (
            state.currentRequest &&
            state.currentRequest.requestId === requestId
          ) {
            state.currentRequest = originalRequest;
          }

          if (
            state.requestDetails &&
            state.requestDetails.requestId === requestId
          ) {
            state.requestDetails = originalRequest;
          }
        }

        state.error =
          action.payload?.error?.message ||
          "Failed to cancel verification request";
      });
  },
});

export const {
  clearError,
  clearVerificationRequests,
  clearCurrentRequest,
  clearRequestDetails,
  resetVerificationState,
  markForRefresh,
  clearRefreshFlag,
  optimisticRequestUpdate,
  optimisticRequestRemove,
  optimisticRequestAdd,
  updateCurrentStatus,
} = verificationSlice.actions;

const verificationReducer = verificationSlice.reducer;

export default verificationReducer;
