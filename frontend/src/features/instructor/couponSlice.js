import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  coupons: [],
  coupon: null,
  couponAnalytics: null,
  expiringSoonCoupons: [],
  error: null,
  loading: false,
  createCouponLoading: false,
  getCouponsLoading: false,
  getCouponByIdLoading: false,
  updateCouponLoading: false,
  deleteCouponLoading: false,
  applyCouponLoading: false,
  getCouponAnalyticsLoading: false,
  toggleCouponStatusLoading: false,
  bulkUpdateCouponsLoading: false,
  getExpiringSoonCouponsLoading: false,
  couponsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  couponsFilters: {
    search: "",
    type: "",
    applicableTo: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  couponsSummary: {
    totalCoupons: 0,
    activeCoupons: 0,
    expiredCoupons: 0,
    totalUsages: 0,
  },
  pendingCreate: null,
  pendingUpdates: {},
  pendingDeletes: [],
  pendingToggleStatus: [],
  pendingBulkUpdates: [],
  needsRefresh: false,
  optimisticOperations: {
    creates: [],
    updates: {},
    deletes: [],
    toggles: {},
    bulkUpdates: [],
  },
};

export const createCoupon = createAsyncThunk(
  "coupon/createCoupon",
  async (couponData, { rejectWithValue }) => {
    try {
      const response = await api.post("/instructor/coupons/create", couponData);
      toast.success("Coupon created successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalData: couponData,
      });
    }
  }
);

