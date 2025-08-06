import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  courses: [],
  course: null,
  courseStats: null,
  dashboard: null,
  courseValidation: null,
  error: null,
  loading: false,
  createCourseLoading: false,
  getCoursesLoading: false,
  getCourseLoading: false,
  updateCourseLoading: false,
  deleteCourseLoading: false,
  submitForReviewLoading: false,
  validateCourseLoading: false,
  getCourseStatsLoading: false,
  getInstructorDashboardLoading: false,
  coursesPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    useCursor: false,
    nextCursor: null,
  },
  coursesFilters: {
    status: "",
    level: "",
    categoryId: "",
    search: "",
    sortBy: "updatedAt",
    sortOrder: "desc",
  },
  pendingCreate: null,
  pendingUpdates: {},
  pendingDeletes: [],
  pendingSubmissions: [],
  needsRefresh: false,
  optimisticOperations: {
    creates: [],
    updates: {},
    deletes: [],
    submissions: {},
  },
};

export const createCourse = createAsyncThunk(
  "instructorCourse/createCourse",
  async (courseData, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      Object.keys(courseData).forEach((key) => {
        if (key === "thumbnail" && courseData[key] instanceof File) {
          formData.append("thumbnail", courseData[key]);
        } else if (Array.isArray(courseData[key])) {
          formData.append(key, JSON.stringify(courseData[key]));
        } else if (courseData[key] !== null && courseData[key] !== undefined) {
          formData.append(key, courseData[key]);
        }
      });

      const response = await api.post("/instructor/courses", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Course created successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalData: courseData,
      });
    }
  }
);

