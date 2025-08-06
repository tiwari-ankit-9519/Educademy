import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  getEnrolledStudents,
  getStudentDetails,
  gradeAssignment,
  bulkGradeAssignments,
  getPendingGrading,
  getStudentAnalytics,
  getStudentEngagement,
  exportStudentData,
  setStudentsFilters,
  resetStudentsFilters,
  clearError,
  clearStudentDetails,
  clearStudentAnalytics,
  clearStudentEngagement,
} from "@/features/instructor/instructorStudentSlice";
import { getCourses } from "@/features/instructor/instructorCourseSlice";
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Activity,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Download,
  Save,
  X,
  Loader2,
  TrendingUp,
  BarChart3,
  User,
  GraduationCap,
  Award,
  Filter,
  Eye,
  Star,
  Calendar,
  Target,
  Brain,
  Zap,
  MapPin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const DataTable = ({
  columns,
  data,
  onRowSelect,
  onSelectAll,
  selectedRows,
  getStatusColor,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === "name") {
        aValue = a.student.name.toLowerCase();
        bValue = b.student.name.toLowerCase();
      } else if (sortConfig.key === "email") {
        aValue = a.student.email.toLowerCase();
        bValue = b.student.email.toLowerCase();
      } else if (sortConfig.key === "enrolled") {
        aValue = new Date(a.enrolledAt);
        bValue = new Date(b.enrolledAt);
      } else if (sortConfig.key === "progress") {
        aValue = a.progress;
        bValue = b.progress;
      } else if (sortConfig.key === "lastAccess") {
        aValue = a.lastAccessedAt ? new Date(a.lastAccessedAt) : new Date(0);
        bValue = b.lastAccessedAt ? new Date(b.lastAccessedAt) : new Date(0);
      } else {
        return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  return (
    <div className="rounded-xl border bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedRows.length === data.length && data.length > 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("name")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                Student
                {getSortIcon("name")}
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("enrolled")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                Enrolled
                {getSortIcon("enrolled")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("progress")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                Progress
                {getSortIcon("progress")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("lastAccess")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                Last Access
                {getSortIcon("lastAccess")}
              </Button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((enrollment) => (
            <TableRow
              key={enrollment.id}
              className="hover:bg-white/70 dark:hover:bg-slate-700/70"
            >
              <TableCell>
                <Checkbox
                  checked={selectedRows.includes(enrollment.student.id)}
                  onCheckedChange={() => onRowSelect(enrollment.student.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {enrollment.student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-white">
                      {enrollment.student.name}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {enrollment.student.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  className={cn("text-xs", getStatusColor(enrollment.status))}
                >
                  {enrollment.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {format(new Date(enrollment.enrolledAt), "MMM dd, yyyy")}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Progress value={enrollment.progress} className="h-2 w-16" />
                  <span className="text-sm font-medium">
                    {enrollment.progress}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {enrollment.lastAccessedAt
                    ? formatDistanceToNow(new Date(enrollment.lastAccessedAt)) +
                      " ago"
                    : "Never"}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    columns
                      .find((col) => col.id === "actions")
                      .onView(enrollment)
                  }
                  className="rounded-lg"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const StudentManagementPage = () => {
  const dispatch = useDispatch();
  const { courseId: routeCourseId } = useParams();
  const [searchParams] = useSearchParams();
  const courseIdFromParams = searchParams.get("courseId");
  const courseId = routeCourseId || courseIdFromParams;

  const {
    students,
    studentDetails,
    pendingGrading,
    studentAnalytics,
    studentEngagement,
    studentsPagination,
    studentsFilters,
    studentsSummary,
    getEnrolledStudentsLoading,
    getStudentDetailsLoading,
    gradeAssignmentLoading,
    bulkGradeAssignmentsLoading,
    getPendingGradingLoading,
    getStudentAnalyticsLoading,
    getStudentEngagementLoading,
    exportStudentDataLoading,
    error,
  } = useSelector((state) => state.instructorStudent);

  const { courses, getCoursesLoading } = useSelector(
    (state) => state.instructorCourse
  );

  const [isStudentDetailsDialogOpen, setIsStudentDetailsDialogOpen] =
    useState(false);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [isBulkGradeDialogOpen, setIsBulkGradeDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [isEngagementDialogOpen, setIsEngagementDialogOpen] = useState(false);
  const [isPendingGradingDialogOpen, setIsPendingGradingDialogOpen] =
    useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId || "");

  const [gradeFormData, setGradeFormData] = useState({
    grade: "",
    feedback: "",
    rubricScores: {},
  });

  const [bulkGradeData, setBulkGradeData] = useState({
    assignments: [],
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "SUSPENDED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.student.id));
    }
  };

  const handleSelectSubmission = (submissionId) => {
    setSelectedSubmissions((prev) =>
      prev.includes(submissionId)
        ? prev.filter((id) => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleSelectAllSubmissions = () => {
    if (selectedSubmissions.length === pendingGrading.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(pendingGrading.map((s) => s.id));
    }
  };

  const handleViewStudentDetails = async (student) => {
    setSelectedStudent(student);
    dispatch(clearStudentDetails());
    setIsStudentDetailsDialogOpen(true);

    try {
      await dispatch(
        getStudentDetails({
          studentId: student.student.id,
          courseId: selectedCourseId,
        })
      ).unwrap();
    } catch (error) {
      toast.error(error.message || "Failed to load student details");
    }
  };

  const tableColumns = useMemo(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={
              selectedStudents.length === students.length && students.length > 0
            }
            onCheckedChange={handleSelectAllStudents}
          />
        ),
      },
      {
        id: "student",
        accessorKey: "student",
        header: "Student",
        sortable: true,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
      },
      {
        id: "enrolled",
        accessorKey: "enrolledAt",
        header: "Enrolled",
        sortable: true,
      },
      {
        id: "progress",
        accessorKey: "progress",
        header: "Progress",
        sortable: true,
      },
      {
        id: "lastAccess",
        accessorKey: "lastAccessedAt",
        header: "Last Access",
        sortable: true,
      },
      {
        id: "actions",
        header: "Actions",
        onView: handleViewStudentDetails,
      },
    ],
    [selectedStudents.length, students.length]
  );

  useEffect(() => {
    dispatch(getCourses({ status: "PUBLISHED" }));
  }, [dispatch]);

  useEffect(() => {
    if (courseId && !selectedCourseId) {
      setSelectedCourseId(courseId);
    }
  }, [courseId, selectedCourseId]);

  useEffect(() => {
    if (!hasInitialLoaded && selectedCourseId) {
      dispatch(
        getEnrolledStudents({
          courseId: selectedCourseId,
          page: 1,
          limit: 20,
        })
      );
      dispatch(getStudentAnalytics({ courseId: selectedCourseId }));
      dispatch(getStudentEngagement({ courseId: selectedCourseId }));
      dispatch(getPendingGrading());
      setHasInitialLoaded(true);
    }
  }, [dispatch, hasInitialLoaded, selectedCourseId]);

  useEffect(() => {
    setSearchTerm(studentsFilters.search || "");
  }, [studentsFilters.search]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    if (courseId) {
      dispatch(
        getEnrolledStudents({
          courseId,
          page: 1,
          limit: 20,
        })
      );
      dispatch(getStudentAnalytics({ courseId }));
      dispatch(getStudentEngagement({ courseId }));
      dispatch(getPendingGrading());
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...studentsFilters, [key]: value };
    dispatch(setStudentsFilters({ [key]: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getEnrolledStudents({
            courseId: selectedCourseId,
            ...newFilters,
            page: 1,
            limit: studentsPagination.limit,
          })
        );
      }, 100);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const newFilters = { ...studentsFilters, search: value };
    dispatch(setStudentsFilters({ search: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getEnrolledStudents({
            courseId: selectedCourseId,
            ...newFilters,
            page: 1,
            limit: studentsPagination.limit,
          })
        );
      }, 300);
    }
  };

  const handlePageChange = (page) => {
    dispatch(
      getEnrolledStudents({
        courseId: selectedCourseId,
        ...studentsFilters,
        page,
        limit: studentsPagination.limit,
      })
    );
  };

  const loadStudents = () => {
    if (!selectedCourseId) return;
    dispatch(
      getEnrolledStudents({
        courseId: selectedCourseId,
        page: 1,
        limit: 20,
        ...studentsFilters,
      })
    );
    dispatch(getStudentAnalytics({ courseId: selectedCourseId }));
    dispatch(getStudentEngagement({ courseId: selectedCourseId }));
  };

  const handleGradeAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      await dispatch(
        gradeAssignment({
          submissionId: selectedAssignment.id,
          gradeData: gradeFormData,
        })
      ).unwrap();
      setIsGradeDialogOpen(false);
      setSelectedAssignment(null);
      setGradeFormData({ grade: "", feedback: "", rubricScores: {} });
      dispatch(getPendingGrading());
    } catch (error) {
      toast.error(error.message || "Failed to grade assignment");
    }
  };

  const handleBulkGrade = async () => {
    if (bulkGradeData.assignments.length === 0) return;

    try {
      await dispatch(bulkGradeAssignments(bulkGradeData)).unwrap();
      setIsBulkGradeDialogOpen(false);
      setBulkGradeData({ assignments: [] });
      setSelectedSubmissions([]);
      dispatch(getPendingGrading());
    } catch (error) {
      toast.error(error.message || "Failed to bulk grade assignments");
    }
  };

  const handleExportData = async (format = "csv") => {
    try {
      const params = new URLSearchParams({
        courseId: selectedCourseId,
        format,
        ...(studentsFilters.status && { status: studentsFilters.status }),
        ...(studentsFilters.search && { search: studentsFilters.search }),
        ...(studentsFilters.sortBy && { sortBy: studentsFilters.sortBy }),
        ...(studentsFilters.sortOrder && {
          sortOrder: studentsFilters.sortOrder,
        }),
      });

      const response = await dispatch(
        exportStudentData(params.toString())
      ).unwrap();

      if (format === "csv") {
        const blob = new Blob([response], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `students-${selectedCourseId}-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error(error.message || "Failed to export data");
    }
  };

  const openGradeDialog = (submission) => {
    setSelectedAssignment(submission);
    setGradeFormData({
      grade: "",
      feedback: "",
      rubricScores: {},
    });
    setIsGradeDialogOpen(true);
  };

  const openAnalyticsDialog = () => {
    setIsAnalyticsDialogOpen(true);
  };

  const openEngagementDialog = () => {
    setIsEngagementDialogOpen(true);
  };

  const openPendingGradingDialog = () => {
    setIsPendingGradingDialogOpen(true);
  };

  const prepareBulkGradeData = () => {
    const assignments = selectedSubmissions.map((submissionId) => {
      const submission = pendingGrading.find((s) => s.id === submissionId);
      return {
        submissionId,
        grade: submission?.suggestedGrade || 0,
        feedback: "",
      };
    });
    setBulkGradeData({ assignments });
    setIsBulkGradeDialogOpen(true);
  };

  const updateBulkGradeItem = (submissionId, field, value) => {
    setBulkGradeData((prev) => ({
      ...prev,
      assignments: prev.assignments.map((item) =>
        item.submissionId === submissionId ? { ...item, [field]: value } : item
      ),
    }));
  };

  if (getCoursesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"
                ></div>
              ))}
            </div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                  Student Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage enrolled students and track their progress
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Label className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  Course:
                </Label>
                <Select
                  value={selectedCourseId}
                  onValueChange={handleCourseChange}
                >
                  <SelectTrigger className="w-full sm:w-48 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={openPendingGradingDialog}
              disabled={!selectedCourseId}
              className="flex-1 sm:flex-none rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <Edit className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Pending Grading</span>
              <span className="sm:hidden">Grading</span>({pendingGrading.length}
              )
            </Button>

            <Button
              variant="outline"
              onClick={openAnalyticsDialog}
              disabled={!selectedCourseId}
              className="flex-1 sm:flex-none rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>

            <Button
              variant="outline"
              onClick={openEngagementDialog}
              disabled={!selectedCourseId}
              className="flex-1 sm:flex-none rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <Activity className="w-4 h-4 mr-2" />
              Engagement
            </Button>

            <Button
              variant="outline"
              onClick={() => handleExportData("csv")}
              disabled={exportStudentDataLoading || !selectedCourseId}
              className="flex-1 sm:flex-none rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              {exportStudentDataLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export
            </Button>

            <Button
              variant="outline"
              onClick={loadStudents}
              disabled={getEnrolledStudentsLoading || !selectedCourseId}
              className="flex-1 sm:flex-none rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  getEnrolledStudentsLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>
        </div>

        {!selectedCourseId ? (
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-12">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto text-slate-400 mb-6 opacity-50" />
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  Select a Course
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Please select a course from the dropdown above to view and
                  manage its enrolled students.
                </p>
                {courses.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No published courses found. Create and publish a course
                    first.
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    You have {courses.length} published course
                    {courses.length !== 1 ? "s" : ""} available.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Total Students
                      </p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {studentsSummary.totalStudents || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Active Students
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {studentsSummary.activeStudents || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {studentsSummary.completedStudents || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Avg Progress
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {studentsSummary.averageProgress || 0}%
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardHeader className="pb-6">
                <div className="flex flex-col space-y-4">
                  <CardTitle className="text-slate-800 dark:text-white">
                    All Students
                  </CardTitle>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10 w-full sm:w-64 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Select
                        value={studentsFilters.status || "all"}
                        onValueChange={(value) =>
                          handleFilterChange(
                            "status",
                            value === "all" ? "" : value
                          )
                        }
                      >
                        <SelectTrigger className="w-full sm:w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                          <SelectItem value="EXPIRED">Expired</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={studentsFilters.sortBy || "enrolledAt"}
                        onValueChange={(value) =>
                          handleFilterChange("sortBy", value)
                        }
                      >
                        <SelectTrigger className="w-full sm:w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="enrolledAt">Enrolled</SelectItem>
                          <SelectItem value="progress">Progress</SelectItem>
                          <SelectItem value="lastAccess">
                            Last Access
                          </SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex space-x-2">
                      {selectedStudents.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => {}}
                          className="rounded-xl"
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Bulk ({selectedStudents.length})
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => {
                          dispatch(resetStudentsFilters());
                          setSearchTerm("");
                          dispatch(
                            getEnrolledStudents({
                              courseId: selectedCourseId,
                              page: 1,
                              limit: studentsPagination.limit,
                            })
                          );
                        }}
                        className="rounded-xl"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {students.length > 0 ? (
                  <DataTable
                    columns={tableColumns}
                    data={students}
                    onRowSelect={handleSelectStudent}
                    onSelectAll={handleSelectAllStudents}
                    selectedRows={selectedStudents}
                    getStatusColor={getStatusColor}
                  />
                ) : !getEnrolledStudentsLoading ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No students found
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-slate-400 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      Loading students...
                    </p>
                  </div>
                )}

                {studentsPagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              handlePageChange(studentsPagination.page - 1)
                            }
                            className={cn(
                              !studentsPagination.hasPrev &&
                                "pointer-events-none opacity-50"
                            )}
                          />
                        </PaginationItem>

                        {[
                          ...Array(Math.min(5, studentsPagination.totalPages)),
                        ].map((_, i) => {
                          const pageNum = studentsPagination.page - 2 + i;
                          if (
                            pageNum < 1 ||
                            pageNum > studentsPagination.totalPages
                          )
                            return null;

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => handlePageChange(pageNum)}
                                isActive={pageNum === studentsPagination.page}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        {studentsPagination.totalPages > 5 &&
                          studentsPagination.page <
                            studentsPagination.totalPages - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              handlePageChange(studentsPagination.page + 1)
                            }
                            className={cn(
                              !studentsPagination.hasNext &&
                                "pointer-events-none opacity-50"
                            )}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog
              open={isStudentDetailsDialogOpen}
              onOpenChange={setIsStudentDetailsDialogOpen}
            >
              <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="flex items-center text-xl">
                    <User className="w-6 h-6 mr-3" />
                    {selectedStudent
                      ? `${selectedStudent.student.name} - Details`
                      : "Student Details"}
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    {selectedStudent
                      ? `Comprehensive information about ${selectedStudent.student.name}'s progress and performance`
                      : "Comprehensive information about the student's progress and performance"}
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-hidden">
                  {getStudentDetailsLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-10 h-10 animate-spin" />
                      <span className="ml-4 text-lg">
                        Loading detailed information...
                      </span>
                    </div>
                  ) : studentDetails ? (
                    <div className="space-y-6 p-6">
                      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-700">
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center space-y-6">
                            <div className="text-center">
                              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                                {studentDetails.student.name.charAt(0)}
                              </div>
                              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                                {studentDetails.student.name}
                              </h3>
                              <p className="text-slate-600 dark:text-slate-400 mb-3">
                                {studentDetails.student.email}
                              </p>
                              <Badge
                                className={cn(
                                  "text-sm px-3 py-1",
                                  getStatusColor(
                                    studentDetails.enrollment.status
                                  )
                                )}
                              >
                                {studentDetails.enrollment.status}
                              </Badge>
                            </div>

                            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Calendar className="w-4 h-4 text-slate-500" />
                                  <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Enrolled
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-center">
                                  {format(
                                    new Date(
                                      studentDetails.enrollment.enrolledAt
                                    ),
                                    "MMM dd, yyyy"
                                  )}
                                </span>
                              </div>

                              {studentDetails.student.country ? (
                                <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <MapPin className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                      Country
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium text-center">
                                    {studentDetails.student.country}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Target className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                      Progress
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium text-center">
                                    {studentDetails.enrollment.progress}%
                                  </span>
                                </div>
                              )}

                              <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Clock className="w-4 h-4 text-slate-500" />
                                  <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Last Access
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-center">
                                  {studentDetails.enrollment.lastAccessedAt
                                    ? formatDistanceToNow(
                                        new Date(
                                          studentDetails.enrollment.lastAccessedAt
                                        )
                                      ) + " ago"
                                    : "Never"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/60 dark:bg-slate-800/60">
                        <CardContent className="p-6">
                          <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2" />
                            Progress Overview
                          </h4>

                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                                Overall Course Progress
                              </span>
                              <span className="text-2xl font-bold text-indigo-600">
                                {studentDetails.enrollment.progress}%
                              </span>
                            </div>
                            <Progress
                              value={studentDetails.enrollment.progress}
                              className="h-3"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                              <div className="text-2xl font-bold text-blue-600">
                                {studentDetails.performance?.lessons
                                  ?.completed || 0}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Lessons Completed
                              </div>
                            </div>
                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                              <div className="text-2xl font-bold text-green-600">
                                {studentDetails.performance?.quizzes
                                  ?.totalPassed || 0}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Quizzes Passed
                              </div>
                            </div>
                            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                              <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                              <div className="text-2xl font-bold text-orange-600">
                                {studentDetails.performance?.assignments
                                  ?.totalGraded || 0}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Assignments Graded
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <div className="flex items-center space-x-2 mb-2">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                  Time Spent
                                </span>
                              </div>
                              <div className="text-xl font-bold text-slate-800 dark:text-white">
                                {Math.round(
                                  (studentDetails.enrollment.totalTimeSpent ||
                                    0) / 60
                                )}
                                h
                              </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <div className="flex items-center space-x-2 mb-2">
                                <Target className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                  Completion Rate
                                </span>
                              </div>
                              <div className="text-xl font-bold text-slate-800 dark:text-white">
                                {studentDetails.performance?.completionRate ||
                                  0}
                                %
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {studentDetails.sectionProgress &&
                        studentDetails.sectionProgress.length > 0 && (
                          <Card className="bg-white/60 dark:bg-slate-800/60">
                            <CardContent className="p-6">
                              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                                <BookOpen className="w-5 h-5 mr-2" />
                                Section Progress
                              </h4>
                              <div className="space-y-4">
                                {studentDetails.sectionProgress.map(
                                  (section) => (
                                    <div
                                      key={section.id}
                                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 space-y-2 sm:space-y-0">
                                        <h5 className="font-semibold text-slate-800 dark:text-white">
                                          {section.title}
                                        </h5>
                                        <span className="text-lg font-bold text-indigo-600">
                                          {section.progressPercentage.toFixed(
                                            0
                                          )}
                                          %
                                        </span>
                                      </div>
                                      <Progress
                                        value={section.progressPercentage}
                                        className="h-2 mb-3"
                                      />
                                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-slate-500 dark:text-slate-400 space-y-2 sm:space-y-0">
                                        <span>
                                          {section.completedItems}/
                                          {section.totalItems} items completed
                                        </span>
                                        <div className="flex space-x-4">
                                          <span>
                                            L: {section.lessons.completed}/
                                            {section.lessons.total}
                                          </span>
                                          <span>
                                            Q: {section.quizzes.completed}/
                                            {section.quizzes.total}
                                          </span>
                                          <span>
                                            A: {section.assignments.completed}/
                                            {section.assignments.total}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                      {studentDetails.recentActivity &&
                        studentDetails.recentActivity.length > 0 && (
                          <Card className="bg-white/60 dark:bg-slate-800/60">
                            <CardContent className="p-6">
                              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                                <Activity className="w-5 h-5 mr-2" />
                                Recent Activity
                              </h4>
                              <div className="space-y-3">
                                {studentDetails.recentActivity
                                  .slice(0, 8)
                                  .map((activity) => (
                                    <div
                                      key={activity.id}
                                      className="flex items-center space-x-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                                    >
                                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-5 h-5 text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 dark:text-white truncate">
                                          {activity.title}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                          {activity.sectionTitle}
                                        </p>
                                      </div>
                                      <div className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
                                        {formatDistanceToNow(
                                          new Date(activity.completedAt)
                                        )}{" "}
                                        ago
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                      {studentDetails.certificate && (
                        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700">
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Award className="w-7 h-7 text-white" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-yellow-800 dark:text-yellow-300">
                                  Certificate Issued
                                </h4>
                                <p className="text-yellow-700 dark:text-yellow-400">
                                  Issued on{" "}
                                  {format(
                                    new Date(
                                      studentDetails.certificate.issueDate
                                    ),
                                    "MMM dd, yyyy"
                                  )}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <User className="w-16 h-16 mx-auto text-slate-400 mb-6 opacity-50" />
                      <p className="text-lg text-slate-600 dark:text-slate-400">
                        No student details available
                      </p>
                    </div>
                  )}
                </ScrollArea>

                <DialogFooter className="flex-shrink-0 border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsStudentDetailsDialogOpen(false);
                      setSelectedStudent(null);
                      dispatch(clearStudentDetails());
                    }}
                    className="rounded-xl px-6"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isPendingGradingDialogOpen}
              onOpenChange={setIsPendingGradingDialogOpen}
            >
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Edit className="w-5 h-5 mr-2" />
                    Pending Grading
                  </DialogTitle>
                  <DialogDescription>
                    Review and grade pending assignments and quizzes
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-200px)]">
                  <div className="space-y-4 py-4 pr-6">
                    {pendingGrading.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={
                              selectedSubmissions.length ===
                              pendingGrading.length
                            }
                            onChange={handleSelectAllSubmissions}
                            className="rounded"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Select All ({selectedSubmissions.length} selected)
                          </span>
                        </div>
                        {selectedSubmissions.length > 0 && (
                          <Button
                            variant="outline"
                            onClick={prepareBulkGradeData}
                            className="rounded-lg"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Bulk Grade ({selectedSubmissions.length})
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="space-y-3">
                      {pendingGrading.map((submission) => (
                        <div
                          key={submission.id}
                          className="p-4 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedSubmissions.includes(
                                  submission.id
                                )}
                                onChange={() =>
                                  handleSelectSubmission(submission.id)
                                }
                                className="mt-1 rounded"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-semibold text-slate-800 dark:text-white">
                                    {submission.title}
                                  </h4>
                                  <Badge
                                    className={getPriorityColor(
                                      submission.priority
                                    )}
                                  >
                                    {submission.priority}
                                  </Badge>
                                  <Badge variant="outline">
                                    {submission.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                  Student: {submission.studentName}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                                  <span>Course: {submission.courseName}</span>
                                  <span>Section: {submission.sectionName}</span>
                                  <span>
                                    Submitted:{" "}
                                    {formatDistanceToNow(
                                      new Date(submission.submittedAt)
                                    )}{" "}
                                    ago
                                  </span>
                                  {submission.isLate && (
                                    <Badge className="bg-red-100 text-red-600 text-xs">
                                      Late
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openGradeDialog(submission)}
                              className="rounded-lg"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Grade
                            </Button>
                          </div>
                        </div>
                      ))}

                      {pendingGrading.length === 0 &&
                        !getPendingGradingLoading && (
                          <div className="text-center py-12">
                            <Edit className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                            <p className="text-slate-600 dark:text-slate-400">
                              No pending grading items
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsPendingGradingDialogOpen(false)}
                    className="rounded-xl"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isGradeDialogOpen}
              onOpenChange={setIsGradeDialogOpen}
            >
              <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Grade Assignment</DialogTitle>
                  <DialogDescription>
                    Grade the assignment submission
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-200px)]">
                  <div className="space-y-4 py-4 pr-6">
                    {selectedAssignment && (
                      <>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <h4 className="font-semibold mb-2">
                            {selectedAssignment.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            Student: {selectedAssignment.studentName}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Max Points: {selectedAssignment.maxPoints}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>
                              Grade (out of {selectedAssignment.maxPoints})
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={selectedAssignment.maxPoints}
                              value={gradeFormData.grade}
                              onChange={(e) =>
                                setGradeFormData({
                                  ...gradeFormData,
                                  grade: e.target.value,
                                })
                              }
                              placeholder="Enter grade"
                              className="rounded-xl"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Feedback</Label>
                            <Textarea
                              value={gradeFormData.feedback}
                              onChange={(e) =>
                                setGradeFormData({
                                  ...gradeFormData,
                                  feedback: e.target.value,
                                })
                              }
                              placeholder="Provide feedback for the student"
                              className="rounded-xl min-h-[100px]"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </ScrollArea>

                <DialogFooter className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsGradeDialogOpen(false);
                      setSelectedAssignment(null);
                      setGradeFormData({
                        grade: "",
                        feedback: "",
                        rubricScores: {},
                      });
                    }}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGradeAssignment}
                    disabled={
                      gradeAssignmentLoading ||
                      !gradeFormData.grade ||
                      gradeFormData.grade < 0 ||
                      gradeFormData.grade > (selectedAssignment?.maxPoints || 0)
                    }
                    className="rounded-xl"
                  >
                    {gradeAssignmentLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Submit Grade
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isBulkGradeDialogOpen}
              onOpenChange={setIsBulkGradeDialogOpen}
            >
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Bulk Grade Assignments</DialogTitle>
                  <DialogDescription>
                    Grade multiple assignments at once
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-200px)]">
                  <div className="space-y-4 py-4 pr-6">
                    {bulkGradeData.assignments.map((assignment) => {
                      const submission = pendingGrading.find(
                        (s) => s.id === assignment.submissionId
                      );
                      return (
                        <div
                          key={assignment.submissionId}
                          className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">
                                {submission?.title}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {submission?.studentName}
                              </p>
                            </div>
                            <span className="text-sm text-slate-500">
                              Max: {submission?.maxPoints}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Grade</Label>
                              <Input
                                type="number"
                                min="0"
                                max={submission?.maxPoints}
                                value={assignment.grade}
                                onChange={(e) =>
                                  updateBulkGradeItem(
                                    assignment.submissionId,
                                    "grade",
                                    e.target.value
                                  )
                                }
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Feedback</Label>
                              <Input
                                value={assignment.feedback}
                                onChange={(e) =>
                                  updateBulkGradeItem(
                                    assignment.submissionId,
                                    "feedback",
                                    e.target.value
                                  )
                                }
                                placeholder="Brief feedback"
                                className="rounded-xl"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <DialogFooter className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsBulkGradeDialogOpen(false);
                      setBulkGradeData({ assignments: [] });
                    }}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkGrade}
                    disabled={
                      bulkGradeAssignmentsLoading ||
                      bulkGradeData.assignments.some(
                        (a) => !a.grade || a.grade < 0
                      )
                    }
                    className="rounded-xl"
                  >
                    {bulkGradeAssignmentsLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Grade All ({bulkGradeData.assignments.length})
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isAnalyticsDialogOpen}
              onOpenChange={setIsAnalyticsDialogOpen}
            >
              <DialogContent className="max-w-5xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Student Analytics
                  </DialogTitle>
                  <DialogDescription>
                    Detailed analytics and performance metrics for your students
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-200px)]">
                  {getStudentAnalyticsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : studentAnalytics ? (
                    <div className="space-y-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-blue-100 text-sm">
                                  Total Students
                                </p>
                                <p className="text-2xl font-bold">
                                  {studentAnalytics.overview
                                    ?.totalEnrollments || 0}
                                </p>
                              </div>
                              <Users className="w-8 h-8 text-blue-200" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-green-100 text-sm">
                                  Active Students
                                </p>
                                <p className="text-2xl font-bold">
                                  {studentAnalytics.overview?.activeStudents ||
                                    0}
                                </p>
                              </div>
                              <Activity className="w-8 h-8 text-green-200" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-purple-100 text-sm">
                                  Avg Progress
                                </p>
                                <p className="text-2xl font-bold">
                                  {studentAnalytics.overview?.averageProgress ||
                                    0}
                                  %
                                </p>
                              </div>
                              <TrendingUp className="w-8 h-8 text-purple-200" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-orange-100 text-sm">
                                  Completion Rate
                                </p>
                                <p className="text-2xl font-bold">
                                  {studentAnalytics.overview?.completionRate ||
                                    0}
                                  %
                                </p>
                              </div>
                              <CheckCircle className="w-8 h-8 text-orange-200" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {studentAnalytics.topPerformers &&
                        studentAnalytics.topPerformers.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">
                              Top Performers
                            </h3>
                            <div className="space-y-3">
                              {studentAnalytics.topPerformers
                                .slice(0, 5)
                                .map((student, index) => (
                                  <div
                                    key={student.studentId}
                                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <h4 className="font-semibold">
                                          {student.name}
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                          {student.courseTitle}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold">
                                        {student.progress}% completed
                                      </p>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {Math.round(
                                          (student.totalTimeSpent || 0) / 60
                                        )}
                                        h spent
                                      </p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                      {studentAnalytics.strugglingStudents &&
                        studentAnalytics.strugglingStudents.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">
                              Students Needing Attention
                            </h3>
                            <div className="space-y-3">
                              {studentAnalytics.strugglingStudents
                                .slice(0, 5)
                                .map((student) => (
                                  <div
                                    key={student.studentId}
                                    className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
                                        <User className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold">
                                          {student.name}
                                        </h4>
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                          {student.daysSinceLastAccess
                                            ? `${student.daysSinceLastAccess} days inactive`
                                            : "Never accessed"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-red-600 font-semibold">
                                        {student.progress}% progress
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-1 text-xs"
                                        onClick={() => {}}
                                      >
                                        Contact
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                      <p className="text-slate-600 dark:text-slate-400">
                        No analytics data available
                      </p>
                    </div>
                  )}
                </ScrollArea>

                <DialogFooter className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAnalyticsDialogOpen(false);
                      dispatch(clearStudentAnalytics());
                    }}
                    className="rounded-xl"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isEngagementDialogOpen}
              onOpenChange={setIsEngagementDialogOpen}
            >
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Student Engagement
                  </DialogTitle>
                  <DialogDescription>
                    Student engagement metrics and activity patterns
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-200px)]">
                  {getStudentEngagementLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : studentEngagement ? (
                    <div className="space-y-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <Card className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-indigo-100 text-sm">
                                  Total Enrolled
                                </p>
                                <p className="text-2xl font-bold">
                                  {studentEngagement.summary?.totalEnrolled ||
                                    0}
                                </p>
                              </div>
                              <Users className="w-8 h-8 text-indigo-200" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-teal-500 text-white border-0">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-green-100 text-sm">
                                  Active Students
                                </p>
                                <p className="text-2xl font-bold">
                                  {studentEngagement.summary?.activeStudents ||
                                    0}
                                </p>
                              </div>
                              <Zap className="w-8 h-8 text-green-200" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-blue-100 text-sm">
                                  Engagement Rate
                                </p>
                                <p className="text-2xl font-bold">
                                  {studentEngagement.summary?.engagementRate ||
                                    0}
                                  %
                                </p>
                              </div>
                              <Brain className="w-8 h-8 text-blue-200" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-orange-100 text-sm">
                                  Avg Progress
                                </p>
                                <p className="text-2xl font-bold">
                                  {studentEngagement.summary?.averageProgress ||
                                    0}
                                  %
                                </p>
                              </div>
                              <Star className="w-8 h-8 text-orange-200" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="bg-white/50 dark:bg-slate-800/50 border-0">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-slate-800 dark:text-white mb-4">
                            Content Engagement
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {studentEngagement.contentEngagement
                                  ?.lessonCompletions || 0}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Lesson Completions
                              </div>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {Math.round(
                                  (studentEngagement.contentEngagement
                                    ?.averageLessonTime || 0) / 60
                                )}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Avg Lesson Time (min)
                              </div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">
                                {studentEngagement.contentEngagement
                                  ?.studentsCompletingLessons || 0}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Active Learners
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {studentEngagement.dailyActivity &&
                        studentEngagement.dailyActivity.length > 0 && (
                          <Card className="bg-white/50 dark:bg-slate-800/50 border-0">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-slate-800 dark:text-white mb-4">
                                Recent Activity
                              </h4>
                              <div className="space-y-2">
                                {studentEngagement.dailyActivity
                                  .slice(0, 7)
                                  .map((day) => (
                                    <div
                                      key={day.date}
                                      className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded"
                                    >
                                      <span className="text-sm font-medium">
                                        {format(new Date(day.date), "MMM dd")}
                                      </span>
                                      <div className="flex items-center space-x-4 text-sm">
                                        <span className="text-blue-600">
                                          {day.uniqueActiveStudents} students
                                        </span>
                                        <span className="text-green-600">
                                          {day.lessonCompletions} completions
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                      <p className="text-slate-600 dark:text-slate-400">
                        No engagement data available
                      </p>
                    </div>
                  )}
                </ScrollArea>

                <DialogFooter className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEngagementDialogOpen(false);
                      dispatch(clearStudentEngagement());
                    }}
                    className="rounded-xl"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentManagementPage;
