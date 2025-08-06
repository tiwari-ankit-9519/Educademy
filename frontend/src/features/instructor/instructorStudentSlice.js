export const getStudentAnalytics = createAsyncThunk(
  "instructorStudent/getStudentAnalytics",
  async (
    { courseId, timeframe = "month", metrics = "all" },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(
        `/instructor/students/${courseId}/analytics`,
        {
          params: { timeframe, metrics },
        }
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  students: [],
  studentDetails: null,
  pendingGrading: [],
  studentAnalytics: null,
  studentEngagement: null,
  error: null,
  loading: false,
  getEnrolledStudentsLoading: false,
  getStudentDetailsLoading: false,
  gradeAssignmentLoading: false,
  bulkGradeAssignmentsLoading: false,
  getPendingGradingLoading: false,
  getStudentAnalyticsLoading: false,
  exportStudentDataLoading: false,
  getStudentEngagementLoading: false,
  studentsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  studentsFilters: {
    search: "",
    status: "",
    courseId: "",
    sortBy: "enrolledAt",
    sortOrder: "desc",
    timeframe: "month",
  },
  studentsSummary: {
    totalStudents: 0,
    activeStudents: 0,
    completedStudents: 0,
    averageProgress: 0,
  },
  pendingGrades: {},
  pendingBulkGrades: [],
  needsRefresh: false,
};

export const getEnrolledStudents = createAsyncThunk(
  "instructorStudent/getEnrolledStudents",
  async ({ courseId, ...params }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/instructor/students/${courseId}`, {
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

export const getStudentDetails = createAsyncThunk(
  "instructorStudent/getStudentDetails",
  async ({ studentId, courseId }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/students/${studentId}/courses/${courseId}/detail`
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const gradeAssignment = createAsyncThunk(
  "instructorStudent/gradeAssignment",
  async ({ submissionId, gradeData }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalSubmission = state.instructorStudent.pendingGrading.find(
      (item) => item.id === submissionId && item.type === "assignment"
    );

    try {
      const response = await api.post(
        `/instructor/students/assignments/${submissionId}/grade`,
        gradeData
      );
      toast.success("Assignment graded successfully");
      return {
        data: response.data,
        submissionId,
        gradeData,
        originalSubmission,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        submissionId,
        gradeData,
        originalSubmission,
      });
    }
  }
);

export const bulkGradeAssignments = createAsyncThunk(
  "instructorStudent/bulkGradeAssignments",
  async (bulkGradeData, { rejectWithValue, getState }) => {
    const state = getState();
    const originalSubmissions = state.instructorStudent.pendingGrading.filter(
      (item) =>
        item.type === "assignment" &&
        bulkGradeData.assignments.some((a) => a.submissionId === item.id)
    );

    try {
      const response = await api.post(
        "/instructor/students/bulk-grade",
        bulkGradeData
      );
      toast.success("Assignments graded successfully");
      return {
        data: response.data,
        bulkGradeData,
        originalSubmissions,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        bulkGradeData,
        originalSubmissions,
      });
    }
  }
);

export const getPendingGrading = createAsyncThunk(
  "instructorStudent/getPendingGrading",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/students/pending-grading", {
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

export const exportStudentData = createAsyncThunk(
  "instructorStudent/exportStudentData",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/students/export", {
        params,
        responseType: params.format === "csv" ? "blob" : "json",
      });
      toast.success("Student data exported successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getStudentEngagement = createAsyncThunk(
  "instructorStudent/getStudentEngagement",
  async ({ courseId, timeframe = "month" }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/students/${courseId}/engagement`,
        {
          params: { timeframe },
        }
      );
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

const instructorStudentSlice = createSlice({
  name: "instructorStudent",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearStudents: (state) => {
      state.students = [];
    },
    clearStudentDetails: (state) => {
      state.studentDetails = null;
    },
    clearPendingGrading: (state) => {
      state.pendingGrading = [];
    },
    clearStudentAnalytics: (state) => {
      state.studentAnalytics = null;
    },
    clearStudentEngagement: (state) => {
      state.studentEngagement = null;
    },
    setStudentsFilters: (state, action) => {
      state.studentsFilters = {
        ...state.studentsFilters,
        ...action.payload,
      };
    },
    resetStudentsFilters: (state) => {
      state.studentsFilters = initialState.studentsFilters;
    },
    resetInstructorStudentState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEnrolledStudents.pending, (state) => {
        state.getEnrolledStudentsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getEnrolledStudents.fulfilled, (state, action) => {
        state.getEnrolledStudentsLoading = false;
        state.loading = false;
        state.error = null;
        state.students = action.payload.data.students || [];
        state.studentsPagination =
          action.payload.data.pagination || state.studentsPagination;
        state.studentsSummary =
          action.payload.data.summary || state.studentsSummary;
        state.needsRefresh = false;
      })
      .addCase(getEnrolledStudents.rejected, (state, action) => {
        state.getEnrolledStudentsLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch students";
      })

      .addCase(getStudentDetails.pending, (state) => {
        state.getStudentDetailsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getStudentDetails.fulfilled, (state, action) => {
        state.getStudentDetailsLoading = false;
        state.loading = false;
        state.error = null;
        state.studentDetails = action.payload.data;
      })
      .addCase(getStudentDetails.rejected, (state, action) => {
        state.getStudentDetailsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch student details";
      })

      .addCase(gradeAssignment.pending, (state, action) => {
        state.gradeAssignmentLoading = true;
        state.loading = true;
        state.error = null;

        const { submissionId, gradeData } = action.meta.arg;
        state.pendingGrades[submissionId] = gradeData;

        state.pendingGrading = state.pendingGrading.map((item) =>
          item.id === submissionId && item.type === "assignment"
            ? {
                ...item,
                grade: gradeData.grade,
                feedback: gradeData.feedback,
                status: "graded",
                gradedAt: new Date().toISOString(),
              }
            : item
        );
      })
      .addCase(gradeAssignment.fulfilled, (state, action) => {
        state.gradeAssignmentLoading = false;
        state.loading = false;
        state.error = null;

        const { submissionId } = action.payload;
        delete state.pendingGrades[submissionId];
      })
      .addCase(gradeAssignment.rejected, (state, action) => {
        state.gradeAssignmentLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to grade assignment";

        const { submissionId, originalSubmission } = action.payload;

        if (originalSubmission) {
          state.pendingGrading = state.pendingGrading.map((item) =>
            item.id === submissionId ? originalSubmission : item
          );
        }

        delete state.pendingGrades[submissionId];
      })

      .addCase(bulkGradeAssignments.pending, (state, action) => {
        state.bulkGradeAssignmentsLoading = true;
        state.loading = true;
        state.error = null;

        const { assignments } = action.meta.arg;
        state.pendingBulkGrades = addToArray(
          state.pendingBulkGrades,
          assignments
        );

        assignments.forEach((assignment) => {
          state.pendingGrading = state.pendingGrading.map((item) =>
            item.id === assignment.submissionId && item.type === "assignment"
              ? {
                  ...item,
                  grade: assignment.grade,
                  feedback: assignment.feedback,
                  status: "graded",
                  gradedAt: new Date().toISOString(),
                }
              : item
          );
        });
      })
      .addCase(bulkGradeAssignments.fulfilled, (state, action) => {
        state.bulkGradeAssignmentsLoading = false;
        state.loading = false;
        state.error = null;

        const { bulkGradeData } = action.payload;
        state.pendingBulkGrades = removeFromArray(
          state.pendingBulkGrades,
          bulkGradeData.assignments
        );
      })
      .addCase(bulkGradeAssignments.rejected, (state, action) => {
        state.bulkGradeAssignmentsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to grade assignments";

        const { bulkGradeData, originalSubmissions } = action.payload;

        if (originalSubmissions) {
          originalSubmissions.forEach((original) => {
            state.pendingGrading = state.pendingGrading.map((item) =>
              item.id === original.id ? original : item
            );
          });
        }

        state.pendingBulkGrades = removeFromArray(
          state.pendingBulkGrades,
          bulkGradeData?.assignments || []
        );
      })

      .addCase(getPendingGrading.pending, (state) => {
        state.getPendingGradingLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getPendingGrading.fulfilled, (state, action) => {
        state.getPendingGradingLoading = false;
        state.loading = false;
        state.error = null;
        state.pendingGrading = [
          ...action.payload.data.assignments,
          ...action.payload.data.quizzes,
        ];
      })
      .addCase(getPendingGrading.rejected, (state, action) => {
        state.getPendingGradingLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch pending grading";
      })

      .addCase(getStudentAnalytics.pending, (state) => {
        state.getStudentAnalyticsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getStudentAnalytics.fulfilled, (state, action) => {
        state.getStudentAnalyticsLoading = false;
        state.loading = false;
        state.error = null;
        state.studentAnalytics = action.payload.data;
      })
      .addCase(getStudentAnalytics.rejected, (state, action) => {
        state.getStudentAnalyticsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch student analytics";
      })

      .addCase(getStudentEngagement.pending, (state) => {
        state.getStudentEngagementLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getStudentEngagement.fulfilled, (state, action) => {
        state.getStudentEngagementLoading = false;
        state.loading = false;
        state.error = null;
        state.studentEngagement = action.payload.data;
      })
      .addCase(getStudentEngagement.rejected, (state, action) => {
        state.getStudentEngagementLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch student engagement";
      })

      .addCase(exportStudentData.pending, (state) => {
        state.exportStudentDataLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(exportStudentData.fulfilled, (state) => {
        state.exportStudentDataLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(exportStudentData.rejected, (state, action) => {
        state.exportStudentDataLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to export student data";
      });
  },
});

export const {
  clearError,
  clearStudents,
  clearStudentDetails,
  clearPendingGrading,
  clearStudentProgress,
  clearStudentAnalytics,
  clearStudentEngagement,
  clearStudentPerformance,
  clearStudentCommunication,
  clearProgressReport,
  setStudentsFilters,
  resetStudentsFilters,
  resetInstructorStudentState,
  markForRefresh,
  clearRefreshFlag,
  optimisticGradeUpdate,
  optimisticStatusUpdate,
  optimisticCertificateAdd,
  optimisticMessageAdd,
  optimisticBulkGradeUpdate,
  revertOptimisticUpdates,
} = instructorStudentSlice.actions;

const instructorStudentReducer = instructorStudentSlice.reducer;

export default instructorStudentReducer;
