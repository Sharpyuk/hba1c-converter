import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface CarbsChartProps {
  range: string;
  carbsData: { time: string; carbs: number }[];
}

const CarbsChart: React.FC<CarbsChartProps> = ({ range, carbsData }) => {
  // Prepare data for the chart
  const labels = carbsData.map((data) => data.time);
  const dataValues = carbsData.map((data) => data.carbs);

  const chartData = {
    labels,
    datasets: [
      {
        label: range === 'today' || range === 'yesterday' ? 'Carb Burndown' : 'Average Carbs Over Time',
        data: dataValues,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        tension: 0.4,
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
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default CarbsChart;