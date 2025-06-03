/* eslint-disable no-unused-vars */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Briefcase,
  Shield,
  Edit3,
  Save,
  X,
  Loader2,
  Plus,
  Target,
  Book,
  Award,
  Users,
  TrendingUp,
  Calendar,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const RoleSpecificSection = ({ user, onUpdate, onSuccess, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(() => {
    const profile =
      user.role === "STUDENT"
        ? user.profile || user.studentProfile
        : user.role === "INSTRUCTOR"
        ? user.profile || user.instructorProfile
        : user.profile || user.adminProfile;

    if (user.role === "STUDENT") {
      return {
        learningGoals: profile?.learningGoals || [],
        interests: profile?.interests || [],
        skillLevel: profile?.skillLevel || "BEGINNER",
      };
    } else if (user.role === "INSTRUCTOR") {
      return {
        title: profile?.title || "",
        expertise: profile?.expertise || [],
        yearsExperience: profile?.yearsExperience || 0,
        education: profile?.education || "",
        certifications: profile?.certifications || [],
        biography: profile?.biography || "",
      };
    } else {
      return {
        department: profile?.department || "",
      };
    }
  });

  const [newGoal, setNewGoal] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newExpertise, setNewExpertise] = useState("");
  const [newCertification, setNewCertification] = useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addArrayItem = (field, value, setterFunction) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
      setterFunction("");
    }
  };

  const removeArrayItem = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      await onUpdate({ profileData: formData });
      setIsEditing(false);
      onSuccess(`${user.role.toLowerCase()} profile updated successfully!`);
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleCancel = () => {
    const profile =
      user.role === "STUDENT"
        ? user.profile || user.studentProfile
        : user.role === "INSTRUCTOR"
        ? user.profile || user.instructorProfile
        : user.profile || user.adminProfile;

    if (user.role === "STUDENT") {
      setFormData({
        learningGoals: profile?.learningGoals || [],
        interests: profile?.interests || [],
        skillLevel: profile?.skillLevel || "BEGINNER",
      });
    } else if (user.role === "INSTRUCTOR") {
      setFormData({
        title: profile?.title || "",
        expertise: profile?.expertise || [],
        yearsExperience: profile?.yearsExperience || 0,
        education: profile?.education || "",
        certifications: profile?.certifications || [],
        biography: profile?.biography || "",
      });
    } else {
      setFormData({
        department: profile?.department || "",
      });
    }

    setNewGoal("");
    setNewInterest("");
    setNewExpertise("");
    setNewCertification("");
    setIsEditing(false);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const renderStudentProfile = () => {
    const profile = user.profile || user.studentProfile;

    return (
      <div className="space-y-6">
        {/* Learning Goals */}
        <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Learning Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add a learning goal..."
                    className="bg-white dark:bg-slate-800"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addArrayItem("learningGoals", newGoal, setNewGoal);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      addArrayItem("learningGoals", newGoal, setNewGoal)
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.learningGoals.map((goal, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{goal}</span>
                      <button
                        onClick={() => removeArrayItem("learningGoals", index)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profile?.learningGoals || []).length > 0 ? (
                  profile.learningGoals.map((goal, index) => (
                    <Badge key={index} variant="outline">
                      {goal}
                    </Badge>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic">
                    No learning goals set
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interests */}
        <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Book className="w-4 h-4 mr-2" />
              Interests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add an interest..."
                    className="bg-white dark:bg-slate-800"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addArrayItem("interests", newInterest, setNewInterest);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      addArrayItem("interests", newInterest, setNewInterest)
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{interest}</span>
                      <button
                        onClick={() => removeArrayItem("interests", index)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profile?.interests || []).length > 0 ? (
                  profile.interests.map((interest, index) => (
                    <Badge key={index} variant="outline">
                      {interest}
                    </Badge>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic">
                    No interests specified
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skill Level */}
        <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Skill Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Select
                value={formData.skillLevel}
                onValueChange={(value) =>
                  handleInputChange("skillLevel", value)
                }
              >
                <SelectTrigger className="bg-white dark:bg-slate-800">
                  <SelectValue placeholder="Select your skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    profile?.skillLevel === "EXPERT"
                      ? "default"
                      : profile?.skillLevel === "ADVANCED"
                      ? "secondary"
                      : profile?.skillLevel === "INTERMEDIATE"
                      ? "outline"
                      : "outline"
                  }
                >
                  {profile?.skillLevel || "BEGINNER"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learning Statistics */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor((profile?.totalLearningTime || 0) / 60)}h
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Learning Time
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {profile?.completedCourses || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Courses Completed
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {profile?.achievements || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Achievements
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderInstructorProfile = () => {
    const profile = user.profile || user.instructorProfile;

    return (
      <div className="space-y-6">
        {/* Professional Title */}
        <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Briefcase className="w-4 h-4 mr-2" />
              Professional Title
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Senior Software Engineer, Mathematics Professor"
                className="bg-white dark:bg-slate-800"
              />
            ) : (
              <p className="text-slate-900 dark:text-white font-medium">
                {profile?.title || "No title specified"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Expertise Areas */}
        <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Award className="w-4 h-4 mr-2" />
              Areas of Expertise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    placeholder="Add an area of expertise..."
                    className="bg-white dark:bg-slate-800"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addArrayItem(
                          "expertise",
                          newExpertise,
                          setNewExpertise
                        );
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      addArrayItem("expertise", newExpertise, setNewExpertise)
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.expertise.map((area, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{area}</span>
                      <button
                        onClick={() => removeArrayItem("expertise", index)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profile?.expertise || []).length > 0 ? (
                  profile.expertise.map((area, index) => (
                    <Badge key={index} variant="outline">
                      {area}
                    </Badge>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic">
                    No expertise areas specified
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience & Education */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Years of Experience */}
          <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Years of Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsExperience}
                  onChange={(e) =>
                    handleInputChange(
                      "yearsExperience",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="bg-white dark:bg-slate-800"
                />
              ) : (
                <p className="text-slate-900 dark:text-white font-medium">
                  {profile?.yearsExperience || 0} years
                </p>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <GraduationCap className="w-4 h-4 mr-2" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Input
                  value={formData.education}
                  onChange={(e) =>
                    handleInputChange("education", e.target.value)
                  }
                  placeholder="e.g., PhD Computer Science, MIT"
                  className="bg-white dark:bg-slate-800"
                />
              ) : (
                <p className="text-slate-900 dark:text-white font-medium">
                  {profile?.education || "Not specified"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Certifications */}
        <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Award className="w-4 h-4 mr-2" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="Add a certification..."
                    className="bg-white dark:bg-slate-800"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addArrayItem(
                          "certifications",
                          newCertification,
                          setNewCertification
                        );
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      addArrayItem(
                        "certifications",
                        newCertification,
                        setNewCertification
                      )
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.certifications.map((cert, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{cert}</span>
                      <button
                        onClick={() => removeArrayItem("certifications", index)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profile?.certifications || []).length > 0 ? (
                  profile.certifications.map((cert, index) => (
                    <Badge key={index} variant="outline">
                      {cert}
                    </Badge>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic">
                    No certifications listed
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Biography */}
        <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
          <CardHeader>
            <CardTitle className="text-base">Professional Biography</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={formData.biography}
                onChange={(e) => handleInputChange("biography", e.target.value)}
                placeholder="Tell students about your background, experience, and teaching philosophy..."
                className="bg-white dark:bg-slate-800 min-h-[120px]"
                maxLength={1000}
              />
            ) : (
              <p className="text-slate-900 dark:text-white whitespace-pre-wrap">
                {profile?.biography || "No biography provided"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Teaching Statistics */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Teaching Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {profile?.totalStudents || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Total Students
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {profile?.totalCourses || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Courses Created
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {profile?.rating ? profile.rating.toFixed(1) : "N/A"}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Average Rating
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${(profile?.totalRevenue || 0).toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Total Revenue
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAdminProfile = () => {
    const profile = user.profile || user.adminProfile;

    return (
      <div className="space-y-6">
        {/* Department */}
        <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Building className="w-4 h-4 mr-2" />
              Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Input
                value={formData.department}
                onChange={(e) =>
                  handleInputChange("department", e.target.value)
                }
                placeholder="e.g., IT Administration, Academic Affairs"
                className="bg-white dark:bg-slate-800"
              />
            ) : (
              <p className="text-slate-900 dark:text-white font-medium">
                {profile?.department || "No department specified"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Admin Statistics */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Administrative Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {profile?.resolvedLogs?.length || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Resolved Issues
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {profile?.permissions?.length || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Active Permissions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case "STUDENT":
        return <GraduationCap className="w-5 h-5 text-blue-600" />;
      case "INSTRUCTOR":
        return <Briefcase className="w-5 h-5 text-blue-600" />;
      case "ADMIN":
        return <Shield className="w-5 h-5 text-blue-600" />;
      default:
        return <GraduationCap className="w-5 h-5 text-blue-600" />;
    }
  };

  const getRoleTitle = () => {
    switch (user.role) {
      case "STUDENT":
        return "Learning Profile";
      case "INSTRUCTOR":
        return "Teaching Profile";
      case "ADMIN":
        return "Administrative Profile";
      default:
        return "Profile";
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={itemVariants}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getRoleIcon()}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {getRoleTitle()}
          </h3>
        </div>
        <Button
          variant={isEditing ? "outline" : "default"}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          disabled={isLoading}
          className={
            isEditing
              ? "text-slate-600"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          }
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4 text-white" />
              <span className="text-white">Edit</span>
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* Role-specific content */}
      {user.role === "STUDENT" && renderStudentProfile()}
      {user.role === "INSTRUCTOR" && renderInstructorProfile()}
      {user.role === "ADMIN" && renderAdminProfile()}

      {/* Save Button */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex justify-end space-x-4"
          >
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RoleSpecificSection;
