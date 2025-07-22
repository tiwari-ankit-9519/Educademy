/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Folder,
  Hash,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const CategoriesManagementPage = () => {
  const dispatch = useDispatch();

  const adminUserState = useSelector((state) => {
    try {
      return state?.adminUser || {};
    } catch (error) {
      console.error("Redux state error:", error);
      return {};
    }
  });

  const {
    categories = [],
    categoryDetails = null,
    categoriesLoading = false,
    categoryDetailsLoading = false,
    createCategoryLoading = false,
    updateCategoryLoading = false,
    deleteCategoryLoading = false,
    categoriesPagination = {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    categoryFilters = {
      search: "",
      isActive: "",
      hasParent: "",
      sortBy: "order",
      sortOrder: "asc",
    },
    error = null,
  } = adminUserState;

  const [localFilters, setLocalFilters] = useState({
    search: "",
    isActive: "all",
    hasParent: "all",
    sortBy: "order",
    sortOrder: "asc",
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    icon: "",
    color: "#3B82F6",
    parentId: "none",
    order: 0,
    image: null,
  });

  const [updateForm, setUpdateForm] = useState({
    name: "",
    description: "",
    icon: "",
    color: "#3B82F6",
    parentId: "none",
    order: 0,
    isActive: true,
    image: null,
    keepCurrentImage: true,
  });

  const [showCreateIconPicker, setShowCreateIconPicker] = useState(false);
  const [showUpdateIconPicker, setShowUpdateIconPicker] = useState(false);

  const predefinedIcons = [
    "📚",
    "💻",
    "🎨",
    "🔬",
    "📊",
    "🎯",
    "🚀",
    "⚡",
    "🎵",
    "🎬",
    "📱",
    "🔒",
    "🌐",
    "📈",
    "💡",
    "🏆",
    "🎪",
    "🎲",
    "🧠",
    "💰",
    "🔧",
    "📝",
    "🎓",
    "🏋️",
    "🍕",
    "☕",
    "🏠",
    "🚗",
    "✈️",
    "🏖️",
    "📷",
    "🎮",
    "🧪",
    "📡",
    "🎭",
    "🎯",
    "🔍",
    "📋",
    "💼",
    "🌟",
    "🔥",
    "💎",
    "🏅",
    "🎊",
    "🎈",
    "🎆",
    "🌈",
    "☀️",
    "🌙",
  ];

  const IconPicker = ({ selectedIcon, onIconSelect, onClose, show }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [customIcon, setCustomIcon] = useState("");

    const filteredIcons = predefinedIcons.filter(
      (icon) => searchTerm === "" || icon.includes(searchTerm)
    );

    if (!show) return null;

    return (
      <div className="icon-picker-container absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Search Icons
            </Label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search or type emoji..."
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Custom Icon
            </Label>
            <div className="flex gap-2">
              <Input
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                placeholder="Enter custom icon/emoji"
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (customIcon.trim()) {
                    onIconSelect(customIcon.trim());
                    setCustomIcon("");
                    onClose();
                  }
                }}
                disabled={!customIcon.trim()}
              >
                Use
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Predefined Icons
            </Label>
            <div className="grid grid-cols-10 gap-2 max-h-48 overflow-y-auto">
              {filteredIcons.map((icon, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onIconSelect(icon);
                    onClose();
                  }}
                  className={`w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded border-2 transition-colors ${
                    selectedIcon === icon
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-transparent"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {selectedIcon && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onIconSelect("");
                  onClose();
                }}
                variant="outline"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCreateIconPicker || showUpdateIconPicker) {
        const target = event.target;
        const iconPicker = target.closest(".icon-picker-container");
        const iconButton = target.closest("button[data-icon-trigger]");
        const iconInput = target.closest("input[data-icon-input]");

        if (!iconPicker && !iconButton && !iconInput) {
          setShowCreateIconPicker(false);
          setShowUpdateIconPicker(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCreateIconPicker, showUpdateIconPicker]);

  useEffect(() => {
    try {
      if (categoryFilters) {
        setLocalFilters({
          search: categoryFilters.search || "",
          isActive: categoryFilters.isActive || "all",
          hasParent: categoryFilters.hasParent || "all",
          sortBy: categoryFilters.sortBy || "order",
          sortOrder: categoryFilters.sortOrder || "asc",
        });
      }
    } catch (error) {
      console.error("Error setting local filters:", error);
    }
  }, [categoryFilters]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (dispatch) {
          const { getAllCategories, clearError } = await import(
            "@/features/adminSlice/adminUser"
          );
          dispatch(clearError());

          const result = await dispatch(
            getAllCategories({ page: 1, limit: 50 })
          ).unwrap();
          console.log("Initial fetch successful:", result);
        }
      } catch (error) {
        console.error("Initial fetch error:", error);
      }
    };

    initializeData();
  }, [dispatch]);

  const fetchData = async (customParams = {}) => {
    try {
      const { getAllCategories } = await import(
        "@/features/adminSlice/adminUser"
      );

      const baseParams = {
        page: categoriesPagination?.page || 1,
        limit: categoriesPagination?.limit || 50,
      };

      const filterParams = {};
      if (categoryFilters?.search && categoryFilters.search.trim() !== "") {
        filterParams.search = categoryFilters.search;
      }
      if (categoryFilters?.isActive && categoryFilters.isActive !== "") {
        filterParams.isActive = categoryFilters.isActive;
      }
      if (categoryFilters?.hasParent && categoryFilters.hasParent !== "") {
        filterParams.hasParent = categoryFilters.hasParent;
      }
      if (categoryFilters?.sortBy && categoryFilters.sortBy !== "") {
        filterParams.sortBy = categoryFilters.sortBy;
      }
      if (categoryFilters?.sortOrder && categoryFilters.sortOrder !== "") {
        filterParams.sortOrder = categoryFilters.sortOrder;
      }

      const params = {
        ...baseParams,
        ...filterParams,
        ...customParams,
      };

      const result = await dispatch(getAllCategories(params)).unwrap();
      console.log("Fetch successful:", result);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    try {
      setLocalFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    } catch (error) {
      console.error("Error changing filter:", error);
    }
  };

  const applyFilters = async () => {
    try {
      const { getAllCategories, setCategoryFilters } = await import(
        "@/features/adminSlice/adminUser"
      );

      const cleanedFilters = Object.entries(localFilters).reduce(
        (acc, [key, value]) => {
          if (value !== "" && value !== null && value !== undefined) {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );

      dispatch(setCategoryFilters(cleanedFilters));

      const baseParams = {
        page: 1,
        limit: categoriesPagination?.limit || 50,
      };

      const params = {
        ...baseParams,
        ...cleanedFilters,
      };

      await dispatch(getAllCategories(params)).unwrap();
    } catch (error) {
      console.error("Error applying filters:", error);
    }
  };

  const clearFilters = async () => {
    try {
      const { getAllCategories, resetCategoryFilters } = await import(
        "@/features/adminSlice/adminUser"
      );

      const defaultFilters = {
        search: "",
        isActive: "all",
        hasParent: "all",
        sortBy: "order",
        sortOrder: "asc",
      };
      setLocalFilters(defaultFilters);
      dispatch(resetCategoryFilters());

      const params = {
        page: 1,
        limit: categoriesPagination?.limit || 50,
        sortBy: "order",
        sortOrder: "asc",
      };

      await dispatch(getAllCategories(params)).unwrap();
    } catch (error) {
      console.error("Error clearing filters:", error);
    }
  };

  const handlePageChange = (newPage) => {
    fetchData({ page: newPage });
  };

  const handleCreateSubmit = async () => {
    try {
      const { createCategory } = await import(
        "@/features/adminSlice/adminUser"
      );

      const formData = new FormData();
      formData.append("name", createForm.name);
      formData.append("description", createForm.description);
      formData.append("icon", createForm.icon);
      formData.append("color", createForm.color);
      formData.append("order", createForm.order);
      if (createForm.parentId && createForm.parentId !== "none") {
        formData.append("parentId", createForm.parentId);
      }
      if (createForm.image) {
        formData.append("image", createForm.image);
      }

      await dispatch(createCategory(formData)).unwrap();
      setShowCreateDialog(false);
      setShowCreateIconPicker(false);
      setCreateForm({
        name: "",
        description: "",
        icon: "",
        color: "#3B82F6",
        parentId: "none",
        order: 0,
        image: null,
      });
      fetchData();
    } catch (error) {
      console.error("Create failed:", error);
    }
  };

  const handleUpdateSubmit = async () => {
    try {
      const { updateCategory } = await import(
        "@/features/adminSlice/adminUser"
      );

      const formData = new FormData();
      formData.append("name", updateForm.name);
      formData.append("description", updateForm.description);
      formData.append("icon", updateForm.icon);
      formData.append("color", updateForm.color);
      formData.append("order", updateForm.order);
      formData.append("isActive", updateForm.isActive);
      if (updateForm.parentId && updateForm.parentId !== "none") {
        formData.append("parentId", updateForm.parentId);
      }
      if (updateForm.image && !updateForm.keepCurrentImage) {
        formData.append("image", updateForm.image);
      }

      await dispatch(
        updateCategory({
          categoryId: selectedCategory.id,
          formData,
        })
      ).unwrap();
      setShowUpdateDialog(false);
      setShowUpdateIconPicker(false);
      setSelectedCategory(null);
      fetchData();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const { deleteCategory } = await import(
        "@/features/adminSlice/adminUser"
      );

      await dispatch(deleteCategory(selectedCategory.id)).unwrap();
      setShowDeleteDialog(false);
      setSelectedCategory(null);
      fetchData();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = async (category) => {
    try {
      const { getSingleCategory } = await import(
        "@/features/adminSlice/adminUser"
      );

      setSelectedCategory(category);
      setShowViewDialog(true);
      dispatch(getSingleCategory(category.id));
    } catch (error) {
      console.error("View error:", error);
    }
  };

  const handleEdit = (category) => {
    try {
      console.log("Editing category:", category);
      setSelectedCategory(category);

      const parentId =
        category.parent?.id && category.parent.id !== ""
          ? category.parent.id
          : "none";
      console.log("Setting parentId to:", parentId);

      setUpdateForm({
        name: category.name || "",
        description: category.description || "",
        icon: category.icon || "",
        color: category.color || "#3B82F6",
        parentId: parentId,
        order: category.order || 0,
        isActive: category.isActive !== false,
        image: null,
        keepCurrentImage: true,
      });
      setShowUpdateDialog(true);
    } catch (error) {
      console.error("Edit error:", error);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (isActive) => {
    return (
      <Badge
        className={`${
          isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        } border-0 font-medium`}
      >
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color = "indigo" }) => {
    console.log(`StatCard color: ${color}`);
    return (
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {title}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {value}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700">
              <Icon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const parentCategories = Array.isArray(categories)
    ? categories.filter((cat) => {
        const isValidParent = !cat.parent && cat.id && cat.id !== "";
        if (!isValidParent && cat.id === "") {
          console.warn("Category with empty ID found:", cat);
        }
        return isValidParent;
      })
    : [];

  const currentDeleteLoading = deleteCategoryLoading || isDeleting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Categories Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage course categories and subcategories
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={fetchData}
              disabled={categoriesLoading}
              variant="outline"
              className="border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${
                  categoriesLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        {Array.isArray(categories) && categories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Categories"
              value={categoriesPagination?.total || 0}
              icon={Folder}
              color="slate"
            />
            <StatCard
              title="Active Categories"
              value={categories.filter((cat) => cat.isActive).length}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="Parent Categories"
              value={categories.filter((cat) => !cat.parent).length}
              icon={Hash}
              color="blue"
            />
            <StatCard
              title="Total Courses"
              value={categories.reduce(
                (sum, cat) => sum + (cat.coursesCount || 0),
                0
              )}
              icon={BookOpen}
              color="purple"
            />
          </div>
        )}

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              Filters & Search
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Filter and search categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="search"
                    value={localFilters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    placeholder="Search categories..."
                    className="pl-10 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </Label>
                <Select
                  value={localFilters.isActive || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("isActive", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="mt-1 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Type
                </Label>
                <Select
                  value={localFilters.hasParent || "all"}
                  onValueChange={(value) =>
                    handleFilterChange(
                      "hasParent",
                      value === "all" ? "" : value
                    )
                  }
                >
                  <SelectTrigger className="mt-1 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="false">Parent Categories</SelectItem>
                    <SelectItem value="true">Subcategories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Sort By
                </Label>
                <Select
                  value={localFilters.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger className="mt-1 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="updatedAt">Updated Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Order
                </Label>
                <Select
                  value={localFilters.sortOrder}
                  onValueChange={(value) =>
                    handleFilterChange("sortOrder", value)
                  }
                >
                  <SelectTrigger className="mt-1 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={applyFilters}
                className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="border-slate-200 dark:border-slate-700 rounded-xl"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert className="bg-red-50/80 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 backdrop-blur-sm rounded-xl">
            <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
                <span className="text-slate-600 dark:text-slate-400">
                  Loading categories...
                </span>
              </div>
            ) : !Array.isArray(categories) || categories.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No categories found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-700">
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Category
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Type
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Status
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Courses
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Order
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Created
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow
                        key={category.id}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/30"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt={category.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                                style={{
                                  backgroundColor: category.color || "#3B82F6",
                                }}
                              >
                                {category.icon ||
                                  category.name?.charAt(0) ||
                                  "?"}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {category.name || "Unnamed Category"}
                              </p>
                              {category.description && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {category.parent ? (
                            <div>
                              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-0 text-xs">
                                Subcategory
                              </Badge>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                of {category.parent.name}
                              </p>
                            </div>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-0 text-xs">
                              Parent
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(category.isActive)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {category.coursesCount || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-slate-200 dark:border-slate-700 text-xs"
                          >
                            {category.order || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(category.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                                disabled={
                                  currentDeleteLoading &&
                                  selectedCategory?.id === category.id
                                }
                              >
                                {currentDeleteLoading &&
                                selectedCategory?.id === category.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                            >
                              <DropdownMenuItem
                                onClick={() => handleView(category)}
                                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                                disabled={currentDeleteLoading}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(category)}
                                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                                disabled={currentDeleteLoading}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setShowDeleteDialog(true);
                                }}
                                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
                                disabled={currentDeleteLoading}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {categoriesPagination && categoriesPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing{" "}
                  {(categoriesPagination.page - 1) *
                    categoriesPagination.limit +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    categoriesPagination.page * categoriesPagination.limit,
                    categoriesPagination.total
                  )}{" "}
                  of {categoriesPagination.total} categories
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={categoriesPagination.page === 1}
                    className="rounded-lg border-slate-200 dark:border-slate-700"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(categoriesPagination.page - 1)
                    }
                    disabled={!categoriesPagination.hasPrev}
                    className="rounded-lg border-slate-200 dark:border-slate-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    {categoriesPagination.page} of{" "}
                    {categoriesPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(categoriesPagination.page + 1)
                    }
                    disabled={!categoriesPagination.hasNext}
                    className="rounded-lg border-slate-200 dark:border-slate-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(categoriesPagination.totalPages)
                    }
                    disabled={
                      categoriesPagination.page ===
                      categoriesPagination.totalPages
                    }
                    className="rounded-lg border-slate-200 dark:border-slate-700"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) {
              setShowCreateIconPicker(false);
            }
          }}
        >
          <DialogContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">
                Create New Category
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Add a new category to organize courses
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Category Name *
                </Label>
                <Input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="Enter category name"
                  className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description
                </Label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter category description"
                  className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Icon
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      value={createForm.icon}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, icon: e.target.value })
                      }
                      placeholder="Click to select icon"
                      className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl pr-10 cursor-pointer"
                      readOnly
                      onClick={() =>
                        setShowCreateIconPicker(!showCreateIconPicker)
                      }
                      data-icon-input="true"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCreateIconPicker(!showCreateIconPicker)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      data-icon-trigger="true"
                    >
                      {createForm.icon || "🎯"}
                    </button>
                  </div>
                  <IconPicker
                    selectedIcon={createForm.icon}
                    onIconSelect={(icon) =>
                      setCreateForm({ ...createForm, icon })
                    }
                    onClose={() => setShowCreateIconPicker(false)}
                    show={showCreateIconPicker}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Color
                  </Label>
                  <Input
                    type="color"
                    value={createForm.color}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, color: e.target.value })
                    }
                    className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Parent Category
                  </Label>
                  <Select
                    value={
                      createForm.parentId && createForm.parentId !== ""
                        ? createForm.parentId
                        : "none"
                    }
                    onValueChange={(value) =>
                      setCreateForm({
                        ...createForm,
                        parentId: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl">
                      <SelectValue placeholder="Select parent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Parent</SelectItem>
                      {parentCategories
                        .filter((cat) => cat.id && cat.id !== "")
                        .map((cat) => {
                          console.log(
                            "Rendering SelectItem for create category:",
                            cat.id,
                            cat.name
                          );
                          if (!cat.id || cat.id === "") {
                            console.error(
                              "Invalid category ID in create:",
                              cat
                            );
                            return null;
                          }
                          return (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Order
                  </Label>
                  <Input
                    type="number"
                    value={createForm.order}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Category Image
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCreateForm({ ...createForm, image: e.target.files[0] })
                  }
                  className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setShowCreateIconPicker(false);
                  }}
                  className="border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSubmit}
                  disabled={createCategoryLoading || !createForm.name.trim()}
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
                >
                  {createCategoryLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Category
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showUpdateDialog}
          onOpenChange={(open) => {
            setShowUpdateDialog(open);
            if (!open) {
              setShowUpdateIconPicker(false);
            }
          }}
        >
          <DialogContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">
                Update Category
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Edit category details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Category Name *
                </Label>
                <Input
                  value={updateForm.name}
                  onChange={(e) =>
                    setUpdateForm({ ...updateForm, name: e.target.value })
                  }
                  placeholder="Enter category name"
                  className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description
                </Label>
                <Textarea
                  value={updateForm.description}
                  onChange={(e) =>
                    setUpdateForm({
                      ...updateForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter category description"
                  className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Icon
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      value={updateForm.icon}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, icon: e.target.value })
                      }
                      placeholder="Click to select icon"
                      className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl pr-10 cursor-pointer"
                      readOnly
                      onClick={() =>
                        setShowUpdateIconPicker(!showUpdateIconPicker)
                      }
                      data-icon-input="true"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowUpdateIconPicker(!showUpdateIconPicker)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      data-icon-trigger="true"
                    >
                      {updateForm.icon || "🎯"}
                    </button>
                  </div>
                  <IconPicker
                    selectedIcon={updateForm.icon}
                    onIconSelect={(icon) =>
                      setUpdateForm({ ...updateForm, icon })
                    }
                    onClose={() => setShowUpdateIconPicker(false)}
                    show={showUpdateIconPicker}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Color
                  </Label>
                  <Input
                    type="color"
                    value={updateForm.color}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, color: e.target.value })
                    }
                    className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Parent Category
                  </Label>
                  <Select
                    value={updateForm.parentId}
                    onValueChange={(value) =>
                      setUpdateForm({ ...updateForm, parentId: value })
                    }
                  >
                    <SelectTrigger className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl">
                      <SelectValue placeholder="Select parent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Parent</SelectItem>
                      {parentCategories
                        .filter((cat) => cat.id !== selectedCategory?.id)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Order
                  </Label>
                  <Input
                    type="number"
                    value={updateForm.order}
                    onChange={(e) =>
                      setUpdateForm({
                        ...updateForm,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Active Status
                </Label>
                <Switch
                  checked={updateForm.isActive}
                  onCheckedChange={(checked) =>
                    setUpdateForm({ ...updateForm, isActive: checked })
                  }
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Update Image
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setUpdateForm({
                      ...updateForm,
                      image: e.target.files[0],
                      keepCurrentImage: !e.target.files[0],
                    })
                  }
                  className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpdateDialog(false);
                    setShowUpdateIconPicker(false);
                  }}
                  className="border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateSubmit}
                  disabled={updateCategoryLoading || !updateForm.name.trim()}
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
                >
                  {updateCategoryLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Edit className="w-4 h-4 mr-2" />
                  )}
                  Update Category
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showViewDialog}
          onOpenChange={(open) => {
            setShowViewDialog(open);
            if (!open) {
              setSelectedCategory(null);
            }
          }}
        >
          <DialogContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">
                Category Details
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Detailed information about this category
              </DialogDescription>
            </DialogHeader>
            {categoryDetailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
                <span className="text-slate-600 dark:text-slate-400">
                  Loading details...
                </span>
              </div>
            ) : categoryDetails || selectedCategory ? (
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  {categoryDetails?.image || selectedCategory?.image ? (
                    <img
                      src={categoryDetails?.image || selectedCategory?.image}
                      alt={categoryDetails?.name || selectedCategory?.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-xl font-medium"
                      style={{
                        backgroundColor:
                          categoryDetails?.color ||
                          selectedCategory?.color ||
                          "#3B82F6",
                      }}
                    >
                      {categoryDetails?.icon ||
                        selectedCategory?.icon ||
                        (
                          categoryDetails?.name || selectedCategory?.name
                        )?.charAt(0) ||
                        "?"}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {categoryDetails?.name || selectedCategory?.name}
                    </h3>
                    {(categoryDetails?.description ||
                      selectedCategory?.description) && (
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        {categoryDetails?.description ||
                          selectedCategory?.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-3">
                      {getStatusBadge(
                        categoryDetails?.isActive ?? selectedCategory?.isActive
                      )}
                      {categoryDetails?.parent || selectedCategory?.parent ? (
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-0">
                          Subcategory of{" "}
                          {
                            (
                              categoryDetails?.parent ||
                              selectedCategory?.parent
                            )?.name
                          }
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-0">
                          Parent Category
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {categoryDetails?.stats?.totalCourses ||
                        categoryDetails?.coursesCount ||
                        selectedCategory?.coursesCount ||
                        0}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Total Courses
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {categoryDetails?.stats?.publishedCourses ||
                        categoryDetails?.publishedCoursesCount ||
                        selectedCategory?.publishedCoursesCount ||
                        0}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Published
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {categoryDetails?.stats?.subcategoriesCount ||
                        categoryDetails?.subcategoriesCount ||
                        selectedCategory?.subcategoriesCount ||
                        0}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Subcategories
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {categoryDetails?.order || selectedCategory?.order || 0}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Order
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 dark:text-slate-400">
                  Failed to load category details
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            if (!currentDeleteLoading) {
              setShowDeleteDialog(open);
            }
          }}
        >
          <AlertDialogContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-900 dark:text-white">
                Delete Category
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                Are you sure you want to delete "{selectedCategory?.name}"? This
                action cannot be undone.
                {selectedCategory?.subcategoriesCount > 0 && (
                  <p className="text-red-600 dark:text-red-400 mt-2">
                    This category has {selectedCategory.subcategoriesCount}{" "}
                    subcategories.
                  </p>
                )}
                {selectedCategory?.coursesCount > 0 && (
                  <p className="text-red-600 dark:text-red-400 mt-2">
                    This category has {selectedCategory.coursesCount} courses.
                  </p>
                )}
                {currentDeleteLoading && (
                  <div className="flex items-center justify-center mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-red-500 mr-2" />
                    <span className="text-red-600 dark:text-red-400 text-sm">
                      Deleting category, please wait...
                    </span>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="rounded-xl"
                disabled={currentDeleteLoading}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={currentDeleteLoading}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl"
              >
                {currentDeleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Category
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CategoriesManagementPage;
