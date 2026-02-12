
import { CalculationInputs, CalculationResult } from './types';

export const calculateFreedomTime = (inputs: CalculationInputs): CalculationResult => {
  const compH = parseInt(inputs.completedHrs) || 0;
  const compM = parseInt(inputs.completedMins) || 0;
  const lastH = parseInt(inputs.lastInHrs) || 0;
  const lastM = parseInt(inputs.lastInMins) || 0;

  // Formula from existing code
  const cHrs = 8 - compH;
  const cMins = 0 - compM;

  let dHrs = cHrs + lastH;
  let dMins = cMins + lastM;

  if (dMins < 0) {
    dHrs--;
    dMins += 60;
  }

  // Handle midnight wrap-around for display purposes (optional but helpful)
  if (dHrs < 0) dHrs += 24;
  if (dHrs >= 24) dHrs -= 24;

  const isValid = inputs.completedHrs !== '' || inputs.completedMins !== '' || inputs.lastInHrs !== '' || inputs.lastInMins !== '';

  const formattedH = dHrs.toString().padStart(2, '0');
  const formattedM = dMins.toString().padStart(2, '0');

  return {
    hours: dHrs,
    minutes: dMins,
    formatted: `${formattedH}:${formattedM}`,
    isValid
  };
};
