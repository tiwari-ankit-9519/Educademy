/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  selectIsAuthenticated,
  selectUser,
  logoutUser,
  clearAuthState,
} from "@/features/authSlice";
import {
  Book,
  BookOpen,
  Users,
  ShoppingCart,
  Heart,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Plus,
  BarChart3,
  Sparkles,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ModeToggle";
import { cn } from "@/lib/utils";
import { navigationConfig } from "@/utils/navigationOptions";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications] = useState([
    { id: 1, message: "New course published", type: "info" },
    { id: 2, message: "Assignment graded", type: "success" },
  ]);

  const userRole = user?.role?.toLowerCase();
  const navigationItems =
    isAuthenticated && userRole
      ? navigationConfig[userRole]
      : navigationConfig.public;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogoutConfirmation = () => {
    setShowLogoutDialog(true);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await dispatch(logoutUser()).unwrap();
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
      navigate("/auth/login");
    } catch (error) {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
      dispatch(clearAuthState());
      navigate("/auth/login");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  // Navigation handlers using navigate instead of Link for dropdown items
  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate("/profile");
  };

  const handleSettingsClick = (e) => {
    e.preventDefault();
    navigate("/profile?tab=security"); // Updated to use unified profile page
  };

  const handleNotificationsClick = (e) => {
    e.preventDefault();
    navigate("/profile?tab=notifications");
  };

  // Role-specific navigation handlers
  const handleRoleSpecificNavigation = (path) => (e) => {
    e.preventDefault();
    navigate(path);
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case "student":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "instructor":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Search Bar - Desktop */}
            {isAuthenticated && (
              <div className="hidden md:flex flex-1 max-w-md mx-6">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search courses, instructors, topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 h-9"
                    />
                  </div>
                </form>
              </div>
            )}

            {/* Right Side - Desktop */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="w-5 h-5" />
                      {notifications.length > 0 && (
                        <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {notifications.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        onClick={handleNotificationsClick}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm">
                            {notification.message}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Just now
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {notifications.length === 0 && (
                      <DropdownMenuItem disabled>
                        No new notifications
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <ModeToggle />

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user?.profileImage}
                          alt={`${user?.firstName} ${user?.lastName}`}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <Badge
                            className={cn(
                              "text-xs",
                              getRoleBadgeColor(user?.role)
                            )}
                          >
                            {user?.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Role-specific menu items using onClick handlers instead of Link */}
                    {userRole === "student" && (
                      <>
                        <DropdownMenuItem
                          onClick={handleRoleSpecificNavigation(
                            "/student/enrollments"
                          )}
                          className="cursor-pointer"
                        >
                          <BookOpen className="mr-2 h-4 w-4" />
                          My Courses
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleRoleSpecificNavigation(
                            "/student/wishlist"
                          )}
                          className="cursor-pointer"
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          Wishlist
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleRoleSpecificNavigation(
                            "/student/cart"
                          )}
                          className="cursor-pointer"
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Cart
                        </DropdownMenuItem>
                      </>
                    )}

                    {userRole === "instructor" && (
                      <>
                        <DropdownMenuItem
                          onClick={handleRoleSpecificNavigation(
                            "/instructor/courses"
                          )}
                          className="cursor-pointer"
                        >
                          <Book className="mr-2 h-4 w-4" />
                          My Courses
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleRoleSpecificNavigation(
                            "/instructor/courses/create"
                          )}
                          className="cursor-pointer"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Course
                        </DropdownMenuItem>
                      </>
                    )}

                    {userRole === "admin" && (
                      <>
                        <DropdownMenuItem
                          onClick={handleRoleSpecificNavigation("/admin/users")}
                          className="cursor-pointer"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Manage Users
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleRoleSpecificNavigation(
                            "/admin/analytics"
                          )}
                          className="cursor-pointer"
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analytics
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />

                    {/* Main navigation items using onClick handlers */}
                    <DropdownMenuItem
                      onClick={handleProfileClick}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleSettingsClick}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={handleLogoutConfirmation}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" asChild>
                    <Link to="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth/register">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button and notifications */}
            <div className="lg:hidden flex items-center space-x-2">
              {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="w-5 h-5" />
                      {notifications.length > 0 && (
                        <Badge className="absolute -top-1 -right-1 w-4 h-4 rounded-full p-0 flex items-center justify-center text-xs">
                          {notifications.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        onClick={handleNotificationsClick}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm">
                            {notification.message}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Just now
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {notifications.length === 0 && (
                      <DropdownMenuItem disabled>
                        No new notifications
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden border-t"
              >
                <div className="py-4 space-y-4">
                  {isAuthenticated && (
                    <form onSubmit={handleSearch} className="px-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search courses..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4"
                        />
                      </div>
                    </form>
                  )}

                  {isAuthenticated && user && (
                    <div className="flex items-center space-x-3 px-2 py-2 border-b">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user?.profileImage}
                          alt={`${user?.firstName} ${user?.lastName}`}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <Badge
                            className={cn(
                              "text-xs",
                              getRoleBadgeColor(user?.role)
                            )}
                          >
                            {user?.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    {navigationItems?.map((item, index) => (
                      <div key={index}>
                        {item.children ? (
                          <div className="space-y-1">
                            <div className="px-2 py-2 text-sm font-medium text-muted-foreground flex items-center">
                              <item.icon className="w-4 h-4 mr-2" />
                              {item.label}
                            </div>
                            <div className="ml-6 space-y-1">
                              {item.children.map((child, childIndex) => (
                                <Link
                                  key={childIndex}
                                  to={child.href}
                                  className="px-2 py-2 text-sm hover:bg-accent rounded-md flex items-center"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  <child.icon className="w-4 h-4 mr-2" />
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Link
                            to={item.href}
                            className={cn(
                              "px-2 py-2 text-sm hover:bg-accent rounded-md flex items-center justify-between",
                              location.pathname === item.href && "bg-accent"
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div className="flex items-center">
                              <item.icon className="w-4 h-4 mr-2" />
                              {item.label}
                            </div>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-1">
                    {isAuthenticated ? (
                      <>
                        <button
                          onClick={() => {
                            handleProfileClick();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm hover:bg-accent rounded-md flex items-center"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            handleSettingsClick();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm hover:bg-accent rounded-md flex items-center"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </button>
                        <button
                          onClick={handleLogoutConfirmation}
                          className="w-full text-left px-2 py-2 text-sm hover:bg-accent rounded-md flex items-center text-red-600"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Log out
                        </button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Link to="/auth/login" className="block">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                          >
                            Sign In
                          </Button>
                        </Link>
                        <Link to="/auth/register" className="block">
                          <Button className="w-full justify-start">
                            Get Started
                          </Button>
                        </Link>
                      </div>
                    )}
                    <div className="flex justify-center pt-2">
                      <ModeToggle />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Confirm Logout</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to sign in again
              to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Yes, Log out
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Navbar;
