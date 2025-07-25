import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Shield,
  AlertTriangle,
  Flag,
  Users,
  MessageSquare,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";
import {
  getCommunityStandards,
  clearError,
} from "@/features/adminSlice/adminModeration";

const CommunityStandards = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();

  const communityStandards = useSelector(
    (state) => state.adminModeration?.communityStandards
  );
  const error = useSelector((state) => state.adminModeration?.error);
  const loading = useSelector(
    (state) => state.adminModeration?.loading || false
  );
  const communityStandardsLoading = useSelector(
    (state) => state.adminModeration?.communityStandardsLoading || false
  );

  useEffect(() => {
    dispatch(clearError());
    dispatch(getCommunityStandards());
  }, [dispatch]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleRefresh = () => {
    dispatch(getCommunityStandards());
  };

  const sectionIcons = {
    respectfulCommunication: MessageSquare,
    qualityContent: BookOpen,
    intellectualProperty: Shield,
    privacy: Users,
  };

  const violationIcons = {
    minor: AlertTriangle,
    moderate: Flag,
    severe: XCircle,
    critical: Ban,
  };

  const actionIcons = {
    warning: AlertTriangle,
    contentRemoval: XCircle,
    accountSuspension: Clock,
    accountBan: Ban,
  };

  const violationColors = {
    minor: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    moderate:
      "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
    severe:
      "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
    critical: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
  };

  if (loading && !communityStandards) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Loading community standards...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl">
      <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                Community Standards
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
                Guidelines and policies for maintaining a safe and respectful
                community
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end">
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm rounded-xl mb-4 sm:mb-6">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-700 dark:text-red-400 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {communityStandardsLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : communityStandards ? (
          <div className="space-y-6 sm:space-y-8">
            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Community Guidelines
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Essential rules and expectations for all community members
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {communityStandards.guidelines &&
                    Object.entries(communityStandards.guidelines).map(
                      ([key, guideline]) => {
                        const IconComponent = sectionIcons[key] || Shield;
                        return (
                          <div
                            key={key}
                            className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                <IconComponent className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                                {guideline.title}
                              </h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                              {guideline.description}
                            </p>
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                Key Rules
                              </h4>
                              <ul className="space-y-1">
                                {guideline.rules?.map((rule, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-300"
                                  >
                                    <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                                    <span>{rule}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      }
                    )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Violation Types & Consequences
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Understanding different levels of violations and their
                  consequences
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {communityStandards.violationTypes &&
                    Object.entries(communityStandards.violationTypes).map(
                      ([key, violation]) => {
                        const IconComponent =
                          violationIcons[key] || AlertTriangle;
                        return (
                          <div
                            key={key}
                            className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <IconComponent className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                                  {violation.level}
                                </h3>
                                <Badge
                                  className={`${violationColors[key]} rounded-lg text-xs mt-1`}
                                >
                                  {key.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                              {violation.description}
                            </p>
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                Consequences
                              </h4>
                              <ul className="space-y-1">
                                {violation.consequences?.map(
                                  (consequence, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-300"
                                    >
                                      <XCircle className="w-3 h-3 mt-0.5 text-red-500 flex-shrink-0" />
                                      <span>{consequence}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          </div>
                        );
                      }
                    )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                    <Flag className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                    Reporting Process
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    How to report violations and what happens next
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {communityStandards.reportingProcess && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                          How to Report
                        </h3>
                        <ul className="space-y-1">
                          {communityStandards.reportingProcess.howToReport?.map(
                            (step, index) => (
                              <li
                                key={index}
                                className="flex items-start space-x-2 text-sm text-slate-600 dark:text-slate-300"
                              >
                                <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                          Review Process
                        </h3>
                        <ul className="space-y-1">
                          {communityStandards.reportingProcess.reviewProcess?.map(
                            (step, index) => (
                              <li
                                key={index}
                                className="flex items-start space-x-2 text-sm text-slate-600 dark:text-slate-300"
                              >
                                <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                                <span>{step}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                    Moderation Actions
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    Types of actions moderators can take
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {communityStandards.moderationActions && (
                    <div className="space-y-3">
                      {Object.entries(communityStandards.moderationActions).map(
                        ([key, action]) => {
                          const IconComponent = actionIcons[key] || Shield;
                          return (
                            <div
                              key={key}
                              className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                  <IconComponent className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
                                    {action.action}
                                  </h4>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                                    {action.description}
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">
                                      Duration: {action.duration}
                                    </span>
                                    <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs">
                                      {action.impact}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {communityStandards.reportingProcess?.appealProcess && (
              <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                    Appeal Process
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    How to appeal moderation decisions
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {communityStandards.reportingProcess.appealProcess.map(
                      (step, index) => (
                        <li
                          key={index}
                          className="flex items-start space-x-3 p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                        >
                          <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {step}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-4 border-t border-white/20 dark:border-slate-600/20">
              <p>
                Last updated:{" "}
                {communityStandards.lastUpdated
                  ? new Date(
                      communityStandards.lastUpdated
                    ).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </p>
              <p className="mt-1">
                Version {communityStandards.version || "1.0"} • These standards
                are subject to updates
              </p>
            </div>
          </div>
        ) : (
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                No Standards Available
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Community standards are currently unavailable. Please try
                refreshing the page.
              </p>
              <Button
                onClick={handleRefresh}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CommunityStandards;
