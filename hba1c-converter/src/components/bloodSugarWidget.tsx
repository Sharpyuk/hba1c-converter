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
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

interface BloodSugarData {
  sgv: number; // Sensor Glucose Value
  dateString: string; // Timestamp
  direction: string; // Trend direction
}

const BloodSugarWidget: React.FC = () => {
  const [bloodSugar, setBloodSugar] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [trend, setTrend] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<BloodSugarData[]>([]);

  const fetchBloodSugar = async () => {
    try {
      const response = await fetch('https://sharpy-cgm.up.railway.app/api/v1/entries.json?count=1');
      if (!response.ok) {
        throw new Error('Failed to fetch blood sugar data');
      }
      const data: BloodSugarData[] = await response.json();
      if (data.length > 0) {
        setBloodSugar(data[0].sgv);
        setTimestamp(data[0].dateString);
        setTrend(data[0].direction);
      } else {
        setError('No data available');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchGraphData = async () => {
    try {
      const response = await fetch('https://sharpy-cgm.up.railway.app/api/v1/entries.json?count=36'); // Fetch last 3 hours (assuming 5-minute intervals)
      if (!response.ok) {
        throw new Error('Failed to fetch graph data');
      }
      const data: BloodSugarData[] = await response.json();
      setGraphData(data.reverse()); // Reverse to show oldest first
    } catch (err) {
      console.error('Error fetching graph data:', err.message);
    }
  };

  useEffect(() => {
    // Fetch data immediately on component mount
    fetchBloodSugar();
    fetchGraphData();

    // Set up an interval to fetch data every 60 seconds
    const interval = setInterval(() => {
      fetchBloodSugar();
      fetchGraphData();
    }, 60000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

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
    return parseFloat((mgDl / 18).toFixed(1)); // Convert and round to 1 decimal place
  };

  const getBackgroundColor = (mmolL: number | null): string => {
    if (mmolL === null) return 'bg-gray-500'; // Default background color for loading or error
    if (mmolL >= 4.0 && mmolL <= 5.5) return 'bg-green-500'; // Green for normal range
    if ((mmolL > 5.5 && mmolL <= 6.5) || (mmolL >= 3.7 && mmolL < 4.0)) return 'bg-orange-500'; // Orange for slightly high/low
    if (mmolL < 3.7 || mmolL > 6.5) return 'bg-red-500'; // Red for critical range
    return 'bg-gray-500'; // Fallback color
  };

  const mmolL = convertToMmolL(bloodSugar);

  const chartData = {
    labels: graphData.map((entry) =>
      new Date(entry.dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    ), // Format timestamps without seconds
    datasets: [
      {
        label: 'Blood Sugar (mmol/L)',
        data: graphData.map((entry) => convertToMmolL(entry.sgv)), // Convert to mmol/L
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow custom height and width
    plugins: {
      legend: {
        display: false,
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
      },
    },
  };

  return (
    <div className={`${getBackgroundColor(mmolL)} text-white p-4 text-center`}>
      {error ? (
        <p>Error: {error}</p>
      ) : bloodSugar !== null ? (
        <div>
          <p className="text-lg font-bold">
            Current Blood Sugar: <br/> <span className="text-4xl">{mmolL} mmol/L {getTrendArrow(trend)}</span>
          </p>
          <p className="text-sm">Last updated: {new Date(timestamp || '').toLocaleString()}</p>
          <div className="mt-4 bg-white p-4 rounded-md" style={{ height: '200px', width: '100%' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default BloodSugarWidget;