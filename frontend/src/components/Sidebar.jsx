import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "@/features/authSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ShoppingCart,
  Heart,
  CreditCard,
  Settings,
  Bell,
  Search,
  HelpCircle,
  User,
  BarChart3,
  Shield,
  DollarSign,
  GraduationCap,
  MessageSquare,
  Upload,
  CheckCircle,
  PlayCircle,
  Edit3,
  Globe,
  Package,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Loader2,
} from "lucide-react";

const Sidebar = ({ className, isCollapsed, setIsCollapsed }) => {
  // const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleExpanded = (menuId) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const isActive = (path) => {
    if (path === location.pathname) return true;
    if (location.pathname.startsWith(path + "/")) {
      const pathSegments = path.split("/").filter(Boolean);
      const locationSegments = location.pathname.split("/").filter(Boolean);
      return (
        pathSegments.length === locationSegments.length - 1 ||
        pathSegments.every(
          (segment, index) => segment === locationSegments[index]
        )
      );
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      setIsLogoutDialogOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLogoutDialogOpen(false);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const adminMenuItems = [
    {
      id: "admin-dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
    },
    {
      id: "admin-analytics",
      title: "Analytics",
      icon: BarChart3,
      path: "/admin/analytics",
      children: [
        { title: "Users", path: "/admin/analytics/users" },
        { title: "Courses", path: "/admin/analytics/courses" },
        { title: "Revenue", path: "/admin/analytics/revenue" },
        { title: "Real-time", path: "/admin/analytics/realtime" },
      ],
    },
    {
      id: "admin-users",
      title: "User Management",
      icon: Users,
      path: "/admin/users/overview",
      children: [
        { title: "All Users", path: "/admin/users" },
        {
          title: "Verification Requests",
          path: "/admin/verification/requests",
        },
      ],
    },
    {
      id: "admin-courses",
      title: "Course Management",
      icon: BookOpen,
      path: "/admin/courses",
      children: [
        { title: "Pending Reviews", path: "/admin/courses/pending" },
        { title: "Course Stats", path: "/admin/courses/stats" },
        { title: "Review History", path: "/admin/courses/history" },
      ],
    },
    {
      id: "admin-payments",
      title: "Payment Management",
      icon: CreditCard,
      path: "/admin/payments",
      children: [
        { title: "Transactions", path: "/admin/payments/transactions" },
        { title: "Payouts", path: "/admin/payments/payouts" },
        { title: "Revenue Overview", path: "/admin/payments/revenue" },
        { title: "Financial Analytics", path: "/admin/payments/analytics" },
      ],
    },
    {
      id: "admin-moderation",
      title: "Moderation",
      icon: Shield,
      path: "/admin/moderation",
      children: [
        { title: "Content Reports", path: "/admin/moderation/reports" },
        { title: "User Violations", path: "/admin/moderation/violations" },
        { title: "Moderation Stats", path: "/admin/moderation/stats" },
        { title: "Community Standards", path: "/admin/moderation/standards" },
      ],
    },
    {
      id: "admin-system",
      title: "System Settings",
      icon: Settings,
      path: "/admin/system",
      children: [
        { title: "General Settings", path: "/admin/system/settings" },
        { title: "Categories", path: "/admin/users/categories" },
        { title: "Announcements", path: "/admin/system/announcements" },
        { title: "System Health", path: "/admin/system/health" },
      ],
    },
  ];

  const instructorMenuItems = [
    {
      id: "instructor-dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/instructor/dashboard",
    },
    {
      id: "instructor-courses",
      title: "My Courses",
      icon: BookOpen,
      path: "/instructor/courses",
      children: [
        { title: "All Courses", path: "/instructor/courses" },
        { title: "Create Course", path: "/instructor/courses/create" },
        { title: "Course Stats", path: "/instructor/courses/stats" },
      ],
    },
    {
      id: "instructor-content",
      title: "Course Content",
      icon: Edit3,
      path: "/instructor/content",
      children: [
        { title: "Sections & Lessons", path: "/instructor/content/sections" },
        { title: "Quizzes", path: "/instructor/content/quizzes" },
        { title: "Assignments", path: "/instructor/content/assignments" },
        { title: "Content Stats", path: "/instructor/content/stats" },
      ],
    },
    {
      id: "instructor-students",
      title: "Students",
      icon: GraduationCap,
      path: "/instructor/students",
      children: [
        { title: "Enrolled Students", path: "/instructor/students" },
        { title: "Student Analytics", path: "/instructor/students/analytics" },
        { title: "Grading", path: "/instructor/students/grading" },
        { title: "Certificates", path: "/instructor/students/certificates" },
      ],
    },
    {
      id: "instructor-community",
      title: "Community",
      icon: MessageSquare,
      path: "/instructor/community",
      children: [
        { title: "Q&A", path: "/instructor/community/qna" },
        { title: "Reviews", path: "/instructor/community/reviews" },
        { title: "Community Overview", path: "/instructor/community/overview" },
      ],
    },
    {
      id: "instructor-earnings",
      title: "Earnings",
      icon: DollarSign,
      path: "/instructor/earnings",
      children: [
        { title: "Overview", path: "/instructor/earnings/overview" },
        { title: "Detailed Report", path: "/instructor/earnings/detailed" },
        { title: "Payout History", path: "/instructor/earnings/payouts" },
        { title: "Revenue Analytics", path: "/instructor/earnings/analytics" },
      ],
    },
    {
      id: "instructor-coupons",
      title: "Coupons",
      icon: Package,
      path: "/instructor/coupons",
      children: [
        { title: "All Coupons", path: "/instructor/coupons" },
        { title: "Create Coupon", path: "/instructor/coupons/create" },
        { title: "Analytics", path: "/instructor/coupons/analytics" },
      ],
    },
    {
      id: "instructor-verification",
      title: "Verification",
      icon: CheckCircle,
      path: "/instructor/verification",
      children: [
        {
          title: "Request Verification",
          path: "/instructor/verification/request",
        },
        { title: "My Requests", path: "/instructor/verification/requests" },
      ],
    },
  ];

  const studentMenuItems = [
    {
      id: "student-learning",
      title: "My Learning",
      icon: PlayCircle,
      path: "/student/learning",
      children: [
        { title: "Enrolled Courses", path: "/student/learning/courses" },
        { title: "Learning Analytics", path: "/student/learning/analytics" },
        { title: "Certificates", path: "/student/learning/certificates" },
      ],
    },
    {
      id: "student-catalog",
      title: "Browse Courses",
      icon: Globe,
      path: "/catalog",
      children: [
        { title: "All Courses", path: "/catalog/courses" },
        { title: "Categories", path: "/catalog/categories" },
        { title: "Featured", path: "/catalog/featured" },
        { title: "Trending", path: "/catalog/trending" },
        { title: "Free Courses", path: "/catalog/free" },
      ],
    },
    {
      id: "student-cart",
      title: "Shopping Cart",
      icon: ShoppingCart,
      path: "/student/cart",
    },
    {
      id: "student-wishlist",
      title: "Wishlist",
      icon: Heart,
      path: "/student/wishlist",
    },
    {
      id: "student-purchases",
      title: "Purchase History",
      icon: CreditCard,
      path: "/student/purchases",
    },
    {
      id: "search",
      title: "Search",
      icon: Search,
      path: "/search",
    },
    {
      id: "student-community",
      title: "Community",
      icon: MessageSquare,
      path: "/student/community",
      children: [
        { title: "Course Reviews", path: "/student/community/reviews" },
        { title: "Q&A", path: "/student/community/qna" },
      ],
    },
  ];

  const commonMenuItems = [
    {
      id: "profile",
      title: "Profile",
      icon: User,
      path: "/profile",
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: Bell,
      path: "/notifications",
    },
    {
      id: "support",
      title: "Support",
      icon: HelpCircle,
      path: "/support",
    },
  ];

  const getMenuItems = () => {
    if (!isAuthenticated || !user) return [];

    let menuItems = [];
    const userRole = user?.role?.toLowerCase();

    if (userRole === "admin") {
      menuItems = [...adminMenuItems];
    } else if (userRole === "instructor") {
      menuItems = [...instructorMenuItems];
    } else if (userRole === "student") {
      menuItems = [...studentMenuItems];
    }

    return [...menuItems, ...commonMenuItems];
  };

  const renderMenuItem = (item, isMobile = false) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.has(item.id);
    const isItemActive = isActive(item.path);

    if (hasChildren) {
      if (isCollapsed && !isMobile) {
        return (
          <TooltipProvider key={item.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full h-11 px-3 font-medium transition-all duration-200 rounded-xl flex items-center justify-center",
                    isItemActive
                      ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/30 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400"
                  )}
                  onClick={() => handleNavigate(item.path)}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      isItemActive
                        ? "bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                <p>{item.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return (
        <Collapsible
          key={item.id}
          open={isExpanded}
          onOpenChange={() => toggleExpanded(item.id)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between h-11 px-3 text-left font-medium transition-all duration-200 rounded-xl",
                isItemActive
                  ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/30 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400"
              )}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isItemActive
                      ? "bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <span className="text-sm">{item.title}</span>
              </div>

              {isExpanded ? (
                <ChevronDown className="w-4 h-4 transition-transform" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pl-10 pt-2">
            {item.children.map((child) => (
              <Button
                key={child.path}
                variant="ghost"
                className={cn(
                  "w-full justify-start h-9 px-3 text-xs font-normal rounded-lg transition-all duration-200",
                  isActive(child.path)
                    ? "bg-gradient-to-r from-indigo-500/15 to-blue-500/15 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/30 dark:hover:bg-slate-700/30"
                )}
                onClick={() => handleNavigate(child.path)}
              >
                {child.title}
              </Button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    if (isCollapsed && !isMobile) {
      return (
        <TooltipProvider key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-11 px-3 font-medium transition-all duration-200 rounded-xl flex items-center justify-center",
                  isItemActive
                    ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/30 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
                onClick={() => handleNavigate(item.path)}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isItemActive
                      ? "bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p>{item.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Button
        key={item.id}
        variant="ghost"
        className={cn(
          "w-full justify-start h-11 px-3 font-medium transition-all duration-200 rounded-xl",
          isItemActive
            ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/30 shadow-sm"
            : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400"
        )}
        onClick={() => handleNavigate(item.path)}
      >
        <div
          className={cn(
            "p-1.5 rounded-lg transition-colors mr-3",
            isItemActive
              ? "bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm">{item.title}</span>
      </Button>
    );
  };

  const desktopSidebarContent = (
    <div className="h-full">
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-6">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">
                {user?.role?.toLowerCase() === "admin"
                  ? "Admin Panel"
                  : user?.role?.toLowerCase() === "instructor"
                  ? "Instructor Dashboard"
                  : "Student Dashboard"}
              </h2>
            </div>
          )}

          {isCollapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  <p>Expand sidebar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Separator className="mb-6 bg-white/30 dark:bg-slate-700/50" />

        <ScrollArea className="flex-1 -mx-2">
          <div className="space-y-2 px-2">
            {getMenuItems().map((item) => renderMenuItem(item, false))}
          </div>
        </ScrollArea>

        <Separator className="my-4 bg-white/30 dark:bg-slate-700/50" />

        <div className="space-y-3">
          {isCollapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center p-3 rounded-xl bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm">
                    <Avatar className="h-8 w-8 ring-2 ring-white/50 dark:ring-slate-600/50">
                      <AvatarImage src={user?.profilePicture} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-xs">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  <div className="text-center">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.role}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm">
              <Avatar className="h-8 w-8 ring-2 ring-white/50 dark:ring-slate-600/50">
                <AvatarImage src={user?.profilePicture} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-xs">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          )}

          {!isCollapsed && (
            <AlertDialog
              open={isLogoutDialogOpen}
              onOpenChange={setIsLogoutDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10 px-3 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-3" />
                  ) : (
                    <LogOut className="w-4 h-4 mr-3" />
                  )}
                  <span className="text-sm">
                    {loading ? "Logging out..." : "Logout"}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-slate-800 dark:text-white">
                    Are you sure you want to logout?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                    You will be signed out of your account and redirected to the
                    login page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Logging out...
                      </>
                    ) : (
                      "Logout"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {isCollapsed && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialog
                    open={isLogoutDialogOpen}
                    onOpenChange={setIsLogoutDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-800 dark:text-white">
                          Are you sure you want to logout?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                          You will be signed out of your account and redirected
                          to the login page.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleLogout}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Logging out...
                            </>
                          ) : (
                            "Logout"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );

  const mobileSidebarContent = (
    <div className="relative h-full">
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">
              {user?.role?.toLowerCase() === "admin"
                ? "Admin Panel"
                : user?.role?.toLowerCase() === "instructor"
                ? "Instructor Dashboard"
                : "Student Dashboard"}
            </h2>
          </div>
        </div>

        <Separator className="mb-6 bg-white/30 dark:bg-slate-700/50" />

        <ScrollArea className="flex-1 -mx-2">
          <div className="space-y-2 px-2">
            {getMenuItems().map((item) => renderMenuItem(item, true))}
          </div>
        </ScrollArea>

        <Separator className="my-4 bg-white/30 dark:bg-slate-700/50" />

        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm">
            <Avatar className="h-8 w-8 ring-2 ring-white/50 dark:ring-slate-600/50">
              <AvatarImage src={user?.profilePicture} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-xs">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>

          <AlertDialog
            open={isLogoutDialogOpen}
            onOpenChange={setIsLogoutDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start h-10 px-3 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-3" />
                ) : (
                  <LogOut className="w-4 h-4 mr-3" />
                )}
                <span className="text-sm">
                  {loading ? "Logging out..." : "Logout"}
                </span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-800 dark:text-white">
                  Are you sure you want to logout?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                  You will be signed out of your account and redirected to the
                  login page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Logging out...
                    </>
                  ) : (
                    "Logout"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="hidden lg:block fixed inset-y-0 left-0 z-50">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl border-r border-white/50 dark:border-slate-700/50 shadow-xl",
            isCollapsed ? "w-20" : "w-72",
            className
          )}
        >
          {desktopSidebarContent}
        </div>
      </div>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="fixed top-4 left-4 z-50 h-10 w-10 p-0 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-lg hover:bg-white/80 dark:hover:bg-slate-800/80"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 p-0 bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-cyan-50/90 dark:from-slate-900/90 dark:via-slate-800/90 dark:to-gray-900/90 backdrop-blur-xl border-r border-white/50 dark:border-slate-700/50"
          >
            {mobileSidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar;
