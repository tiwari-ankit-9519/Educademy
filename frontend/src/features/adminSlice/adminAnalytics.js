import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  dashboardData: null,
  userAnalytics: null,
  courseAnalytics: null,
  revenueAnalytics: null,
  engagementAnalytics: null,
  realtimeStats: null,
  exportData: null,
  error: null,
  loading: false,
  dashboardLoading: false,
  userAnalyticsLoading: false,
  courseAnalyticsLoading: false,
  revenueAnalyticsLoading: false,
  engagementAnalyticsLoading: false,
  realtimeStatsLoading: false,
  exportLoading: false,
  downloadLoading: false,
};

export const getDashboardOverview = createAsyncThunk(
  "adminAnalytics/getDashboardOverview",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/analytics/dashboard", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getUserAnalytics = createAsyncThunk(
  "adminAnalytics/getUserAnalytics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/analytics/users", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getCourseAnalytics = createAsyncThunk(
  "adminAnalytics/getCourseAnalytics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/analytics/courses", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getRevenueAnalytics = createAsyncThunk(
  "adminAnalytics/getRevenueAnalytics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/analytics/revenue", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getRealtimeStats = createAsyncThunk(
  "adminAnalytics/getRealtimeStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/analytics/realtime");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const exportAnalyticsData = createAsyncThunk(
  "adminAnalytics/exportAnalyticsData",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/admin/analytics/export",
        {},
        { params }
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

export const downloadExportedData = createAsyncThunk(
  "adminAnalytics/downloadExportedData",
  async ({ exportId, format }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/analytics/download/${exportId}`, {
        params: { format },
        responseType: format === "csv" ? "blob" : "json",
      });

      if (format === "csv") {
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analytics_${exportId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("File downloaded successfully");
        return { success: true };
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analytics_${exportId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("File downloaded successfully");
        return response.data;
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

const adminAnalyticsSlice = createSlice({
  name: "adminAnalytics",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDashboardData: (state) => {
      state.dashboardData = null;
    },
    clearUserAnalytics: (state) => {
      state.userAnalytics = null;
    },
    clearCourseAnalytics: (state) => {
      state.courseAnalytics = null;
    },
    clearRevenueAnalytics: (state) => {
      state.revenueAnalytics = null;
    },
    clearEngagementAnalytics: (state) => {
      state.engagementAnalytics = null;
    },
    clearRealtimeStats: (state) => {
      state.realtimeStats = null;
    },
    clearExportData: (state) => {
      state.exportData = null;
    },
    resetAnalyticsState: () => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardOverview.pending, (state) => {
        state.dashboardLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getDashboardOverview.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.loading = false;
        state.dashboardData = action.payload.data;
        state.error = null;
      })
      .addCase(getDashboardOverview.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch dashboard overview";
      })
      .addCase(getUserAnalytics.pending, (state) => {
        state.userAnalyticsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserAnalytics.fulfilled, (state, action) => {
        state.userAnalyticsLoading = false;
        state.loading = false;
        state.userAnalytics = action.payload.data;
        state.error = null;
      })
      .addCase(getUserAnalytics.rejected, (state, action) => {
        state.userAnalyticsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch user analytics";
      })
      .addCase(getCourseAnalytics.pending, (state) => {
        state.courseAnalyticsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourseAnalytics.fulfilled, (state, action) => {
        state.courseAnalyticsLoading = false;
        state.loading = false;
        state.courseAnalytics = action.payload.data;
        state.error = null;
      })
      .addCase(getCourseAnalytics.rejected, (state, action) => {
        state.courseAnalyticsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch course analytics";
      })
      .addCase(getRevenueAnalytics.pending, (state) => {
        state.revenueAnalyticsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getRevenueAnalytics.fulfilled, (state, action) => {
        state.revenueAnalyticsLoading = false;
        state.loading = false;
        state.revenueAnalytics = action.payload.data;
        state.error = null;
      })
      .addCase(getRevenueAnalytics.rejected, (state, action) => {
        state.revenueAnalyticsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch revenue analytics";
      })
      .addCase(getRealtimeStats.pending, (state) => {
        state.realtimeStatsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getRealtimeStats.fulfilled, (state, action) => {
        state.realtimeStatsLoading = false;
        state.loading = false;
        state.realtimeStats = action.payload.data;
        state.error = null;
      })
      .addCase(getRealtimeStats.rejected, (state, action) => {
        state.realtimeStatsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch realtime stats";
      })
      .addCase(exportAnalyticsData.pending, (state) => {
        state.exportLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(exportAnalyticsData.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.loading = false;
        state.exportData = action.payload.data;
        state.error = null;
      })
      .addCase(exportAnalyticsData.rejected, (state, action) => {
        state.exportLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to export analytics data";
      })
      .addCase(downloadExportedData.pending, (state) => {
        state.downloadLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadExportedData.fulfilled, (state) => {
        state.downloadLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(downloadExportedData.rejected, (state, action) => {
        state.downloadLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to download exported data";
      });
  },
});

export const {
  clearError,
  clearDashboardData,
  clearUserAnalytics,
  clearCourseAnalytics,
  clearRevenueAnalytics,
  clearEngagementAnalytics,
  clearRealtimeStats,
  clearExportData,
  resetAnalyticsState,
} = adminAnalyticsSlice.actions;

const adminAnalyticsReducer = adminAnalyticsSlice.reducer;

export default adminAnalyticsReducer;
