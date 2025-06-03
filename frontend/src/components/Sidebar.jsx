/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "@/features/authSlice";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { navigationConfig } from "@/utils/navigationOptions";

const SidebarNavigation = () => {
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const [openItems, setOpenItems] = useState(new Set());

  const userRole = user?.role?.toLowerCase();
  const navigationItems =
    isAuthenticated && userRole
      ? navigationConfig[userRole]
      : navigationConfig.public;

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  // Don't render sidebar for mobile (handled by navbar)
  if (!navigationItems) return null;

  const containerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  const glowVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.6, 0.3],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="relative hidden lg:flex">
      {/* Background Effects */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-10 left-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"
          variants={glowVariants}
          animate="animate"
        />
        <motion.div
          className="absolute top-32 right-4 w-12 h-12 bg-purple-500/10 rounded-full blur-xl"
          variants={glowVariants}
          animate="animate"
          style={{ animationDelay: "1s" }}
        />
        <motion.div
          className="absolute bottom-20 left-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl"
          variants={glowVariants}
          animate="animate"
          style={{ animationDelay: "2s" }}
        />
      </motion.div>

      <Sidebar className="border-r-0 bg-gradient-to-b from-slate-50/95 via-blue-50/90 to-indigo-50/95 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-indigo-900/95 backdrop-blur-xl">
        <SidebarContent className="relative z-10">
          {/* Brand Header */}
          <motion.div
            className="p-6 border-b border-white/20 dark:border-slate-700/50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Educademy
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {user?.role?.toLowerCase() || "Platform"}
                </p>
              </div>
            </div>
          </motion.div>

          <SidebarGroup className="p-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <SidebarGroupLabel className="text-slate-600 dark:text-slate-300 font-semibold mb-3 text-sm uppercase tracking-wider">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {navigationItems.map((item, index) => (
                    <motion.div key={index} variants={itemVariants}>
                      <SidebarMenuItem>
                        {item.children ? (
                          <Collapsible
                            open={openItems.has(index)}
                            onOpenChange={() => toggleItem(index)}
                          >
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton className="w-full justify-between hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-xl transition-all duration-200 p-3 group">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200/70 dark:group-hover:bg-blue-800/50 transition-colors duration-200">
                                    <item.icon className="w-4 h-4 text-black dark:text-white" />
                                  </div>
                                  <span className="font-medium text-slate-700 dark:text-slate-200">
                                    {item.label}
                                  </span>
                                </div>
                                <motion.div
                                  animate={{
                                    rotate: openItems.has(index) ? 90 : 0,
                                  }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                </motion.div>
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <AnimatePresence>
                              {openItems.has(index) && (
                                <CollapsibleContent forceMount>
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <SidebarMenuSub className="ml-4 mt-2 space-y-1">
                                      {item.children.map(
                                        (child, childIndex) => (
                                          <motion.div
                                            key={childIndex}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                              delay: childIndex * 0.05,
                                            }}
                                          >
                                            <SidebarMenuSubItem>
                                              <SidebarMenuSubButton asChild>
                                                <Link
                                                  to={child.href}
                                                  className={cn(
                                                    "flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 group",
                                                    location.pathname ===
                                                      child.href
                                                      ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700 dark:text-blue-300 shadow-md border border-blue-200/50 dark:border-blue-800/50"
                                                      : "hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300"
                                                  )}
                                                >
                                                  <div
                                                    className={cn(
                                                      "w-6 h-6 rounded-md flex items-center justify-center transition-colors duration-200",
                                                      location.pathname ===
                                                        child.href
                                                        ? "bg-blue-100 dark:bg-blue-900/50"
                                                        : "bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30"
                                                    )}
                                                  >
                                                    <child.icon
                                                      className={cn(
                                                        "w-3 h-3 transition-colors duration-200",
                                                        location.pathname ===
                                                          child.href
                                                          ? "text-blue-600 dark:text-blue-400"
                                                          : "text-slate-500 dark:text-slate-400"
                                                      )}
                                                    />
                                                  </div>
                                                  <span className="text-sm font-medium">
                                                    {child.label}
                                                  </span>
                                                  {location.pathname ===
                                                    child.href && (
                                                    <motion.div
                                                      layoutId="activeIndicator"
                                                      className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
                                                      initial={{ scale: 0 }}
                                                      animate={{ scale: 1 }}
                                                      transition={{
                                                        duration: 0.2,
                                                      }}
                                                    />
                                                  )}
                                                </Link>
                                              </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                          </motion.div>
                                        )
                                      )}
                                    </SidebarMenuSub>
                                  </motion.div>
                                </CollapsibleContent>
                              )}
                            </AnimatePresence>
                          </Collapsible>
                        ) : (
                          <SidebarMenuButton asChild>
                            <Link
                              to={item.href}
                              className={cn(
                                "flex items-center space-x-3 w-full py-6 rounded-md transition-all duration-200 group",
                                location.pathname === item.href
                                  ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700 dark:text-blue-300 shadow-lg border border-blue-200/50 dark:border-blue-800/50"
                                  : "hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                                  location.pathname === item.href
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg"
                                    : "bg-blue-100/50 dark:bg-blue-900/30 group-hover:bg-blue-200/70 dark:group-hover:bg-blue-800/50"
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    "w-4 h-4 transition-colors duration-200",
                                    location.pathname === item.href
                                      ? "text-white"
                                      : "text-blue-600 dark:text-blue-400"
                                  )}
                                />
                              </div>
                              <span className="font-medium">{item.label}</span>
                              {location.pathname === item.href && (
                                <motion.div
                                  layoutId="mainActiveIndicator"
                                  className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                />
                              )}
                            </Link>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    </motion.div>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </motion.div>
          </SidebarGroup>

          {/* User Info Footer */}
          {user && (
            <motion.div
              className="mt-auto p-4 border-t border-white/20 dark:border-slate-700/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link
                to="/profile"
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group",
                  location.pathname === "/profile"
                    ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-200/50 dark:border-blue-800/50"
                    : "hover:bg-white/50 dark:hover:bg-slate-700/50"
                )}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
                {location.pathname === "/profile" && (
                  <motion.div
                    layoutId="profileActiveIndicator"
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            </motion.div>
          )}
        </SidebarContent>
      </Sidebar>
    </div>
  );
};

export default SidebarNavigation;
