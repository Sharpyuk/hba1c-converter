import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface BloodSugarData {
  sgv: number; // Sensor Glucose Value
  dateString: string; // Timestamp
}

interface TreatmentData {
  eventType: string; // Type of treatment (e.g., "Correction Bolus", "Meal Bolus")
  insulin: number; // Insulin amount in units
  carbs: number; // Carbohydrates in grams
  dateString: string; // Timestamp
}

interface StatisticsWidgetProps {
  range: string;
  setRange: (range: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const StatisticsWidget: React.FC<StatisticsWidgetProps> = ({ range, setRange, loading, setLoading }) => {
  const [timeInRange, setTimeInRange] = useState<number>(0);
  const [timeAboveRange, setTimeAboveRange] = useState<number>(0);
  const [timeBelowRange, setTimeBelowRange] = useState<number>(0);
  const [totalCarbs, setTotalCarbs] = useState<number>(0);
  const [averageCarbsPerDay, setAverageCarbsPerDay] = useState<number>(0);
  const [totalInsulin, setTotalInsulin] = useState<{ basal: number; bolus: number }>({
    basal: 0,
    bolus: 0,
  });
  const [averageDailyInsulin, setAverageDailyInsulin] = useState<number>(0);

  useEffect(() => {
    fetchStatistics();
  }, [range]);

  const fetchStatistics = async () => {
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

      console.log('Start Date (UTC):', startDate.toISOString());
      console.log('End Date (UTC):', now.toISOString());

      // Fetch blood sugar data for TIR, TAR, and TBR
      const entriesQuery = `find[dateString][$gte]=${startDate.toISOString()}&find[dateString][$lte]=${now.toISOString()}`;
      const entriesResponse = await fetch(
        `https://sharpy-cgm.up.railway.app/api/v1/entries.json?${entriesQuery}&count=10000`
      );

      if (!entriesResponse.ok) {
        throw new Error(`Failed to fetch blood sugar data: ${entriesResponse.status}`);
      }

      const bloodSugarData: BloodSugarData[] = await entriesResponse.json();
      const totalReadings = bloodSugarData.length;

      // Calculate TIR, TAR, and TBR as percentages
      const inRange = bloodSugarData.filter((entry) => entry.sgv / 18 >= 4 && entry.sgv / 18 <= 8).length;
      const aboveRange = bloodSugarData.filter((entry) => entry.sgv / 18 > 8).length;
      const belowRange = bloodSugarData.filter((entry) => entry.sgv / 18 < 4).length;

      setTimeInRange(totalReadings > 0 ? (inRange / totalReadings) * 100 : 0);
      setTimeAboveRange(totalReadings > 0 ? (aboveRange / totalReadings) * 100 : 0);
      setTimeBelowRange(totalReadings > 0 ? (belowRange / totalReadings) * 100 : 0);

      // Fetch treatment data for insulin and carbs
      const treatmentsQuery = `find[created_at][$gte]=${startDate.toISOString()}&find[created_at][$lt]=${now.toISOString()}`;
      const treatmentsResponse = await fetch(
        `https://sharpy-cgm.up.railway.app/api/v1/treatments.json?count=10000&${treatmentsQuery}`
      );

      if (!treatmentsResponse.ok) {
        throw new Error(`Failed to fetch treatment data: ${treatmentsResponse.status}`);
      }

      const treatmentData: TreatmentData[] = await treatmentsResponse.json();

      // Calculate total carbs
      const totalCarbsEaten = treatmentData.reduce((sum, entry) => sum + (entry.carbs || 0), 0);
      setTotalCarbs(totalCarbsEaten);

      // Calculate average carbs per day
      const daysInRange = range === '1w' ? 7 : range === '1m' ? 30 : range === '3m' ? 90 : 1;
      setAverageCarbsPerDay(totalCarbsEaten / daysInRange);

      // Calculate total insulin
      const basalInsulin = treatmentData
        .filter((entry) => entry.eventType.toLowerCase().includes('basal'))
        .reduce((sum, entry) => sum + (entry.insulin || 0), 0);
      const bolusInsulin = treatmentData
        .filter((entry) => entry.eventType.toLowerCase().includes('bolus'))
        .reduce((sum, entry) => sum + (entry.insulin || 0), 0);

      setTotalInsulin({ basal: basalInsulin, bolus: bolusInsulin });
      setAverageDailyInsulin((basalInsulin + bolusInsulin) / daysInRange);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pie chart data
  const pieOptions = {
    plugins: {
      legend: {
        display: false, // Disable the legend
      },
    },
  };
  
  const pieData = {
    labels: ['Time in Range', 'Time Above Range', 'Time Below Range'],
    datasets: [
      {
        data: [timeInRange, timeAboveRange, timeBelowRange],
        backgroundColor: ['#DFF5E1', '#FFE8CC', '#FFD6D6'], // Light pastel green, orange, red
        hoverBackgroundColor: ['#C8EACD', '#FFD8A8', '#FFC2C2'], // Slightly darker pastel colors for hover
      },
    ],
  };


  return (
    <div className="bg-white p-6 rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4">Statistics</h2>
      <div className="flex justify-center mb-4 space-x-2">
        <button
          onClick={() => setRange('today')}
          className={`px-4 py-2 rounded-md font-semibold ${
            range === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
          } hover:bg-blue-500 hover:text-white transition`}
        >
          Today
        </button>
        <button
          onClick={() => setRange('yesterday')}
          className={`px-4 py-2 rounded-md font-semibold ${
            range === 'yesterday' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
          } hover:bg-blue-500 hover:text-white transition`}
        >
          Yesterday
        </button>
        <button
          onClick={() => setRange('1w')}
          className={`px-4 py-2 rounded-md font-semibold ${
            range === '1w' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
          } hover:bg-blue-500 hover:text-white transition`}
        >
          1 Week
        </button>
        <button
          onClick={() => setRange('1m')}
          className={`px-4 py-2 rounded-md font-semibold ${
            range === '1m' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
          } hover:bg-blue-500 hover:text-white transition`}
        >
          1 Month
        </button>
        <button
          onClick={() => setRange('3m')}
          className={`px-4 py-2 rounded-md font-semibold ${
            range === '3m' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
          } hover:bg-blue-500 hover:text-white transition`}
        >
          3 Months
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="table-auto w-full text-left border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border border-gray-300">Statistic</th>
              <th className="px-4 py-2 border border-gray-300">Value</th>
              <th className="px-4 py-2 border border-gray-300 text-center">Visualization</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#DFF5E1' }}> {/* Light pastel green for TIR */}
              <td className="px-4 py-2 border border-gray-300">Time in Range</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${timeInRange.toFixed(1)}%`}
              </td>
              <td className="row-span-3 px-4 py-2 border border-gray-300 text-center align-middle" rowSpan={3} style={{ backgroundColor: '#FFFFFF' }}>
                {loading ? (
                  <Skeleton circle={true} height={100} width={100} />
                ) : (
                  <div style={{ width: '100px', height: '100px', margin: '0 auto' }}>
                    <Pie data={pieData} options={pieOptions} />
                  </div>
                )}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#FFE8CC' }}> {/* Light pastel orange for TAR */}
              <td className="px-4 py-2 border border-gray-300">Time Above Range</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${timeAboveRange.toFixed(1)}%`}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#FFD6D6' }}> {/* Light pastel red for TBR */}
              <td className="px-4 py-2 border border-gray-300">Time Below Range</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${timeBelowRange.toFixed(1)}%`}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 border border-gray-300">Total Carbs Eaten</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${totalCarbs.toFixed(2)} g`}
              </td>
              <td className="px-4 py-2 border border-gray-300"></td>
            </tr>
            {['1w', '1m', '3m'].includes(range) && (
              <tr>
                <td className="px-4 py-2 border border-gray-300">Average Carbs Per Day</td>
                <td className="px-4 py-2 border border-gray-300">
                  {loading ? <Skeleton width={100} /> : `${averageCarbsPerDay.toFixed(2)} g/day`}
                </td>
                <td className="px-4 py-2 border border-gray-300"></td>
              </tr>
            )}
            <tr>
              <td className="px-4 py-2 border border-gray-300">Total Insulin</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? (
                  <Skeleton width={150} />
                ) : (
                  `${totalInsulin.basal + totalInsulin.bolus} U (Basal: ${totalInsulin.basal} U, Bolus: ${totalInsulin.bolus} U)`
                )}
              </td>
              <td className="px-4 py-2 border border-gray-300"></td>
            </tr>
            <tr>
              <td className="px-4 py-2 border border-gray-300">Average Daily Insulin</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${averageDailyInsulin.toFixed(2)} U/day`}
              </td>
              <td className="px-4 py-2 border border-gray-300"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatisticsWidget;