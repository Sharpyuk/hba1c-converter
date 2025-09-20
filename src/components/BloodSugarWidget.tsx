import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(annotationPlugin);
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

interface BloodSugarData {
  sgv: number;
  dateString: string;
  direction: string;
}

const DEFAULT_NIGHTSCOUT_URL = "https://sharpy-cgm.up.railway.app";

interface BloodSugarWidgetProps {
  nightscoutUrl?: string;
}

const BloodSugarWidget: React.FC<BloodSugarWidgetProps> = ({ nightscoutUrl }) => {
  const [bloodSugar, setBloodSugar] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [trend, setTrend] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<BloodSugarData[]>([]);
  const [range, setRange] = useState<string>('3h');
  const [zoom, setZoom] = useState<boolean>(false);

  // Hypo button state
  const [showHypoBox, setShowHypoBox] = useState(false);
  const [hypoMessage, setHypoMessage] = useState<string | null>(null);
  const [showHypoConfirm, setShowHypoConfirm] = useState(false);
  const [registeringHypo, setRegisteringHypo] = useState(false);

  // Use prop or fallback to default
  const url = nightscoutUrl || DEFAULT_NIGHTSCOUT_URL;

  const fetchBloodSugar = async () => {
    try {
      const response = await fetch(`${url}/api/v1/entries.json?count=1`);
      if (!response.ok) {
        throw new Error('Failed to fetch blood sugar data');
      }
      const data: BloodSugarData[] = await response.json();
      if (data.length > 0) {
        setBloodSugar(data[0].sgv);
        setTimestamp(data[0].dateString);
        setTrend(data[0].direction);
        setError(null);
      } else {
        setError('No data available');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchGraphData = async () => {
    try {
      let count = 36;
      if (range === '12h') count = 144;
      if (range === '1d') count = 288;
      if (range === '3d') count = 864;
      if (range === '1w') count = 2016;

      const response = await fetch(
        `${url}/api/v1/entries.json?count=${count}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch graph data');
      }
      const data: BloodSugarData[] = await response.json();
      setGraphData(data.reverse());
    } catch (err: any) {
      setGraphData([]);
      console.error('Error fetching graph data:', err.message);
    }
  };

  useEffect(() => {
    fetchBloodSugar();
    fetchGraphData();

    const interval = setInterval(() => {
      fetchBloodSugar();
      fetchGraphData();
    }, 60000);

    return () => clearInterval(interval);
  }, [range, url]);

  const getTrendArrow = (direction: string | null) => {
    switch (direction) {
      case 'DoubleUp':
        return '⬆⬆';
      case 'SingleUp':
        return '⬆';
      case 'FortyFiveUp':
        return '↗';
      case 'Flat':
        return '→';
      case 'FortyFiveDown':
        return '↘';
      case 'SingleDown':
        return '⬇';
      case 'DoubleDown':
        return '⬇⬇';
      default:
        return '';
    }
  };

  const convertToMmolL = (mgDl: number | null): number | null => {
    if (mgDl === null) return null;
    return parseFloat((mgDl / 18).toFixed(1));
  };

  const getBackgroundColor = (mmolL: number | null): string => {
    if (mmolL === null) return 'bg-gray-500';
    if (mmolL >= 4.0 && mmolL <= 5.5) return 'bg-green-500';
    if ((mmolL > 5.5 && mmolL <= 6.5) || (mmolL >= 3.7 && mmolL < 4.0)) return 'bg-orange-500';
    if (mmolL < 3.7 || mmolL > 6.5) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const mmolL = convertToMmolL(bloodSugar);

  // --- Hypo Button Logic ---
  const handleHypoClick = () => {
    setShowHypoBox(true);
    setHypoMessage(null);
    if (mmolL !== null && mmolL < 4.3) {
      // Auto-register hypo
      registerHypo();
    } else {
      setShowHypoConfirm(true);
      // Hide box after 10s if no action
      setTimeout(() => {
        setShowHypoBox(false);
        setShowHypoConfirm(false);
        setHypoMessage(null);
      }, 10000);
    }
  };

  const registerHypo = async () => {
    setRegisteringHypo(true);
    setHypoMessage("Registering hypo...");
    try {
      const res = await fetch("/api/nightscout-hypo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          glucose: mmolL,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setHypoMessage("Hypo registered successfully!");
      } else {
        setHypoMessage(data.error || "Failed to register hypo.");
      }
    } catch {
      setHypoMessage("Failed to register hypo.");
    } finally {
      setRegisteringHypo(false);
      setShowHypoConfirm(false);
      setTimeout(() => setShowHypoBox(false), 3000);
    }
  };

  // --- End Hypo Button Logic ---

  const chartData = {
    labels: graphData.map((entry) => {
      const date = new Date(entry.dateString);
      if (range === '3h' || range === '12h' || range === '1d') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return (
          date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
          ' ' +
          date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      }
    }),
    datasets: [
      {
        label: 'Blood Sugar (mmol/L)',
        data: graphData.map((entry) => convertToMmolL(entry.sgv)),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        pointRadius: range === '3h' ? 3 : 0,
        pointHoverRadius: range === '3h' ? 6 : 0,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      annotation: {
        annotations: {
          ...(graphData.some((entry) => convertToMmolL(entry.sgv) !== null && convertToMmolL(entry.sgv)! < 3.8)
            ? {
                lowerRange: {
                  type: 'line',
                  yMin: 3.8,
                  yMax: 3.8,
                  borderColor: 'red',
                  borderWidth: 2,
                  borderDash: [6, 6],
                  label: {
                    content: '3.8 mmol (Low)',
                    enabled: true,
                    position: 'start',
                    backgroundColor: 'rgba(255, 0, 0, 0.5)',
                    color: 'white',
                  },
                },
              }
            : {}),
          ...(graphData.some((entry) => convertToMmolL(entry.sgv) !== null && convertToMmolL(entry.sgv)! < 5.5)
            ? {
                upperRange: {
                  type: 'line',
                  yMin: 5.5,
                  yMax: 5.5,
                  borderColor: 'orange',
                  borderWidth: 2,
                  borderDash: [6, 6],
                  label: {
                    content: '5.5 mmol (Target)',
                    enabled: true,
                    position: 'start',
                    backgroundColor: 'rgba(255, 165, 0, 0.5)',
                    color: 'white',
                  },
                },
              }
            : {}),
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Blood Sugar (mmol/L)',
        },
        beginAtZero: false,
        min: zoom ? undefined : 3,
        max: zoom ? undefined : 15,
      },
    },
  };

  return (
    <div className={`${getBackgroundColor(mmolL)} text-white p-4 text-center w-full relative rounded-md`}>
      {/* Hypo Button */}
      <button
        className="absolute top-10 left-5 z-20 bg-yellow-400 hover:bg-yellow-300 rounded-full shadow-2xl shadow-black p-2"
        style={{ width: 48, height: 48, fontSize: 32, lineHeight: "32px"}}
        title="Register Hypo"
        onClick={handleHypoClick}
      >
        ⭐
      </button>
      {/* Hypo Output Box */}
      {showHypoBox && (
        <div className="absolute left-0 right-0 top-0 mx-auto mt-2 bg-yellow-100 text-yellow-900 rounded shadow-lg px-6 py-4 z-30 max-w-md w-full flex flex-col items-center">
          {hypoMessage && <div className="font-semibold mb-2">{hypoMessage}</div>}
          {showHypoConfirm && (
            <div className="flex flex-col items-center">
              <div className="mb-2 font-semibold">
                Current BG is not low. Are you sure you want to register a hypo?
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={() => {
                    setShowHypoConfirm(false);
                    registerHypo();
                  }}
                  disabled={registeringHypo}
                >
                  Yes
                </button>
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                  onClick={() => {
                    setShowHypoBox(false);
                    setShowHypoConfirm(false);
                    setHypoMessage(null);
                  }}
                  disabled={registeringHypo}
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {error ? (
        <p>Error: {error}</p>
      ) : bloodSugar !== null ? (
        <div>
          <p className="text-lg font-bold">
            Current Blood Sugar: <br />{' '}
            <span className="text-4xl">
              {mmolL} mmol/L {getTrendArrow(trend)}
            </span>
          </p>
          <p className="text-sm">Last updated: {new Date(timestamp || '').toLocaleString()}</p>
          <div className="mt-4 bg-white p-4 rounded-md" style={{ height: '200px', width: '100%' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="flex justify-center mt-4 gap-2 sm:gap-4">
            <button
              onClick={() => setRange('3h')}
              className={`px-4 py-2 rounded-md font-semibold ${
                range === '3h' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              } hover:bg-blue-500 hover:text-white transition`}
            >
              3 Hours
            </button>
            <button
              onClick={() => setRange('12h')}
              className={`px-4 py-2 rounded-md font-semibold ${
                range === '12h' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              } hover:bg-blue-500 hover:text-white transition`}
            >
              12 Hours
            </button>
            <button
              onClick={() => setRange('1d')}
              className={`px-4 py-2 rounded-md font-semibold ${
                range === '1d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              } hover:bg-blue-500 hover:text-white transition`}
            >
              1 Day
            </button>
            <button
              onClick={() => setRange('3d')}
              className={`px-4 py-2 rounded-md font-semibold ${
                range === '3d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              } hover:bg-blue-500 hover:text-white transition`}
            >
              3 Days
            </button>
            <button
              onClick={() => setRange('1w')}
              className={`px-4 py-2 rounded-md font-semibold ${
                range === '1w' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              } hover:bg-blue-500 hover:text-white transition`}
            >
              1 Week
            </button>
          </div>
          <div className="mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={zoom}
                onChange={(e) => setZoom(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="text-sm">Zoom</span>
            </label>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default BloodSugarWidget;