export const getCourses = createAsyncThunk(
  "instructorCourse/getCourses",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/courses", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getCourse = createAsyncThunk(
  "instructorCourse/getCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/instructor/courses/${courseId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const updateCourse = createAsyncThunk(
  "instructorCourse/updateCourse",
  async ({ courseId, updateData }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalCourse =
      state.instructorCourse.courses.find((c) => c.id === courseId) ||
      state.instructorCourse.course;

    try {
      const formData = new FormData();

      Object.keys(updateData).forEach((key) => {
        if (key === "thumbnail" && updateData[key] instanceof File) {
          formData.append("thumbnail", updateData[key]);
        } else if (Array.isArray(updateData[key])) {
          formData.append(key, JSON.stringify(updateData[key]));
        } else if (updateData[key] !== null && updateData[key] !== undefined) {
          formData.append(key, updateData[key]);
        }
      });

      const response = await api.put(
        `/instructor/courses/${courseId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Course updated successfully");
      return {
        data: response.data,
        courseId,
        updateData,
        originalCourse,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        courseId,
        originalCourse,
        updateData,
      });
    }
  }
);

export const deleteCourse = createAsyncThunk(
  "instructorCourse/deleteCourse",
  async ({ courseId, confirmDelete }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalCourse = state.instructorCourse.courses.find(
      (c) => c.id === courseId
    );

    try {
      const response = await api.delete(`/instructor/courses/${courseId}`, {
        data: { confirmDelete },
      });

      toast.success("Course deleted successfully");
      return {
        data: response.data,
        courseId,
        originalCourse,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        courseId,
        originalCourse,
      });
    }
  }
);

export const submitForReview = createAsyncThunk(
  "instructorCourse/submitForReview",
  async (courseId, { rejectWithValue, getState }) => {
    const state = getState();
    const originalCourse =
      state.instructorCourse.courses.find((c) => c.id === courseId) ||
      state.instructorCourse.course;

    try {
      const response = await api.post(`/instructor/courses/${courseId}/submit`);
      toast.success("Course submitted for review successfully");
      return {
        data: response.data,
        courseId,
        originalCourse,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        courseId,
        originalCourse,
      });
    }
  }
);

export const validateCourse = createAsyncThunk(
  "instructorCourse/validateCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/courses/${courseId}/validate`
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getCourseStats = createAsyncThunk(
  "instructorCourse/getCourseStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/courses/stats");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getInstructorDashboard = createAsyncThunk(
  "instructorCourse/getInstructorDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/courses/dashboard");
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

const instructorCourseSlice = createSlice({
  name: "instructorCourse",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCourses: (state) => {
      state.courses = [];
    },
    clearCourse: (state) => {
      state.course = null;
    },
    clearCourseStats: (state) => {
      state.courseStats = null;
    },
    clearDashboard: (state) => {
      state.dashboard = null;
    },
    clearCourseValidation: (state) => {
      state.courseValidation = null;
    },
    setCoursesFilters: (state, action) => {
      state.coursesFilters = {
        ...state.coursesFilters,
        ...action.payload,
      };
    },
    resetCoursesFilters: (state) => {
      state.coursesFilters = initialState.coursesFilters;
    },
    resetInstructorCourseState: () => {
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
      const { courseId, updateData } = action.payload;
      state.pendingUpdates[courseId] = updateData;
    },
    removeFromPendingUpdates: (state, action) => {
      const courseId = action.payload;
      delete state.pendingUpdates[courseId];
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
    addToPendingSubmissions: (state, action) => {
      state.pendingSubmissions = addToArray(
        state.pendingSubmissions,
        action.payload
      );
    },
    removeFromPendingSubmissions: (state, action) => {
      state.pendingSubmissions = removeFromArray(
        state.pendingSubmissions,
        action.payload
      );
    },
    optimisticCourseUpdate: (state, action) => {
      const { courseId, updates } = action.payload;

      state.courses = state.courses.map((course) =>
        course.id === courseId ? { ...course, ...updates } : course
      );

      if (state.course && state.course.id === courseId) {
        state.course = { ...state.course, ...updates };
      }
    },
    optimisticCourseRemove: (state, action) => {
      const courseIds = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];

      state.courses = state.courses.filter(
        (course) => !courseIds.includes(course.id)
      );

      if (state.course && courseIds.includes(state.course.id)) {
        state.course = null;
      }

      state.coursesPagination = updatePaginationAfterRemoval(
        state.coursesPagination,
        courseIds.length
      );
    },
    optimisticCourseAdd: (state, action) => {
      const newCourse = action.payload;
      state.courses.unshift(newCourse);
      state.coursesPagination = {
        ...state.coursesPagination,
        total: state.coursesPagination.total + 1,
      };
    },
    optimisticStatusChange: (state, action) => {
      const { courseId, newStatus } = action.payload;

      const courseIndex = state.courses.findIndex((c) => c.id === courseId);
      if (courseIndex !== -1) {
        state.courses[courseIndex] = {
          ...state.courses[courseIndex],
          status: newStatus,
          reviewSubmittedAt:
            newStatus === "UNDER_REVIEW" ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }

      if (state.course && state.course.id === courseId) {
        state.course = {
          ...state.course,
          status: newStatus,
          reviewSubmittedAt:
            newStatus === "UNDER_REVIEW" ? new Date().toISOString() : undefined,
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
            state.courses = state.courses.filter((c) => c.id !== tempId);
            state.optimisticOperations.creates = [];
          }
          break;
        case "update":
          if (data.originalCourse) {
            state.courses = state.courses.map((course) =>
              course.id === data.courseId ? data.originalCourse : course
            );
            if (state.course && state.course.id === data.courseId) {
              state.course = data.originalCourse;
            }
          }
          break;
        case "delete":
          if (data.originalCourse) {
            state.courses.push(data.originalCourse);
            state.coursesPagination = {
              ...state.coursesPagination,
              total: state.coursesPagination.total + 1,
            };
          }
          break;
        case "submit":
          if (data.originalCourse) {
            state.courses = state.courses.map((course) =>
              course.id === data.courseId ? data.originalCourse : course
            );
            if (state.course && state.course.id === data.courseId) {
              state.course = data.originalCourse;
            }
          }
          break;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCourse.pending, (state, action) => {
        state.createCourseLoading = true;
        state.loading = true;
        state.error = null;

        const tempCourse = {
          id: `temp_${Date.now()}`,
          ...action.meta.arg,
          status: "DRAFT",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          enrollmentsCount: 0,
          reviewsCount: 0,
          sectionsCount: 0,
          publishedSections: 0,
          price: parseFloat(action.meta.arg.price) || 0,
          discountPrice: action.meta.arg.discountPrice
            ? parseFloat(action.meta.arg.discountPrice)
            : null,
        };

        state.pendingCreate = tempCourse;
        state.courses.unshift(tempCourse);
        state.coursesPagination = {
          ...state.coursesPagination,
          total: state.coursesPagination.total + 1,
        };
        state.optimisticOperations.creates.push(tempCourse.id);
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.createCourseLoading = false;
        state.loading = false;
        state.error = null;

        const newCourse = action.payload.data.course;
        const tempId = state.optimisticOperations.creates[0];

        state.courses = state.courses.map((course) =>
          course.id === tempId ? newCourse : course
        );

        state.pendingCreate = null;
        state.optimisticOperations.creates = [];
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.createCourseLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to create course";

        const tempId = state.optimisticOperations.creates[0];
        if (tempId) {
          state.courses = state.courses.filter((c) => c.id !== tempId);
          state.coursesPagination = {
            ...state.coursesPagination,
            total: Math.max(0, state.coursesPagination.total - 1),
          };
        }

        state.pendingCreate = null;
        state.optimisticOperations.creates = [];
      })

      .addCase(getCourses.pending, (state) => {
        state.getCoursesLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourses.fulfilled, (state, action) => {
        state.getCoursesLoading = false;
        state.loading = false;
        state.error = null;
        state.courses = action.payload.data.courses || [];
        state.coursesPagination =
          action.payload.data.pagination || state.coursesPagination;
        state.needsRefresh = false;
      })
      .addCase(getCourses.rejected, (state, action) => {
        state.getCoursesLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch courses";
      })

      .addCase(getCourse.pending, (state) => {
        state.getCourseLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourse.fulfilled, (state, action) => {
        state.getCourseLoading = false;
        state.loading = false;
        state.error = null;
        state.course = action.payload.data.course;
      })
      .addCase(getCourse.rejected, (state, action) => {
        state.getCourseLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch course";
      })

      .addCase(updateCourse.pending, (state, action) => {
        state.updateCourseLoading = true;
        state.loading = true;
        state.error = null;

        const { courseId, updateData } = action.meta.arg;
        state.pendingUpdates[courseId] = updateData;

        const updatedData = {
          ...updateData,
          updatedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };

        state.courses = state.courses.map((course) =>
          course.id === courseId ? { ...course, ...updatedData } : course
        );

        if (state.course && state.course.id === courseId) {
          state.course = { ...state.course, ...updatedData };
        }

        state.optimisticOperations.updates[courseId] = updateData;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.updateCourseLoading = false;
        state.loading = false;
        state.error = null;

        const { courseId } = action.payload;
        const updatedCourse = action.payload.data.data.course;

        state.courses = state.courses.map((course) =>
          course.id === courseId ? updatedCourse : course
        );

        if (state.course && state.course.id === courseId) {
          state.course = updatedCourse;
        }

        delete state.pendingUpdates[courseId];
        delete state.optimisticOperations.updates[courseId];
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.updateCourseLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update course";

        const { courseId, originalCourse } = action.payload;

        if (originalCourse) {
          state.courses = state.courses.map((course) =>
            course.id === courseId ? originalCourse : course
          );

          if (state.course && state.course.id === courseId) {
            state.course = originalCourse;
          }
        }

        delete state.pendingUpdates[courseId];
        delete state.optimisticOperations.updates[courseId];
      })

      .addCase(deleteCourse.pending, (state, action) => {
        state.deleteCourseLoading = true;
        state.loading = true;
        state.error = null;

        const { courseId } = action.meta.arg;
        state.pendingDeletes = addToArray(state.pendingDeletes, courseId);

        state.courses = state.courses.filter((c) => c.id !== courseId);

        if (state.course && state.course.id === courseId) {
          state.course = null;
        }

        state.coursesPagination = updatePaginationAfterRemoval(
          state.coursesPagination,
          1
        );
        state.optimisticOperations.deletes.push(courseId);
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.deleteCourseLoading = false;
        state.loading = false;
        state.error = null;

        const { courseId } = action.payload;
        state.pendingDeletes = removeFromArray(state.pendingDeletes, courseId);
        state.optimisticOperations.deletes =
          state.optimisticOperations.deletes.filter((id) => id !== courseId);
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.deleteCourseLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to delete course";

        const { courseId, originalCourse } = action.payload;

        if (originalCourse) {
          state.courses.push(originalCourse);
          state.coursesPagination = {
            ...state.coursesPagination,
            total: state.coursesPagination.total + 1,
          };
        }

        state.pendingDeletes = removeFromArray(state.pendingDeletes, courseId);
        state.optimisticOperations.deletes =
          state.optimisticOperations.deletes.filter((id) => id !== courseId);
      })

      .addCase(submitForReview.pending, (state, action) => {
        state.submitForReviewLoading = true;
        state.loading = true;
        state.error = null;

        const courseId = action.meta.arg;
        state.pendingSubmissions = addToArray(
          state.pendingSubmissions,
          courseId
        );

        const courseIndex = state.courses.findIndex((c) => c.id === courseId);
        if (courseIndex !== -1) {
          state.courses[courseIndex] = {
            ...state.courses[courseIndex],
            status: "UNDER_REVIEW",
            reviewSubmittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        if (state.course && state.course.id === courseId) {
          state.course = {
            ...state.course,
            status: "UNDER_REVIEW",
            reviewSubmittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        state.optimisticOperations.submissions[courseId] = true;
      })
      .addCase(submitForReview.fulfilled, (state, action) => {
        state.submitForReviewLoading = false;
        state.loading = false;
        state.error = null;

        const { courseId } = action.payload;
        const updatedCourse = action.payload.data.data.course;

        state.courses = state.courses.map((course) =>
          course.id === courseId ? { ...course, ...updatedCourse } : course
        );

        if (state.course && state.course.id === courseId) {
          state.course = { ...state.course, ...updatedCourse };
        }

        state.pendingSubmissions = removeFromArray(
          state.pendingSubmissions,
          courseId
        );
        delete state.optimisticOperations.submissions[courseId];
      })
      .addCase(submitForReview.rejected, (state, action) => {
        state.submitForReviewLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message ||
          "Failed to submit course for review";

        const { courseId, originalCourse } = action.payload;

        if (originalCourse) {
          state.courses = state.courses.map((course) =>
            course.id === courseId ? originalCourse : course
          );

          if (state.course && state.course.id === courseId) {
            state.course = originalCourse;
          }
        }

        state.pendingSubmissions = removeFromArray(
          state.pendingSubmissions,
          courseId
        );
        delete state.optimisticOperations.submissions[courseId];
      })

      .addCase(validateCourse.pending, (state) => {
        state.validateCourseLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(validateCourse.fulfilled, (state, action) => {
        state.validateCourseLoading = false;
        state.loading = false;
        state.error = null;
        state.courseValidation = action.payload.data;
      })
      .addCase(validateCourse.rejected, (state, action) => {
        state.validateCourseLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to validate course";
      })

      .addCase(getCourseStats.pending, (state) => {
        state.getCourseStatsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourseStats.fulfilled, (state, action) => {
        state.getCourseStatsLoading = false;
        state.loading = false;
        state.error = null;
        state.courseStats = action.payload.data;
      })
      .addCase(getCourseStats.rejected, (state, action) => {
        state.getCourseStatsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch course statistics";
      })

      .addCase(getInstructorDashboard.pending, (state) => {
        state.getInstructorDashboardLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getInstructorDashboard.fulfilled, (state, action) => {
        state.getInstructorDashboardLoading = false;
        state.loading = false;
        state.error = null;
        state.dashboard = action.payload.data;
      })
      .addCase(getInstructorDashboard.rejected, (state, action) => {
        state.getInstructorDashboardLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch dashboard data";
      });
  },
});

export const {
  clearError,
  clearCourses,
  clearCourse,
  clearCourseStats,
  clearDashboard,
  clearCourseValidation,
  setCoursesFilters,
  resetCoursesFilters,
  resetInstructorCourseState,
  markForRefresh,
  clearRefreshFlag,
  addToPendingCreate,
  removeFromPendingCreate,
  addToPendingUpdates,
  removeFromPendingUpdates,
  addToPendingDeletes,
  removeFromPendingDeletes,
  addToPendingSubmissions,
  removeFromPendingSubmissions,
  optimisticCourseUpdate,
  optimisticCourseRemove,
  optimisticCourseAdd,
  optimisticStatusChange,
  revertOptimisticUpdates,
} = instructorCourseSlice.actions;

const instructorCourseReducer = instructorCourseSlice.reducer;

export default instructorCourseReducer;
