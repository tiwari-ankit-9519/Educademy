import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  systemSettings: null,
  announcements: [],
  announcementDetails: null,
  systemHealth: null,
  error: null,
  loading: false,
  systemSettingsLoading: false,
  updateSystemSettingsLoading: false,
  announcementsLoading: false,
  createAnnouncementLoading: false,
  updateAnnouncementLoading: false,
  deleteAnnouncementLoading: false,
  systemHealthLoading: false,
  needsRefresh: false,
  socketConnectionStatus: false,
  lastCreatedAnnouncement: null,
  announcementsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  announcementsFilters: {
    type: "",
    priority: "",
    targetAudience: "",
    isActive: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
};

export const getSystemSettings = createAsyncThunk(
  "adminSystem/getSystemSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/system/settings");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const updateSystemSettings = createAsyncThunk(
  "adminSystem/updateSystemSettings",
  async ({ category, settings }, { rejectWithValue }) => {
    try {
      const response = await api.put("/admin/system/settings", {
        category,
        settings,
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

export const getAllAnnouncements = createAsyncThunk(
  "adminSystem/getAllAnnouncements",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/system/announcements", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const createAnnouncement = createAsyncThunk(
  "adminSystem/createAnnouncement",
  async (announcementData, { rejectWithValue }) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticAnnouncement = {
      id: tempId,
      ...announcementData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: announcementData.isActive ? "active" : "inactive",
      readCount: 0,
      dismissedCount: 0,
      readBy: [],
      dismissedBy: [],
    };

    try {
      const response = await api.post(
        "/admin/system/announcements",
        announcementData
      );
      toast.success(response.data.message);

      const createdAnnouncement = response.data.data;

      return {
        data: createdAnnouncement,
        tempId,
        optimisticAnnouncement,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        tempId,
        optimisticAnnouncement,
      });
    }
  }
);

export const updateAnnouncement = createAsyncThunk(
  "adminSystem/updateAnnouncement",
  async (
    { announcementId, announcementData },
    { rejectWithValue, getState }
  ) => {
    const state = getState();
    const existingAnnouncement = state.adminSystem.announcements.find(
      (a) => a.id === announcementId
    );

    const optimisticUpdate = {
      ...existingAnnouncement,
      ...announcementData,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await api.put(
        `/admin/system/announcements/${announcementId}`,
        announcementData
      );
      toast.success(response.data.message);
      return {
        data: response.data.data,
        announcementId,
        optimisticUpdate,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        announcementId,
        originalAnnouncement: existingAnnouncement,
      });
    }
  }
);

export const deleteAnnouncement = createAsyncThunk(
  "adminSystem/deleteAnnouncement",
  async (announcementId, { rejectWithValue, getState }) => {
    const state = getState();
    const existingAnnouncement = state.adminSystem.announcements.find(
      (a) => a.id === announcementId
    );

    try {
      const response = await api.delete(
        `/admin/system/announcements/${announcementId}`
      );
      toast.success(response.data.message);
      return {
        deletedAnnouncementId: announcementId,
        data: response.data,
        existingAnnouncement,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        announcementId,
        existingAnnouncement,
      });
    }
  }
);

export const getSystemHealth = createAsyncThunk(
  "adminSystem/getSystemHealth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/system/health");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

const updatePaginationAfterDelete = (pagination) => {
  const newTotal = Math.max(0, pagination.total - 1);
  const newTotalPages = Math.max(1, Math.ceil(newTotal / pagination.limit));

  return {
    ...pagination,
    total: newTotal,
    totalPages: newTotalPages,
    hasNext: pagination.page < newTotalPages,
    hasPrev: pagination.page > 1,
  };
};

const updatePaginationAfterCreate = (pagination) => {
  const newTotal = pagination.total + 1;
  const newTotalPages = Math.ceil(newTotal / pagination.limit);

  return {
    ...pagination,
    total: newTotal,
    totalPages: newTotalPages,
    hasNext: pagination.page < newTotalPages,
    hasPrev: pagination.page > 1,
  };
};

const adminSystemSlice = createSlice({
  name: "adminSystem",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSystemSettings: (state) => {
      state.systemSettings = null;
    },
    clearAnnouncements: (state) => {
      state.announcements = [];
    },
    clearAnnouncementDetails: (state) => {
      state.announcementDetails = null;
    },
    clearSystemHealth: (state) => {
      state.systemHealth = null;
    },
    setAnnouncementsFilters: (state, action) => {
      state.announcementsFilters = {
        ...state.announcementsFilters,
        ...action.payload,
      };
    },
    resetAnnouncementsFilters: (state) => {
      state.announcementsFilters = initialState.announcementsFilters;
    },
    resetAdminSystemState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    setSocketConnectionStatus: (state, action) => {
      state.socketConnectionStatus = action.payload;
    },
    clearLastCreatedAnnouncement: (state) => {
      state.lastCreatedAnnouncement = null;
    },
    onAnnouncementCreated: (state, action) => {
      const announcement = action.payload;
      const existingIndex = state.announcements.findIndex(
        (a) => a.id === announcement.id
      );

      if (existingIndex === -1) {
        state.announcements.unshift(announcement);
        state.announcementsPagination = updatePaginationAfterCreate(
          state.announcementsPagination
        );
      }
    },
    onAnnouncementUpdated: (state, action) => {
      const updatedAnnouncement = action.payload;
      const existingIndex = state.announcements.findIndex(
        (a) => a.id === updatedAnnouncement.id
      );

      if (existingIndex !== -1) {
        state.announcements[existingIndex] = updatedAnnouncement;
      }

      if (
        state.announcementDetails &&
        state.announcementDetails.id === updatedAnnouncement.id
      ) {
        state.announcementDetails = updatedAnnouncement;
      }
    },
    onAnnouncementDeleted: (state, action) => {
      const { announcementId, deletedAnnouncement } = action.payload;
      const targetId = announcementId || deletedAnnouncement?.id;

      if (targetId) {
        state.announcements = state.announcements.filter(
          (announcement) => announcement.id !== targetId
        );

        if (
          state.announcementDetails &&
          state.announcementDetails.id === targetId
        ) {
          state.announcementDetails = null;
        }

        state.announcementsPagination = updatePaginationAfterDelete(
          state.announcementsPagination
        );
      }
    },
    onAnnouncementStatsUpdated: (state, action) => {
      const stats = action.payload;
      const { announcementId } = stats;

      const announcementIndex = state.announcements.findIndex(
        (a) => a.id === announcementId
      );

      if (announcementIndex !== -1) {
        state.announcements[announcementIndex] = {
          ...state.announcements[announcementIndex],
          readCount: stats.readCount || 0,
          totalNotifications: stats.totalNotifications || 0,
          readPercentage: stats.readPercentage || 0,
        };
      }

      if (
        state.announcementDetails &&
        state.announcementDetails.id === announcementId
      ) {
        state.announcementDetails = {
          ...state.announcementDetails,
          readCount: stats.readCount || 0,
          totalNotifications: stats.totalNotifications || 0,
          readPercentage: stats.readPercentage || 0,
        };
      }
    },
    onNotificationStatusUpdate: (state, action) => {
      const { announcementId, stats } = action.payload;

      const announcementIndex = state.announcements.findIndex(
        (a) => a.id === announcementId
      );
      if (announcementIndex !== -1) {
        state.announcements[announcementIndex] = {
          ...state.announcements[announcementIndex],
          readCount: stats.readCount || 0,
          dismissedCount: stats.dismissedCount || 0,
        };
      }

      if (
        state.announcementDetails &&
        state.announcementDetails.id === announcementId
      ) {
        state.announcementDetails = {
          ...state.announcementDetails,
          readCount: stats.readCount || 0,
          dismissedCount: stats.dismissedCount || 0,
        };
      }
    },
    optimisticAnnouncementUpdate: (state, action) => {
      const { announcementId, updates } = action.payload;
      state.announcements = state.announcements.map((announcement) =>
        announcement.id === announcementId
          ? { ...announcement, ...updates }
          : announcement
      );

      if (
        state.announcementDetails &&
        state.announcementDetails.id === announcementId
      ) {
        state.announcementDetails = {
          ...state.announcementDetails,
          ...updates,
        };
      }
    },
    optimisticAnnouncementRemove: (state, action) => {
      const announcementId = action.payload;
      state.announcements = state.announcements.filter(
        (announcement) => announcement.id !== announcementId
      );

      if (
        state.announcementDetails &&
        state.announcementDetails.id === announcementId
      ) {
        state.announcementDetails = null;
      }

      state.announcementsPagination = updatePaginationAfterDelete(
        state.announcementsPagination
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSystemSettings.pending, (state) => {
        state.systemSettingsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getSystemSettings.fulfilled, (state, action) => {
        state.systemSettingsLoading = false;
        state.loading = false;
        state.systemSettings = action.payload.data;
        state.error = null;
      })
      .addCase(getSystemSettings.rejected, (state, action) => {
        state.systemSettingsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch system settings";
      })

      .addCase(updateSystemSettings.pending, (state) => {
        state.updateSystemSettingsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSystemSettings.fulfilled, (state, action) => {
        state.updateSystemSettingsLoading = false;
        state.loading = false;

        const { category, updatedSettings } = action.payload.data;
        if (state.systemSettings) {
          state.systemSettings = {
            ...state.systemSettings,
            [category]: updatedSettings,
          };
        }

        state.error = null;
      })
      .addCase(updateSystemSettings.rejected, (state, action) => {
        state.updateSystemSettingsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to update system settings";
      })

      .addCase(getAllAnnouncements.pending, (state) => {
        state.announcementsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllAnnouncements.fulfilled, (state, action) => {
        state.announcementsLoading = false;
        state.loading = false;
        state.announcements = action.payload.data.announcements || [];
        state.announcementsPagination =
          action.payload.data.pagination || state.announcementsPagination;
        state.announcementsFilters = {
          ...state.announcementsFilters,
          ...action.payload.data.filters,
        };
        state.needsRefresh = false;
        state.error = null;
      })
      .addCase(getAllAnnouncements.rejected, (state, action) => {
        state.announcementsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch announcements";
      })

      .addCase(createAnnouncement.pending, (state, action) => {
        state.createAnnouncementLoading = true;
        state.loading = true;
        state.error = null;

        const optimisticAnnouncement = {
          id: `temp_${Date.now()}`,
          ...action.meta.arg,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: action.meta.arg.isActive ? "active" : "inactive",
          readCount: 0,
          dismissedCount: 0,
          readBy: [],
          dismissedBy: [],
        };

        state.announcements.unshift(optimisticAnnouncement);
        state.announcementsPagination = updatePaginationAfterCreate(
          state.announcementsPagination
        );
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.createAnnouncementLoading = false;
        state.loading = false;

        const tempIndex = state.announcements.findIndex((a) =>
          a.id.startsWith("temp_")
        );
        if (tempIndex !== -1) {
          state.announcements[tempIndex] = action.payload.data;
        } else {
          state.announcements.unshift(action.payload.data);
          state.announcementsPagination = updatePaginationAfterCreate(
            state.announcementsPagination
          );
        }

        state.lastCreatedAnnouncement = action.payload.data;
        state.error = null;
      })
      .addCase(createAnnouncement.rejected, (state, action) => {
        state.createAnnouncementLoading = false;
        state.loading = false;

        state.announcements = state.announcements.filter(
          (a) => !a.id.startsWith("temp_")
        );
        state.announcementsPagination = updatePaginationAfterDelete(
          state.announcementsPagination
        );

        state.error =
          action.payload?.error?.message || "Failed to create announcement";
      })

      .addCase(updateAnnouncement.pending, (state, action) => {
        state.updateAnnouncementLoading = true;
        state.loading = true;
        state.error = null;

        const { announcementId, announcementData } = action.meta.arg;
        state.announcements = state.announcements.map((announcement) =>
          announcement.id === announcementId
            ? {
                ...announcement,
                ...announcementData,
                updatedAt: new Date().toISOString(),
              }
            : announcement
        );

        if (
          state.announcementDetails &&
          state.announcementDetails.id === announcementId
        ) {
          state.announcementDetails = {
            ...state.announcementDetails,
            ...announcementData,
            updatedAt: new Date().toISOString(),
          };
        }
      })
      .addCase(updateAnnouncement.fulfilled, (state, action) => {
        state.updateAnnouncementLoading = false;
        state.loading = false;

        const updatedAnnouncement = action.payload.data;
        state.announcements = state.announcements.map((announcement) =>
          announcement.id === updatedAnnouncement.id
            ? updatedAnnouncement
            : announcement
        );

        if (
          state.announcementDetails &&
          state.announcementDetails.id === updatedAnnouncement.id
        ) {
          state.announcementDetails = updatedAnnouncement;
        }

        state.error = null;
      })
      .addCase(updateAnnouncement.rejected, (state, action) => {
        state.updateAnnouncementLoading = false;
        state.loading = false;

        if (action.payload?.originalAnnouncement) {
          state.announcements = state.announcements.map((announcement) =>
            announcement.id === action.payload.originalAnnouncement.id
              ? action.payload.originalAnnouncement
              : announcement
          );

          if (
            state.announcementDetails &&
            state.announcementDetails.id ===
              action.payload.originalAnnouncement.id
          ) {
            state.announcementDetails = action.payload.originalAnnouncement;
          }
        }

        state.error =
          action.payload?.error?.message || "Failed to update announcement";
      })

      .addCase(deleteAnnouncement.pending, (state, action) => {
        state.deleteAnnouncementLoading = true;
        state.loading = true;
        state.error = null;

        const announcementId = action.meta.arg;
        state.announcements = state.announcements.filter(
          (announcement) => announcement.id !== announcementId
        );

        if (
          state.announcementDetails &&
          state.announcementDetails.id === announcementId
        ) {
          state.announcementDetails = null;
        }

        state.announcementsPagination = updatePaginationAfterDelete(
          state.announcementsPagination
        );
      })
      .addCase(deleteAnnouncement.fulfilled, (state) => {
        state.deleteAnnouncementLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteAnnouncement.rejected, (state, action) => {
        state.deleteAnnouncementLoading = false;
        state.loading = false;

        if (action.payload?.existingAnnouncement) {
          state.announcements.push(action.payload.existingAnnouncement);
          state.announcementsPagination = updatePaginationAfterCreate(
            state.announcementsPagination
          );
        }

        state.error =
          action.payload?.error?.message || "Failed to delete announcement";
      })

      .addCase(getSystemHealth.pending, (state) => {
        state.systemHealthLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getSystemHealth.fulfilled, (state, action) => {
        state.systemHealthLoading = false;
        state.loading = false;
        state.systemHealth = action.payload.data;
        state.error = null;
      })
      .addCase(getSystemHealth.rejected, (state, action) => {
        state.systemHealthLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch system health";
      });
  },
});

export const {
  clearError,
  clearSystemSettings,
  clearAnnouncements,
  clearAnnouncementDetails,
  clearSystemHealth,
  setAnnouncementsFilters,
  resetAnnouncementsFilters,
  resetAdminSystemState,
  markForRefresh,
  clearRefreshFlag,
  setSocketConnectionStatus,
  clearLastCreatedAnnouncement,
  onAnnouncementCreated,
  onAnnouncementUpdated,
  onAnnouncementDeleted,
  onAnnouncementStatsUpdated,
  onNotificationStatusUpdate,
  optimisticAnnouncementUpdate,
  optimisticAnnouncementRemove,
} = adminSystemSlice.actions;

const adminSystemReducer = adminSystemSlice.reducer;

export default adminSystemReducer;
