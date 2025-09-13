import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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

const IOBCOBWidget: React.FC = () => {
  const { data: session } = useSession();
  const [nightscoutUrl, setNightscoutUrl] = useState(DEFAULT_NIGHTSCOUT_URL);
  const [urlLoaded, setUrlLoaded] = useState(false);
  const [iob, setIob] = useState<number | null>(null);
  const [cob, setCob] = useState<number | null>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Calculate TDD and total carbs for the selected day
  const tdd = treatments.reduce(
    (sum, t) => sum + (typeof t.insulin === "number" ? t.insulin : 0),
    0
  );
  const totalCarbs = treatments.reduce(
    (sum, t) => sum + (typeof t.carbs === "number" ? t.carbs : 0),
    0
  );

  // Fetch user's Nightscout URL
  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/user-settings?userId=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.nightscout_address) setNightscoutUrl(data.nightscout_address);
          else setNightscoutUrl(DEFAULT_NIGHTSCOUT_URL);
          setUrlLoaded(true);
        })
        .catch(() => {
          setNightscoutUrl(DEFAULT_NIGHTSCOUT_URL);
          setUrlLoaded(true);
        });
    } else if (session === null) {
      setNightscoutUrl(DEFAULT_NIGHTSCOUT_URL);
      setUrlLoaded(true);
    }
  }, [session]);

  // Fetch treatments for the selected day
  useEffect(() => {
    if (!urlLoaded) return;
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    fetch(
      `${nightscoutUrl}/api/v1/treatments.json?find[created_at][$gte]=${start.toISOString()}&find[created_at][$lte]=${end.toISOString()}&count=1000`
    )
      .then(res => res.json())
      .then(data => {
        setTreatments(data);
        setIob(calculateIOB(data));
        setCob(calculateCOB(data));
      });
  }, [nightscoutUrl, urlLoaded, selectedDate]);

  const chartData = groupTreatmentsByHour(treatments, selectedDate);

return (
  <div className="bg-blue-50 p-4 rounded-xl shadow-md mt-6 max-w-screen-sm mx-auto">
    <h2 className="text-xl font-semibold mb-4">Insulin &amp; Carbs</h2>
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
    <div className="bg-white rounded-xl shadow p-2" style={{ width: "100%", height: 220 }}>
      {/* Date controls and label INSIDE the white box */}
      <div className="flex items-center justify-center gap-4 mb-2 px-2">
        <button
          className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 text-2xl shadow transition active:bg-gray-300"
          aria-label="Previous day"
          onClick={() =>
            setSelectedDate(prev => {
              const d = new Date(prev);
              d.setDate(d.getDate() - 1);
              return d;
            })
          }
        >
          {/* Larger SVG left chevron */}
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
              return d;
            })
          }
        >
          {/* Larger SVG right chevron */}
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
      {/* Left Y axis for Carbs */}
      <YAxis
        yAxisId="left"
        fontSize={10}
        axisLine={true}
        tickLine={true}
        width={25}
        label={{ value: "Carbs (g)", angle: -90, position: "insideLeft", fontSize: 10 }}
      />
      {/* Right Y axis for Insulin */}
      <YAxis
        yAxisId="right"
        orientation="right"
        fontSize={10}
        axisLine={true}
        tickLine={true}
        width={25}
        domain={[0, 10]} // <-- Fixed scale: 0 to 10 units
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
      />
      <Bar
        yAxisId="right"
        dataKey="insulin"
        fill="#3b82f6"
        name="Insulin (U)"
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
</div>
    </div>
    <div className="flex justify-center gap-8 mt-4">
      <div className="bg-white rounded-lg shadow px-4 py-2 flex flex-col items-center min-w-[110px]">
        <span className="text-xs text-gray-500 font-medium mb-1">TDD</span>
        <span className="text-lg font-bold text-blue-700">
          {tdd.toFixed(2)}
          <span className="text-base font-normal text-gray-500">U</span>
        </span>
      </div>
      <div className="bg-white rounded-lg shadow px-4 py-2 flex flex-col items-center min-w-[110px]">
        <span className="text-xs text-gray-500 font-medium mb-1">Total Carbs</span>
        <span className="text-lg font-bold text-yellow-700">
          {totalCarbs.toFixed(1)}
          <span className="text-base font-normal text-gray-500">g</span>
        </span>
      </div>
    </div>
  </div>
  );
};

export default IOBCOBWidget;