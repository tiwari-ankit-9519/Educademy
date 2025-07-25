import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  pendingCourses: [],
  courseReviewDetails: null,
  courseStats: null,
  courseReviewHistory: null,
  coursesWithHistory: [],
  error: null,
  loading: false,
  pendingCoursesLoading: false,
  courseReviewDetailsLoading: false,
  reviewCourseLoading: false,
  courseStatsLoading: false,
  bulkActionsLoading: false,
  courseReviewHistoryLoading: false,
  coursesWithHistoryLoading: false,
  needsRefresh: false,
  pendingCoursesPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  pendingCoursesFilters: {
    category: "",
    level: "",
    priority: "all",
    sortBy: "reviewSubmittedAt",
    sortOrder: "asc",
    search: "",
    instructor: "",
  },
  pendingCoursesSummary: {
    totalPending: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    overdue: 0,
  },
};

export const getPendingCourses = createAsyncThunk(
  "adminCourse/getPendingCourses",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/courses/pending", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getCourseReviewDetails = createAsyncThunk(
  "adminCourse/getCourseReviewDetails",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/courses/${courseId}/review`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const reviewCourse = createAsyncThunk(
  "adminCourse/reviewCourse",
  async ({ courseId, reviewData }, { rejectWithValue, getState }) => {
    const state = getState();
    const existingCourse = state.adminCourse.pendingCourses.find(
      (c) => c.id === courseId
    );

    const optimisticUpdate = {
      ...existingCourse,
      status: reviewData.action === "APPROVE" ? "PUBLISHED" : "REJECTED",
      reviewerFeedback: reviewData.feedback || reviewData.reason,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await api.post(
        `/admin/courses/${courseId}/review`,
        reviewData
      );
      toast.success(response.data.message);
      return {
        data: response.data.data,
        courseId,
        optimisticUpdate,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        courseId,
        originalCourse: existingCourse,
      });
    }
  }
);

export const getCourseStats = createAsyncThunk(
  "adminCourse/getCourseStats",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/courses/stats", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const bulkCourseActions = createAsyncThunk(
  "adminCourse/bulkCourseActions",
  async ({ courseIds, action, reason }, { rejectWithValue, getState }) => {
    const state = getState();
    const affectedCourses = state.adminCourse.pendingCourses.filter((c) =>
      courseIds.includes(c.id)
    );

    const statusMap = {
      APPROVE: "PUBLISHED",
      REJECT: "REJECTED",
      SUSPEND: "SUSPENDED",
      ARCHIVE: "ARCHIVED",
    };

    const optimisticUpdates = affectedCourses.map((course) => ({
      ...course,
      status: statusMap[action],
      reviewerFeedback: reason,
      updatedAt: new Date().toISOString(),
    }));

    try {
      const response = await api.post("/admin/courses/bulk-actions", {
        courseIds,
        action,
        reason,
      });
      toast.success(response.data.message);
      return {
        data: response.data.data,
        courseIds,
        optimisticUpdates,
        affectedCourses,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        courseIds,
        originalCourses: affectedCourses,
      });
    }
  }
);

export const getAllCoursesWithHistory = createAsyncThunk(
  "adminCourse/getAllCoursesWithHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/courses/history");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getCourseReviewHistory = createAsyncThunk(
  "adminCourse/getCourseReviewHistory",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/courses/${courseId}/history`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

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

const adminCourseSlice = createSlice({
  name: "adminCourse",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPendingCourses: (state) => {
      state.pendingCourses = [];
    },
    clearCourseReviewDetails: (state) => {
      state.courseReviewDetails = null;
    },
    clearCourseStats: (state) => {
      state.courseStats = null;
    },
    clearCourseReviewHistory: (state) => {
      state.courseReviewHistory = null;
    },
    clearCoursesWithHistory: (state) => {
      state.coursesWithHistory = [];
    },
    setPendingCoursesFilters: (state, action) => {
      state.pendingCoursesFilters = {
        ...state.pendingCoursesFilters,
        ...action.payload,
      };
    },
    resetPendingCoursesFilters: (state) => {
      state.pendingCoursesFilters = initialState.pendingCoursesFilters;
    },
    resetAdminCourseState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    optimisticCourseUpdate: (state, action) => {
      const { courseId, updates } = action.payload;
      state.pendingCourses = state.pendingCourses.map((course) =>
        course.id === courseId ? { ...course, ...updates } : course
      );

      if (
        state.courseReviewDetails &&
        state.courseReviewDetails.course.id === courseId
      ) {
        state.courseReviewDetails.course = {
          ...state.courseReviewDetails.course,
          ...updates,
        };
      }
    },
    optimisticCourseRemove: (state, action) => {
      const courseIds = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      state.pendingCourses = state.pendingCourses.filter(
        (course) => !courseIds.includes(course.id)
      );

      if (
        state.courseReviewDetails &&
        courseIds.includes(state.courseReviewDetails.course.id)
      ) {
        state.courseReviewDetails = null;
      }

      state.pendingCoursesPagination = updatePaginationAfterRemoval(
        state.pendingCoursesPagination,
        courseIds.length
      );
    },
    updateCoursePriorityScore: (state, action) => {
      const { courseId, priorityScore, priorityLevel } = action.payload;
      state.pendingCourses = state.pendingCourses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              metrics: {
                ...course.metrics,
                priorityScore,
                priorityLevel,
              },
            }
          : course
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPendingCourses.pending, (state) => {
        state.pendingCoursesLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getPendingCourses.fulfilled, (state, action) => {
        state.pendingCoursesLoading = false;
        state.loading = false;
        state.pendingCourses = action.payload.data.courses || [];
        state.pendingCoursesPagination =
          action.payload.data.pagination || state.pendingCoursesPagination;
        state.pendingCoursesFilters = {
          ...state.pendingCoursesFilters,
          ...action.payload.data.filters,
        };
        state.pendingCoursesSummary =
          action.payload.data.summary || state.pendingCoursesSummary;
        state.needsRefresh = false;
        state.error = null;
      })
      .addCase(getPendingCourses.rejected, (state, action) => {
        state.pendingCoursesLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch pending courses";
      })

      .addCase(getCourseReviewDetails.pending, (state) => {
        state.courseReviewDetailsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourseReviewDetails.fulfilled, (state, action) => {
        state.courseReviewDetailsLoading = false;
        state.loading = false;
        state.courseReviewDetails = action.payload.data;
        state.error = null;
      })
      .addCase(getCourseReviewDetails.rejected, (state, action) => {
        state.courseReviewDetailsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch course review details";
      })

      .addCase(reviewCourse.pending, (state, action) => {
        state.reviewCourseLoading = true;
        state.loading = true;
        state.error = null;

        const { courseId, reviewData } = action.meta.arg;
        const statusMap = {
          APPROVE: "PUBLISHED",
          REJECT: "REJECTED",
          PUBLISHED: "PUBLISHED",
          SUSPENDED: "SUSPENDED",
          ARCHIVED: "ARCHIVED",
          UNDER_REVIEW: "UNDER_REVIEW",
        };

        state.pendingCourses = state.pendingCourses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                status: statusMap[reviewData.action],
                reviewerFeedback: reviewData.feedback || reviewData.reason,
                updatedAt: new Date().toISOString(),
              }
            : course
        );

        if (
          state.courseReviewDetails &&
          state.courseReviewDetails.course.id === courseId
        ) {
          state.courseReviewDetails.course = {
            ...state.courseReviewDetails.course,
            status: statusMap[reviewData.action],
            reviewerFeedback: reviewData.feedback || reviewData.reason,
            updatedAt: new Date().toISOString(),
          };
        }
      })
      .addCase(reviewCourse.fulfilled, (state, action) => {
        state.reviewCourseLoading = false;
        state.loading = false;

        const { courseId, data } = action.payload;

        if (data.newStatus === "PUBLISHED" || data.newStatus === "REJECTED") {
          state.pendingCourses = state.pendingCourses.filter(
            (course) => course.id !== courseId
          );
          state.pendingCoursesPagination = updatePaginationAfterRemoval(
            state.pendingCoursesPagination,
            1
          );
        } else {
          state.pendingCourses = state.pendingCourses.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  status: data.newStatus,
                  reviewerFeedback: data.feedback,
                  updatedAt: data.reviewedAt,
                }
              : course
          );
        }

        if (
          state.courseReviewDetails &&
          state.courseReviewDetails.course.id === courseId
        ) {
          state.courseReviewDetails.course = {
            ...state.courseReviewDetails.course,
            status: data.newStatus,
            reviewerFeedback: data.feedback,
            updatedAt: data.reviewedAt,
          };
        }

        state.error = null;
      })
      .addCase(reviewCourse.rejected, (state, action) => {
        state.reviewCourseLoading = false;
        state.loading = false;

        if (action.payload?.originalCourse) {
          state.pendingCourses = state.pendingCourses.map((course) =>
            course.id === action.payload.originalCourse.id
              ? action.payload.originalCourse
              : course
          );

          if (
            state.courseReviewDetails &&
            state.courseReviewDetails.course.id ===
              action.payload.originalCourse.id
          ) {
            state.courseReviewDetails.course = action.payload.originalCourse;
          }
        }

        state.error =
          action.payload?.error?.message || "Failed to review course";
      })

      .addCase(getCourseStats.pending, (state) => {
        state.courseStatsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourseStats.fulfilled, (state, action) => {
        state.courseStatsLoading = false;
        state.loading = false;
        state.courseStats = action.payload.data;
        state.error = null;
      })
      .addCase(getCourseStats.rejected, (state, action) => {
        state.courseStatsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch course statistics";
      })

      .addCase(bulkCourseActions.pending, (state, action) => {
        state.bulkActionsLoading = true;
        state.loading = true;
        state.error = null;

        const { courseIds, action: bulkAction, reason } = action.meta.arg;
        const statusMap = {
          APPROVE: "PUBLISHED",
          REJECT: "REJECTED",
          SUSPEND: "SUSPENDED",
          ARCHIVE: "ARCHIVED",
        };

        state.pendingCourses = state.pendingCourses.map((course) =>
          courseIds.includes(course.id)
            ? {
                ...course,
                status: statusMap[bulkAction],
                reviewerFeedback: reason,
                updatedAt: new Date().toISOString(),
              }
            : course
        );
      })
      .addCase(bulkCourseActions.fulfilled, (state, action) => {
        state.bulkActionsLoading = false;
        state.loading = false;

        const { data } = action.payload;
        const { results } = data;

        if (results && Array.isArray(results)) {
          const shouldRemoveFromPending = results.some(
            (result) =>
              result.success &&
              (result.newStatus === "PUBLISHED" ||
                result.newStatus === "REJECTED")
          );

          if (shouldRemoveFromPending) {
            const removedCourseIds = results
              .filter(
                (result) =>
                  result.success &&
                  (result.newStatus === "PUBLISHED" ||
                    result.newStatus === "REJECTED")
              )
              .map((result) => result.courseId);

            state.pendingCourses = state.pendingCourses.filter(
              (course) => !removedCourseIds.includes(course.id)
            );
            state.pendingCoursesPagination = updatePaginationAfterRemoval(
              state.pendingCoursesPagination,
              removedCourseIds.length
            );
          } else {
            state.pendingCourses = state.pendingCourses.map((course) => {
              const result = results.find(
                (r) => r.courseId === course.id && r.success
              );
              return result
                ? {
                    ...course,
                    status: result.newStatus,
                    updatedAt: new Date().toISOString(),
                  }
                : course;
            });
          }
        }

        state.error = null;
      })
      .addCase(bulkCourseActions.rejected, (state, action) => {
        state.bulkActionsLoading = false;
        state.loading = false;

        if (action.payload?.originalCourses) {
          const originalCoursesMap = new Map(
            action.payload.originalCourses.map((course) => [course.id, course])
          );

          state.pendingCourses = state.pendingCourses.map((course) =>
            originalCoursesMap.has(course.id)
              ? originalCoursesMap.get(course.id)
              : course
          );
        }

        state.error =
          action.payload?.error?.message || "Failed to execute bulk actions";
      })

      .addCase(getCourseReviewHistory.pending, (state) => {
        state.courseReviewHistoryLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourseReviewHistory.fulfilled, (state, action) => {
        state.courseReviewHistoryLoading = false;
        state.loading = false;
        state.courseReviewHistory = action.payload.data;
        state.error = null;
      })
      .addCase(getCourseReviewHistory.rejected, (state, action) => {
        state.courseReviewHistoryLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch course review history";
      })

      .addCase(getAllCoursesWithHistory.pending, (state) => {
        state.coursesWithHistoryLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCoursesWithHistory.fulfilled, (state, action) => {
        state.coursesWithHistoryLoading = false;
        state.loading = false;
        state.coursesWithHistory = action.payload.data.courses || [];
        state.error = null;
      })
      .addCase(getAllCoursesWithHistory.rejected, (state, action) => {
        state.coursesWithHistoryLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch courses with history";
      });
  },
});

export const {
  clearError,
  clearPendingCourses,
  clearCourseReviewDetails,
  clearCourseStats,
  clearCourseReviewHistory,
  clearCoursesWithHistory,
  setPendingCoursesFilters,
  resetPendingCoursesFilters,
  resetAdminCourseState,
  markForRefresh,
  clearRefreshFlag,
  optimisticCourseUpdate,
  optimisticCourseRemove,
  updateCoursePriorityScore,
} = adminCourseSlice.actions;

const adminCourseReducer = adminCourseSlice.reducer;

export default adminCourseReducer;
