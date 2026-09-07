import Head from "next/head";
import React, { useMemo, useState } from "react";
import Layout from "../components/Layout";
import {
  DistanceUnit,
  convertDistance,
  formatDuration,
  fromKilometres,
  paceToSecondsPerKilometre,
  secondsPerKilometreToPace,
  toKilometres,
} from "../utils/running";

type Calculation = "time" | "distance" | "pace";

const distancePresets: Record<DistanceUnit, number[]> = {
  km: [5, 10, 20, 30, 50, 100],
  mi: [1, 3, 5, 10, 20, 30, 50, 100],
};

const numberValue = (value: string) => Number(value) || 0;

const UltraPage: React.FC = () => {
  const [conversion, setConversion] = useState("50");
  const [conversionUnit, setConversionUnit] = useState<DistanceUnit>("mi");
  const [conversionPresetIndex, setConversionPresetIndex] = useState(6);
  const [calculation, setCalculation] = useState<Calculation>("time");
  const [distance, setDistance] = useState("50");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("km");
  const [presetIndex, setPresetIndex] = useState(4);
  const [paceMinutes, setPaceMinutes] = useState("5");
  const [paceSeconds, setPaceSeconds] = useState("00");
  const [paceUnit, setPaceUnit] = useState<DistanceUnit>("km");
  const [timeHours, setTimeHours] = useState("4");
  const [timeMinutes, setTimeMinutes] = useState("00");
  const [timeSeconds, setTimeSeconds] = useState("00");

  const converted = convertDistance(
    numberValue(conversion),
    conversionUnit,
    conversionUnit === "mi" ? "km" : "mi",
  );

  const result = useMemo(() => {
    const distanceKm = toKilometres(numberValue(distance), distanceUnit);
    const paceSecondsPerKm = paceToSecondsPerKilometre(
      numberValue(paceMinutes),
      numberValue(paceSeconds),
      paceUnit,
    );
    const totalSeconds =
      numberValue(timeHours) * 3600 +
      numberValue(timeMinutes) * 60 +
      numberValue(timeSeconds);

    if (calculation === "time" && distanceKm > 0 && paceSecondsPerKm > 0) {
      const seconds = distanceKm * paceSecondsPerKm;
      return {
        value: formatDuration(seconds),
        label: "Estimated finish time",
        detail: `${(seconds / 3600).toFixed(2)} hours`,
      };
    }

    if (calculation === "distance" && totalSeconds > 0 && paceSecondsPerKm > 0) {
      const kilometres = totalSeconds / paceSecondsPerKm;
      return {
        value: `${fromKilometres(kilometres, distanceUnit).toFixed(2)} ${distanceUnit}`,
        label: "Distance you can cover",
        detail: `${fromKilometres(kilometres, distanceUnit === "km" ? "mi" : "km").toFixed(2)} ${distanceUnit === "km" ? "mi" : "km"}`,
      };
    }

    if (calculation === "pace" && totalSeconds > 0 && distanceKm > 0) {
      const seconds = secondsPerKilometreToPace(totalSeconds / distanceKm, paceUnit);
      return {
        value: `${formatDuration(seconds)} /${paceUnit}`,
        label: "Required average pace",
        detail: `${formatDuration(secondsPerKilometreToPace(totalSeconds / distanceKm, paceUnit === "km" ? "mi" : "km"))} /${paceUnit === "km" ? "mi" : "km"}`,
      };
    }

    return { value: "—", label: "Enter values above", detail: "" };
  }, [calculation, distance, distanceUnit, paceMinutes, paceSeconds, paceUnit, timeHours, timeMinutes, timeSeconds]);

  const showDistance = calculation !== "distance";
  const showPace = calculation !== "pace";
  const showTime = calculation !== "time";

  const selectPreset = (index: number) => {
    setPresetIndex(index);
    setDistance(String(distancePresets[distanceUnit][index]));
  };

  const swapConversionUnit = () => {
    const nextUnit = conversionUnit === "mi" ? "km" : "mi";
    const presets = distancePresets[nextUnit];
    const exactIndex = presets.indexOf(numberValue(conversion));
    const nextIndex = exactIndex >= 0 ? exactIndex : 0;
    setConversionUnit(nextUnit);
    setConversionPresetIndex(nextIndex);
    setConversion(String(presets[nextIndex]));
  };

  return (
    <Layout>
      <Head>
        <title>Ultra running calculator | Craig Sharpe</title>
        <meta name="description" content="Convert miles and kilometres, calculate running pace, finish time and distance." />
      </Head>
      <div className="min-h-screen bg-slate-950 px-4 pb-16 pt-20 text-slate-100 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-lime-400">Trail maths, made easy</p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Ultra calculator</h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-400">Quick distance conversions and race-day calculations—because the hard part should be the running.</p>
          </div>

          <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7">
            <h2 className="mb-5 text-xl font-bold">Miles ↔ kilometres</h2>
            <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
              <label className="block text-sm font-semibold text-slate-300">
                <span className="mb-2 block">Distance</span>
                <input aria-label="Distance to convert" type="number" min="0" step="any" value={conversion} onChange={(e) => setConversion(e.target.value)} className="!border-slate-700 !bg-slate-950 !p-4 text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-lime-400" />
              </label>
              <button type="button" aria-label="Swap conversion units" onClick={swapConversionUnit} className="!rounded-full !bg-slate-800 !px-4 !py-3 text-xl hover:!bg-slate-700">⇄</button>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-300">{conversionUnit === "mi" ? "Kilometres" : "Miles"}</p>
                <div className="rounded-lg border border-lime-400/30 bg-lime-400/10 p-4 text-2xl font-black text-lime-300">
                  {converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} {conversionUnit === "mi" ? "km" : "mi"}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">{numberValue(conversion).toLocaleString()} {conversionUnit} = {converted.toFixed(3)} {conversionUnit === "mi" ? "km" : "mi"}</p>
            <DistancePresetSlider
              id="conversion-distance-preset"
              unit={conversionUnit}
              index={conversionPresetIndex}
              onChange={(index) => {
                setConversionPresetIndex(index);
                setConversion(String(distancePresets[conversionUnit][index]));
              }}
            />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7">
            <h2 className="text-xl font-bold">Pace, time & distance</h2>
            <p className="mt-1 text-sm text-slate-400">Choose what you want to work out, then enter the other two values.</p>
            <div className="my-6 grid grid-cols-3 rounded-xl bg-slate-950 p-1">
              {(["time", "distance", "pace"] as Calculation[]).map((item) => (
                <button key={item} type="button" onClick={() => setCalculation(item)} className={`!rounded-lg !px-2 !py-3 text-sm font-bold capitalize transition sm:text-base ${calculation === item ? "!bg-lime-400 !text-slate-950" : "!bg-transparent !text-slate-400 hover:!text-white"}`}>{item}</button>
              ))}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {showDistance && <div>
                <InputGroup label="Distance">
                  <input aria-label="Running distance" type="number" min="0" step="any" value={distance} onChange={(e) => setDistance(e.target.value)} className="!border-slate-700 !bg-slate-950 text-white focus:ring-2 focus:ring-lime-400" />
                  <UnitSelect value={distanceUnit} onChange={(unit) => {
                    setDistanceUnit(unit);
                    setPresetIndex(0);
                    setDistance(String(distancePresets[unit][0]));
                  }} />
                </InputGroup>
                <DistancePresetSlider id="calculator-distance-preset" unit={distanceUnit} index={presetIndex} onChange={selectPreset} />
              </div>}

              {showPace && <InputGroup label="Pace">
                <TimeInput label="Pace minutes" value={paceMinutes} onChange={setPaceMinutes} placeholder="min" />
                <TimeInput label="Pace seconds" value={paceSeconds} onChange={setPaceSeconds} placeholder="sec" max={59} />
                <UnitSelect value={paceUnit} onChange={setPaceUnit} slash />
              </InputGroup>}

              {showTime && <InputGroup label="Time">
                <TimeInput label="Time hours" value={timeHours} onChange={setTimeHours} placeholder="hr" />
                <TimeInput label="Time minutes" value={timeMinutes} onChange={setTimeMinutes} placeholder="min" max={59} />
                <TimeInput label="Time seconds" value={timeSeconds} onChange={setTimeSeconds} placeholder="sec" max={59} />
              </InputGroup>}
            </div>

            <div aria-live="polite" className="mt-7 rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/15 to-emerald-400/5 p-6 text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-lime-300">{result.label}</p>
              <p className="mt-2 text-4xl font-black text-white sm:text-5xl">{result.value}</p>
              {result.detail && <p className="mt-2 text-slate-400">{result.detail}</p>}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

const InputGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <fieldset>
    <legend className="mb-2 text-sm font-semibold text-slate-300">{label}</legend>
    <div className="flex gap-2">{children}</div>
  </fieldset>
);

const TimeInput = ({ label, value, onChange, placeholder, max }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; max?: number }) => (
  <div className="min-w-0 flex-1">
    <input aria-label={label} type="number" min="0" max={max} value={value} onChange={(e) => onChange(e.target.value)} className="!border-slate-700 !bg-slate-950 text-center text-white focus:ring-2 focus:ring-lime-400" />
    <span className="mt-1 block text-center text-xs text-slate-500">{placeholder}</span>
  </div>
);

