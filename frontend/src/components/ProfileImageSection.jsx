/* eslint-disable no-unused-vars */
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  Trash2,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProfileImageSection = ({
  user,
  onUpdateImage,
  onRemoveImage,
  onSuccess,
  isLoading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const validateImage = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "Only JPEG, PNG, GIF, and WebP images are allowed";
    }

    if (file.size > maxSize) {
      return "Image size must be less than 5MB";
    }

    return null;
  };

  const handleImageSelect = (file) => {
    // Clear previous errors
    setValidationError("");
    setUploadError("");

    const error = validateImage(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    // Clear previous upload errors and reset progress
    setUploadError("");
    setUploadProgress(0);

    try {
      // Check if onUpdateImage function is provided
      if (!onUpdateImage || typeof onUpdateImage !== "function") {
        throw new Error("Upload function not available");
      }

      // Simulate progress for user feedback (since actual progress tracking requires backend changes)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call the upload function and wait for it to complete
      const result = await onUpdateImage(selectedImage);

      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Small delay to show 100% completion
      setTimeout(() => {
        // Clear the selection and preview on success
        setSelectedImage(null);
        setImagePreview(null);
        setUploadProgress(0);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Call success callback if provided
        if (onSuccess && typeof onSuccess === "function") {
          onSuccess("Profile image updated successfully!");
        }
      }, 500);
    } catch (error) {
      console.error("Image upload failed:", error);

      // Reset progress on error
      setUploadProgress(0);

      // Set upload error for user feedback but DON'T clear the selection
      const errorMessage =
        error.message || error || "Upload failed. Please try again.";
      setUploadError(errorMessage);

      // Don't clear the selection so user can retry with the same image
      // or select a new one if they want
    }
  };

  const handleRemove = async () => {
    // Clear previous errors
    setUploadError("");

    try {
      // Check if onRemoveImage function is provided
      if (!onRemoveImage || typeof onRemoveImage !== "function") {
        throw new Error("Remove function not available");
      }

      // Call the remove function
      await onRemoveImage();

      // Clear any selected image
      setSelectedImage(null);
      setImagePreview(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Call success callback if provided
      if (onSuccess && typeof onSuccess === "function") {
        onSuccess("Profile image removed successfully!");
      }
    } catch (error) {
      console.error("Image removal failed:", error);

      // Set error message
      const errorMessage =
        error.message || error || "Failed to remove image. Please try again.";
      setUploadError(errorMessage);
    }
  };

  const cancelSelection = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setValidationError("");
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const retryUpload = () => {
    // Clear errors but keep the selected image for retry
    setUploadError("");
    setValidationError("");
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={itemVariants}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Camera className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Profile Image
        </h3>
      </div>

      <Separator />

      {/* Error Messages */}
      <AnimatePresence>
        {(validationError || uploadError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                {validationError || uploadError}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Profile Image */}
      <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
        <CardHeader>
          <CardTitle className="text-base">Current Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white/50 shadow-lg">
                <AvatarImage
                  src={imagePreview || user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-2xl font-bold">
                  {user.firstName?.[0] || "U"}
                  {user.lastName?.[0] || ""}
                </AvatarFallback>
              </Avatar>

              {selectedImage && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Camera className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </div>

            <div className="flex-1">
              <h4 className="font-medium text-slate-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {selectedImage ? (
                  <span className="text-blue-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    New image selected - click upload to save
                  </span>
                ) : user.profileImage ? (
                  "Profile image is set"
                ) : (
                  "No profile image"
                )}
              </p>

              {user.profileImage && !selectedImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isLoading}
                  className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Image
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload New Image */}
      <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            Upload New Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              dragActive
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading}
            />

            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-blue-600" />
                )}
              </div>

              <div>
                <p className="text-lg font-medium text-slate-900 dark:text-white">
                  {isLoading
                    ? "Processing..."
                    : dragActive
                    ? "Drop your image here"
                    : "Upload a profile image"}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {isLoading
                    ? "Please wait..."
                    : "Drag and drop or click to select"}
                </p>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p>Supported formats: JPEG, PNG, GIF, WebP</p>
                <p>Maximum size: 5MB</p>
                <p>Recommended: Square images (400x400px or larger)</p>
              </div>
            </div>
          </div>

          {/* Selected Image Info */}
          <AnimatePresence>
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {selectedImage.name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelSelection}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    {uploadError ? (
                      <Button
                        size="sm"
                        onClick={handleUpload}
                        disabled={isLoading || !selectedImage}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Retry Upload
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleUpload}
                        disabled={isLoading || !selectedImage}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span>
                              {uploadProgress > 0
                                ? `${uploadProgress}%`
                                : "Uploading..."}
                            </span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                    )}

                    {/* Progress Bar */}
                    {isLoading && uploadProgress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-200 rounded-b-sm overflow-hidden">
                        <div
                          className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Guidelines */}
          <div className="bg-slate-100 dark:bg-slate-600/50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">
              Image Guidelines
            </h4>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Use a clear, recent photo of yourself</li>
              <li>• Square images work best for profile pictures</li>
              <li>• Ensure good lighting and avoid blurry photos</li>
              <li>• Keep it professional and appropriate</li>
              <li>• High resolution images will be automatically resized</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfileImageSection;
