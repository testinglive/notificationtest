
export interface CalculationInputs {
  completedHrs: string;
  completedMins: string;
  lastInHrs: string;
  lastInMins: string;
}

export interface CalculationResult {
  hours: number;
  minutes: number;
  formatted: string;
  isValid: boolean;
}
