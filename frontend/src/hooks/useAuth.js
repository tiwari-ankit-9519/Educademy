import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import {
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectRegistrationStep,
  selectResetPasswordStep,
  selectProfileLoading,
  selectImageUploadLoading,
  registerUser,
  verifyOTP,
  loginUser,
  requestPasswordReset,
  resetPassword,
  exchangeAuthCode,
  getUserProfile,
  updateUserProfile,
  updateProfileImage,
  removeProfileImage,
  logoutUser,
  clearError,
  clearAuthState,
  setRegistrationStep,
  setResetPasswordStep,
  updateUserData,
} from "@/features/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();

  const authState = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const registrationStep = useSelector(selectRegistrationStep);
  const resetPasswordStep = useSelector(selectResetPasswordStep);
  const profileLoading = useSelector(selectProfileLoading);
  const imageUploadLoading = useSelector(selectImageUploadLoading);

  const register = useCallback(
    (userData) => {
      return dispatch(registerUser(userData));
    },
    [dispatch]
  );

  const verifyOtp = useCallback(
    (otpData) => {
      return dispatch(verifyOTP(otpData));
    },
    [dispatch]
  );

  const login = useCallback(
    (credentials) => {
      return dispatch(loginUser(credentials));
    },
    [dispatch]
  );

  const requestReset = useCallback(
    (email) => {
      return dispatch(requestPasswordReset(email));
    },
    [dispatch]
  );

  const resetPass = useCallback(
    (resetData) => {
      return dispatch(resetPassword(resetData));
    },
    [dispatch]
  );

  const exchangeCode = useCallback(
    (codeData) => {
      return dispatch(exchangeAuthCode(codeData));
    },
    [dispatch]
  );

  const getProfile = useCallback(() => {
    return dispatch(getUserProfile());
  }, [dispatch]);

  const updateProfile = useCallback(
    (profileData) => {
      return dispatch(updateUserProfile(profileData));
    },
    [dispatch]
  );

  const uploadProfileImage = useCallback(
    (imageData) => {
      return dispatch(updateProfileImage(imageData));
    },
    [dispatch]
  );

  const deleteProfileImage = useCallback(() => {
    return dispatch(removeProfileImage());
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch(logoutUser());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleClearAuthState = useCallback(() => {
    dispatch(clearAuthState());
  }, [dispatch]);

  const handleSetRegistrationStep = useCallback(
    (step) => {
      dispatch(setRegistrationStep(step));
    },
    [dispatch]
  );

  const handleSetResetPasswordStep = useCallback(
    (step) => {
      dispatch(setResetPasswordStep(step));
    },
    [dispatch]
  );

  const handleUpdateUserData = useCallback(
    (userData) => {
      dispatch(updateUserData(userData));
    },
    [dispatch]
  );

  const initiateGoogleAuth = useCallback(() => {
    const authUrl = `${
      import.meta.env.VITE_API_URL || "http://localhost:3000/api"
    }/auth/google`;
    window.location.href = authUrl;
  }, []);

  const initiateGitHubAuth = useCallback(() => {
    const authUrl = `${
      import.meta.env.VITE_API_URL || "http://localhost:3000/api"
    }/auth/github`;
    window.location.href = authUrl;
  }, []);

  const hasRole = useCallback(
    (role) => {
      return user?.role === role;
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission) => {
      return user?.permissions?.includes(permission) || false;
    },
    [user]
  );

  const isEmailVerified = useCallback(() => {
    return user?.emailVerified || false;
  }, [user]);

  const getInitials = useCallback(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  const getDisplayName = useCallback(() => {
    return user?.name || user?.email?.split("@")[0] || "User";
  }, [user]);

  return {
    authState,
    user,
    isAuthenticated,
    isLoading,
    error,
    registrationStep,
    resetPasswordStep,
    profileLoading,
    imageUploadLoading,
    register,
    verifyOtp,
    login,
    requestReset,
    resetPass,
    exchangeCode,
    getProfile,
    updateProfile,
    uploadProfileImage,
    deleteProfileImage,
    logout,
    clearError: handleClearError,
    clearAuthState: handleClearAuthState,
    setRegistrationStep: handleSetRegistrationStep,
    setResetPasswordStep: handleSetResetPasswordStep,
    updateUserData: handleUpdateUserData,
    initiateGoogleAuth,
    initiateGitHubAuth,
    hasRole,
    hasPermission,
    isEmailVerified,
    getInitials,
    getDisplayName,
  };
};
