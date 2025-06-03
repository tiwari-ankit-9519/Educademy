/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import {
  MonitorPlay,
  Award,
  Clock,
  Users,
  Brain,
  Shield,
  CheckCircle,
  TrendingUp,
  Headphones,
  BookOpen,
  Globe,
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: MonitorPlay,
      title: "Interactive Video Lessons",
      description:
        "High-quality video content with interactive elements and quizzes to enhance learning",
    },
    {
      icon: Award,
      title: "Industry Certifications",
      description:
        "Earn recognized certificates that boost your career prospects and validate your skills",
    },
    {
      icon: Clock,
      title: "Flexible Learning Schedule",
      description:
        "Learn at your own pace with lifetime access to all course materials and updates",
    },
    {
      icon: Users,
      title: "Peer Learning Community",
      description:
        "Connect with fellow learners, share projects, and get feedback from the community",
    },
    {
      icon: Brain,
      title: "AI-Powered Learning Path",
      description:
        "Personalized curriculum recommendations based on your goals and learning style",
    },
    {
      icon: Shield,
      title: "100% Money Back Guarantee",
      description:
        "Risk-free learning with our 30-day money-back guarantee if you're not satisfied",
    },
  ];

  const stats = [
    { number: "50K+", label: "Course Completions", icon: CheckCircle },
    { number: "98%", label: "Success Rate", icon: TrendingUp },
    { number: "24/7", label: "Learning Support", icon: Headphones },
    { number: "1M+", label: "Active Students", icon: BookOpen },
    { number: "150+", label: "Countries Reached", icon: Globe },
    { number: "250+", label: "Expert Instructors", icon: Users },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Educademy?
            </span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            We provide the best learning experience with cutting-edge technology
            and expert guidance
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-8 lg:p-12"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">
              Trusted by Learners{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Worldwide
              </span>
            </h3>
            <p className="text-foreground/70 max-w-xl mx-auto">
              Join millions of students who have transformed their careers with
              our platform
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
                  {stat.number}
                </div>
                <div className="text-xs lg:text-sm text-foreground/60 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
