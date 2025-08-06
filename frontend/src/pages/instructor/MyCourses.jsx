import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  submitForReview,
  validateCourse,
  getCourseStats,
  getInstructorDashboard,
  setCoursesFilters,
  resetCoursesFilters,
  clearError,
  clearCourseStats,
  clearCourseValidation,
  clearCourse,
} from "@/features/instructor/instructorCourseSlice";
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Activity,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  TrendingUp,
  BarChart3,
  Eye,
  Send,
  AlertCircle,
  Star,
  PlayCircle,
  FileText,
  Calendar,
  Filter,
  BookOpen as BookIcon,
  Award,
  Target,
  Zap,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
} from "lucide-react";

const MyCoursesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    courses,
    course,
    courseStats,
    courseValidation,
    coursesPagination,
    coursesFilters,
    getCourseStatsLoading,
    getCourseLoading,
    createCourseLoading,
    updateCourseLoading,
    deleteCourseLoading,
    submitForReviewLoading,
    validateCourseLoading,
    getCoursesLoading,
    error,
  } = useSelector((state) => state.instructorCourse);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [validatingCourseId, setValidatingCourseId] = useState(null);
  const [viewingCourseId, setViewingCourseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [editThumbnailFile, setEditThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [editThumbnailPreview, setEditThumbnailPreview] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [createFormData, setCreateFormData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    price: "",
    discountPrice: "",
    level: "BEGINNER",
    categoryId: "",
    language: "english",
    requirements: [""],
    learningObjectives: [""],
    tags: [""],
  });

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    price: "",
    discountPrice: "",
    level: "BEGINNER",
    categoryId: "",
    language: "english",
    requirements: [""],
    learningObjectives: [""],
    tags: [""],
  });

  useEffect(() => {
    if (!hasInitialLoaded) {
      dispatch(getCourses({ page: 1, limit: 9 }));
      dispatch(getCourseStats());
      dispatch(getInstructorDashboard());
      setHasInitialLoaded(true);
    }
  }, [dispatch, hasInitialLoaded]);

  useEffect(() => {
    setSearchTerm(coursesFilters.search || "");
  }, [coursesFilters.search]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...coursesFilters, [key]: value };
    dispatch(setCoursesFilters({ [key]: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getCourses({
            ...newFilters,
            page: 1,
            limit: 9,
          })
        );
        setCurrentPage(1);
      }, 100);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const newFilters = { ...coursesFilters, search: value };
    dispatch(setCoursesFilters({ search: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getCourses({
            ...newFilters,
            page: 1,
            limit: 9,
          })
        );
        setCurrentPage(1);
      }, 300);
    }
  };

  const loadCourses = (page = currentPage) => {
    dispatch(
      getCourses({
        page: page,
        limit: 9,
        ...(coursesFilters.search && { search: coursesFilters.search }),
        ...(coursesFilters.status && { status: coursesFilters.status }),
        ...(coursesFilters.level && { level: coursesFilters.level }),
        ...(coursesFilters.categoryId && {
          categoryId: coursesFilters.categoryId,
        }),
        sortBy: coursesFilters.sortBy || "updatedAt",
        sortOrder: coursesFilters.sortOrder || "desc",
      })
    );
    dispatch(getInstructorDashboard());
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadCourses(page);
  };

  const handleThumbnailChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isEdit) {
        setEditThumbnailFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setEditThumbnailPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setThumbnailFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setThumbnailPreview(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const addArrayField = (field, isEdit = false) => {
    if (isEdit) {
      setEditFormData({
        ...editFormData,
        [field]: [...editFormData[field], ""],
      });
    } else {
      setCreateFormData({
        ...createFormData,
        [field]: [...createFormData[field], ""],
      });
    }
  };

  const removeArrayField = (field, index, isEdit = false) => {
    if (isEdit) {
      const newArray = editFormData[field].filter((_, i) => i !== index);
      setEditFormData({
        ...editFormData,
        [field]: newArray,
      });
    } else {
      const newArray = createFormData[field].filter((_, i) => i !== index);
      setCreateFormData({
        ...createFormData,
        [field]: newArray,
      });
    }
  };

  const updateArrayField = (field, index, value, isEdit = false) => {
    if (isEdit) {
      const newArray = [...editFormData[field]];
      newArray[index] = value;
      setEditFormData({
        ...editFormData,
        [field]: newArray,
      });
    } else {
      const newArray = [...createFormData[field]];
      newArray[index] = value;
      setCreateFormData({
        ...createFormData,
        [field]: newArray,
      });
    }
  };

  const handleCreateCourse = async () => {
    const filteredData = {
      ...createFormData,
      requirements: createFormData.requirements.filter((req) => req.trim()),
      learningObjectives: createFormData.learningObjectives.filter((obj) =>
        obj.trim()
      ),
      tags: createFormData.tags.filter((tag) => tag.trim()),
    };

    if (thumbnailFile) {
      filteredData.thumbnail = thumbnailFile;
    }

    try {
      await dispatch(createCourse(filteredData)).unwrap();
      setIsCreateDialogOpen(false);
      resetCreateForm();
      loadCourses(1);
      setCurrentPage(1);
    } catch (error) {
      toast.error(error.message || "Failed to create course");
    }
  };

  const handleUpdateCourse = async () => {
    const filteredData = {
      ...editFormData,
      requirements: editFormData.requirements.filter((req) => req.trim()),
      learningObjectives: editFormData.learningObjectives.filter((obj) =>
        obj.trim()
      ),
      tags: editFormData.tags.filter((tag) => tag.trim()),
    };

    if (editThumbnailFile) {
      filteredData.thumbnail = editThumbnailFile;
    }

    try {
      await dispatch(
        updateCourse({
          courseId: selectedCourse.id,
          updateData: filteredData,
        })
      ).unwrap();
      setIsEditDialogOpen(false);
      setSelectedCourse(null);
      loadCourses();
    } catch (error) {
      toast.error(error.message || "Failed to update course");
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      await dispatch(
        deleteCourse({
          courseId: courseToDelete.id,
          confirmDelete: true,
        })
      ).unwrap();
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
      loadCourses();
    } catch (error) {
      toast.error(error.message || "Failed to delete course");
    }
  };

  const handleSubmitForReview = async (courseId) => {
    try {
      await dispatch(submitForReview(courseId)).unwrap();
      loadCourses();
    } catch (error) {
      toast.error(error.message || "Failed to submit course for review");
    }
  };

  const handleValidateCourse = async (courseId) => {
    setValidatingCourseId(courseId);
    try {
      await dispatch(validateCourse(courseId)).unwrap();
      setIsValidationDialogOpen(true);
    } catch (error) {
      toast.error(error.message || "Failed to validate course");
    } finally {
      setValidatingCourseId(null);
    }
  };

  const handleGetCourseStats = async () => {
    try {
      await dispatch(getCourseStats()).unwrap();
      setIsStatsDialogOpen(true);
    } catch (error) {
      toast.error(error.message || "Failed to fetch instructor statistics");
    }
  };

  const openEditDialog = (course) => {
    setSelectedCourse(course);
    setEditFormData({
      title: course.title,
      description: course.description || "",
      shortDescription: course.shortDescription || "",
      price: course.price?.toString() || "",
      discountPrice: course.discountPrice?.toString() || "",
      level: course.level || "BEGINNER",
      categoryId: course.categoryId || "",
      language: course.language || "english",
      requirements: course.requirements?.length ? course.requirements : [""],
      learningObjectives: course.learningObjectives?.length
        ? course.learningObjectives
        : [""],
      tags: course.tags?.length ? course.tags : [""],
    });
    setEditThumbnailPreview(course.thumbnail || "");
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (course) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  const openDetailsDialog = async (course) => {
    setSelectedCourse(course);
    setViewingCourseId(course.id);
    dispatch(clearCourse());
    try {
      await dispatch(getCourse(course.id)).unwrap();
      setIsDetailsDialogOpen(true);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load course details");
    } finally {
      setViewingCourseId(null);
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      title: "",
      description: "",
      shortDescription: "",
      price: "",
      discountPrice: "",
      level: "BEGINNER",
      categoryId: "",
      language: "english",
      requirements: [""],
      learningObjectives: [""],
      tags: [""],
    });
    setThumbnailFile(null);
    setThumbnailPreview("");
  };

  const handleSelectCourse = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAllCourses = () => {
    if (selectedCourses.length === courses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(courses.map((c) => c.id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "BEGINNER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "INTERMEDIATE":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "ADVANCED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const navigateToContent = (courseId) => {
    navigate(`/instructor/${courseId}/content`);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "0";
    return typeof value === "number" ? value.toString() : value.toString();
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === 0) return "0.00";
    const numValue = typeof value === "number" ? value : parseFloat(value);
    return !isNaN(numValue) ? numValue.toFixed(2) : "0.00";
  };

  const formatRating = (value) => {
    if (value === null || value === undefined || value === 0) return "0.0";
    const numValue = typeof value === "number" ? value : parseFloat(value);
    return !isNaN(numValue) ? numValue.toFixed(1) : "0.0";
  };

  if (getCoursesLoading && courses.length === 0 && !hasInitialLoaded) {
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
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                  My Courses
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage your courses and track their performance
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>
                      Create a new course and start adding content.
                    </DialogDescription>
                  </DialogHeader>

                  <ScrollArea className="max-h-[calc(90vh-200px)]">
                    <div className="space-y-4 py-4 pr-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Course Title</Label>
                          <Input
                            value={createFormData.title}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                title: e.target.value,
                              })
                            }
                            placeholder="Complete Web Development Bootcamp"
                            className="rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Level</Label>
                          <Select
                            value={createFormData.level}
                            onValueChange={(value) =>
                              setCreateFormData({
                                ...createFormData,
                                level: value,
                              })
                            }
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BEGINNER">Beginner</SelectItem>
                              <SelectItem value="INTERMEDIATE">
                                Intermediate
                              </SelectItem>
                              <SelectItem value="ADVANCED">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Short Description</Label>
                        <Input
                          value={createFormData.shortDescription}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              shortDescription: e.target.value,
                            })
                          }
                          placeholder="Learn web development from scratch"
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={createFormData.description}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              description: e.target.value,
                            })
                          }
                          placeholder="Detailed course description..."
                          className="rounded-xl min-h-[100px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Price (₹)</Label>
                          <Input
                            type="number"
                            value={createFormData.price}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                price: e.target.value,
                              })
                            }
                            placeholder="2999"
                            className="rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Discount Price (₹)</Label>
                          <Input
                            type="number"
                            value={createFormData.discountPrice}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                discountPrice: e.target.value,
                              })
                            }
                            placeholder="1999"
                            className="rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Language</Label>
                          <Select
                            value={createFormData.language}
                            onValueChange={(value) =>
                              setCreateFormData({
                                ...createFormData,
                                language: value,
                              })
                            }
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="english">English</SelectItem>
                              <SelectItem value="hindi">Hindi</SelectItem>
                              <SelectItem value="spanish">Spanish</SelectItem>
                              <SelectItem value="french">French</SelectItem>
                              <SelectItem value="german">German</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Category ID</Label>
                          <Input
                            value={createFormData.categoryId}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                categoryId: e.target.value,
                              })
                            }
                            placeholder="programming"
                            className="rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Thumbnail</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          className="rounded-xl"
                        />
                        {thumbnailPreview && (
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="w-32 h-20 object-cover rounded-lg"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Requirements</Label>
                        {createFormData.requirements.map((req, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={req}
                              onChange={(e) =>
                                updateArrayField(
                                  "requirements",
                                  index,
                                  e.target.value
                                )
                              }
                              placeholder="Basic computer knowledge"
                              className="rounded-xl"
                            />
                            {createFormData.requirements.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  removeArrayField("requirements", index)
                                }
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayField("requirements")}
                          className="rounded-xl"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Requirement
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Learning Objectives</Label>
                        {createFormData.learningObjectives.map((obj, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={obj}
                              onChange={(e) =>
                                updateArrayField(
                                  "learningObjectives",
                                  index,
                                  e.target.value
                                )
                              }
                              placeholder="Build a complete web application"
                              className="rounded-xl"
                            />
                            {createFormData.learningObjectives.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  removeArrayField("learningObjectives", index)
                                }
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayField("learningObjectives")}
                          className="rounded-xl"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Objective
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Tags</Label>
                        {createFormData.tags.map((tag, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={tag}
                              onChange={(e) =>
                                updateArrayField("tags", index, e.target.value)
                              }
                              placeholder="javascript"
                              className="rounded-xl"
                            />
                            {createFormData.tags.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeArrayField("tags", index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayField("tags")}
                          className="rounded-xl"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Tag
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>

                  <DialogFooter className="border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        resetCreateForm();
                      }}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCourse}
                      disabled={
                        createCourseLoading ||
                        !createFormData.title ||
                        !createFormData.description ||
                        !createFormData.price
                      }
                      className="rounded-xl"
                    >
                      {createCourseLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Create Course
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={() => loadCourses()}
                disabled={getCoursesLoading}
                className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
              >
                <RefreshCw
                  className={cn(
                    "w-4 h-4 mr-2",
                    getCoursesLoading && "animate-spin"
                  )}
                />
                Refresh
              </Button>

              <Button
                variant="outline"
                onClick={handleGetCourseStats}
                disabled={getCourseStatsLoading}
                className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Statistics
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Total Courses
                    </p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {getCourseStatsLoading ? (
                        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      ) : (
                        courseStats?.overview?.totalCourses || 0
                      )}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Published
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {getCourseStatsLoading ? (
                        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      ) : (
                        courseStats?.overview?.publishedCourses || 0
                      )}
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
                      Under Review
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {getCourseStatsLoading ? (
                        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      ) : (
                        courseStats?.overview?.underReviewCourses || 0
                      )}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Draft
                    </p>
                    <p className="text-2xl font-bold text-slate-600">
                      {getCourseStatsLoading ? (
                        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      ) : (
                        courseStats?.overview?.draftCourses || 0
                      )}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-500 rounded-lg shadow-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardHeader className="pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <CardTitle className="text-slate-800 dark:text-white">
                  All Courses
                </CardTitle>

                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 w-64 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                    />
                  </div>

                  <Select
                    value={coursesFilters.status || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("status", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={coursesFilters.level || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("level", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => {
                      dispatch(resetCoursesFilters());
                      setSearchTerm("");
                      setCurrentPage(1);
                      dispatch(
                        getCourses({
                          page: 1,
                          limit: 9,
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
            </CardHeader>

            <CardContent>
              {courses.length > 0 && (
                <div className="flex items-center space-x-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <input
                    type="checkbox"
                    checked={selectedCourses.length === courses.length}
                    onChange={handleSelectAllCourses}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Select All ({selectedCourses.length} selected)
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getCoursesLoading && hasInitialLoaded
                  ? Array.from({ length: 6 }, (_, i) => (
                      <div
                        key={i}
                        className="p-6 rounded-xl border bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      >
                        <div className="animate-pulse">
                          <div className="h-32 bg-slate-200 dark:bg-slate-600 rounded-lg mb-4"></div>
                          <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded mb-2"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded mb-3"></div>
                          <div className="flex justify-between mb-3">
                            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-600 rounded"></div>
                            <div className="h-4 w-12 bg-slate-200 dark:bg-slate-600 rounded"></div>
                          </div>
                          <div className="flex justify-between">
                            <div className="flex space-x-2">
                              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-600 rounded-lg"></div>
                              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-600 rounded-lg"></div>
                            </div>
                            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-600 rounded-lg"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  : courses.map((course) => (
                      <div
                        key={course.id}
                        className="p-6 rounded-xl border bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course.id)}
                            onChange={() => handleSelectCourse(course.id)}
                            className="mt-1 rounded"
                          />
                          <div className="flex space-x-2">
                            <Badge
                              className={cn(
                                "text-xs",
                                getStatusColor(course.status)
                              )}
                            >
                              {course.status.replace("_", " ")}
                            </Badge>
                            <Badge
                              className={cn(
                                "text-xs",
                                getLevelColor(course.level)
                              )}
                            >
                              {course.level}
                            </Badge>
                          </div>
                        </div>

                        {course.thumbnail && (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-32 object-cover rounded-lg mb-4"
                          />
                        )}

                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2 line-clamp-2">
                          {course.title}
                        </h3>

                        {course.shortDescription && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                            {course.shortDescription}
                          </p>
                        )}

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-1">
                            <IndianRupee className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold text-slate-800 dark:text-white">
                              {formatCurrency(course.price)}
                            </span>
                            {course.discountPrice && (
                              <span className="text-sm text-slate-500 line-through">
                                ₹{formatCurrency(course.discountPrice)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {formatRating(course.averageRating)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{course.enrollmentsCount || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <PlayCircle className="w-4 h-4" />
                            <span>{course.sectionsCount || 0} sections</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatDistanceToNow(new Date(course.updatedAt))}{" "}
                              ago
                            </span>
                          </div>
                        </div>

                        {course.sectionsCount > 0 &&
                          course.publishedSections !== null && (
                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Content Progress
                                </span>
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                  {course.publishedSections}/
                                  {course.sectionsCount} sections
                                </span>
                              </div>
                              <Progress
                                value={
                                  (course.publishedSections /
                                    course.sectionsCount) *
                                  100
                                }
                                className="h-2"
                              />
                            </div>
                          )}

                        <div className="flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDetailsDialog(course)}
                                  disabled={viewingCourseId === course.id}
                                  className="rounded-lg"
                                >
                                  {viewingCourseId === course.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleValidateCourse(course.id)
                                  }
                                  disabled={validatingCourseId === course.id}
                                  className="rounded-lg"
                                >
                                  {validatingCourseId === course.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Validate Course</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => navigateToContent(course.id)}
                                className="rounded-lg bg-gradient-to-r text-white from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Content
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Add Content</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <div className="flex items-center justify-between space-x-1 mt-3">
                          <div className="flex space-x-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(course)}
                                  className="rounded-lg"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit Course</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteDialog(course)}
                                  disabled={deleteCourseLoading}
                                  className="rounded-lg text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete Course</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {course.status === "DRAFT" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleSubmitForReview(course.id)
                                  }
                                  disabled={submitForReviewLoading}
                                  className="rounded-lg text-green-600 hover:text-green-700"
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  Submit
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Submit for Review</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    ))}

                {!getCoursesLoading &&
                  courses.length === 0 &&
                  hasInitialLoaded && (
                    <div className="col-span-full text-center py-12">
                      <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                      <p className="text-slate-600 dark:text-slate-400">
                        No courses found
                      </p>
                    </div>
                  )}
              </div>

              {coursesPagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={cn(
                            currentPage <= 1 && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>

                      {Array.from(
                        { length: coursesPagination.totalPages },
                        (_, i) => i + 1
                      )
                        .filter((page) => {
                          const start = Math.max(1, currentPage - 2);
                          const end = Math.min(
                            coursesPagination.totalPages,
                            currentPage + 2
                          );
                          return page >= start && page <= end;
                        })
                        .map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={page === currentPage}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={cn(
                            currentPage >= coursesPagination.totalPages &&
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

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Edit Course</DialogTitle>
                <DialogDescription>
                  Update the course details.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[calc(90vh-200px)]">
                <div className="space-y-4 py-4 pr-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Course Title</Label>
                      <Input
                        value={editFormData.title}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            title: e.target.value,
                          })
                        }
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Level</Label>
                      <Select
                        value={editFormData.level}
                        onValueChange={(value) =>
                          setEditFormData({
                            ...editFormData,
                            level: value,
                          })
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BEGINNER">Beginner</SelectItem>
                          <SelectItem value="INTERMEDIATE">
                            Intermediate
                          </SelectItem>
                          <SelectItem value="ADVANCED">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Input
                      value={editFormData.shortDescription}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          shortDescription: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editFormData.description}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          description: e.target.value,
                        })
                      }
                      className="rounded-xl min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (₹)</Label>
                      <Input
                        type="number"
                        value={editFormData.price}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            price: e.target.value,
                          })
                        }
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Discount Price (₹)</Label>
                      <Input
                        type="number"
                        value={editFormData.discountPrice}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            discountPrice: e.target.value,
                          })
                        }
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Thumbnail</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleThumbnailChange(e, true)}
                      className="rounded-xl"
                    />
                    {editThumbnailPreview && (
                      <img
                        src={editThumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Requirements</Label>
                    {editFormData.requirements.map((req, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={req}
                          onChange={(e) =>
                            updateArrayField(
                              "requirements",
                              index,
                              e.target.value,
                              true
                            )
                          }
                          className="rounded-xl"
                        />
                        {editFormData.requirements.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              removeArrayField("requirements", index, true)
                            }
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayField("requirements", true)}
                      className="rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Requirement
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Learning Objectives</Label>
                    {editFormData.learningObjectives.map((obj, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={obj}
                          onChange={(e) =>
                            updateArrayField(
                              "learningObjectives",
                              index,
                              e.target.value,
                              true
                            )
                          }
                          className="rounded-xl"
                        />
                        {editFormData.learningObjectives.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              removeArrayField(
                                "learningObjectives",
                                index,
                                true
                              )
                            }
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayField("learningObjectives", true)}
                      className="rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Objective
                    </Button>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateCourse}
                  disabled={
                    updateCourseLoading ||
                    !editFormData.title ||
                    !editFormData.description
                  }
                  className="rounded-xl"
                >
                  {updateCourseLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
          >
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Course Details
                </DialogTitle>
                <DialogDescription>
                  Detailed information about your course
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[calc(90vh-200px)]">
                {getCourseLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : course ? (
                  <div className="space-y-6 py-4 pr-6">
                    {course.thumbnail && (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-xl"
                      />
                    )}

                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {course.title}
                      </h2>

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className={cn(
                            "text-xs",
                            getStatusColor(course.status)
                          )}
                        >
                          {course.status.replace("_", " ")}
                        </Badge>
                        <Badge
                          className={cn("text-xs", getLevelColor(course.level))}
                        >
                          {course.level}
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                          {course.language}
                        </Badge>
                      </div>

                      {course.description && (
                        <div>
                          <h3 className="font-semibold mb-2">Description</h3>
                          <p className="text-slate-600 dark:text-slate-400">
                            {course.description}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold">Pricing</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-slate-800 dark:text-white">
                              ₹{formatCurrency(course.price)}
                            </span>
                            {course.discountPrice && (
                              <span className="text-slate-500 line-through">
                                ₹{formatCurrency(course.discountPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-semibold">Statistics</h3>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Enrollments:</span>
                              <span>{course.enrollmentsCount || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Reviews:</span>
                              <span>{course.reviewsCount || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sections:</span>
                              <span>{course.sectionsCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {course.requirements?.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Requirements</h3>
                          <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                            {course.requirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {course.learningObjectives?.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">
                            Learning Objectives
                          </h3>
                          <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                            {course.learningObjectives.map((obj, index) => (
                              <li key={index}>{obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {course.tags?.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {course.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        <p>
                          Created:{" "}
                          {format(new Date(course.createdAt), "MMM dd, yyyy")}
                        </p>
                        <p>
                          Last Updated:{" "}
                          {format(new Date(course.updatedAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">
                      Failed to load course details
                    </p>
                  </div>
                )}
              </ScrollArea>

              <DialogFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsDialogOpen(false)}
                  className="rounded-xl"
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Instructor Statistics
                </DialogTitle>
                <DialogDescription>
                  Overall analytics and performance metrics across all your
                  courses
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[calc(90vh-200px)]">
                {getCourseStatsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : courseStats ? (
                  <div className="space-y-6 py-4 pr-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm">
                                Total Courses
                              </p>
                              <p className="text-2xl font-bold">
                                {formatNumber(
                                  courseStats.overview?.totalCourses
                                )}
                              </p>
                            </div>
                            <BookOpen className="w-8 h-8 text-blue-200" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-sm">
                                Total Students
                              </p>
                              <p className="text-2xl font-bold">
                                {formatNumber(
                                  courseStats.overview?.totalStudents
                                )}
                              </p>
                            </div>
                            <Users className="w-8 h-8 text-green-200" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-100 text-sm">
                                Total Sections
                              </p>
                              <p className="text-2xl font-bold">
                                {formatNumber(
                                  courseStats.overview?.totalSections
                                )}
                              </p>
                            </div>
                            <FileText className="w-8 h-8 text-purple-200" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-orange-100 text-sm">
                                Total Enrollments
                              </p>
                              <p className="text-2xl font-bold">
                                {formatNumber(courseStats.enrollment?.total)}
                              </p>
                            </div>
                            <Users className="w-8 h-8 text-orange-200" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-yellow-100 text-sm">Revenue</p>
                              <p className="text-2xl font-bold">
                                ₹{formatCurrency(courseStats.revenue?.totalNet)}
                              </p>
                            </div>
                            <IndianRupee className="w-8 h-8 text-yellow-200" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-indigo-100 text-sm">
                                Avg Rating
                              </p>
                              <p className="text-2xl font-bold">
                                {formatRating(courseStats.ratings?.average)}
                              </p>
                            </div>
                            <Star className="w-8 h-8 text-indigo-200" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-teal-500 to-green-500 text-white border-0">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-teal-100 text-sm">
                                Completion Rate
                              </p>
                              <p className="text-2xl font-bold">
                                {formatNumber(
                                  courseStats.engagement?.completionRate
                                )}
                                %
                              </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-teal-200" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {courseStats.ratings?.distribution && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Rating Distribution
                        </h3>
                        <div className="space-y-3">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count =
                              courseStats.ratings.distribution[rating] || 0;
                            const total = courseStats.ratings.total || 1;
                            const percentage = (count / total) * 100;

                            return (
                              <div
                                key={rating}
                                className="flex items-center space-x-3"
                              >
                                <span className="text-sm w-8">{rating}★</span>
                                <Progress
                                  value={percentage}
                                  className="flex-1 h-3"
                                />
                                <span className="text-sm w-16 text-right">
                                  {count} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No statistics data available
                    </p>
                  </div>
                )}
              </ScrollArea>

              <DialogFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsStatsDialogOpen(false);
                    dispatch(clearCourseStats());
                  }}
                  className="rounded-xl"
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isValidationDialogOpen}
            onOpenChange={setIsValidationDialogOpen}
          >
            <DialogContent className="max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Course Validation
                </DialogTitle>
                <DialogDescription>
                  Review validation results and requirements
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[calc(90vh-200px)]">
                {validateCourseLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : courseValidation ? (
                  <div className="space-y-6 py-4 pr-6">
                    <div className="text-center">
                      <div
                        className={cn(
                          "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4",
                          courseValidation.validation?.isValid
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        )}
                      >
                        {courseValidation.validation?.isValid ? (
                          <CheckCircle className="w-8 h-8" />
                        ) : (
                          <XCircle className="w-8 h-8" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {courseValidation.validation?.isValid
                          ? "Course is Valid"
                          : "Course Needs Attention"}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        {courseValidation.message || "Validation completed"}
                      </p>
                    </div>

                    {courseValidation.validation?.errors?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-600 mb-3 flex items-center">
                          <XCircle className="w-5 h-5 mr-2" />
                          Errors ({courseValidation.validation.errors.length})
                        </h4>
                        <div className="space-y-2">
                          {courseValidation.validation.errors.map(
                            (error, index) => (
                              <div
                                key={index}
                                className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                              >
                                <p className="text-red-800 dark:text-red-300 text-sm">
                                  {error}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {courseValidation.validation?.warnings?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-yellow-600 mb-3 flex items-center">
                          <AlertCircle className="w-5 h-5 mr-2" />
                          Warnings (
                          {courseValidation.validation.warnings.length})
                        </h4>
                        <div className="space-y-2">
                          {courseValidation.validation.warnings.map(
                            (warning, index) => (
                              <div
                                key={index}
                                className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                              >
                                <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                                  {warning}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {courseValidation.validation?.suggestions?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-blue-600 mb-3 flex items-center">
                          <Zap className="w-5 h-5 mr-2" />
                          Suggestions (
                          {courseValidation.validation.suggestions.length})
                        </h4>
                        <div className="space-y-2">
                          {courseValidation.validation.suggestions.map(
                            (suggestion, index) => (
                              <div
                                key={index}
                                className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                              >
                                <p className="text-blue-800 dark:text-blue-300 text-sm">
                                  {suggestion}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No validation data available
                    </p>
                  </div>
                )}
              </ScrollArea>

              <DialogFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsValidationDialogOpen(false);
                    dispatch(clearCourseValidation());
                  }}
                  className="rounded-xl"
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Course</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{courseToDelete?.title}"?
                  This action cannot be undone and will remove all course
                  content permanently.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCourse}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MyCoursesPage;
