import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface BloodSugarData {
  sgv: number; // Sensor Glucose Value
  dateString: string; // Timestamp
}

interface PercentileWidgetProps {
  range: string;
}

const PercentileWidget: React.FC<PercentileWidgetProps> = ({ range }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchPercentileData();
  }, [range]);

  const fetchPercentileData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate = new Date();

      // Calculate the start date based on the selected range
      if (range === 'today') {
        startDate.setUTCHours(0, 0, 0, 0);
        now.setUTCHours(23, 59, 59, 999);
      } else if (range === 'yesterday') {
        startDate.setUTCDate(now.getUTCDate() - 1);
        startDate.setUTCHours(0, 0, 0, 0);
        now.setUTCDate(now.getUTCDate() - 1);
        now.setUTCHours(23, 59, 59, 999);
      } else if (range === '1w') {
        startDate.setUTCDate(now.getUTCDate() - 7);
      } else if (range === '1m') {
        startDate.setUTCMonth(now.getUTCMonth() - 1);
      } else if (range === '3m') {
        startDate.setUTCMonth(now.getUTCMonth() - 3);
      }

      const query = `find[dateString][$gte]=${startDate.toISOString()}&find[dateString][$lte]=${now.toISOString()}`;
      const response = await fetch(
        `https://sharpy-cgm.up.railway.app/api/v1/entries.json?${query}&count=10000`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch blood sugar data: ${response.status}`);
      }

      const bloodSugarData: BloodSugarData[] = await response.json();

      // Group data by hour
      const groupedData: { [key: string]: number[] } = {};
      bloodSugarData.forEach((entry) => {
        const hour = new Date(entry.dateString).getUTCHours();
        if (!groupedData[hour]) groupedData[hour] = [];
        groupedData[hour].push(entry.sgv / 18); // Convert mg/dL to mmol/L
      });

      // Calculate percentiles for each hour
      const labels = Object.keys(groupedData).map((hour) => `${hour}:00`);
      const percentiles = {
        p10: [] as number[],
        p25: [] as number[],
        p50: [] as number[],
        p75: [] as number[],
        p90: [] as number[],
      };

      const calculatePercentile = (arr: number[], p: number) => {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index] || 0;
      };

      labels.forEach((hour) => {
        const values = groupedData[parseInt(hour.split(':')[0])] || [];
        percentiles.p10.push(calculatePercentile(values, 10));
        percentiles.p25.push(calculatePercentile(values, 25));
        percentiles.p50.push(calculatePercentile(values, 50));
        percentiles.p75.push(calculatePercentile(values, 75));
        percentiles.p90.push(calculatePercentile(values, 90));
      });

      // Set chart data
      setChartData({
        labels,
        datasets: [
          {
            label: '10th–90th Percentile',
            data: percentiles.p90,
            backgroundColor: 'rgba(135, 206, 250, 0.2)', // Light blue
            borderColor: 'rgba(135, 206, 250, 0.5)',
            fill: '-1', // Fill to the dataset below (10th percentile)
          },
          {
            label: '25th–75th Percentile',
            data: percentiles.p75,
            backgroundColor: 'rgba(144, 238, 144, 0.2)', // Light green
            borderColor: 'rgba(144, 238, 144, 0.5)',
            fill: '-1', // Fill to the dataset below (25th percentile)
          },
          {
            label: 'Median (50th Percentile)',
            data: percentiles.p50,
            borderColor: '#4CAF50', // Green
            borderWidth: 2,
            fill: false,
          },
          {
            label: '25th Percentile',
            data: percentiles.p25,
            borderColor: 'rgba(144, 238, 144, 0.5)',
            fill: false,
          },
          {
            label: '10th Percentile',
            data: percentiles.p10,
            borderColor: 'rgba(135, 206, 250, 0.5)',
            fill: false,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching percentile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Blood Glucose (mmol/L)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time (Hours)',
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4">Percentile Report</h2>
      {loading ? (
        <p>Loading...</p>
      ) : chartData ? (
        <Line data={chartData} options={options} />
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default PercentileWidget;