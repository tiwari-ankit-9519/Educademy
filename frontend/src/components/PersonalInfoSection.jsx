/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  MapPin,
  Edit3,
  Save,
  X,
  Loader2,
  LinkIcon,
  Github,
  Twitter,
  Linkedin,
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
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

const PersonalInfoSection = ({ user, onUpdate, onSuccess, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    bio: user.bio || "",
    phoneNumber: user.phoneNumber || "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
    country: user.country || "",
    timezone: user.timezone || "",
    language: user.language || "",
    website: user.website || "",
    linkedinProfile: user.linkedinProfile || "",
    twitterProfile: user.twitterProfile || "",
    githubProfile: user.githubProfile || "",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91"); // Default to India
  const [phoneWithoutCode, setPhoneWithoutCode] = useState("");

  // Split existing phone number into country code and number
  useEffect(() => {
    if (formData.phoneNumber) {
      const phoneStr = formData.phoneNumber;
      const matchedCode = countryCodes.find((cc) =>
        phoneStr.startsWith(cc.code)
      );
      if (matchedCode) {
        setSelectedCountryCode(matchedCode.code);
        setPhoneWithoutCode(phoneStr.substring(matchedCode.code.length).trim());
      } else {
        setPhoneWithoutCode(phoneStr);
      }
    }
  }, [user.phoneNumber]);

  const languages = [
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Russian",
    "Chinese",
    "Japanese",
    "Korean",
    "Arabic",
    "Hindi",
    "Dutch",
    "Swedish",
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    if (formData.phoneNumber) {
      // Remove all non-digits to count actual digits
      const digitsOnly = formData.phoneNumber.replace(/\D/g, "");

      // Check if it has at least 10 digits and contains only valid characters
      if (
        digitsOnly.length < 10 ||
        !/^\+?[\d\s\-().]+$/.test(formData.phoneNumber)
      ) {
        errors.phoneNumber = "Invalid phone number format";
      }
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      errors.website =
        "Website must be a valid URL starting with http:// or https://";
    }

    if (
      formData.linkedinProfile &&
      !/^https?:\/\/(www\.)?linkedin\.com\/.+/.test(formData.linkedinProfile)
    ) {
      errors.linkedinProfile = "LinkedIn profile must be a valid LinkedIn URL";
    }

    if (
      formData.twitterProfile &&
      !/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/.test(
        formData.twitterProfile
      )
    ) {
      errors.twitterProfile = "Twitter profile must be a valid Twitter/X URL";
    }

    if (
      formData.githubProfile &&
      !/^https?:\/\/(www\.)?github\.com\/.+/.test(formData.githubProfile)
    ) {
      errors.githubProfile = "GitHub profile must be a valid GitHub URL";
    }

    if (formData.dateOfBirth) {
      const birthDate = formData.dateOfBirth;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      if (age < 13 || age > 120) {
        errors.dateOfBirth =
          "Invalid date of birth. Age must be between 13 and 120 years";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    // Check if onUpdate function is provided
    if (!onUpdate || typeof onUpdate !== "function") {
      console.error("onUpdate prop is required and must be a function");
      return;
    }

    try {
      // Prepare the data for the API - convert Date to ISO string if needed
      const updateData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth
          ? formData.dateOfBirth.toISOString()
          : null,
      };

      await onUpdate(updateData);
      setIsEditing(false);
      if (onSuccess && typeof onSuccess === "function") {
        onSuccess("Personal information updated successfully!");
      }
    } catch (error) {
      console.error("Update failed:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      bio: user.bio || "",
      phoneNumber: user.phoneNumber || "",
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
      country: user.country || "",
      timezone: user.timezone || "",
      language: user.language || "",
      website: user.website || "",
      linkedinProfile: user.linkedinProfile || "",
      twitterProfile: user.twitterProfile || "",
      githubProfile: user.githubProfile || "",
    });
    setValidationErrors({});
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

  const countries = [
    "United States",
    "Canada",
    "United Kingdom",
    "Germany",
    "France",
    "Italy",
    "Spain",
    "India",
    "China",
    "Japan",
    "Australia",
    "Brazil",
    "Mexico",
    "Netherlands",
    "Sweden",
    "Norway",
    "Denmark",
    "Finland",
    "Switzerland",
    "Austria",
  ];

  const timezones = [
    "UTC-12:00",
    "UTC-11:00",
    "UTC-10:00",
    "UTC-09:00",
    "UTC-08:00",
    "UTC-07:00",
    "UTC-06:00",
    "UTC-05:00",
    "UTC-04:00",
    "UTC-03:00",
    "UTC-02:00",
    "UTC-01:00",
    "UTC+00:00",
    "UTC+01:00",
    "UTC+02:00",
    "UTC+03:00",
    "UTC+04:00",
    "UTC+05:00",
    "UTC+05:30",
    "UTC+06:00",
    "UTC+07:00",
    "UTC+08:00",
    "UTC+09:00",
    "UTC+10:00",
    "UTC+11:00",
    "UTC+12:00",
  ];

  const countryCodes = [
    { code: "+1", country: "US", flag: "🇺🇸", name: "United States" },
    { code: "+1", country: "CA", flag: "🇨🇦", name: "Canada" },
    { code: "+44", country: "GB", flag: "🇬🇧", name: "United Kingdom" },
    { code: "+49", country: "DE", flag: "🇩🇪", name: "Germany" },
    { code: "+33", country: "FR", flag: "🇫🇷", name: "France" },
    { code: "+39", country: "IT", flag: "🇮🇹", name: "Italy" },
    { code: "+34", country: "ES", flag: "🇪🇸", name: "Spain" },
    { code: "+91", country: "IN", flag: "🇮🇳", name: "India" },
    { code: "+86", country: "CN", flag: "🇨🇳", name: "China" },
    { code: "+81", country: "JP", flag: "🇯🇵", name: "Japan" },
    { code: "+61", country: "AU", flag: "🇦🇺", name: "Australia" },
    { code: "+55", country: "BR", flag: "🇧🇷", name: "Brazil" },
    { code: "+52", country: "MX", flag: "🇲🇽", name: "Mexico" },
    { code: "+31", country: "NL", flag: "🇳🇱", name: "Netherlands" },
    { code: "+46", country: "SE", flag: "🇸🇪", name: "Sweden" },
    { code: "+47", country: "NO", flag: "🇳🇴", name: "Norway" },
    { code: "+45", country: "DK", flag: "🇩🇰", name: "Denmark" },
    { code: "+358", country: "FI", flag: "🇫🇮", name: "Finland" },
    { code: "+41", country: "CH", flag: "🇨🇭", name: "Switzerland" },
    { code: "+43", country: "AT", flag: "🇦🇹", name: "Austria" },
  ];

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
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Personal Information
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
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          }
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* Basic Information */}
      <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-slate-700 dark:text-slate-300"
              >
                First Name
              </Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={`bg-white dark:bg-slate-800 ${
                      validationErrors.firstName
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="Enter your first name"
                  />
                  <AnimatePresence>
                    {validationErrors.firstName && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-red-600 dark:text-red-400"
                      >
                        {validationErrors.firstName}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-slate-900 dark:text-white font-medium">
                  {user.firstName || "Not provided"}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-slate-700 dark:text-slate-300"
              >
                Last Name
              </Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={`bg-white dark:bg-slate-800 ${
                      validationErrors.lastName
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="Enter your last name"
                  />
                  <AnimatePresence>
                    {validationErrors.lastName && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-red-600 dark:text-red-400"
                      >
                        {validationErrors.lastName}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-slate-900 dark:text-white font-medium">
                  {user.lastName || "Not provided"}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-slate-700 dark:text-slate-300">
              Bio
            </Label>
            {isEditing ? (
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                className="bg-white dark:bg-slate-800"
                placeholder="Tell us about yourself"
                rows={3}
              />
            ) : (
              <p className="text-slate-900 dark:text-white font-medium">
                {user.bio || "Not provided"}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label
              htmlFor="phoneNumber"
              className="text-slate-700 dark:text-slate-300 flex items-center"
            >
              <Phone className="w-4 h-4 mr-2" />
              Phone Number
            </Label>
            {isEditing ? (
              <div className="space-y-1">
                <div className="flex gap-2">
                  {/* Country Code Selector */}
                  <Select
                    value={selectedCountryCode}
                    onValueChange={(value) => {
                      setSelectedCountryCode(value);
                      const fullPhone = value + " " + phoneWithoutCode;
                      handleInputChange("phoneNumber", fullPhone.trim());
                    }}
                  >
                    <SelectTrigger className="w-32 bg-white dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((country) => (
                        <SelectItem
                          key={`${country.code}-${country.country}`}
                          value={country.code}
                        >
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Phone Number Input */}
                  <Input
                    id="phoneNumber"
                    value={phoneWithoutCode}
                    onChange={(e) => {
                      const newPhoneWithoutCode = e.target.value;
                      setPhoneWithoutCode(newPhoneWithoutCode);
                      const fullPhone =
                        selectedCountryCode + " " + newPhoneWithoutCode;
                      handleInputChange("phoneNumber", fullPhone.trim());
                    }}
                    className={`flex-1 bg-white dark:bg-slate-800 ${
                      validationErrors.phoneNumber
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="9519412446"
                  />
                </div>
                <AnimatePresence>
                  {validationErrors.phoneNumber && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      {validationErrors.phoneNumber}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <p className="text-slate-900 dark:text-white font-medium">
                {user.phoneNumber || "Not provided"}
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label
              htmlFor="dateOfBirth"
              className="text-slate-700 dark:text-slate-300 flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Date of Birth
            </Label>
            {isEditing ? (
              <div className="space-y-1">
                <input
                  type="date"
                  id="dateOfBirth"
                  value={
                    formData.dateOfBirth
                      ? format(formData.dateOfBirth, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      const newDate = new Date(e.target.value);
                      handleInputChange("dateOfBirth", newDate);
                    } else {
                      handleInputChange("dateOfBirth", null);
                    }
                  }}
                  min="1900-01-01"
                  max={format(new Date(), "yyyy-MM-dd")}
                  className={`w-full px-3 py-2 text-sm rounded-md border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.dateOfBirth
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                />
                <AnimatePresence>
                  {validationErrors.dateOfBirth && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      {validationErrors.dateOfBirth}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <p className="text-slate-900 dark:text-white font-medium">
                {user.dateOfBirth
                  ? format(new Date(user.dateOfBirth), "PPP")
                  : "Not provided"}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Country */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Country
              </Label>
              {isEditing ? (
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange("country", value)}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-slate-900 dark:text-white font-medium">
                  {user.country || "Not provided"}
                </p>
              )}
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300 flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                Timezone
              </Label>
              {isEditing ? (
                <Select
                  value={formData.timezone}
                  onValueChange={(value) =>
                    handleInputChange("timezone", value)
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((timezone) => (
                      <SelectItem key={timezone} value={timezone}>
                        {timezone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-slate-900 dark:text-white font-medium">
                  {user.timezone || "Not provided"}
                </p>
              )}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              Preferred Language
            </Label>
            {isEditing ? (
              <Select
                value={formData.language}
                onValueChange={(value) => handleInputChange("language", value)}
              >
                <SelectTrigger className="bg-white dark:bg-slate-800">
                  <SelectValue placeholder="Select your preferred language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-slate-900 dark:text-white font-medium">
                {user.language || "Not provided"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <LinkIcon className="w-4 h-4 mr-2" />
            Social Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Website */}
          <div className="space-y-2">
            <Label
              htmlFor="website"
              className="text-slate-700 dark:text-slate-300 flex items-center"
            >
              <Globe className="w-4 h-4 mr-2" />
              Website
            </Label>
            {isEditing ? (
              <div className="space-y-1">
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className={`bg-white dark:bg-slate-800 ${
                    validationErrors.website
                      ? "border-red-300 focus:ring-red-500"
                      : ""
                  }`}
                  placeholder="https://yourwebsite.com"
                />
                <AnimatePresence>
                  {validationErrors.website && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      {validationErrors.website}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <p className="text-slate-900 dark:text-white font-medium">
                {user.website ? (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500 underline"
                  >
                    {user.website}
                  </a>
                ) : (
                  "Not provided"
                )}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* LinkedIn */}
            <div className="space-y-2">
              <Label
                htmlFor="linkedinProfile"
                className="text-slate-700 dark:text-slate-300 flex items-center"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    id="linkedinProfile"
                    value={formData.linkedinProfile}
                    onChange={(e) =>
                      handleInputChange("linkedinProfile", e.target.value)
                    }
                    className={`bg-white dark:bg-slate-800 ${
                      validationErrors.linkedinProfile
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="https://linkedin.com/in/username"
                  />
                  <AnimatePresence>
                    {validationErrors.linkedinProfile && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-red-600 dark:text-red-400"
                      >
                        {validationErrors.linkedinProfile}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-slate-900 dark:text-white font-medium">
                  {user.linkedinProfile ? (
                    <a
                      href={user.linkedinProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500 underline break-all"
                    >
                      LinkedIn Profile
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </p>
              )}
            </div>

            {/* Twitter */}
            <div className="space-y-2">
              <Label
                htmlFor="twitterProfile"
                className="text-slate-700 dark:text-slate-300 flex items-center"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter/X
              </Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    id="twitterProfile"
                    value={formData.twitterProfile}
                    onChange={(e) =>
                      handleInputChange("twitterProfile", e.target.value)
                    }
                    className={`bg-white dark:bg-slate-800 ${
                      validationErrors.twitterProfile
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="https://twitter.com/username"
                  />
                  <AnimatePresence>
                    {validationErrors.twitterProfile && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-red-600 dark:text-red-400"
                      >
                        {validationErrors.twitterProfile}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-slate-900 dark:text-white font-medium">
                  {user.twitterProfile ? (
                    <a
                      href={user.twitterProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500 underline break-all"
                    >
                      Twitter Profile
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </p>
              )}
            </div>

            {/* GitHub */}
            <div className="space-y-2">
              <Label
                htmlFor="githubProfile"
                className="text-slate-700 dark:text-slate-300 flex items-center"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    id="githubProfile"
                    value={formData.githubProfile}
                    onChange={(e) =>
                      handleInputChange("githubProfile", e.target.value)
                    }
                    className={`bg-white dark:bg-slate-800 ${
                      validationErrors.githubProfile
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="https://github.com/username"
                  />
                  <AnimatePresence>
                    {validationErrors.githubProfile && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-red-600 dark:text-red-400"
                      >
                        {validationErrors.githubProfile}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-slate-900 dark:text-white font-medium">
                  {user.githubProfile ? (
                    <a
                      href={user.githubProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500 underline break-all"
                    >
                      GitHub Profile
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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

export default PersonalInfoSection;
