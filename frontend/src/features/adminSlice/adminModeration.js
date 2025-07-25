import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  contentReports: [],
  contentReportDetails: null,
  userViolations: [],
  userViolationDetails: null,
  searchedUsers: [],
  moderationStats: null,
  communityStandards: null,
  error: null,
  loading: false,
  contentReportsLoading: false,
  reviewContentReportLoading: false,
  userViolationsLoading: false,
  moderateUserLoading: false,
  moderationStatsLoading: false,
  bulkModerateContentLoading: false,
  communityStandardsLoading: false,
  needsRefresh: false,
  contentReportsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  contentReportsFilters: {
    status: "PENDING",
    contentType: "",
    priority: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    search: "",
    reportedBy: "",
    dateFrom: "",
    dateTo: "",
  },
  userViolationsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  userViolationsFilters: {
    type: "",
    severity: "",
    dateFrom: "",
    dateTo: "",
  },
};

export const getContentReports = createAsyncThunk(
  "adminModeration/getContentReports",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/moderation/reports", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const reviewContentReport = createAsyncThunk(
  "adminModeration/reviewContentReport",
  async (
    { reportId, action, actionTaken, moderatorNotes, violationSeverity },
    { rejectWithValue, getState }
  ) => {
    const state = getState();
    const existingReport = state.adminModeration.contentReports.find(
      (r) => r.id === reportId
    );

    const optimisticUpdate = {
      ...existingReport,
      status:
        action === "APPROVE"
          ? "RESOLVED"
          : action === "ESCALATE"
          ? "ESCALATED"
          : "REVIEWED",
      reviewedAt: new Date().toISOString(),
      actionTaken:
        actionTaken || `Content ${action.toLowerCase()}d by moderator`,
    };

    try {
      const response = await api.put(
        `/admin/moderation/reports/${reportId}/review`,
        {
          action,
          actionTaken,
          moderatorNotes,
          violationSeverity,
        }
      );
      toast.success(response.data.message);
      return {
        data: response.data.data,
        reportId,
        optimisticUpdate,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        reportId,
        originalReport: existingReport,
      });
    }
  }
);

