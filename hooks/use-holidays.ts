"use client";

import { useCallback } from "react";
import { holidaysApi, type WorkingDaysResponse } from "@/lib/api/holidays";

export function useHolidays() {
  const getWorkingDays = useCallback(async (start: string, end: string): Promise<WorkingDaysResponse> => {
    return holidaysApi.getWorkingDays(start, end);
  }, []);

  return {
    getWorkingDays,
  };
}