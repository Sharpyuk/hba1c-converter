import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

const INSULIN_ACTION_MINUTES = 240;
const CARB_ABSORPTION_MINUTES = 120;
const DEFAULT_NIGHTSCOUT_URL = "https://sharpy-cgm.up.railway.app";

function iobFractionWalsh(minsAgo: number, diaHours: number) {
  const t = minsAgo / 60;
  if (t < 0) return 1;
  if (t >= diaHours) return 0;
  const tau = diaHours;
  if (t <= tau / 2) {
    return 1 - (2 * t) / tau;
  } else {
    return 2 * (1 - t / tau) * (1 - t / tau);
  }
}

function calculateIOB(treatments: any[], diaHours = 4) {
  let iob = 0;
  const now = Date.now();
  treatments.forEach(t => {
    if (t.insulin && t.created_at) {
      const mins = (now - new Date(t.created_at).getTime()) / 60000;
      if (mins < diaHours * 60) {
        iob += t.insulin * iobFractionWalsh(mins, diaHours);
      }
    }
  });
  return Math.max(0, iob);
}

function calculateCOB(treatments: any[]) {
  let cob = 0;
  const now = Date.now();
  treatments.forEach(t => {
    if (t.carbs && t.created_at) {
      const mins = (now - new Date(t.created_at).getTime()) / 60000;
      if (mins < CARB_ABSORPTION_MINUTES) {
        cob += t.carbs * (1 - mins / CARB_ABSORPTION_MINUTES);
      }
    }
  });
  return Math.max(0, cob);
}

function groupTreatmentsByHour(treatments: any[], date: Date) {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    carbs: 0,
    insulin: 0,
  }));
  treatments.forEach(t => {
    if (t.created_at) {
      const d = new Date(t.created_at);
      if (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      ) {
        const h = d.getHours();
        if (t.carbs) hours[h].carbs += t.carbs;
        if (t.insulin) hours[h].insulin += t.insulin;
      }
    }
  });
  return hours;
}

function getDayLabel(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  if (diffDays === 1) return "Tomorrow";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

interface IOBCOBWidgetProps {
  nightscoutUrl?: string;
}

const IOBCOBWidget: React.FC<IOBCOBWidgetProps> = ({ nightscoutUrl }) => {
  const [iob, setIob] = useState<number | null>(null);
  const [cob, setCob] = useState<number | null>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Calculate TDD and total carbs for the selected day
  const tdd = treatments.reduce(
    (sum, t) => sum + (typeof t.insulin === "number" ? t.insulin : 0),
    0
  );
  const totalCarbs = treatments.reduce(
    (sum, t) => sum + (typeof t.carbs === "number" ? t.carbs : 0),
    0
  );

  // Use prop or fallback to default
  const url = nightscoutUrl || DEFAULT_NIGHTSCOUT_URL;

  // Fetch treatments for the selected day
  useEffect(() => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    fetch(
      `${url}/api/v1/treatments.json?find[created_at][$gte]=${start.toISOString()}&find[created_at][$lte]=${end.toISOString()}&count=1000`
    )
      .then(res => res.json())
      .then(data => {
        setTreatments(data);
        setIob(calculateIOB(data));
        setCob(calculateCOB(data));
      });
  }, [url, selectedDate]);

  const chartData = groupTreatmentsByHour(treatments, selectedDate);

  // Get treatments for the selected hour
  const treatmentsForHour = selectedHour !== null
    ? treatments.filter(t => {
        const d = new Date(t.created_at);
        return (
          d.getFullYear() === selectedDate.getFullYear() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getDate() === selectedDate.getDate() &&
          d.getHours() === selectedHour
        );
      })
    : [];

  // Helper to parse notes JSON if present
  function parseNotes(notes: string | undefined) {
    if (!notes) return null;
    try {
      const parsed = JSON.parse(notes);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
    } catch {
      // Not JSON, just return as string
    }
    return null;
  }

  return (
    <div className="bg-blue-50 p-4 rounded-xl shadow-md mt-6 max-w-screen-sm mx-auto">
      <h2 className="text-xl font-semibold mb-4">Insulin &amp; Carbs</h2>
      {/* IOB and COB summary boxes at the top */}
      <div className="flex justify-center gap-4 mb-4">
        <div className="bg-white shadow rounded-lg px-6 py-3 flex flex-col items-center min-w-[110px]">
          <span className="text-xs text-gray-500 font-medium mb-1">IOB</span>
          <span className="text-lg font-bold text-blue-700">
            {iob !== null ? iob.toFixed(2) : "--"}
            <span className="text-base font-normal text-gray-500">U</span>
          </span>
        </div>
        <div className="bg-white shadow rounded-lg px-6 py-3 flex flex-col items-center min-w-[110px]">
          <span className="text-xs text-gray-500 font-medium mb-1">COB</span>
          <span className="text-lg font-bold text-yellow-700">
            {cob !== null ? cob.toFixed(1) : "--"}
            <span className="text-base font-normal text-gray-500">g</span>
          </span>
        </div>
      </div>
      {/* Graph box with date controls, chart, and TDD/Carbs */}
      <div
        className="bg-white rounded-xl shadow py-6 px-2 transition-all duration-300"
        style={{
          width: "100%",
          minHeight: 340,
        }}
      >
        <div className="flex items-center justify-center gap-4 mb-2">
          <button
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 text-2xl shadow transition active:bg-gray-300"
            aria-label="Previous day"
            onClick={() =>
              setSelectedDate(prev => {
                const d = new Date(prev);
                d.setDate(d.getDate() - 1);
                setSelectedHour(null);
                return d;
              })
            }
          >
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" stroke="#374151" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="font-semibold text-base">
            {getDayLabel(selectedDate)}
          </span>
          <button
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 text-2xl shadow transition active:bg-gray-300"
            aria-label="Next day"
            onClick={() =>
              setSelectedDate(prev => {
                const d = new Date(prev);
                d.setDate(d.getDate() + 1);
                setSelectedHour(null);
                return d;
              })
            }
          >
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" stroke="#374151" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="#e5e7eb" strokeWidth={0.5} vertical={false} />
              <XAxis dataKey="hour" fontSize={10} />
              <YAxis
                yAxisId="left"
                fontSize={10}
                axisLine={true}
                tickLine={true}
                width={25}
                label={{ value: "Carbs (g)", angle: -90, position: "insideLeft", fontSize: 10 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                fontSize={10}
                axisLine={true}
                tickLine={true}
                width={25}
                domain={[0, 5]}
                label={{ value: "Insulin (U)", angle: 90, position: "insideRight", fontSize: 10 }}
              />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="carbs"
                fill="#fbbf24"
                name="Carbs (g)"
                radius={[4, 4, 0, 0]}
                onClick={(_, index) => setSelectedHour(index)}
              />
              <Bar
                yAxisId="right"
                dataKey="insulin"
                fill="#3b82f6"
                name="Insulin (U)"
                radius={[4, 4, 0, 0]}
                onClick={(_, index) => setSelectedHour(index)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Treatments details shown in a hidden div directly below the chart */}
        {selectedHour !== null && (
          <div className="mt-4 bg-gray-50 rounded p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Treatments for {selectedHour}:00</span>
              <button
                className="text-xs text-blue-600 underline"
                onClick={() => setSelectedHour(null)}
              >
                Hide
              </button>
            </div>
            {treatmentsForHour.filter(t => (t.carbs || t.insulin)).length === 0 ? (
              <div className="text-gray-500 italic">No treatments for this hour.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border">Time</th>
                    <th className="px-2 py-1 border">Carbs</th>
                    <th className="px-2 py-1 border">Insulin</th>
                  </tr>
                </thead>
                <tbody>
                  {[...treatmentsForHour]
                    .reverse()
                    .filter(t => (t.carbs || t.insulin))
                    .map((t, idx) => {
                      const parsedNotes = parseNotes(t.notes);
                      const hasNotes =
                        (parsedNotes && Object.keys(parsedNotes).length > 0) ||
                        (t.notes && t.notes.trim() !== "");
                      return (
                        <React.Fragment key={t._id || idx}>
                          <tr>
                            <td className="px-2 py-1 border">
                              {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-2 py-1 border">{t.carbs ?? ""}</td>
                            <td className="px-2 py-1 border">{t.insulin ?? ""}</td>
                          </tr>
                          {hasNotes && (
                            <tr>
                              <td className="px-2 py-1 border bg-gray-100" colSpan={3}>
                                {parsedNotes
                                  ? <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-1 rounded">{JSON.stringify(parsedNotes, null, 2)}</pre>
                                  : t.notes}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        )}
        {/* TDD and Total Carbs boxes below the chart, inside the white box */}
        <div className="flex justify-center gap-8 mt-6">
          <div className="bg-gray-100 rounded-lg shadow px-4 py-2 flex flex-col items-center min-w-[110px]">
            <span className="text-xs text-gray-500 font-medium mb-1">TDD</span>
            <span className="text-lg font-bold text-blue-700">
              {tdd.toFixed(2)}
              <span className="text-base font-normal text-gray-500">U</span>
            </span>
          </div>
          <div className="bg-gray-100 rounded-lg shadow px-4 py-2 flex flex-col items-center min-w-[110px]">
            <span className="text-xs text-gray-500 font-medium mb-1">Total Carbs</span>
            <span className="text-lg font-bold text-yellow-700">
              {totalCarbs.toFixed(1)}
              <span className="text-base font-normal text-gray-500">g</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IOBCOBWidget;