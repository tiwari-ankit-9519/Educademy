/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import {
  Code,
  Palette,
  Megaphone,
  GraduationCap,
  Camera,
  Briefcase,
  ArrowRight,
  Clock,
  Layers,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CoursesSection = () => {
  const courses = [
    {
      icon: Palette,
      title: "UI/UX Design",
      description:
        "Master user interface and experience design with industry-standard tools and create stunning user experiences",
      color: "from-pink-500 to-rose-500",
      bgColor:
        "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/10 dark:to-rose-950/10",
      borderColor: "border-pink-200 dark:border-pink-800/50",
      duration: "12 weeks",
      projects: "8 projects",
      level: "Beginner to Pro",
      price: "$199",
      rating: 4.8,
      students: "12.5K",
      image: "🎨",
    },
    {
      icon: Code,
      title: "Web Development",
      description:
        "Build modern web applications with React, Node.js, and latest technologies used by top companies",
      color: "from-orange-500 to-amber-500",
      bgColor:
        "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/10 dark:to-amber-950/10",
      borderColor: "border-orange-200 dark:border-orange-800/50",
      duration: "16 weeks",
      projects: "12 projects",
      level: "Beginner to Expert",
      price: "$299",
      rating: 4.9,
      students: "18.2K",
      image: "💻",
    },
    {
      icon: Megaphone,
      title: "Digital Marketing",
      description:
        "Grow your business with SEO, social media, and conversion strategies that drive real results",
      color: "from-cyan-500 to-blue-500",
      bgColor:
        "bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/10 dark:to-blue-950/10",
      borderColor: "border-cyan-200 dark:border-cyan-800/50",
      duration: "10 weeks",
      projects: "6 campaigns",
      level: "Beginner to Advanced",
      price: "$249",
      rating: 4.7,
      students: "9.8K",
      image: "📢",
    },
    {
      icon: GraduationCap,
      title: "Data Science",
      description:
        "Analyze data and build ML models with Python and advanced algorithms to make data-driven decisions",
      color: "from-purple-500 to-indigo-500",
      bgColor:
        "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/10 dark:to-indigo-950/10",
      borderColor: "border-purple-200 dark:border-purple-800/50",
      duration: "20 weeks",
      projects: "10 projects",
      level: "Intermediate to Expert",
      price: "$399",
      rating: 4.9,
      students: "7.3K",
      image: "📊",
    },
    {
      icon: Camera,
      title: "Graphic Design",
      description:
        "Create stunning visuals and brand identities using professional techniques and industry tools",
      color: "from-green-500 to-emerald-500",
      bgColor:
        "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/10 dark:to-emerald-950/10",
      borderColor: "border-green-200 dark:border-green-800/50",
      duration: "8 weeks",
      projects: "15 designs",
      level: "Beginner to Pro",
      price: "$189",
      rating: 4.6,
      students: "11.1K",
      image: "🎭",
    },
    {
      icon: Briefcase,
      title: "Business Analytics",
      description:
        "Make data-driven decisions and optimize business performance with advanced analytics tools",
      color: "from-violet-500 to-purple-500",
      bgColor:
        "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/10 dark:to-purple-950/10",
      borderColor: "border-violet-200 dark:border-violet-800/50",
      duration: "14 weeks",
      projects: "8 case studies",
      level: "Intermediate",
      price: "$329",
      rating: 4.8,
      students: "6.7K",
      image: "📈",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Browse Top Essential{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Career Courses
            </span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Choose from our comprehensive selection of courses designed to
            advance your career with hands-on projects and industry recognition
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group cursor-pointer"
            >
              <Card
                className={`${course.bgColor} ${course.borderColor} border overflow-hidden h-full shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-opacity-100`}
              >
                <CardContent className="p-0">
                  {/* Course Header */}
                  <div className="relative p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                      >
                        <span className="text-2xl">{course.image}</span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-yellow-500 mb-1">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium text-foreground">
                            {course.rating}
                          </span>
                        </div>
                        <div className="text-xs text-foreground/60 flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {course.students}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h3>
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        {course.level}
                      </Badge>
                    </div>

                    <p className="text-foreground/70 text-sm leading-relaxed mb-4">
                      {course.description}
                    </p>
                  </div>

                  {/* Course Stats */}
                  <div className="px-6 pb-4">
                    <div className="flex items-center justify-between text-xs text-foreground/60 mb-4 bg-white/50 dark:bg-black/20 rounded-lg p-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>{course.projects}</span>
                      </div>
                    </div>
                  </div>

                  {/* Course Footer */}
                  <div className="px-6 pb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-foreground">
                          {course.price}
                        </span>
                        <span className="text-sm text-foreground/60">
                          one-time
                        </span>
                      </div>
                      <motion.div
                        className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors"
                        whileHover={{ x: 5 }}
                      >
                        <span>Enroll Now</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r dark:text-white from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Browse All Courses
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CoursesSection;