export const getUserViolations = createAsyncThunk(
  "adminModeration/getUserViolations",
  async ({ searchTerm, params = {} }, { rejectWithValue }) => {
    try {
      console.log("Making API call for searchTerm:", searchTerm);
      const response = await api.get(
        `/admin/moderation/users/${searchTerm}/violations`,
        {
          params,
        }
      );

      console.log("API Response:", response.data);

      if (!response.data.success) {
        console.log("API returned success: false, rejecting");
        return rejectWithValue(response.data);
      }

      console.log("API returned success: true, fulfilling");
      return response.data;
    } catch (error) {
      console.log("API call failed with error:", error);
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const moderateUser = createAsyncThunk(
  "adminModeration/moderateUser",
  async ({ userId, action, reason, duration, notes }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/admin/moderation/users/${userId}/moderate`,
        {
          action,
          reason,
          duration,
          notes,
        }
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

export const getModerationStats = createAsyncThunk(
  "adminModeration/getModerationStats",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/moderation/stats", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const bulkModerateContent = createAsyncThunk(
  "adminModeration/bulkModerateContent",
  async (
    { reportIds, action, reason, moderatorNotes },
    { rejectWithValue, getState }
  ) => {
    const state = getState();
    const affectedReports = state.adminModeration.contentReports.filter(
      (report) => reportIds.includes(report.id)
    );

    const optimisticUpdates = affectedReports.map((report) => ({
      ...report,
      status:
        action === "APPROVE"
          ? "RESOLVED"
          : action === "ESCALATE"
          ? "ESCALATED"
          : "REVIEWED",
      reviewedAt: new Date().toISOString(),
      actionTaken: reason || `Bulk ${action.toLowerCase()} action`,
    }));

    try {
      const response = await api.put("/admin/moderation/reports/bulk", {
        reportIds,
        action,
        reason,
        moderatorNotes,
      });
      toast.success(response.data.message);
      return {
        data: response.data.data,
        reportIds,
        optimisticUpdates,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        reportIds,
        originalReports: affectedReports,
      });
    }
  }
);

export const getCommunityStandards = createAsyncThunk(
  "adminModeration/getCommunityStandards",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/moderation/community-standards");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

const updatePaginationAfterDelete = (pagination, deleteCount = 1) => {
  const newTotal = Math.max(0, pagination.total - deleteCount);
  const newTotalPages = Math.max(1, Math.ceil(newTotal / pagination.limit));

  return {
    ...pagination,
    total: newTotal,
    totalPages: newTotalPages,
    hasNext: pagination.page < newTotalPages,
    hasPrev: pagination.page > 1,
  };
};

const adminModerationSlice = createSlice({
  name: "adminModeration",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearContentReports: (state) => {
      state.contentReports = [];
    },
    clearContentReportDetails: (state) => {
      state.contentReportDetails = null;
    },
    clearUserViolations: (state) => {
      state.userViolations = [];
    },
    clearUserViolationDetails: (state) => {
      state.userViolationDetails = null;
    },
    clearSearchedUsers: (state) => {
      state.searchedUsers = [];
    },
    clearModerationStats: (state) => {
      state.moderationStats = null;
    },
    clearCommunityStandards: (state) => {
      state.communityStandards = null;
    },
    setContentReportsFilters: (state, action) => {
      state.contentReportsFilters = {
        ...state.contentReportsFilters,
        ...action.payload,
      };
    },
    setUserViolationsFilters: (state, action) => {
      state.userViolationsFilters = {
        ...state.userViolationsFilters,
        ...action.payload,
      };
    },
    resetContentReportsFilters: (state) => {
      state.contentReportsFilters = initialState.contentReportsFilters;
    },
    resetUserViolationsFilters: (state) => {
      state.userViolationsFilters = initialState.userViolationsFilters;
    },
    resetAdminModerationState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    optimisticReportUpdate: (state, action) => {
      const { reportId, updates } = action.payload;
      state.contentReports = state.contentReports.map((report) =>
        report.id === reportId ? { ...report, ...updates } : report
      );

      if (
        state.contentReportDetails &&
        state.contentReportDetails.id === reportId
      ) {
        state.contentReportDetails = {
          ...state.contentReportDetails,
          ...updates,
        };
      }
    },
    optimisticReportRemove: (state, action) => {
      const reportId = action.payload;
      state.contentReports = state.contentReports.filter(
        (report) => report.id !== reportId
      );

      if (
        state.contentReportDetails &&
        state.contentReportDetails.id === reportId
      ) {
        state.contentReportDetails = null;
      }

      state.contentReportsPagination = updatePaginationAfterDelete(
        state.contentReportsPagination
      );
    },
    optimisticBulkReportUpdate: (state, action) => {
      const { reportIds, updates } = action.payload;
      state.contentReports = state.contentReports.map((report) =>
        reportIds.includes(report.id) ? { ...report, ...updates } : report
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getContentReports.pending, (state) => {
        state.contentReportsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getContentReports.fulfilled, (state, action) => {
        state.contentReportsLoading = false;
        state.loading = false;
        state.contentReports = action.payload.data.reports || [];
        state.contentReportsPagination =
          action.payload.data.pagination || state.contentReportsPagination;
        state.contentReportsFilters = {
          ...state.contentReportsFilters,
          ...action.payload.data.filters,
        };
        state.needsRefresh = false;
        state.error = null;
      })
      .addCase(getContentReports.rejected, (state, action) => {
        state.contentReportsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch content reports";
      })

      .addCase(reviewContentReport.pending, (state, action) => {
        state.reviewContentReportLoading = true;
        state.loading = true;
        state.error = null;

        const { reportId, action: reviewAction } = action.meta.arg;
        state.contentReports = state.contentReports.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status:
                  reviewAction === "APPROVE"
                    ? "RESOLVED"
                    : reviewAction === "ESCALATE"
                    ? "ESCALATED"
                    : "REVIEWED",
                reviewedAt: new Date().toISOString(),
              }
            : report
        );
      })
      .addCase(reviewContentReport.fulfilled, (state, action) => {
        state.reviewContentReportLoading = false;
        state.loading = false;

        const updatedReport = action.payload.data;
        state.contentReports = state.contentReports.map((report) =>
          report.id === updatedReport.reportId
            ? { ...report, ...updatedReport }
            : report
        );

        if (
          state.contentReportDetails &&
          state.contentReportDetails.id === updatedReport.reportId
        ) {
          state.contentReportDetails = {
            ...state.contentReportDetails,
            ...updatedReport,
          };
        }

        state.error = null;
      })
      .addCase(reviewContentReport.rejected, (state, action) => {
        state.reviewContentReportLoading = false;
        state.loading = false;

        if (action.payload?.originalReport) {
          state.contentReports = state.contentReports.map((report) =>
            report.id === action.payload.originalReport.id
              ? action.payload.originalReport
              : report
          );

          if (
            state.contentReportDetails &&
            state.contentReportDetails.id === action.payload.originalReport.id
          ) {
            state.contentReportDetails = action.payload.originalReport;
          }
        }

        state.error =
          action.payload?.error?.message || "Failed to review content report";
      })

      .addCase(getUserViolations.pending, (state) => {
        console.log("getUserViolations.pending triggered");
        state.userViolationsLoading = true;
        state.loading = true;
        state.error = null;
        state.searchedUsers = [];
        state.userViolations = [];
        state.userViolationDetails = null;
      })
      .addCase(getUserViolations.fulfilled, (state, action) => {
        state.userViolationsLoading = false;
        state.loading = false;

        console.log("getUserViolations fulfilled:", action.payload);
        console.log("multipleResults:", action.payload.meta?.multipleResults);

        if (action.payload.meta?.multipleResults) {
          console.log("Setting searchedUsers:", action.payload.data.users);
          state.searchedUsers = action.payload.data.users || [];
        } else {
          state.userViolations = action.payload.data.violations || [];
          state.userViolationDetails = action.payload.data.userInfo || null;
          state.userViolationsPagination =
            action.payload.data.pagination || state.userViolationsPagination;
        }

        state.error = null;
      })
      .addCase(getUserViolations.rejected, (state, action) => {
        console.log("getUserViolations.rejected triggered:", action.payload);
        state.userViolationsLoading = false;
        state.loading = false;
        state.searchedUsers = [];
        state.userViolations = [];
        state.userViolationDetails = null;
        state.error =
          action.payload?.message || "Failed to fetch user violations";
      })

      .addCase(moderateUser.pending, (state) => {
        state.moderateUserLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(moderateUser.fulfilled, (state) => {
        state.moderateUserLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(moderateUser.rejected, (state, action) => {
        state.moderateUserLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to moderate user";
      })

      .addCase(getModerationStats.pending, (state) => {
        state.moderationStatsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getModerationStats.fulfilled, (state, action) => {
        state.moderationStatsLoading = false;
        state.loading = false;
        state.moderationStats = action.payload.data;
        state.error = null;
      })
      .addCase(getModerationStats.rejected, (state, action) => {
        state.moderationStatsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch moderation stats";
      })

      .addCase(bulkModerateContent.pending, (state, action) => {
        state.bulkModerateContentLoading = true;
        state.loading = true;
        state.error = null;

        const { reportIds, action: bulkAction } = action.meta.arg;
        state.contentReports = state.contentReports.map((report) =>
          reportIds.includes(report.id)
            ? {
                ...report,
                status:
                  bulkAction === "APPROVE"
                    ? "RESOLVED"
                    : bulkAction === "ESCALATE"
                    ? "ESCALATED"
                    : "REVIEWED",
                reviewedAt: new Date().toISOString(),
              }
            : report
        );
      })
      .addCase(bulkModerateContent.fulfilled, (state) => {
        state.bulkModerateContentLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(bulkModerateContent.rejected, (state, action) => {
        state.bulkModerateContentLoading = false;
        state.loading = false;

        if (action.payload?.originalReports) {
          action.payload.originalReports.forEach((originalReport) => {
            const index = state.contentReports.findIndex(
              (r) => r.id === originalReport.id
            );
            if (index !== -1) {
              state.contentReports[index] = originalReport;
            }
          });
        }

        state.error =
          action.payload?.error?.message || "Failed to bulk moderate content";
      })

      .addCase(getCommunityStandards.pending, (state) => {
        state.communityStandardsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCommunityStandards.fulfilled, (state, action) => {
        state.communityStandardsLoading = false;
        state.loading = false;
        state.communityStandards = action.payload.data;
        state.error = null;
      })
      .addCase(getCommunityStandards.rejected, (state, action) => {
        state.communityStandardsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch community standards";
      });
  },
});

export const {
  clearError,
  clearContentReports,
  clearContentReportDetails,
  clearUserViolations,
  clearUserViolationDetails,
  clearSearchedUsers,
  clearModerationStats,
  clearCommunityStandards,
  setContentReportsFilters,
  setUserViolationsFilters,
  resetContentReportsFilters,
  resetUserViolationsFilters,
  resetAdminModerationState,
  markForRefresh,
  clearRefreshFlag,
  optimisticReportUpdate,
  optimisticReportRemove,
  optimisticBulkReportUpdate,
} = adminModerationSlice.actions;

const adminModerationReducer = adminModerationSlice.reducer;

export default adminModerationReducer;
