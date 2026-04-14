"use client";

import { useState, useCallback } from "react";
import { employeesApi, type ChangePasswordPayload } from "@/lib/api/employees";

interface UseEmployeeOptions {
  employeeId: string;
}

export function useEmployee(options: UseEmployeeOptions) {
  const { employeeId } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadAvatar = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    try {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        throw new Error("Invalid file type. Please upload JPEG, PNG or WebP.");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File too large. Maximum size is 5MB.");
      }
      
      const response = await employeesApi.uploadAvatar(employeeId, file);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
      throw err;
    } finally {
      setIsLoading(false);
      setUploadProgress(100);
    }
  }, [employeeId]);

  const changePassword = useCallback(async (data: ChangePasswordPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await employeesApi.changePassword(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  return {
    isLoading,
    error,
    uploadProgress,
    uploadAvatar,
    changePassword,
  };
}