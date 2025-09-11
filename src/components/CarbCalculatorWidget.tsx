import React, { useState } from "react";

const CarbCalculatorWidget: React.FC = () => {
  const [mode, setMode] = useState<"per100g" | "fraction">("per100g");

  // Mode 1 state
  const [carbsPer100g, setCarbsPer100g] = useState("");
  const [weight, setWeight] = useState("");
  const carbsTotal =
    carbsPer100g && weight
      ? ((parseFloat(carbsPer100g) * parseFloat(weight)) / 100).toFixed(1)
      : "";

  // Mode 2 state
  const [itemCarbs, setItemCarbs] = useState("");
  const [fraction, setFraction] = useState(0.5);
  const carbsFraction =
    itemCarbs && fraction
      ? (parseFloat(itemCarbs) * fraction).toFixed(1)
      : "";

  return (
    <div className="bg-white p-4 rounded-md shadow-md mt-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Carb Calculator</h2>
      <div className="flex mb-4">
        <button
          className={`flex-1 px-2 py-1 rounded-l ${mode === "per100g" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("per100g")}
        >
          Per 100g
        </button>
        <button
          className={`flex-1 px-2 py-1 rounded-r ${mode === "fraction" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("fraction")}
        >
          Fraction of Item
        </button>
      </div>

      {mode === "per100g" ? (
        <div>
          <label className="block mb-2">
            Carbs per 100g:
            <input
              type="number"
              className="ml-2 border rounded px-2 py-1"
              value={carbsPer100g}
              onChange={e => setCarbsPer100g(e.target.value)}
              min="0"
              step="any"
            />
          </label>
          <label className="block mb-2">
            Weight (g):
            <input
              type="number"
              className="ml-2 border rounded px-2 py-1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              min="0"
              step="any"
            />
          </label>
          <div className="mt-2 font-bold">
            Total Carbs: {carbsTotal ? `${carbsTotal}g` : "--"}
          </div>
        </div>
      ) : (
        <div>
          <label className="block mb-2">
            Carbs in whole item:
            <input
              type="number"
              className="ml-2 border rounded px-2 py-1"
              value={itemCarbs}
              onChange={e => setItemCarbs(e.target.value)}
              min="0"
              step="any"
            />
          </label>
          <div className="flex mb-2">
            {[
              { label: "½", value: 0.5 },
              { label: "⅓", value: 1 / 3 },
              { label: "¼", value: 0.25 },
            ].map(f => (
              <button
                key={f.label}
                className={`flex-1 px-2 py-1 border ${fraction === f.value ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                onClick={() => setFraction(f.value)}
                type="button"
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="mt-2 font-bold">
            Carbs for portion: {carbsFraction ? `${carbsFraction}g` : "--"}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarbCalculatorWidget;