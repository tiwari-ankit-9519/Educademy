import React from "react";
import { Button } from "@/components/ui/button";

const SocialLogin = ({ role = "STUDENT", disabled = false }) => {
  const handleSocialLogin = (provider) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const authUrl = `${baseUrl}/auth/${provider}?role=${role}`;
    window.location.href = authUrl;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
        </div>
        <div className="relative flex justify-center text-xs sm:text-sm">
          <span className="px-3 sm:px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            Or sign in with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin("google")}
          disabled={disabled}
          className="h-10 sm:h-12 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-3 h-3 sm:w-4 sm:h-4">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
              Google
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default SocialLogin;
