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
  personId?: string; 
}

const HypoTreatmentsWidget: React.FC<HypoTreatmentsWidgetProps> = ({ nightscoutUrl, personId }) => {
  const [treatments, setTreatments] = useState<HypoTreatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("today");
  const [editing, setEditing] = useState<HypoTreatment | null>(null);
  const [editCarbs, setEditCarbs] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Use prop or fallback to default
  const url = nightscoutUrl || DEFAULT_NIGHTSCOUT_URL;

  const fetchTreatments = () => {
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
      .then((data) => {
        setTreatments(data);
        setLoading(false);
      })
      .catch(() => {
        setTreatments([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTreatments();
    // eslint-disable-next-line
  }, [url, range]);

  // Delete handler
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    //await fetch(`/api/nightscout-hypo?id=${id}`, { method: "DELETE" });

    // Add personId to DELETE
    await fetch(`/api/nightscout-hypo?id=${id}&personId=${encodeURIComponent(personId || "")}`, { method: "DELETE" });
    setDeletingId(null);
    fetchTreatments();
  };

  // Edit handler
  const handleEdit = (t: HypoTreatment) => {
    setEditing(t);
    setEditCarbs(t.carbs.toString());
    setEditNotes(t.notes || "");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    // await fetch(`/api/nightscout-hypo`, {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     id: editing._id,
    //     carbs: parseFloat(editCarbs),
    //     notes: editNotes,
    //   }),
    // });
    // Add personId to PUT
    await fetch(`/api/nightscout-hypo`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing._id,
        carbs: parseFloat(editCarbs),
        notes: editNotes,
        personId: personId || "",
      }),
    });
    setEditing(null);
    fetchTreatments();
  };

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
              <th className="px-2 py-1 border"></th>
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
                <td className="px-2 py-1 border text-center">
                  <button
                    className="text-xs text-white mr-2"
                    onClick={() => handleEdit(t)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs text-white"
                    onClick={() => handleDelete(t._id)}
                    disabled={deletingId === t._id}
                  >
                    {deletingId === t._id ? "Deleting..." : "X"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form
            onSubmit={handleEditSubmit}
            className="bg-white p-6 rounded shadow-md w-full max-w-xs"
          >
            <h3 className="text-lg font-semibold mb-4">Edit Hypo Treatment</h3>
            <label className="block mb-2 text-sm font-medium">Carbs (g)</label>
            <input
              type="number"
              step="0.1"
              value={editCarbs}
              onChange={e => setEditCarbs(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4"
              required
            />
            <label className="block mb-2 text-sm font-medium">Notes</label>
            <input
              type="text"
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded flex-1"
              >
                Save
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded flex-1"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HypoTreatmentsWidget;