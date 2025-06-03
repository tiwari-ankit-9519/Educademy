/* eslint-disable no-unused-vars */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  ArrowRight,
  Heart,
  Rocket,
  BookOpen,
  Users,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CTASection = () => {
  const benefits = [
    { icon: BookOpen, text: "Access to all courses" },
    { icon: Users, text: "Join learning community" },
    { icon: Award, text: "Get certified" },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <motion.div
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Rocket className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Career?
              </span>
            </h2>
            <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
              Join over 1 million students who have already started their
              journey to success. Start learning today and unlock your
              potential.
            </p>
          </div>

          {/* Benefits Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/50 dark:bg-black/20 border-border/50 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6 text-center">
                    <benefit.icon className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                    <p className="font-medium text-foreground">
                      {benefit.text}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="flex items-center justify-center space-x-2 text-foreground/70">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>No long-term commitments</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-foreground/70">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Learn at your own pace</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-foreground/70">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Lifetime course access</span>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/auth/register">
              <Button
                size="lg"
                className="bg-gradient-to-r dark:text-white from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-4 text-lg"
              >
                Start Learning Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
              <Heart className="mr-2 w-5 h-5" />
              View Success Stories
            </Button>
          </div>

          {/* Social Proof */}
          <div className="text-sm text-foreground/60">
            <p className="mb-4">
              Trusted by students from top companies including:
            </p>
            <div className="flex items-center justify-center space-x-8 text-foreground/40">
              <span className="font-semibold">Google</span>
              <span className="font-semibold">Microsoft</span>
              <span className="font-semibold">Apple</span>
              <span className="font-semibold">Netflix</span>
              <span className="font-semibold">Amazon</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
