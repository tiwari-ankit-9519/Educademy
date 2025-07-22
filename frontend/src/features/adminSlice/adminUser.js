import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  users: [],
  userDetails: null,
  userStats: null,
  categories: [],
  categoryDetails: null,
  verificationRequests: [],
  verificationRequestDetails: null,
  verificationStats: null,
  error: null,
  loading: false,
  usersLoading: false,
  userDetailsLoading: false,
  userStatsLoading: false,
  updateUserStatusLoading: false,
  bulkUpdateUsersLoading: false,
  deleteUserLoading: false,
  categoriesLoading: false,
  categoryDetailsLoading: false,
  createCategoryLoading: false,
  updateCategoryLoading: false,
  deleteCategoryLoading: false,
  verificationRequestsLoading: false,
  verificationRequestDetailsLoading: false,
  verificationStatsLoading: false,
  reviewVerificationRequestLoading: false,
  needsRefresh: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  categoriesPagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  verificationRequestsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {
    role: "",
    status: "",
    isVerified: "",
    isBanned: "",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    dateFrom: "",
    dateTo: "",
  },
  categoryFilters: {
    search: "",
    isActive: "",
    hasParent: "",
    sortBy: "order",
    sortOrder: "asc",
  },
  verificationFilters: {
    status: "",
    verificationLevel: "",
    priority: "",
    sortBy: "submittedAt",
    sortOrder: "desc",
    search: "",
  },
};

