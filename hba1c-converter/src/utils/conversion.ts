

export const convertPercentToMmolMol = (percent: number): number => {
    return 10.929 * (percent - 2.15);
  };
  
  export const convertMmolMolToPercent = (mmolMol: number): number => {
    return (mmolMol / 10.929) + 2.15;
  };

export const calculateAverageGlucose = (hba1cPercent: number): number => {
    return (hba1cPercent * 1.59) - 2.59;
  };