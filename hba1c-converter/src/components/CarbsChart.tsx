import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface CarbsChartProps {
  range: string; // Current date range (e.g., 'today', 'yesterday', '1w', '1m', '3m')
}

const CarbsChart: React.FC<CarbsChartProps> = ({ range }) => {
  const [carbsData, setCarbsData] = useState<{ time: string; carbs: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch carbs data based on the selected range
    const fetchCarbsData = async () => {
        try {
          setLoading(true);
      
          const response = await fetch(`/api/carbs?range=${range}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch carbs data: ${response.status}`);
          }
      
          const data = await response.json();
          setCarbsData(data);
        } catch (error) {
          console.error('Error fetching carbs data:', error);
        } finally {
          setLoading(false);
        }
      };
  
    fetchCarbsData();
  }, [range]);

  // Prepare data for the chart
  const labels = carbsData.map((data) => data.time); // X-axis labels (time)
  const dataValues = carbsData.map((data) => data.carbs); // Y-axis values (carbs)

  // Chart configuration
  const chartData = {
    labels,
    datasets: [
      {
        label: range === 'today' || range === 'yesterday' ? 'Carb Burndown' : 'Average Carbs Over Time',
        data: dataValues,
        borderColor: '#4CAF50', // Green line
        backgroundColor: 'rgba(76, 175, 80, 0.2)', // Light green fill
        tension: 0.4, // Smooth curve
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: range === 'today' || range === 'yesterday' ? 'Carb Burndown' : 'Average Carbs Over Time',
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
          text: 'Carbs (g)',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-md">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Line data={chartData} options={chartOptions} />
      )}
    </div>
  );
};

export default CarbsChart;