export const getCoupons = createAsyncThunk(
  "coupon/getCoupons",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/coupons/all", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getCouponById = createAsyncThunk(
  "coupon/getCouponById",
  async (couponId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/instructor/coupons/${couponId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const updateCoupon = createAsyncThunk(
  "coupon/updateCoupon",
  async ({ couponId, updateData }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalCoupon =
      state.coupon.coupons.find((c) => c.id === couponId) ||
      state.coupon.coupon;

    try {
      const response = await api.put(
        `/instructor/coupons/${couponId}`,
        updateData
      );
      toast.success("Coupon updated successfully");
      return {
        data: response.data,
        couponId,
        updateData,
        originalCoupon,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        couponId,
        originalCoupon,
        updateData,
      });
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  "coupon/deleteCoupon",
  async (couponId, { rejectWithValue, getState }) => {
    const state = getState();
    const originalCoupon = state.coupon.coupons.find((c) => c.id === couponId);

    try {
      const response = await api.delete(`/instructor/coupons/${couponId}`);
      toast.success("Coupon deleted successfully");
      return {
        data: response.data,
        couponId,
        originalCoupon,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        couponId,
        originalCoupon,
      });
    }
  }
);

export const applyCoupon = createAsyncThunk(
  "coupon/applyCoupon",
  async (applicationData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/instructor/coupons/apply",
        applicationData
      );
      toast.success("Coupon applied successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getCouponAnalytics = createAsyncThunk(
  "coupon/getCouponAnalytics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/coupons/analytics", {
        params,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const toggleCouponStatus = createAsyncThunk(
  "coupon/toggleCouponStatus",
  async (couponId, { rejectWithValue, getState }) => {
    const state = getState();
    const originalCoupon =
      state.coupon.coupons.find((c) => c.id === couponId) ||
      state.coupon.coupon;

    try {
      const response = await api.patch(
        `/instructor/coupons/${couponId}/toggle-status`
      );
      toast.success(
        `Coupon ${
          originalCoupon?.isActive ? "deactivated" : "activated"
        } successfully`
      );
      return {
        data: response.data,
        couponId,
        originalCoupon,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        couponId,
        originalCoupon,
      });
    }
  }
);

export const bulkUpdateCoupons = createAsyncThunk(
  "coupon/bulkUpdateCoupons",
  async (bulkData, { rejectWithValue, getState }) => {
    const state = getState();
    const originalCoupons = state.coupon.coupons.filter((c) =>
      bulkData.couponIds.includes(c.id)
    );

    try {
      const response = await api.put(
        "/instructor/coupons/bulk-update",
        bulkData
      );
      toast.success(
        `${bulkData.couponIds.length} coupons updated successfully`
      );
      return {
        data: response.data,
        bulkData,
        originalCoupons,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        bulkData,
        originalCoupons,
      });
    }
  }
);

export const getExpiringSoonCoupons = createAsyncThunk(
  "coupon/getExpiringSoonCoupons",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/coupons/expiring-soon", {
        params,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

const addToArray = (array, items) => {
  const itemsArray = Array.isArray(items) ? items : [items];
  const newItems = itemsArray.filter((item) => !array.includes(item));
  return [...array, ...newItems];
};

const removeFromArray = (array, items) => {
  const itemsArray = Array.isArray(items) ? items : [items];
  return array.filter((item) => !itemsArray.includes(item));
};

const updatePaginationAfterRemoval = (pagination, removedCount) => {
  const newTotal = Math.max(0, pagination.total - removedCount);
  const newTotalPages = Math.max(1, Math.ceil(newTotal / pagination.limit));

  return {
    ...pagination,
    total: newTotal,
    totalPages: newTotalPages,
    hasNext: pagination.page < newTotalPages,
    hasPrev: pagination.page > 1,
  };
};

const updateSummaryAfterCreate = (summary) => {
  return {
    ...summary,
    totalCoupons: summary.totalCoupons + 1,
    activeCoupons: summary.activeCoupons + 1,
  };
};

const updateSummaryAfterDelete = (summary, deletedCoupon) => {
  return {
    ...summary,
    totalCoupons: Math.max(0, summary.totalCoupons - 1),
    activeCoupons: deletedCoupon?.isActive
      ? Math.max(0, summary.activeCoupons - 1)
      : summary.activeCoupons,
    expiredCoupons:
      deletedCoupon?.status === "expired"
        ? Math.max(0, summary.expiredCoupons - 1)
        : summary.expiredCoupons,
  };
};

const updateSummaryAfterToggle = (summary, originalCoupon) => {
  if (!originalCoupon) return summary;

  return {
    ...summary,
    activeCoupons: originalCoupon.isActive
      ? Math.max(0, summary.activeCoupons - 1)
      : summary.activeCoupons + 1,
  };
};

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCoupons: (state) => {
      state.coupons = [];
    },
    clearCoupon: (state) => {
      state.coupon = null;
    },
    clearCouponAnalytics: (state) => {
      state.couponAnalytics = null;
    },
    clearExpiringSoonCoupons: (state) => {
      state.expiringSoonCoupons = [];
    },
    setCouponsFilters: (state, action) => {
      state.couponsFilters = {
        ...state.couponsFilters,
        ...action.payload,
      };
    },
    resetCouponsFilters: (state) => {
      state.couponsFilters = initialState.couponsFilters;
    },
    resetCouponState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    addToPendingCreate: (state, action) => {
      state.pendingCreate = action.payload;
    },
    removeFromPendingCreate: (state) => {
      state.pendingCreate = null;
    },
    addToPendingUpdates: (state, action) => {
      const { couponId, updateData } = action.payload;
      state.pendingUpdates[couponId] = updateData;
    },
    removeFromPendingUpdates: (state, action) => {
      const couponId = action.payload;
      delete state.pendingUpdates[couponId];
    },
    addToPendingDeletes: (state, action) => {
      state.pendingDeletes = addToArray(state.pendingDeletes, action.payload);
    },
    removeFromPendingDeletes: (state, action) => {
      state.pendingDeletes = removeFromArray(
        state.pendingDeletes,
        action.payload
      );
    },
    addToPendingToggleStatus: (state, action) => {
      state.pendingToggleStatus = addToArray(
        state.pendingToggleStatus,
        action.payload
      );
    },
    removeFromPendingToggleStatus: (state, action) => {
      state.pendingToggleStatus = removeFromArray(
        state.pendingToggleStatus,
        action.payload
      );
    },
    addToPendingBulkUpdates: (state, action) => {
      state.pendingBulkUpdates = addToArray(
        state.pendingBulkUpdates,
        action.payload
      );
    },
    removeFromPendingBulkUpdates: (state, action) => {
      state.pendingBulkUpdates = removeFromArray(
        state.pendingBulkUpdates,
        action.payload
      );
    },
    optimisticCouponUpdate: (state, action) => {
      const { couponId, updates } = action.payload;

      state.coupons = state.coupons.map((coupon) =>
        coupon.id === couponId ? { ...coupon, ...updates } : coupon
      );

      if (state.coupon && state.coupon.id === couponId) {
        state.coupon = { ...state.coupon, ...updates };
      }
    },
    optimisticCouponRemove: (state, action) => {
      const couponIds = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];

      const removedCoupons = state.coupons.filter((coupon) =>
        couponIds.includes(coupon.id)
      );

      state.coupons = state.coupons.filter(
        (coupon) => !couponIds.includes(coupon.id)
      );

      if (state.coupon && couponIds.includes(state.coupon.id)) {
        state.coupon = null;
      }

      state.couponsPagination = updatePaginationAfterRemoval(
        state.couponsPagination,
        couponIds.length
      );

      removedCoupons.forEach((coupon) => {
        state.couponsSummary = updateSummaryAfterDelete(
          state.couponsSummary,
          coupon
        );
      });
    },
    optimisticCouponAdd: (state, action) => {
      const newCoupon = action.payload;
      state.coupons.unshift(newCoupon);
      state.couponsPagination = {
        ...state.couponsPagination,
        total: state.couponsPagination.total + 1,
      };
      state.couponsSummary = updateSummaryAfterCreate(state.couponsSummary);
    },
    optimisticBulkUpdate: (state, action) => {
      const { couponIds, updateData } = action.payload;

      state.coupons = state.coupons.map((coupon) =>
        couponIds.includes(coupon.id)
          ? { ...coupon, ...updateData, updatedAt: new Date().toISOString() }
          : coupon
      );

      if (state.coupon && couponIds.includes(state.coupon.id)) {
        state.coupon = {
          ...state.coupon,
          ...updateData,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    revertOptimisticUpdates: (state, action) => {
      const { type, data } = action.payload;

      switch (type) {
        case "create":
          if (state.optimisticOperations.creates.length > 0) {
            const tempId = state.optimisticOperations.creates[0];
            state.coupons = state.coupons.filter((c) => c.id !== tempId);
            state.optimisticOperations.creates = [];
          }
          break;
        case "update":
          if (data.originalCoupon) {
            state.coupons = state.coupons.map((coupon) =>
              coupon.id === data.couponId ? data.originalCoupon : coupon
            );
            if (state.coupon && state.coupon.id === data.couponId) {
              state.coupon = data.originalCoupon;
            }
          }
          break;
        case "delete":
          if (data.originalCoupon) {
            state.coupons.push(data.originalCoupon);
            state.couponsPagination = {
              ...state.couponsPagination,
              total: state.couponsPagination.total + 1,
            };
          }
          break;
        case "toggle":
          if (data.originalCoupon) {
            state.coupons = state.coupons.map((coupon) =>
              coupon.id === data.couponId ? data.originalCoupon : coupon
            );
            if (state.coupon && state.coupon.id === data.couponId) {
              state.coupon = data.originalCoupon;
            }
          }
          break;
        case "bulk":
          if (data.originalCoupons) {
            const originalCouponsMap = new Map(
              data.originalCoupons.map((coupon) => [coupon.id, coupon])
            );
            state.coupons = state.coupons.map((coupon) =>
              originalCouponsMap.has(coupon.id)
                ? originalCouponsMap.get(coupon.id)
                : coupon
            );
          }
          break;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCoupon.pending, (state, action) => {
        state.createCouponLoading = true;
        state.loading = true;
        state.error = null;

        const tempCoupon = {
          id: `temp_${Date.now()}`,
          ...action.meta.arg,
          code: action.meta.arg.code?.toUpperCase(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          usedCount: 0,
          totalUsages: 0,
          connectedCourses: 0,
          status: "active",
          usagePercentage: null,
        };

        state.pendingCreate = tempCoupon;
        state.coupons.unshift(tempCoupon);
        state.couponsPagination = {
          ...state.couponsPagination,
          total: state.couponsPagination.total + 1,
        };
        state.couponsSummary = updateSummaryAfterCreate(state.couponsSummary);
        state.optimisticOperations.creates.push(tempCoupon.id);
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.createCouponLoading = false;
        state.loading = false;
        state.error = null;

        const newCoupon = action.payload.data.coupon;
        const tempId = state.optimisticOperations.creates[0];

        state.coupons = state.coupons.map((coupon) =>
          coupon.id === tempId ? newCoupon : coupon
        );

        state.pendingCreate = null;
        state.optimisticOperations.creates = [];
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.createCouponLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to create coupon";

        const tempId = state.optimisticOperations.creates[0];
        if (tempId) {
          state.coupons = state.coupons.filter((c) => c.id !== tempId);
          state.couponsPagination = {
            ...state.couponsPagination,
            total: Math.max(0, state.couponsPagination.total - 1),
          };
          state.couponsSummary = {
            ...state.couponsSummary,
            totalCoupons: Math.max(0, state.couponsSummary.totalCoupons - 1),
            activeCoupons: Math.max(0, state.couponsSummary.activeCoupons - 1),
          };
        }

        state.pendingCreate = null;
        state.optimisticOperations.creates = [];
      })

      .addCase(getCoupons.pending, (state) => {
        state.getCouponsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCoupons.fulfilled, (state, action) => {
        state.getCouponsLoading = false;
        state.loading = false;
        state.error = null;
        state.coupons = action.payload.data.coupons || [];
        state.couponsPagination =
          action.payload.data.pagination || state.couponsPagination;
        state.couponsSummary =
          action.payload.data.summary || state.couponsSummary;
        state.needsRefresh = false;
      })
      .addCase(getCoupons.rejected, (state, action) => {
        state.getCouponsLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch coupons";
      })

      .addCase(getCouponById.pending, (state) => {
        state.getCouponByIdLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCouponById.fulfilled, (state, action) => {
        state.getCouponByIdLoading = false;
        state.loading = false;
        state.error = null;
        state.coupon = action.payload.data.coupon;
      })
      .addCase(getCouponById.rejected, (state, action) => {
        state.getCouponByIdLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch coupon";
      })

      .addCase(updateCoupon.pending, (state, action) => {
        state.updateCouponLoading = true;
        state.loading = true;
        state.error = null;

        const { couponId, updateData } = action.meta.arg;
        state.pendingUpdates[couponId] = updateData;

        const updatedData = {
          ...updateData,
          updatedAt: new Date().toISOString(),
        };

        state.coupons = state.coupons.map((coupon) =>
          coupon.id === couponId ? { ...coupon, ...updatedData } : coupon
        );

        if (state.coupon && state.coupon.id === couponId) {
          state.coupon = { ...state.coupon, ...updatedData };
        }

        state.optimisticOperations.updates[couponId] = updateData;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.updateCouponLoading = false;
        state.loading = false;
        state.error = null;

        const { couponId } = action.payload;
        const updatedCoupon = action.payload.data.data.coupon;

        state.coupons = state.coupons.map((coupon) =>
          coupon.id === couponId ? updatedCoupon : coupon
        );

        if (state.coupon && state.coupon.id === couponId) {
          state.coupon = updatedCoupon;
        }

        delete state.pendingUpdates[couponId];
        delete state.optimisticOperations.updates[couponId];
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.updateCouponLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update coupon";

        const { couponId, originalCoupon } = action.payload;

        if (originalCoupon) {
          state.coupons = state.coupons.map((coupon) =>
            coupon.id === couponId ? originalCoupon : coupon
          );

          if (state.coupon && state.coupon.id === couponId) {
            state.coupon = originalCoupon;
          }
        }

        delete state.pendingUpdates[couponId];
        delete state.optimisticOperations.updates[couponId];
      })

      .addCase(deleteCoupon.pending, (state, action) => {
        state.deleteCouponLoading = true;
        state.loading = true;
        state.error = null;

        const couponId = action.meta.arg;
        const couponToDelete = state.coupons.find((c) => c.id === couponId);

        state.pendingDeletes = addToArray(state.pendingDeletes, couponId);

        if (couponToDelete) {
          state.couponsSummary = updateSummaryAfterDelete(
            state.couponsSummary,
            couponToDelete
          );
        }

        state.coupons = state.coupons.filter((c) => c.id !== couponId);

        if (state.coupon && state.coupon.id === couponId) {
          state.coupon = null;
        }

        state.couponsPagination = updatePaginationAfterRemoval(
          state.couponsPagination,
          1
        );
        state.optimisticOperations.deletes.push(couponId);
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.deleteCouponLoading = false;
        state.loading = false;
        state.error = null;

        const { couponId } = action.payload;
        state.pendingDeletes = removeFromArray(state.pendingDeletes, couponId);
        state.optimisticOperations.deletes =
          state.optimisticOperations.deletes.filter((id) => id !== couponId);
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.deleteCouponLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to delete coupon";

        const { couponId, originalCoupon } = action.payload;

        if (originalCoupon) {
          state.coupons.push(originalCoupon);
          state.couponsPagination = {
            ...state.couponsPagination,
            total: state.couponsPagination.total + 1,
          };
          state.couponsSummary = updateSummaryAfterCreate(state.couponsSummary);
        }

        state.pendingDeletes = removeFromArray(state.pendingDeletes, couponId);
        state.optimisticOperations.deletes =
          state.optimisticOperations.deletes.filter((id) => id !== couponId);
      })

      .addCase(applyCoupon.pending, (state) => {
        state.applyCouponLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.applyCouponLoading = false;
        state.loading = false;
        state.error = null;

        const appliedCouponId = action.payload.data.usage?.coupon?.id;
        if (appliedCouponId) {
          state.coupons = state.coupons.map((coupon) =>
            coupon.id === appliedCouponId
              ? {
                  ...coupon,
                  usedCount: (coupon.usedCount || 0) + 1,
                  totalUsages: (coupon.totalUsages || 0) + 1,
                }
              : coupon
          );

          if (state.coupon && state.coupon.id === appliedCouponId) {
            state.coupon = {
              ...state.coupon,
              usedCount: (state.coupon.usedCount || 0) + 1,
              totalUsages: (state.coupon.totalUsages || 0) + 1,
            };
          }
        }
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.applyCouponLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to apply coupon";
      })

      .addCase(getCouponAnalytics.pending, (state) => {
        state.getCouponAnalyticsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCouponAnalytics.fulfilled, (state, action) => {
        state.getCouponAnalyticsLoading = false;
        state.loading = false;
        state.error = null;
        state.couponAnalytics = action.payload.data;
      })
      .addCase(getCouponAnalytics.rejected, (state, action) => {
        state.getCouponAnalyticsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch coupon analytics";
      })

      .addCase(toggleCouponStatus.pending, (state, action) => {
        state.toggleCouponStatusLoading = true;
        state.loading = true;
        state.error = null;

        const couponId = action.meta.arg;
        const originalCoupon =
          state.coupons.find((c) => c.id === couponId) || state.coupon;

        state.pendingToggleStatus = addToArray(
          state.pendingToggleStatus,
          couponId
        );

        if (originalCoupon) {
          const newStatus = !originalCoupon.isActive;
          const updatedData = {
            isActive: newStatus,
            updatedAt: new Date().toISOString(),
          };

          state.coupons = state.coupons.map((coupon) =>
            coupon.id === couponId ? { ...coupon, ...updatedData } : coupon
          );

          if (state.coupon && state.coupon.id === couponId) {
            state.coupon = { ...state.coupon, ...updatedData };
          }

          state.couponsSummary = updateSummaryAfterToggle(
            state.couponsSummary,
            originalCoupon
          );
          state.optimisticOperations.toggles[couponId] = originalCoupon;
        }
      })
      .addCase(toggleCouponStatus.fulfilled, (state, action) => {
        state.toggleCouponStatusLoading = false;
        state.loading = false;
        state.error = null;

        const { couponId } = action.payload;
        const updatedCoupon = action.payload.data.data.coupon;

        state.coupons = state.coupons.map((coupon) =>
          coupon.id === couponId ? { ...coupon, ...updatedCoupon } : coupon
        );

        if (state.coupon && state.coupon.id === couponId) {
          state.coupon = { ...state.coupon, ...updatedCoupon };
        }

        state.pendingToggleStatus = removeFromArray(
          state.pendingToggleStatus,
          couponId
        );
        delete state.optimisticOperations.toggles[couponId];
      })
      .addCase(toggleCouponStatus.rejected, (state, action) => {
        state.toggleCouponStatusLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to toggle coupon status";

        const { couponId, originalCoupon } = action.payload;

        if (originalCoupon) {
          state.coupons = state.coupons.map((coupon) =>
            coupon.id === couponId ? originalCoupon : coupon
          );

          if (state.coupon && state.coupon.id === couponId) {
            state.coupon = originalCoupon;
          }

          state.couponsSummary = updateSummaryAfterToggle(
            state.couponsSummary,
            {
              ...originalCoupon,
              isActive: !originalCoupon.isActive,
            }
          );
        }

        state.pendingToggleStatus = removeFromArray(
          state.pendingToggleStatus,
          couponId
        );
        delete state.optimisticOperations.toggles[couponId];
      })

      .addCase(bulkUpdateCoupons.pending, (state, action) => {
        state.bulkUpdateCouponsLoading = true;
        state.loading = true;
        state.error = null;

        const {
          couponIds,
          action: updateAction,
          data: updateData,
        } = action.meta.arg;
        state.pendingBulkUpdates = addToArray(
          state.pendingBulkUpdates,
          couponIds
        );

        let bulkUpdateData = {};
        switch (updateAction) {
          case "activate":
            bulkUpdateData.isActive = true;
            break;
          case "deactivate":
            bulkUpdateData.isActive = false;
            break;
          case "extend":
            if (updateData?.validUntil) {
              bulkUpdateData.validUntil = new Date(updateData.validUntil);
            }
            break;
          case "update":
            if (updateData?.usageLimit !== undefined)
              bulkUpdateData.usageLimit = parseInt(updateData.usageLimit);
            if (updateData?.minimumAmount !== undefined)
              bulkUpdateData.minimumAmount = parseFloat(
                updateData.minimumAmount
              );
            if (updateData?.maximumDiscount !== undefined)
              bulkUpdateData.maximumDiscount = parseFloat(
                updateData.maximumDiscount
              );
            break;
        }

        if (Object.keys(bulkUpdateData).length > 0) {
          state.coupons = state.coupons.map((coupon) =>
            couponIds.includes(coupon.id)
              ? {
                  ...coupon,
                  ...bulkUpdateData,
                  updatedAt: new Date().toISOString(),
                }
              : coupon
          );

          if (state.coupon && couponIds.includes(state.coupon.id)) {
            state.coupon = {
              ...state.coupon,
              ...bulkUpdateData,
              updatedAt: new Date().toISOString(),
            };
          }
        }

        state.optimisticOperations.bulkUpdates.push({
          couponIds,
          updateData: bulkUpdateData,
        });
      })
      .addCase(bulkUpdateCoupons.fulfilled, (state, action) => {
        state.bulkUpdateCouponsLoading = false;
        state.loading = false;
        state.error = null;

        const { bulkData } = action.payload;
        state.pendingBulkUpdates = removeFromArray(
          state.pendingBulkUpdates,
          bulkData.couponIds
        );
        state.optimisticOperations.bulkUpdates =
          state.optimisticOperations.bulkUpdates.filter(
            (op) => !op.couponIds.every((id) => bulkData.couponIds.includes(id))
          );
      })
      .addCase(bulkUpdateCoupons.rejected, (state, action) => {
        state.bulkUpdateCouponsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update coupons";

        const { bulkData, originalCoupons } = action.payload;

        if (originalCoupons && originalCoupons.length > 0) {
          const originalCouponsMap = new Map(
            originalCoupons.map((coupon) => [coupon.id, coupon])
          );

          state.coupons = state.coupons.map((coupon) =>
            originalCouponsMap.has(coupon.id)
              ? originalCouponsMap.get(coupon.id)
              : coupon
          );

          if (state.coupon && originalCouponsMap.has(state.coupon.id)) {
            state.coupon = originalCouponsMap.get(state.coupon.id);
          }
        }

        if (bulkData?.couponIds) {
          state.pendingBulkUpdates = removeFromArray(
            state.pendingBulkUpdates,
            bulkData.couponIds
          );
        }

        state.optimisticOperations.bulkUpdates =
          state.optimisticOperations.bulkUpdates.filter(
            (op) =>
              !op.couponIds.every((id) => bulkData?.couponIds?.includes(id))
          );
      })

      .addCase(getExpiringSoonCoupons.pending, (state) => {
        state.getExpiringSoonCouponsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getExpiringSoonCoupons.fulfilled, (state, action) => {
        state.getExpiringSoonCouponsLoading = false;
        state.loading = false;
        state.error = null;
        state.expiringSoonCoupons = action.payload.data.coupons || [];
      })
      .addCase(getExpiringSoonCoupons.rejected, (state, action) => {
        state.getExpiringSoonCouponsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch expiring coupons";
      });
  },
});

export const {
  clearError,
  clearCoupons,
  clearCoupon,
  clearCouponAnalytics,
  clearExpiringSoonCoupons,
  setCouponsFilters,
  resetCouponsFilters,
  resetCouponState,
  markForRefresh,
  clearRefreshFlag,
  addToPendingCreate,
  removeFromPendingCreate,
  addToPendingUpdates,
  removeFromPendingUpdates,
  addToPendingDeletes,
  removeFromPendingDeletes,
  addToPendingToggleStatus,
  removeFromPendingToggleStatus,
  addToPendingBulkUpdates,
  removeFromPendingBulkUpdates,
  optimisticCouponUpdate,
  optimisticCouponRemove,
  optimisticCouponAdd,
  optimisticBulkUpdate,
  revertOptimisticUpdates,
} = couponSlice.actions;

const couponReducer = couponSlice.reducer;

export default couponReducer;
