export const KILOMETRES_PER_MILE = 1.609344;

export type DistanceUnit = "km" | "mi";

export const toKilometres = (distance: number, unit: DistanceUnit) =>
  unit === "mi" ? distance * KILOMETRES_PER_MILE : distance;

export const fromKilometres = (distance: number, unit: DistanceUnit) =>
  unit === "mi" ? distance / KILOMETRES_PER_MILE : distance;

export const convertDistance = (
  distance: number,
  from: DistanceUnit,
  to: DistanceUnit,
) => fromKilometres(toKilometres(distance, from), to);

export const paceToSecondsPerKilometre = (
  minutes: number,
  seconds: number,
  unit: DistanceUnit,
) => {
  const secondsPerUnit = minutes * 60 + seconds;
  return unit === "mi" ? secondsPerUnit / KILOMETRES_PER_MILE : secondsPerUnit;
};

export const secondsPerKilometreToPace = (
  secondsPerKilometre: number,
  unit: DistanceUnit,
) => unit === "mi" ? secondsPerKilometre * KILOMETRES_PER_MILE : secondsPerKilometre;

export const formatDuration = (totalSeconds: number) => {
  const rounded = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