export const getAllUsers = createAsyncThunk(
  "adminUser/getAllUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/users/users", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getUserDetails = createAsyncThunk(
  "adminUser/getUserDetails",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/users/users/${userId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  "adminUser/updateUserStatus",
  async ({ userId, action, reason, duration }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/users/users/${userId}`, {
        action,
        reason,
        duration,
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

export const bulkUpdateUsers = createAsyncThunk(
  "adminUser/bulkUpdateUsers",
  async ({ userIds, action, reason }, { rejectWithValue }) => {
    try {
      const response = await api.patch("/admin/users/bulk", {
        userIds,
        action,
        reason,
      });
      toast.success(response.data.message);
      return { userIds, action, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const deleteUser = createAsyncThunk(
  "adminUser/deleteUser",
  async ({ userId, reason, confirmEmail }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/users/users/${userId}`, {
        data: { reason, confirmEmail },
      });
      toast.success(response.data.message);
      return { deletedUserId: userId, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getAllCategories = createAsyncThunk(
  "adminUser/getAllCategories",
  async (params = {}, { rejectWithValue }) => {
    try {
      const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await api.get("/admin/users/categories", {
        params: cleanParams,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const createCategory = createAsyncThunk(
  "adminUser/createCategory",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/users/categories", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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

export const updateCategory = createAsyncThunk(
  "adminUser/updateCategory",
  async ({ categoryId, formData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/admin/users/categories/${categoryId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
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

export const deleteCategory = createAsyncThunk(
  "adminUser/deleteCategory",
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `/admin/users/categories/${categoryId}`
      );
      toast.success(response.data.message);
      return { deletedCategoryId: categoryId, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getSingleCategory = createAsyncThunk(
  "adminUser/getSingleCategory",
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/users/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getAllVerificationRequests = createAsyncThunk(
  "adminUser/getAllVerificationRequests",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/users/admin/all", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getVerificationStats = createAsyncThunk(
  "adminUser/getVerificationStats",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/users/admin/stats", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getVerificationRequestById = createAsyncThunk(
  "adminUser/getVerificationRequestById",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/users/admin/${requestId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const reviewVerificationRequest = createAsyncThunk(
  "adminUser/reviewVerificationRequest",
  async (
    { requestId, action, adminNotes, rejectionReason },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/admin/users/admin/${requestId}/review`, {
        action,
        adminNotes,
        rejectionReason,
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

const adminUserSlice = createSlice({
  name: "adminUser",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUsers: (state) => {
      state.users = [];
    },
    clearUserDetails: (state) => {
      state.userDetails = null;
    },
    clearUserStats: (state) => {
      state.userStats = null;
    },
    clearCategories: (state) => {
      state.categories = [];
    },
    clearCategoryDetails: (state) => {
      state.categoryDetails = null;
    },
    clearVerificationRequests: (state) => {
      state.verificationRequests = [];
    },
    clearVerificationRequestDetails: (state) => {
      state.verificationRequestDetails = null;
    },
    clearVerificationStats: (state) => {
      state.verificationStats = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setCategoryFilters: (state, action) => {
      state.categoryFilters = { ...state.categoryFilters, ...action.payload };
    },
    setVerificationFilters: (state, action) => {
      state.verificationFilters = {
        ...state.verificationFilters,
        ...action.payload,
      };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    resetCategoryFilters: (state) => {
      state.categoryFilters = initialState.categoryFilters;
    },
    resetVerificationFilters: (state) => {
      state.verificationFilters = initialState.verificationFilters;
    },
    resetAdminUserState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    optimisticUserUpdate: (state, action) => {
      const { userId, updates } = action.payload;
      state.users = state.users.map((user) =>
        user.id === userId ? { ...user, ...updates } : user
      );

      if (state.userDetails && state.userDetails.id === userId) {
        state.userDetails = { ...state.userDetails, ...updates };
      }
    },
    optimisticUserRemove: (state, action) => {
      const userId = action.payload;
      state.users = state.users.filter((user) => user.id !== userId);

      if (state.userDetails && state.userDetails.id === userId) {
        state.userDetails = null;
      }

      state.pagination = updatePaginationAfterDelete(state.pagination);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllUsers.pending, (state) => {
        state.usersLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.loading = false;
        state.users = action.payload.data.users;
        state.pagination = action.payload.data.pagination;
        state.filters = { ...state.filters, ...action.payload.data.filters };
        state.needsRefresh = false;
        state.error = null;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch users";
      })
      .addCase(getUserDetails.pending, (state) => {
        state.userDetailsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserDetails.fulfilled, (state, action) => {
        state.userDetailsLoading = false;
        state.loading = false;
        state.userDetails = action.payload.data;
        state.error = null;
      })
      .addCase(getUserDetails.rejected, (state, action) => {
        state.userDetailsLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch user details";
      })
      .addCase(updateUserStatus.pending, (state) => {
        state.updateUserStatusLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.updateUserStatusLoading = false;
        state.loading = false;

        const { userId, newStatus } = action.payload.data;

        state.users = state.users.map((user) => {
          if (user.id === userId) {
            return { ...user, ...newStatus };
          }
          return user;
        });

        if (state.userDetails && state.userDetails.id === userId) {
          state.userDetails = { ...state.userDetails, ...newStatus };
        }

        state.error = null;
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.updateUserStatusLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to update user status";
      })
      .addCase(bulkUpdateUsers.pending, (state) => {
        state.bulkUpdateUsersLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUpdateUsers.fulfilled, (state, action) => {
        state.bulkUpdateUsersLoading = false;
        state.loading = false;

        const { userIds, action: bulkAction } = action.payload;

        state.users = state.users.map((user) => {
          if (userIds.includes(user.id)) {
            switch (bulkAction) {
              case "activate":
                return { ...user, isActive: true, isBanned: false };
              case "deactivate":
                return { ...user, isActive: false };
              case "ban":
                return { ...user, isBanned: true, isActive: false };
              case "unban":
                return { ...user, isBanned: false, isActive: true };
              case "verify":
                return { ...user, isVerified: true };
              case "unverify":
                return { ...user, isVerified: false };
              default:
                return user;
            }
          }
          return user;
        });

        if (state.userDetails && userIds.includes(state.userDetails.id)) {
          const updatedUser = state.users.find(
            (user) => user.id === state.userDetails.id
          );
          if (updatedUser) {
            state.userDetails = { ...state.userDetails, ...updatedUser };
          }
        }

        state.error = null;
      })
      .addCase(bulkUpdateUsers.rejected, (state, action) => {
        state.bulkUpdateUsersLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to bulk update users";
      })
      .addCase(deleteUser.pending, (state) => {
        state.deleteUserLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleteUserLoading = false;
        state.loading = false;

        const { deletedUserId } = action.payload;
        state.users = state.users.filter((user) => user.id !== deletedUserId);

        if (state.userDetails && state.userDetails.id === deletedUserId) {
          state.userDetails = null;
        }

        state.pagination = updatePaginationAfterDelete(state.pagination);
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleteUserLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete user";
      })
      .addCase(getAllCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.loading = false;

        const responseData = action.payload;

        if (responseData && responseData.success && responseData.data) {
          state.categories = responseData.data.categories || [];

          const paginationData = responseData.data.pagination || {};

          state.categoriesPagination = {
            page: paginationData.page || 1,
            limit: paginationData.limit || 50,
            total: paginationData.total || 0,
            totalPages: paginationData.totalPages || 0,
            hasNext: paginationData.hasNext || false,
            hasPrev: paginationData.hasPrev || false,
          };

          state.categoryFilters = {
            ...state.categoryFilters,
            ...(responseData.filters || {}),
          };
        } else {
          state.categories = [];
          state.categoriesPagination = initialState.categoriesPagination;
        }

        state.error = null;
      })
      .addCase(getAllCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch categories";
      })
      .addCase(createCategory.pending, (state) => {
        state.createCategoryLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.createCategoryLoading = false;
        state.loading = false;
        state.categories.unshift(action.payload.data);
        state.categoriesPagination.total += 1;
        state.error = null;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.createCategoryLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to create category";
      })
      .addCase(updateCategory.pending, (state) => {
        state.updateCategoryLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.updateCategoryLoading = false;
        state.loading = false;
        const updatedCategory = action.payload.data;
        state.categories = state.categories.map((category) =>
          category.id === updatedCategory.id ? updatedCategory : category
        );
        if (
          state.categoryDetails &&
          state.categoryDetails.id === updatedCategory.id
        ) {
          state.categoryDetails = {
            ...state.categoryDetails,
            ...updatedCategory,
          };
        }
        state.error = null;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.updateCategoryLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to update category";
      })
      .addCase(deleteCategory.pending, (state) => {
        state.deleteCategoryLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.deleteCategoryLoading = false;
        state.loading = false;
        const { deletedCategoryId } = action.payload;
        state.categories = state.categories.filter(
          (category) => category.id !== deletedCategoryId
        );
        if (
          state.categoryDetails &&
          state.categoryDetails.id === deletedCategoryId
        ) {
          state.categoryDetails = null;
        }
        state.categoriesPagination.total = Math.max(
          0,
          state.categoriesPagination.total - 1
        );
        state.error = null;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.deleteCategoryLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete category";
      })
      .addCase(getSingleCategory.pending, (state) => {
        state.categoryDetailsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getSingleCategory.fulfilled, (state, action) => {
        state.categoryDetailsLoading = false;
        state.loading = false;
        state.categoryDetails = action.payload.data;
        state.error = null;
      })
      .addCase(getSingleCategory.rejected, (state, action) => {
        state.categoryDetailsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch category details";
      })
      .addCase(getAllVerificationRequests.pending, (state) => {
        state.verificationRequestsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllVerificationRequests.fulfilled, (state, action) => {
        state.verificationRequestsLoading = false;
        state.loading = false;
        state.verificationRequests = action.payload.data.requests;
        state.verificationRequestsPagination = action.payload.data.pagination;
        state.verificationFilters = {
          ...state.verificationFilters,
          ...action.payload.data.filters,
        };
        state.error = null;
      })
      .addCase(getAllVerificationRequests.rejected, (state, action) => {
        state.verificationRequestsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch verification requests";
      })
      .addCase(getVerificationStats.pending, (state) => {
        state.verificationStatsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getVerificationStats.fulfilled, (state, action) => {
        state.verificationStatsLoading = false;
        state.loading = false;
        state.verificationStats = action.payload.data;
        state.error = null;
      })
      .addCase(getVerificationStats.rejected, (state, action) => {
        state.verificationStatsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch verification stats";
      })
      .addCase(getVerificationRequestById.pending, (state) => {
        state.verificationRequestDetailsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getVerificationRequestById.fulfilled, (state, action) => {
        state.verificationRequestDetailsLoading = false;
        state.loading = false;
        state.verificationRequestDetails = action.payload.data.request;
        state.error = null;
      })
      .addCase(getVerificationRequestById.rejected, (state, action) => {
        state.verificationRequestDetailsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message ||
          "Failed to fetch verification request details";
      })
      .addCase(reviewVerificationRequest.pending, (state) => {
        state.reviewVerificationRequestLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(reviewVerificationRequest.fulfilled, (state, action) => {
        state.reviewVerificationRequestLoading = false;
        state.loading = false;
        const updatedRequest = action.payload.data;
        state.verificationRequests = state.verificationRequests.map((request) =>
          request.requestId === updatedRequest.requestId
            ? {
                ...request,
                status: updatedRequest.status,
                reviewedAt: updatedRequest.reviewedAt,
              }
            : request
        );
        if (
          state.verificationRequestDetails &&
          state.verificationRequestDetails.requestId ===
            updatedRequest.requestId
        ) {
          state.verificationRequestDetails = {
            ...state.verificationRequestDetails,
            status: updatedRequest.status,
            reviewedAt: updatedRequest.reviewedAt,
          };
        }
        state.error = null;
      })
      .addCase(reviewVerificationRequest.rejected, (state, action) => {
        state.reviewVerificationRequestLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to review verification request";
      });
  },
});

export const {
  clearError,
  clearUsers,
  clearUserDetails,
  clearUserStats,
  clearCategories,
  clearCategoryDetails,
  clearVerificationRequests,
  clearVerificationRequestDetails,
  clearVerificationStats,
  setFilters,
  setCategoryFilters,
  setVerificationFilters,
  resetFilters,
  resetCategoryFilters,
  resetVerificationFilters,
  resetAdminUserState,
  markForRefresh,
  clearRefreshFlag,
  optimisticUserUpdate,
  optimisticUserRemove,
} = adminUserSlice.actions;

const adminUserReducer = adminUserSlice.reducer;

export default adminUserReducer;
