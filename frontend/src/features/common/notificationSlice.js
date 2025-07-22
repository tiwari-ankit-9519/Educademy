import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  notifications: [],
  unreadCount: 0,
  notificationStats: null,
  notificationSettings: null,
  notificationPreferences: null,
  error: null,
  loading: false,
  notificationsLoading: false,
  unreadCountLoading: false,
  statsLoading: false,
  settingsLoading: false,
  preferencesLoading: false,
  markReadLoading: false,
  deleteLoading: false,
  deleteAllLoading: false,
  updateSettingsLoading: false,
  testNotificationLoading: false,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {
    isRead: undefined,
    type: undefined,
    priority: undefined,
    startDate: undefined,
    endDate: undefined,
  },
};

export const getNotifications = createAsyncThunk(
  "notification/getNotifications",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/notifications", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getUnreadCount = createAsyncThunk(
  "notification/getUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/notifications/unread-count");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getNotificationStats = createAsyncThunk(
  "notification/getNotificationStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/notifications/stats");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getNotificationSettings = createAsyncThunk(
  "notification/getNotificationSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/notifications/settings");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getNotificationPreferences = createAsyncThunk(
  "notification/getNotificationPreferences",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/notifications/preferences");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const markNotificationsAsRead = createAsyncThunk(
  "notification/markNotificationsAsRead",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put("/notifications/mark-read", data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  "notification/updateNotificationSettings",
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put("/notifications/settings", settings);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notification/deleteNotification",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const deleteAllReadNotifications = createAsyncThunk(
  "notification/deleteAllReadNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete("/notifications/read/all");
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const sendTestNotification = createAsyncThunk(
  "notification/sendTestNotification",
  async (notificationData, { rejectWithValue }) => {
    try {
      const response = await api.post("/notifications/test", notificationData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.pagination = initialState.pagination;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    addSocketNotification: (state, action) => {
      const newNotification = action.payload;
      state.notifications = [newNotification, ...state.notifications];
      if (!newNotification.isRead) {
        state.unreadCount += 1;
      }
    },
    updateSocketNotificationRead: (state, action) => {
      const { notificationIds } = action.payload;
      state.notifications = state.notifications.map((notification) =>
        notificationIds.includes(notification.id)
          ? { ...notification, isRead: true }
          : notification
      );
      state.unreadCount = Math.max(
        0,
        state.unreadCount - notificationIds.length
      );
    },
    setSocketUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    resetNotificationState: () => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getNotifications.pending, (state) => {
        state.notificationsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.notificationsLoading = false;
        state.loading = false;
        state.notifications = action.payload.data.notifications;
        state.pagination = {
          currentPage: action.payload.data.currentPage,
          totalPages: action.payload.data.totalPages,
          totalCount: action.payload.data.totalCount,
          hasNext: action.payload.data.hasNext,
          hasPrev: action.payload.data.hasPrev,
        };
        state.error = null;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.notificationsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch notifications";
      })
      .addCase(getUnreadCount.pending, (state) => {
        state.unreadCountLoading = true;
        state.error = null;
      })
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCountLoading = false;
        state.unreadCount = action.payload.data.unreadCount;
        state.error = null;
      })
      .addCase(getUnreadCount.rejected, (state, action) => {
        state.unreadCountLoading = false;
        state.error = action.payload?.message || "Failed to fetch unread count";
      })
      .addCase(getNotificationStats.pending, (state) => {
        state.statsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotificationStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.loading = false;
        state.notificationStats = action.payload.data;
        state.error = null;
      })
      .addCase(getNotificationStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch notification stats";
      })
      .addCase(getNotificationSettings.pending, (state) => {
        state.settingsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotificationSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.loading = false;
        state.notificationSettings = action.payload.data.settings;
        state.error = null;
      })
      .addCase(getNotificationSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch notification settings";
      })
      .addCase(getNotificationPreferences.pending, (state) => {
        state.preferencesLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotificationPreferences.fulfilled, (state, action) => {
        state.preferencesLoading = false;
        state.loading = false;
        state.notificationPreferences = action.payload.data;
        state.error = null;
      })
      .addCase(getNotificationPreferences.rejected, (state, action) => {
        state.preferencesLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch notification preferences";
      })
      .addCase(markNotificationsAsRead.pending, (state) => {
        state.markReadLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        state.markReadLoading = false;
        state.loading = false;
        const { notificationIds, markAll, markedCount } = action.payload.data;

        if (markAll) {
          state.notifications = state.notifications.map((notification) => ({
            ...notification,
            isRead: true,
          }));
          state.unreadCount = 0;
        } else {
          state.notifications = state.notifications.map((notification) =>
            notificationIds.includes(notification.id)
              ? { ...notification, isRead: true }
              : notification
          );
          state.unreadCount = Math.max(0, state.unreadCount - markedCount);
        }
        state.error = null;
      })
      .addCase(markNotificationsAsRead.rejected, (state, action) => {
        state.markReadLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to mark notifications as read";
      })
      .addCase(updateNotificationSettings.pending, (state) => {
        state.updateSettingsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.updateSettingsLoading = false;
        state.loading = false;
        state.notificationSettings = action.payload.data.settings;
        state.error = null;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.updateSettingsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to update notification settings";
      })
      .addCase(deleteNotification.pending, (state) => {
        state.deleteLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.loading = false;
        const { deletedNotificationId } = action.payload.data;
        const deletedNotification = state.notifications.find(
          (n) => n.id === deletedNotificationId
        );

        state.notifications = state.notifications.filter(
          (notification) => notification.id !== deletedNotificationId
        );

        if (deletedNotification && !deletedNotification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.error = null;
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.deleteLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to delete notification";
      })
      .addCase(deleteAllReadNotifications.pending, (state) => {
        state.deleteAllLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAllReadNotifications.fulfilled, (state) => {
        state.deleteAllLoading = false;
        state.loading = false;

        state.notifications = state.notifications.filter(
          (notification) => !notification.isRead
        );
        state.error = null;
      })
      .addCase(deleteAllReadNotifications.rejected, (state, action) => {
        state.deleteAllLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to delete read notifications";
      })
      .addCase(sendTestNotification.pending, (state) => {
        state.testNotificationLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(sendTestNotification.fulfilled, (state) => {
        state.testNotificationLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(sendTestNotification.rejected, (state, action) => {
        state.testNotificationLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to send test notification";
      });
  },
});

export const {
  clearError,
  clearNotifications,
  setFilters,
  clearFilters,
  addSocketNotification,
  updateSocketNotificationRead,
  setSocketUnreadCount,
  resetNotificationState,
} = notificationSlice.actions;

const notificationReducer = notificationSlice.reducer;

export default notificationReducer;
