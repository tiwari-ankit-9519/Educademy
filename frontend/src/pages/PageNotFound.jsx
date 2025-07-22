import React, { useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import {
  Home,
  ArrowLeft,
  Search,
  AlertTriangle,
  Compass,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTheme } from "@/components/ThemeProvider";

const PageNotFound = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const buttonsRef = useRef(null);
  const backgroundRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    initializeAnimations();
  }, []);

  const initializeAnimations = () => {
    const tl = gsap.timeline();

    gsap.set(
      [
        cardRef.current,
        titleRef.current,
        contentRef.current,
        buttonsRef.current,
      ],
      {
        opacity: 0,
        y: 60,
        scale: 0.95,
      }
    );

    gsap.set(".floating-shape", {
      opacity: 0,
      scale: 0,
      rotation: -180,
    });

    gsap.set(".particle", {
      opacity: 0,
      scale: 0,
    });

    gsap.set([backgroundRef.current, particlesRef.current], {
      opacity: 0,
    });

    tl.to(backgroundRef.current, {
      duration: 1,
      opacity: 1,
      ease: "power2.out",
    })
      .to(
        particlesRef.current,
        {
          duration: 0.8,
          opacity: 1,
          ease: "power2.out",
        },
        "-=0.5"
      )
      .to(
        ".floating-shape",
        {
          duration: 1.2,
          opacity: 0.4,
          scale: 1,
          rotation: 0,
          stagger: 0.15,
          ease: "back.out(1.7)",
        },
        "-=0.5"
      )
      .to(
        cardRef.current,
        {
          duration: 1,
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "power3.out",
        },
        "-=0.8"
      )
      .to(
        titleRef.current,
        {
          duration: 0.8,
          opacity: 1,
          y: 0,
          ease: "power2.out",
        },
        "-=0.6"
      )
      .to(
        contentRef.current,
        {
          duration: 0.8,
          opacity: 1,
          y: 0,
          ease: "power2.out",
        },
        "-=0.4"
      )
      .to(
        buttonsRef.current,
        {
          duration: 0.8,
          opacity: 1,
          y: 0,
          ease: "power2.out",
        },
        "-=0.2"
      )
      .to(
        ".particle",
        {
          duration: 0.6,
          opacity: 1,
          scale: 1,
          stagger: 0.05,
          ease: "power2.out",
        },
        "-=0.4"
      );

    const floatingShapes = document.querySelectorAll(".floating-shape");
    floatingShapes.forEach((shape, index) => {
      gsap.to(shape, {
        duration: 6 + index * 0.8,
        y: `${Math.random() * 30 - 15}px`,
        x: `${Math.random() * 30 - 15}px`,
        rotation: `${Math.random() * 360}deg`,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.3,
      });
    });

    const particles = document.querySelectorAll(".particle");
    particles.forEach((particle, index) => {
      gsap.to(particle, {
        duration: 4 + Math.random() * 3,
        y: `${Math.random() * 40 - 20}px`,
        x: `${Math.random() * 40 - 20}px`,
        opacity: Math.random() * 0.3 + 0.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.2,
      });
    });

    gsap.fromTo(
      ".error-number",
      {
        scale: 0.8,
        opacity: 0.7,
      },
      {
        scale: 1.1,
        opacity: 1,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1,
      }
    );
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        ref={backgroundRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div className="floating-shape absolute top-16 left-16 w-24 h-24 bg-destructive/20 rounded-full opacity-30"></div>
        <div className="floating-shape absolute top-32 right-24 w-32 h-32 bg-destructive/30 rounded-2xl opacity-30"></div>
        <div className="floating-shape absolute bottom-24 left-24 w-28 h-28 bg-accent/30 rounded-full opacity-30"></div>
        <div className="floating-shape absolute bottom-16 right-16 w-20 h-20 bg-primary/30 rounded-2xl opacity-30"></div>
        <div className="floating-shape absolute top-1/2 left-1/3 w-16 h-16 bg-primary/20 rounded-full opacity-20"></div>
        <div className="floating-shape absolute top-1/3 right-1/3 w-12 h-12 bg-accent/20 rounded-2xl opacity-20"></div>
      </div>

      <div
        ref={particlesRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle absolute w-1 h-1 bg-muted-foreground/40 rounded-full opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div
        ref={containerRef}
        className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8"
      >
        <div className="w-full max-w-lg sm:max-w-xl">
          <Card ref={cardRef} className="bg-card shadow-xl border">
            <CardHeader ref={titleRef} className="text-center pb-6 sm:pb-8">
              <div className="mx-auto mb-4 sm:mb-6 relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-destructive rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-destructive-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-accent rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-accent-foreground" />
                </div>
              </div>
              <div className="error-number text-6xl sm:text-8xl font-bold text-primary mb-2">
                404
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Page Not Found
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm sm:text-base">
                Oops! The page you're looking for seems to have wandered off
                into the digital void.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-4 sm:px-6">
              <div ref={contentRef} className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                  <Compass className="w-5 h-5" />
                  <span className="text-sm sm:text-base">
                    Don't worry, even the best explorers get lost sometimes
                  </span>
                </div>

                <div className="bg-muted rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-foreground mb-2">
                    Here's what you can do:
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Check if the URL is typed correctly</li>
                    <li>• Go back to the previous page</li>
                    <li>• Return to our homepage</li>
                    <li>• Use the search feature to find what you need</li>
                  </ul>
                </div>
              </div>

              <div ref={buttonsRef} className="space-y-3 sm:space-y-4">
                <Button
                  onClick={handleGoHome}
                  className="w-full h-10 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Go to Homepage
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleGoBack}
                    variant="outline"
                    className="h-10 sm:h-12 border-2 hover:bg-muted text-sm sm:text-base"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Go Back
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-10 sm:h-12 border-2 hover:bg-muted text-sm sm:text-base"
                  >
                    <Link to="/search">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Search
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-border">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Need help?{" "}
                  <Link
                    to="/support"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Contact Support
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
