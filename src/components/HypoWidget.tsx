import React, { useEffect, useState } from "react";

const DEFAULT_NIGHTSCOUT_URL = "https://sharpy-cgm.up.railway.app";

interface HypoTreatment {
  _id: string;
  created_at: string;
  carbs: number;
  glucose?: number;
  notes?: string;
}

const ranges = [
  { label: "Today", value: "today" },
  { label: "1 Week", value: "1w" },
  { label: "1 Month", value: "1m" },
  { label: "3 Months", value: "3m" },
];

interface HypoTreatmentsWidgetProps {
  nightscoutUrl?: string;
}

const HypoTreatmentsWidget: React.FC<HypoTreatmentsWidgetProps> = ({ nightscoutUrl }) => {
  const [treatments, setTreatments] = useState<HypoTreatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("today");

  // Use prop or fallback to default
  const url = nightscoutUrl || DEFAULT_NIGHTSCOUT_URL;

  useEffect(() => {
    setLoading(true);

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "1w") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "1m") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (range === "3m") {
      startDate.setMonth(now.getMonth() - 3);
    }

    fetch(
      `${url}/api/v1/treatments.json?find[eventType]=Carb Correction&find[enteredBy]=hba1c-converter&find[created_at][$gte]=${startDate.toISOString()}&find[created_at][$lte]=${now.toISOString()}&count=1000`
    )
      .then(res => res.json())
      .then(async (data) => {
        // For each treatment, fetch the closest BG entry before the treatment time
        const treatmentsWithBG: HypoTreatment[] = await Promise.all(
          data.map(async (t: any) => {
            let bloodGlucose: number | undefined = undefined;
            try {
              const bgRes = await fetch(
                `${url}/api/v1/entries.json?find[dateString][$lte]=${t.created_at}&count=1&sort[$natural]=-1`
              );
              const bgData = await bgRes.json();
              if (bgData && bgData.length > 0) {
                bloodGlucose = bgData[0].sgv / 18;
              }
            } catch {}
            return {
                _id: t._id,
                created_at: t.created_at,
                carbs: t.carbs,
                glucose: t.glucose,
                notes: t.notes,
            };
          })
        );
        setTreatments(treatmentsWithBG);
        setLoading(false);
      })
      .catch(() => {
        setTreatments([]);
        setLoading(false);
      });
  }, [url, range]);

  return (
    <div className="bg-white p-4 rounded-md shadow-md mt-6">
      <h2 className="text-xl font-semibold mb-4">Hypo Treatments</h2>
      <div className="flex space-x-2 mb-4">
        {ranges.map(r => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-3 py-1 rounded ${
              range === r.value
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : treatments.length === 0 ? (
        <div className="text-gray-500 italic">No hypo treatments found for this period.</div>
      ) : (
        <table className="w-full table-auto text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 border">Date/Time</th>
              <th className="px-2 py-1 border">Carbs (g)</th>
              <th className="px-2 py-1 border">Blood Glucose (mmol/L)</th>
            </tr>
          </thead>
          <tbody>
            {treatments.map(t => (
              <tr key={t._id}>
                <td className="px-2 py-1 border">
                  {new Date(t.created_at).toLocaleString()}
                </td>
                <td className="px-2 py-1 border">{t.carbs}</td>
                <td className="px-2 py-1 border">
                    {typeof t.glucose === "number"
                        ? t.glucose.toFixed(1)
                        : t.notes
                        ? t.notes
                        : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HypoTreatmentsWidget;