import {
  Book,
  BookOpen,
  Users,
  ShoppingCart,
  Heart,
  User,
  Settings,
  Bell,
  Plus,
  BarChart3,
  GraduationCap,
  Crown,
  Shield,
  MessageSquare,
  HelpCircle,
  Monitor,
  Award,
  Briefcase,
  Calendar,
  FileText,
  UserPlus,
  Database,
  TrendingUp,
  Home,
  RefreshCw,
  CreditCard,
  Bookmark,
  Mail,
} from "lucide-react";

export const navigationConfig = {
  public: [
    { label: "Home", href: "/", icon: Home },
    { label: "Browse Courses", href: "/courses", icon: BookOpen },
    { label: "Categories", href: "/categories", icon: Briefcase },
    { label: "About", href: "/about", icon: Users },
    { label: "Contact", href: "/contact", icon: MessageSquare },
  ],

  student: [
    {
      label: "Dashboard",
      href: "/student/dashboard",
      icon: Monitor,
    },
    {
      label: "My Learning",
      icon: GraduationCap,
      children: [
        { label: "My Courses", href: "/student/enrollments", icon: BookOpen },
        {
          label: "My Progress",
          href: "/student/course-progress",
          icon: TrendingUp,
        },
        { label: "Study Plans", href: "/student/study-plans", icon: Calendar },
        { label: "Achievements", href: "/student/achievements", icon: Crown },
        { label: "Certificates", href: "/student/certificates", icon: Award },
        { label: "My Bookmarks", href: "/student/bookmarks", icon: Bookmark },
        { label: "My Notes", href: "/student/notes", icon: FileText },
      ],
    },
    {
      label: "Shopping",
      icon: ShoppingCart,
      children: [
        { label: "Browse Courses", href: "/courses", icon: BookOpen },
        { label: "Categories", href: "/categories", icon: Briefcase },
        { label: "My Cart", href: "/student/cart", icon: ShoppingCart },
        { label: "My Wishlist", href: "/student/wishlist", icon: Heart },
      ],
    },
    {
      label: "Assessments",
      icon: Award,
      children: [
        { label: "Quiz Attempts", href: "/student/quiz-attempts", icon: Award },
        {
          label: "Assignment Submissions",
          href: "/student/assignment-submissions",
          icon: FileText,
        },
      ],
    },
    {
      label: "Community",
      icon: MessageSquare,
      children: [
        {
          label: "Discussions",
          href: "/student/discussions",
          icon: MessageSquare,
        },
        { label: "My Reviews", href: "/student/reviews", icon: Award },
        { label: "Messages", href: "/student/messages", icon: Mail },
        { label: "Following", href: "/student/following", icon: Users },
      ],
    },
  ],

  instructor: [
    {
      label: "Dashboard",
      href: "/instructor/dashboard",
      icon: Monitor,
    },
    {
      label: "My Courses",
      icon: BookOpen,
      children: [
        { label: "All My Courses", href: "/instructor/courses", icon: Book },
        {
          label: "Create Course",
          href: "/instructor/courses/create",
          icon: Plus,
        },
        {
          label: "Course Sections",
          href: "/instructor/sections",
          icon: Database,
        },
        { label: "Lessons", href: "/instructor/lessons", icon: BookOpen },
        { label: "Quizzes", href: "/instructor/quizzes", icon: Award },
        {
          label: "Assignments",
          href: "/instructor/assignments",
          icon: FileText,
        },
        {
          label: "Attachments",
          href: "/instructor/attachments",
          icon: Database,
        },
        { label: "Course FAQs", href: "/instructor/faqs", icon: HelpCircle },
      ],
    },
    {
      label: "Students",
      icon: Users,
      children: [
        {
          label: "Course Enrollments",
          href: "/instructor/enrollments",
          icon: UserPlus,
        },
        {
          label: "Student Progress",
          href: "/instructor/course-progress",
          icon: TrendingUp,
        },
        {
          label: "Student Quiz Attempts",
          href: "/instructor/quiz-attempts",
          icon: Award,
        },
        {
          label: "Student Submissions",
          href: "/instructor/assignment-submissions",
          icon: FileText,
        },
      ],
    },
    {
      label: "Analytics",
      icon: BarChart3,
      children: [
        {
          label: "Course Analytics",
          href: "/instructor/course-analytics",
          icon: BarChart3,
        },
        { label: "Course Reviews", href: "/instructor/reviews", icon: Award },
      ],
    },
    {
      label: "Earnings",
      icon: TrendingUp,
      children: [
        {
          label: "My Earnings",
          href: "/instructor/earnings",
          icon: TrendingUp,
        },
        { label: "My Coupons", href: "/instructor/coupons", icon: Award },
      ],
    },
    {
      label: "Communication",
      icon: MessageSquare,
      children: [
        {
          label: "Course Discussions",
          href: "/instructor/discussions",
          icon: MessageSquare,
        },
        { label: "Messages", href: "/instructor/messages", icon: Mail },
      ],
    },
  ],

  admin: [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: Shield,
    },
    {
      label: "User Management",
      icon: Users,
      children: [
        { label: "All Users", href: "/admin/users", icon: Users },
        { label: "Students", href: "/admin/students", icon: GraduationCap },
        { label: "Instructors", href: "/admin/instructors", icon: Award },
        { label: "Admins", href: "/admin/admins", icon: Shield },
        { label: "User Sessions", href: "/admin/sessions", icon: Monitor },
        {
          label: "User Activities",
          href: "/admin/activities",
          icon: BarChart3,
        },
      ],
    },
    {
      label: "Course Management",
      icon: BookOpen,
      children: [
        { label: "All Courses", href: "/admin/courses", icon: BookOpen },
        { label: "Categories", href: "/admin/categories", icon: Briefcase },
        { label: "Course Reviews", href: "/admin/reviews", icon: Award },
      ],
    },
    {
      label: "Platform Analytics",
      icon: BarChart3,
      children: [
        {
          label: "Platform Analytics",
          href: "/admin/analytics",
          icon: BarChart3,
        },
        {
          label: "Monthly Analytics",
          href: "/admin/monthly-analytics",
          icon: BarChart3,
        },
        {
          label: "Course Analytics",
          href: "/admin/course-analytics",
          icon: BarChart3,
        },
      ],
    },
    {
      label: "Financial Overview",
      icon: TrendingUp,
      children: [
        { label: "All Payments", href: "/admin/payments", icon: CreditCard },
        {
          label: "Instructor Earnings",
          href: "/admin/earnings",
          icon: TrendingUp,
        },
        { label: "Platform Coupons", href: "/admin/coupons", icon: Award },
      ],
    },
    {
      label: "Community Management",
      icon: MessageSquare,
      children: [
        {
          label: "All Discussions",
          href: "/admin/discussions",
          icon: MessageSquare,
        },
        { label: "Platform Messages", href: "/admin/messages", icon: Mail },
      ],
    },
    {
      label: "System",
      icon: Settings,
      children: [
        {
          label: "Platform Notifications",
          href: "/admin/notifications",
          icon: Bell,
        },
        { label: "System Logs", href: "/admin/logs", icon: FileText },
      ],
    },
  ],
};
