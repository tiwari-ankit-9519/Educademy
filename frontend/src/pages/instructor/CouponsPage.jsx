import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
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
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  getCouponAnalytics,
  toggleCouponStatus,
  bulkUpdateCoupons,
  getExpiringSoonCoupons,
  setCouponsFilters,
  resetCouponsFilters,
  clearError,
} from "@/features/instructor/couponSlice";
import { getCourses } from "@/features/instructor/instructorCourseSlice";
import {
  Ticket,
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
  Tag,
  Percent,
  DollarSign,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Filter,
  BookOpen,
} from "lucide-react";

const CouponsPage = () => {
  const dispatch = useDispatch();
  const {
    coupons,
    couponAnalytics,
    expiringSoonCoupons,
    couponsPagination,
    couponsFilters,
    couponsSummary,
    getCouponsLoading,
    createCouponLoading,
    updateCouponLoading,
    deleteCouponLoading,
    toggleCouponStatusLoading,
    bulkUpdateCouponsLoading,
    getCouponAnalyticsLoading,
    error,
  } = useSelector((state) => state.coupon);

  const { courses, getCoursesLoading } = useSelector(
    (state) => state.instructorCourse
  );

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [selectedCoupons, setSelectedCoupons] = useState([]);
  const [showExpiring, setShowExpiring] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [hasCoursesLoaded, setHasCoursesLoaded] = useState(false);

  const [createFormData, setCreateFormData] = useState({
    code: "",
    title: "",
    description: "",
    type: "PERCENTAGE",
    value: "",
    minimumAmount: "",
    maximumDiscount: "",
    usageLimit: "",
    validFrom: "",
    validUntil: "",
    applicableTo: "ALL_COURSES",
    courseIds: [],
  });

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    value: "",
    minimumAmount: "",
    maximumDiscount: "",
    usageLimit: "",
    validFrom: "",
    validUntil: "",
    isActive: true,
  });

  const [bulkUpdateData, setBulkUpdateData] = useState({
    action: "",
    data: {},
  });

  useEffect(() => {
    if (!hasInitialLoaded) {
      dispatch(getCoupons({ page: 1, limit: 20 }));
      dispatch(getCouponAnalytics());
      dispatch(getExpiringSoonCoupons());
      setHasInitialLoaded(true);
    }
  }, [dispatch, hasInitialLoaded]);

  useEffect(() => {
    if (
      createFormData.applicableTo === "SPECIFIC_COURSES" &&
      !hasCoursesLoaded
    ) {
      dispatch(getCourses({ status: "PUBLISHED", limit: 50 }));
      setHasCoursesLoaded(true);
    }
  }, [createFormData.applicableTo, dispatch, hasCoursesLoaded]);

  useEffect(() => {
    setSearchTerm(couponsFilters.search || "");
  }, [couponsFilters.search]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...couponsFilters, [key]: value };
    dispatch(setCouponsFilters({ [key]: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getCoupons({
            ...newFilters,
            page: 1,
            limit: couponsPagination.limit,
          })
        );
      }, 100);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const newFilters = { ...couponsFilters, search: value };
    dispatch(setCouponsFilters({ search: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getCoupons({
            ...newFilters,
            page: 1,
            limit: couponsPagination.limit,
          })
        );
      }, 300);
    }
  };

  const loadCoupons = () => {
    dispatch(
      getCoupons({
        page: 1,
        limit: 20,
        ...(couponsFilters.search && { search: couponsFilters.search }),
        ...(couponsFilters.type && { type: couponsFilters.type }),
        ...(couponsFilters.applicableTo && {
          applicableTo: couponsFilters.applicableTo,
        }),
        ...(couponsFilters.status && { status: couponsFilters.status }),
        sortBy: couponsFilters.sortBy || "createdAt",
        sortOrder: couponsFilters.sortOrder || "desc",
      })
    );
    dispatch(getCouponAnalytics());
    dispatch(getExpiringSoonCoupons());
  };

  const handleCreateCoupon = async () => {
    if (
      createFormData.applicableTo === "SPECIFIC_COURSES" &&
      createFormData.courseIds.length === 0
    ) {
      toast.error(
        "Please select at least one course for specific courses option"
      );
      return;
    }

    try {
      await dispatch(createCoupon(createFormData)).unwrap();
      setIsCreateDialogOpen(false);
      setCreateFormData({
        code: "",
        title: "",
        description: "",
        type: "PERCENTAGE",
        value: "",
        minimumAmount: "",
        maximumDiscount: "",
        usageLimit: "",
        validFrom: "",
        validUntil: "",
        applicableTo: "ALL_COURSES",
        courseIds: [],
      });
      setCourseSearchTerm("");
      loadCoupons();
    } catch (error) {
      toast.error(error.message || "Failed to create coupon");
    }
  };

  const handleUpdateCoupon = async () => {
    try {
      await dispatch(
        updateCoupon({
          couponId: selectedCoupon.id,
          updateData: editFormData,
        })
      ).unwrap();
      setIsEditDialogOpen(false);
      setSelectedCoupon(null);
      loadCoupons();
    } catch (error) {
      toast.error(error.message || "Failed to update coupon");
    }
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;

    try {
      await dispatch(deleteCoupon(couponToDelete.id)).unwrap();
      setIsDeleteDialogOpen(false);
      setCouponToDelete(null);
      loadCoupons();
    } catch (error) {
      toast.error(error.message || "Failed to delete coupon");
    }
  };

  const handleToggleStatus = async (couponId) => {
    try {
      await dispatch(toggleCouponStatus(couponId)).unwrap();
      loadCoupons();
    } catch (error) {
      toast.error(error.message || "Failed to toggle coupon status");
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedCoupons.length === 0) return;

    try {
      await dispatch(
        bulkUpdateCoupons({
          couponIds: selectedCoupons,
          action: bulkUpdateData.action,
          data: bulkUpdateData.data,
        })
      ).unwrap();
      setIsBulkUpdateDialogOpen(false);
      setSelectedCoupons([]);
      setBulkUpdateData({ action: "", data: {} });
      loadCoupons();
    } catch (error) {
      toast.error(error.message || "Failed to update coupons");
    }
  };

  const openEditDialog = (coupon) => {
    setSelectedCoupon(coupon);
    setEditFormData({
      title: coupon.title,
      description: coupon.description || "",
      value: coupon.value.toString(),
      minimumAmount: coupon.minimumAmount?.toString() || "",
      maximumDiscount: coupon.maximumDiscount?.toString() || "",
      usageLimit: coupon.usageLimit?.toString() || "",
      validFrom: coupon.validFrom
        ? format(new Date(coupon.validFrom), "yyyy-MM-dd'T'HH:mm")
        : "",
      validUntil: coupon.validUntil
        ? format(new Date(coupon.validUntil), "yyyy-MM-dd'T'HH:mm")
        : "",
      isActive: coupon.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteDialogOpen(true);
  };

  const openAnalyticsDialog = () => {
    setIsAnalyticsDialogOpen(true);
  };

  const handleSelectCoupon = (couponId) => {
    setSelectedCoupons((prev) =>
      prev.includes(couponId)
        ? prev.filter((id) => id !== couponId)
        : [...prev, couponId]
    );
  };

  const handleSelectAllCoupons = () => {
    if (selectedCoupons.length === coupons.length) {
      setSelectedCoupons([]);
    } else {
      setSelectedCoupons(coupons.map((c) => c.id));
    }
  };

  const handleCourseSelect = (courseId) => {
    setCreateFormData((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  };

  const handleSelectAllCourses = () => {
    const filteredCourses = getFilteredCourses();
    const allSelected = filteredCourses.every((course) =>
      createFormData.courseIds.includes(course.id)
    );

    if (allSelected) {
      setCreateFormData((prev) => ({
        ...prev,
        courseIds: prev.courseIds.filter(
          (id) => !filteredCourses.some((course) => course.id === id)
        ),
      }));
    } else {
      setCreateFormData((prev) => ({
        ...prev,
        courseIds: [
          ...new Set([
            ...prev.courseIds,
            ...filteredCourses.map((course) => course.id),
          ]),
        ],
      }));
    }
  };

  const getFilteredCourses = () => {
    return courses.filter(
      (course) =>
        course.status === "PUBLISHED" &&
        (courseSearchTerm === "" ||
          course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()))
    );
  };

  const handleApplicableToChange = (value) => {
    setCreateFormData((prev) => ({
      ...prev,
      applicableTo: value,
      courseIds: value === "ALL_COURSES" ? [] : prev.courseIds,
    }));

    if (value === "SPECIFIC_COURSES" && !hasCoursesLoaded) {
      dispatch(getCourses({ status: "PUBLISHED", limit: 50 }));
      setHasCoursesLoaded(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "PERCENTAGE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "FIXED_AMOUNT":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getApplicableToColor = (applicableTo) => {
    switch (applicableTo) {
      case "ALL_COURSES":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "SPECIFIC_COURSES":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  if (getCouponsLoading && coupons.length === 0) {
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
              <Ticket className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Coupons
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage discount coupons and promotional codes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowExpiring(!showExpiring)}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <Clock className="w-4 h-4 mr-2" />
              Expiring Soon ({expiringSoonCoupons.length})
            </Button>

            <Button
              variant="outline"
              onClick={openAnalyticsDialog}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Coupon
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Create New Coupon</DialogTitle>
                  <DialogDescription>
                    Create a new discount coupon for your courses.
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-200px)]">
                  <div className="space-y-4 py-4 pr-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Coupon Code</Label>
                        <Input
                          value={createFormData.code}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              code: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="SAVE20"
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={createFormData.title}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              title: e.target.value,
                            })
                          }
                          placeholder="Summer Sale"
                          className="rounded-xl"
                        />
                      </div>
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
                        placeholder="Coupon description"
                        className="rounded-xl min-h-[80px]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={createFormData.type}
                          onValueChange={(value) =>
                            setCreateFormData({
                              ...createFormData,
                              type: value,
                            })
                          }
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE">
                              Percentage
                            </SelectItem>
                            <SelectItem value="FIXED_AMOUNT">
                              Fixed Amount
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Value</Label>
                        <Input
                          type="number"
                          value={createFormData.value}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              value: e.target.value,
                            })
                          }
                          placeholder={
                            createFormData.type === "PERCENTAGE" ? "20" : "10"
                          }
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Usage Limit</Label>
                        <Input
                          type="number"
                          value={createFormData.usageLimit}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              usageLimit: e.target.value,
                            })
                          }
                          placeholder="100"
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    {createFormData.type === "PERCENTAGE" && (
                      <div className="space-y-2">
                        <Label>Maximum Discount Amount</Label>
                        <Input
                          type="number"
                          value={createFormData.maximumDiscount}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              maximumDiscount: e.target.value,
                            })
                          }
                          placeholder="50"
                          className="rounded-xl"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Minimum Amount</Label>
                      <Input
                        type="number"
                        value={createFormData.minimumAmount}
                        onChange={(e) =>
                          setCreateFormData({
                            ...createFormData,
                            minimumAmount: e.target.value,
                          })
                        }
                        placeholder="25"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Valid From</Label>
                        <Input
                          type="datetime-local"
                          value={createFormData.validFrom}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              validFrom: e.target.value,
                            })
                          }
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Valid Until</Label>
                        <Input
                          type="datetime-local"
                          value={createFormData.validUntil}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              validUntil: e.target.value,
                            })
                          }
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Applicable To</Label>
                      <Select
                        value={createFormData.applicableTo}
                        onValueChange={handleApplicableToChange}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL_COURSES">
                            All Courses
                          </SelectItem>
                          <SelectItem value="SPECIFIC_COURSES">
                            Specific Courses
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {createFormData.applicableTo === "SPECIFIC_COURSES" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Select Courses</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                              placeholder="Search courses..."
                              value={courseSearchTerm}
                              onChange={(e) =>
                                setCourseSearchTerm(e.target.value)
                              }
                              className="pl-10 rounded-xl"
                            />
                          </div>
                        </div>

                        {getCoursesLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="ml-2">Loading courses...</span>
                          </div>
                        ) : (
                          <div className="border rounded-xl p-4">
                            {getFilteredCourses().length > 0 ? (
                              <>
                                <div className="flex items-center space-x-2 mb-3 pb-3 border-b">
                                  <Checkbox
                                    checked={getFilteredCourses().every(
                                      (course) =>
                                        createFormData.courseIds.includes(
                                          course.id
                                        )
                                    )}
                                    onCheckedChange={handleSelectAllCourses}
                                  />
                                  <label className="text-sm font-medium">
                                    Select All (
                                    {createFormData.courseIds.length} selected)
                                  </label>
                                </div>
                                <ScrollArea className="h-48">
                                  <div className="space-y-2 pr-6">
                                    {getFilteredCourses().map((course) => (
                                      <div
                                        key={course.id}
                                        className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                                      >
                                        <Checkbox
                                          checked={createFormData.courseIds.includes(
                                            course.id
                                          )}
                                          onCheckedChange={() =>
                                            handleCourseSelect(course.id)
                                          }
                                        />
                                        <div className="flex items-center space-x-2 flex-1">
                                          <BookOpen className="w-4 h-4 text-slate-400" />
                                          <div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                              {course.title}
                                            </p>
                                            <div className="flex items-center space-x-2 text-xs text-slate-500">
                                              <span>{course.level}</span>
                                              <span>•</span>
                                              <span>
                                                {course.enrollmentsCount || 0}{" "}
                                                students
                                              </span>
                                              <span>•</span>
                                              <span>${course.price}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </>
                            ) : (
                              <div className="text-center py-8 text-slate-500">
                                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No published courses found</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <DialogFooter className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setCreateFormData({
                        code: "",
                        title: "",
                        description: "",
                        type: "PERCENTAGE",
                        value: "",
                        minimumAmount: "",
                        maximumDiscount: "",
                        usageLimit: "",
                        validFrom: "",
                        validUntil: "",
                        applicableTo: "ALL_COURSES",
                        courseIds: [],
                      });
                      setCourseSearchTerm("");
                    }}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCoupon}
                    disabled={
                      createCouponLoading ||
                      !createFormData.code ||
                      !createFormData.title ||
                      !createFormData.value ||
                      !createFormData.validFrom ||
                      !createFormData.validUntil ||
                      (createFormData.applicableTo === "SPECIFIC_COURSES" &&
                        createFormData.courseIds.length === 0)
                    }
                    className="rounded-xl"
                  >
                    {createCouponLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Create Coupon
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={loadCoupons}
              disabled={getCouponsLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  getCouponsLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {couponsSummary.totalCoupons || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Active
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {couponsSummary.activeCoupons || 0}
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
                    Expired
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {couponsSummary.expiredCoupons || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg shadow-lg">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Usage
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {couponsSummary.totalUsages || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {showExpiring && expiringSoonCoupons.length > 0 && (
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700 shadow-xl rounded-2xl mb-8">
            <CardHeader>
              <CardTitle className="text-orange-800 dark:text-orange-300 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expiringSoonCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-orange-200 dark:border-orange-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-800 dark:text-white">
                        {coupon.code}
                      </h4>
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                        {coupon.daysLeft} days left
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {coupon.title}
                    </p>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Used: {coupon.usedCount}</span>
                      <span>
                        Expires: {format(new Date(coupon.validUntil), "MMM dd")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <CardTitle className="text-slate-800 dark:text-white">
                All Coupons
              </CardTitle>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search coupons..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-64 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                  />
                </div>

                <Select
                  value={couponsFilters.type || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("type", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={couponsFilters.status || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("status", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                {selectedCoupons.length > 0 && (
                  <Dialog
                    open={isBulkUpdateDialogOpen}
                    onOpenChange={setIsBulkUpdateDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-xl">
                        <Filter className="w-4 h-4 mr-2" />
                        Bulk ({selectedCoupons.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>Bulk Update Coupons</DialogTitle>
                        <DialogDescription>
                          Update {selectedCoupons.length} selected coupons
                        </DialogDescription>
                      </DialogHeader>

                      <ScrollArea className="max-h-[calc(90vh-200px)]">
                        <div className="space-y-4 py-4 pr-6">
                          <div className="space-y-2">
                            <Label>Action</Label>
                            <Select
                              value={bulkUpdateData.action}
                              onValueChange={(value) =>
                                setBulkUpdateData({
                                  ...bulkUpdateData,
                                  action: value,
                                })
                              }
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select action" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="activate">
                                  Activate
                                </SelectItem>
                                <SelectItem value="deactivate">
                                  Deactivate
                                </SelectItem>
                                <SelectItem value="extend">
                                  Extend Validity
                                </SelectItem>
                                <SelectItem value="update">
                                  Update Limits
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {bulkUpdateData.action === "extend" && (
                            <div className="space-y-2">
                              <Label>New Valid Until Date</Label>
                              <Input
                                type="datetime-local"
                                value={bulkUpdateData.data.validUntil || ""}
                                onChange={(e) =>
                                  setBulkUpdateData({
                                    ...bulkUpdateData,
                                    data: {
                                      ...bulkUpdateData.data,
                                      validUntil: e.target.value,
                                    },
                                  })
                                }
                                className="rounded-xl"
                              />
                            </div>
                          )}

                          {bulkUpdateData.action === "update" && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Usage Limit</Label>
                                <Input
                                  type="number"
                                  value={bulkUpdateData.data.usageLimit || ""}
                                  onChange={(e) =>
                                    setBulkUpdateData({
                                      ...bulkUpdateData,
                                      data: {
                                        ...bulkUpdateData.data,
                                        usageLimit: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="New usage limit"
                                  className="rounded-xl"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Minimum Amount</Label>
                                <Input
                                  type="number"
                                  value={
                                    bulkUpdateData.data.minimumAmount || ""
                                  }
                                  onChange={(e) =>
                                    setBulkUpdateData({
                                      ...bulkUpdateData,
                                      data: {
                                        ...bulkUpdateData.data,
                                        minimumAmount: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="New minimum amount"
                                  className="rounded-xl"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      <DialogFooter className="border-t pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsBulkUpdateDialogOpen(false)}
                          className="rounded-xl"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleBulkUpdate}
                          disabled={
                            bulkUpdateCouponsLoading ||
                            !bulkUpdateData.action ||
                            (bulkUpdateData.action === "extend" &&
                              !bulkUpdateData.data.validUntil)
                          }
                          className="rounded-xl"
                        >
                          {bulkUpdateCouponsLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Update Coupons
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    dispatch(resetCouponsFilters());
                    setSearchTerm("");
                    dispatch(
                      getCoupons({
                        page: 1,
                        limit: couponsPagination.limit,
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
            {coupons.length > 0 && (
              <div className="flex items-center space-x-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <input
                  type="checkbox"
                  checked={selectedCoupons.length === coupons.length}
                  onChange={handleSelectAllCoupons}
                  className="rounded"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Select All ({selectedCoupons.length} selected)
                </span>
              </div>
            )}

            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="p-6 rounded-xl border bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedCoupons.includes(coupon.id)}
                        onChange={() => handleSelectCoupon(coupon.id)}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                            {coupon.code}
                          </h3>
                          <Badge
                            className={cn(
                              "text-xs",
                              getStatusColor(coupon.status)
                            )}
                          >
                            {coupon.status}
                          </Badge>
                          <Badge
                            className={cn("text-xs", getTypeColor(coupon.type))}
                          >
                            {coupon.type === "PERCENTAGE" ? (
                              <Percent className="w-3 h-3 mr-1" />
                            ) : (
                              <DollarSign className="w-3 h-3 mr-1" />
                            )}
                            {coupon.value}
                            {coupon.type === "PERCENTAGE" ? "%" : ""}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-xs",
                              getApplicableToColor(coupon.applicableTo)
                            )}
                          >
                            {coupon.applicableTo.replace("_", " ")}
                          </Badge>
                        </div>

                        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                          {coupon.title}
                        </h4>

                        {coupon.description && (
                          <p className="text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                            {coupon.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400 mb-3">
                          <div className="flex items-center space-x-1">
                            <Activity className="w-4 h-4" />
                            <span>Used: {coupon.usedCount || 0}</span>
                          </div>
                          {coupon.usageLimit && (
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>Limit: {coupon.usageLimit}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Valid until:{" "}
                              {format(
                                new Date(coupon.validUntil),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatDistanceToNow(new Date(coupon.createdAt))}{" "}
                              ago
                            </span>
                          </div>
                        </div>

                        {coupon.usageLimit &&
                          coupon.usagePercentage !== null && (
                            <div className="mb-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Usage Progress
                                </span>
                                <span className="text-sm font-bold text-slate-800 dark:text-white">
                                  {coupon.usagePercentage}%
                                </span>
                              </div>
                              <Progress
                                value={coupon.usagePercentage}
                                className="h-2"
                              />
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(coupon.id)}
                        disabled={toggleCouponStatusLoading}
                        className="rounded-lg"
                      >
                        {coupon.isActive ? (
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(coupon)}
                        className="rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(coupon)}
                        disabled={deleteCouponLoading}
                        className="rounded-lg text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {coupons.length === 0 && !getCouponsLoading && (
                <div className="text-center py-12">
                  <Ticket className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No coupons found
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Coupon</DialogTitle>
              <DialogDescription>Update the coupon details.</DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        title: e.target.value,
                      })
                    }
                    placeholder="Coupon title"
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
                    placeholder="Coupon description"
                    className="rounded-xl min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      type="number"
                      value={editFormData.value}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          value: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Usage Limit</Label>
                    <Input
                      type="number"
                      value={editFormData.usageLimit}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          usageLimit: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Amount</Label>
                    <Input
                      type="number"
                      value={editFormData.minimumAmount}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          minimumAmount: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Discount</Label>
                    <Input
                      type="number"
                      value={editFormData.maximumDiscount}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          maximumDiscount: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valid From</Label>
                    <Input
                      type="datetime-local"
                      value={editFormData.validFrom}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          validFrom: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input
                      type="datetime-local"
                      value={editFormData.validUntil}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          validUntil: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editFormData.isActive}
                    onCheckedChange={(checked) =>
                      setEditFormData({ ...editFormData, isActive: checked })
                    }
                  />
                  <Label>Active</Label>
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
                onClick={handleUpdateCoupon}
                disabled={
                  updateCouponLoading ||
                  !editFormData.title ||
                  !editFormData.value
                }
                className="rounded-xl"
              >
                {updateCouponLoading ? (
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
          open={isAnalyticsDialogOpen}
          onOpenChange={setIsAnalyticsDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Coupon Analytics
              </DialogTitle>
              <DialogDescription>
                Detailed analytics and performance metrics for your coupons
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              {getCouponAnalyticsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : couponAnalytics ? (
                <div className="space-y-6 py-4 pr-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm">Total Usage</p>
                            <p className="text-2xl font-bold">
                              {couponAnalytics.summary?.totalUsages || 0}
                            </p>
                          </div>
                          <Activity className="w-8 h-8 text-blue-200" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm">
                              Total Discount
                            </p>
                            <p className="text-2xl font-bold">
                              $
                              {couponAnalytics.summary?.totalDiscount?.toFixed(
                                2
                              ) || "0.00"}
                            </p>
                          </div>
                          <DollarSign className="w-8 h-8 text-green-200" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm">
                              Total Revenue
                            </p>
                            <p className="text-2xl font-bold">
                              $
                              {couponAnalytics.summary?.totalRevenue?.toFixed(
                                2
                              ) || "0.00"}
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
                              Avg Discount
                            </p>
                            <p className="text-2xl font-bold">
                              $
                              {couponAnalytics.summary?.averageDiscount?.toFixed(
                                2
                              ) || "0.00"}
                            </p>
                          </div>
                          <Tag className="w-8 h-8 text-orange-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {couponAnalytics.topPerformers &&
                    couponAnalytics.topPerformers.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Top Performing Coupons
                        </h3>
                        <div className="space-y-3">
                          {couponAnalytics.topPerformers
                            .slice(0, 5)
                            .map((coupon, index) => (
                              <div
                                key={coupon.couponId}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">
                                      {coupon.code}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      {coupon.title}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    {coupon.usages} uses
                                  </p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    ${coupon.totalDiscount?.toFixed(2)} saved
                                  </p>
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
                onClick={() => setIsAnalyticsDialogOpen(false)}
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
              <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{couponToDelete?.code}"? This
                action cannot be undone and will remove the coupon permanently.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCoupon}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CouponsPage;
