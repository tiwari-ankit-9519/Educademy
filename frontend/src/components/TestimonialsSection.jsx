/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Senior UX Designer at Google",
      content:
        "The UI/UX course completely transformed my career. I went from a junior designer to a senior role at Google within 8 months. The practical projects and mentor feedback were invaluable.",
      avatar: "SJ",
      rating: 5,
      company: "Google",
      beforeRole: "Junior Designer",
      achievement: "300% salary increase",
      courseTaken: "UI/UX Design Masterclass",
    },
    {
      name: "Michael Chen",
      role: "Full Stack Developer at Microsoft",
      content:
        "Best investment I've made in my career. The web development course is incredibly comprehensive and up-to-date with industry standards. I landed my dream job right after completion.",
      avatar: "MC",
      rating: 5,
      company: "Microsoft",
      beforeRole: "Freelancer",
      achievement: "Landed dream job",
      courseTaken: "Complete Web Development",
    },
    {
      name: "Emily Davis",
      role: "Marketing Director at Shopify",
      content:
        "The digital marketing strategies I learned boosted our company's growth by 400%. The course content is practical, actionable, and delivers real results.",
      avatar: "ED",
      rating: 5,
      company: "Shopify",
      beforeRole: "Marketing Specialist",
      achievement: "400% growth increase",
      courseTaken: "Digital Marketing Pro",
    },
    {
      name: "David Wilson",
      role: "Data Scientist at Netflix",
      content:
        "From zero coding experience to building ML models at Netflix. The data science course curriculum is world-class and the support is exceptional.",
      avatar: "DW",
      rating: 5,
      company: "Netflix",
      beforeRole: "Business Analyst",
      achievement: "Career pivot success",
      courseTaken: "Data Science & ML",
    },
    {
      name: "Lisa Thompson",
      role: "Creative Director at Adobe",
      content:
        "The graphic design course helped me transition from traditional design to digital. Now I'm leading creative teams at Adobe. Couldn't be happier!",
      avatar: "LT",
      rating: 5,
      company: "Adobe",
      beforeRole: "Print Designer",
      achievement: "Leadership role",
      courseTaken: "Graphic Design Fundamentals",
    },
    {
      name: "Alex Rodriguez",
      role: "Business Analyst at Amazon",
      content:
        "The business analytics course gave me the skills to make data-driven decisions that directly impact our bottom line. My insights helped save the company over $2M this year.",
      avatar: "AR",
      rating: 5,
      company: "Amazon",
      beforeRole: "Junior Analyst",
      achievement: "$2M cost savings",
      courseTaken: "Business Analytics Pro",
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
            Success{" "}
            <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Stories
            </span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            See how our students transformed their careers and achieved their
            goals
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <Carousel className="w-full">
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="p-1"
                  >
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-full hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-8">
                        {/* Rating */}
                        <div className="flex items-center mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-5 h-5 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>

                        {/* Testimonial Content */}
                        <blockquote className="text-foreground/90 mb-6 italic leading-relaxed">
                          "{testimonial.content}"
                        </blockquote>

                        {/* Course Badge */}
                        <div className="mb-4">
                          <Badge variant="outline" className="text-xs">
                            📚 {testimonial.courseTaken}
                          </Badge>
                        </div>

                        {/* Achievement Stats */}
                        <div className="flex items-center space-x-4 text-sm text-foreground/60 mb-6 bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            From: {testimonial.beforeRole}
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            {testimonial.achievement}
                          </div>
                        </div>

                        {/* Author Info */}
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {testimonial.avatar}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {testimonial.name}
                            </div>
                            <div className="text-sm text-foreground/70">
                              {testimonial.role}
                            </div>
                            <Badge className="mt-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 text-xs">
                              {testimonial.company}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Custom Navigation */}
            <div className="flex justify-center mt-8 space-x-4">
              <CarouselPrevious className="relative translate-y-0 translate-x-0" />
              <CarouselNext className="relative translate-y-0 translate-x-0" />
            </div>
          </Carousel>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-foreground/70 mb-6">
            Ready to write your own success story?
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
          >
            Start Your Journey Today
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