const DistancePresetSlider = ({ id, unit, index, onChange }: { id: string; unit: DistanceUnit; index: number; onChange: (index: number) => void }) => {
  const presets = distancePresets[unit];
  const suffix = unit === "km" ? "K" : presets[index] === 1 ? " mile" : " miles";

  return (
    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-slate-300">
          {unit === "km" ? "Kilometre presets" : "Mile presets"}
        </label>
        <span className="rounded-full bg-lime-400 px-3 py-1 text-sm font-black text-slate-950">
          {presets[index]}{suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max={presets.length - 1}
        step="1"
        value={index}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-lime-400"
      />
      <div className="mt-3 flex justify-between text-xs font-semibold text-slate-500">
        <span>{presets[0]}{unit === "km" ? "K" : " mi"}</span>
        <span>{presets[presets.length - 1]}{unit === "km" ? "K" : " mi"}</span>
      </div>
    </div>
  );
};

const UnitSelect = ({ value, onChange, slash = false }: { value: DistanceUnit; onChange: (value: DistanceUnit) => void; slash?: boolean }) => (
  <select aria-label={slash ? "Pace unit" : "Distance unit"} value={value} onChange={(e) => onChange(e.target.value as DistanceUnit)} className="rounded-md border border-slate-700 bg-slate-800 px-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-lime-400">
    <option value="km">{slash ? "/km" : "km"}</option>
    <option value="mi">{slash ? "/mi" : "mi"}</option>
  </select>
);

export default UltraPage;
