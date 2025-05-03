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
  const [timeInMyRange, setTimeInMyRange] = useState<number>(0);
  const [timeAboveMyRange, setTimeAboveMyRange] = useState<number>(0);
  const [timeBelowMyRange, setTimeBelowMyRange] = useState<number>(0);
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

      console.log('Range:', range);
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

      // Calculate TIR, TAR, and TBR as percentages for MY RANGE
      const inMyRange = bloodSugarData.filter((entry) => entry.sgv / 18 >= 4 && entry.sgv / 18 <= 5.5).length;
      const aboveMyRange = bloodSugarData.filter((entry) => entry.sgv / 18 > 5.5).length;
      const belowMyRange = bloodSugarData.filter((entry) => entry.sgv / 18 < 3.8).length;

      setTimeInRange(totalReadings > 0 ? (inRange / totalReadings) * 100 : 0);
      setTimeAboveRange(totalReadings > 0 ? (aboveRange / totalReadings) * 100 : 0);
      setTimeBelowRange(totalReadings > 0 ? (belowRange / totalReadings) * 100 : 0);
      setTimeInMyRange(totalReadings > 0 ? (inMyRange / totalReadings) * 100 : 0);
      setTimeAboveMyRange(totalReadings > 0 ? (aboveMyRange / totalReadings) * 100 : 0);
      setTimeBelowMyRange(totalReadings > 0 ? (belowMyRange / totalReadings) * 100 : 0);


      // Fetch treatment data for insulin and carbs
    //   const treatmentsQuery = `find[created_at][$gte]=${startDate.toISOString()}&find[created_at][$lt]=${now.toISOString()}`;
    //   const treatmentsResponse = await fetch(
    //     `https://sharpy-cgm.up.railway.app/api/v1/treatments.json?count=10000&${treatmentsQuery}`
    //   );

      const treatmentsQuery = `find[created_at][$gte]=${startDate.toISOString()}&find[created_at][$lt]=${now.toISOString()}`;
      const treatmentsResponse = await fetch(
        `https://sharpy-cgm.up.railway.app/api/v1/treatments.json?count=100000&${treatmentsQuery}`
      );

      if (!treatmentsResponse.ok) {
        throw new Error(`Failed to fetch treatment data: ${treatmentsResponse.status}`);
      }

      const treatmentData: TreatmentData[] = await treatmentsResponse.json();

      // Log the treatment data to the console
      console.log('Fetched Treatment Data:', treatmentData);

      // Calculate total carbs
      const totalCarbsEaten = treatmentData.reduce((sum, entry) => sum + (entry.carbs || 0), 0);
      setTotalCarbs(totalCarbsEaten);

      // Calculate average carbs per day
      const daysInRange = range === '1w' ? 7 : range === '1m' ? 30 : range === '3m' ? 90 : 1;
      setAverageCarbsPerDay(totalCarbsEaten / daysInRange);

      // Calculate total insulin
      // Calculate total basal insulin
      const basalInsulin = treatmentData
      .filter((entry) => 
        (entry.eventType.toLowerCase().includes('basal') || entry.eventType.toLowerCase().includes('temp basal')) &&
        entry.created_at // Ensure created_at exists
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Sort by start time
      .reduce((total, entry, index, array) => {
        if (!entry.created_at) {
          console.warn(`Skipping entry with missing created_at:`, entry);
          return total;
        }
    
        const startTime = new Date(entry.created_at).getTime();
        const durationInHours = (entry.duration || 0) / 60; // Convert duration from minutes to hours
        let endTime = startTime + durationInHours * 60 * 60 * 1000; // Calculate end time in milliseconds
    
        // Check if the next entry overlaps with the current one
        if (index < array.length - 1) {
          const nextStartTime = new Date(array[index + 1].created_at).getTime();
          if (nextStartTime < endTime) {
            // Adjust the duration to avoid overlap
            const adjustedDurationInHours = (nextStartTime - startTime) / (60 * 60 * 1000);
            const contribution = entry.rate * Math.max(adjustedDurationInHours, 0);
            console.log(`Adjusted Entry: ${entry.created_at}, Rate: ${entry.rate}, Adjusted Duration: ${adjustedDurationInHours}, Contribution: ${contribution}`);
            return total + contribution;
          }
        }
    
        // Add the insulin for the current entry
        const contribution = entry.rate * durationInHours;
        console.log(`Entry: ${entry.created_at}, Rate: ${entry.rate}, Duration: ${durationInHours}, Contribution: ${contribution}`);
        return total + contribution;
      }, 0);
    
    // Round the basal insulin to avoid floating-point inaccuracies
    const roundedBasalInsulin = Math.round(basalInsulin * 100) / 100;

        // Calculate total bolus insulin
        const bolusInsulin = treatmentData
        .filter((entry) => 
            entry.eventType.toLowerCase().includes('bolus') || 
            entry.eventType.toLowerCase().includes('smb')
        )
        .reduce((sum, entry) => sum + (entry.insulin || 0), 0);

        // Round the bolus insulin to avoid floating-point inaccuracies
        const roundedBolusInsulin = Math.round(bolusInsulin * 100) / 100;

        // Set the total insulin and average daily insulin
        setTotalInsulin({ basal: roundedBasalInsulin, bolus: roundedBolusInsulin });
        setAverageDailyInsulin((roundedBasalInsulin + roundedBolusInsulin) / daysInRange);


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

  const pieDataMyRange = {
    labels: ['Time in Range', 'Time Above Range', 'Time Below Range'],
    datasets: [
      {
        data: [timeInMyRange, timeAboveMyRange, timeBelowMyRange],
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
            <tr className="bg-gray-100 col-span-3">
              <th className="px-4 py-2 border border-gray-300"  colSpan={3}>Time in Range</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#DFF5E1' }}>
              <td className="px-4 py-2 border border-gray-300">Time in Range 4.0 - 8.0 mmol/l</td>
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
           
            <tr style={{ backgroundColor: '#FFE8CC' }}>
              <td className="px-4 py-2 border border-gray-300">Time Above Range &gt;8.0mmol/l</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${timeAboveRange.toFixed(1)}%`}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#FFD6D6' }}>
              <td className="px-4 py-2 border border-gray-300">Time Below Range &lt;4.0mmol/l</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${timeBelowRange.toFixed(1)}%`}
              </td>
            </tr>
            
            <tr style={{ backgroundColor: '#DFF5E1' }}>
              <td className="px-4 py-2 border border-gray-300">Time in Range 3.8 - 5.50mmol/l</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${timeInMyRange.toFixed(1)}%`}
              </td>
              <td className="row-span-3 px-4 py-2 border border-gray-300 text-center align-middle" rowSpan={3} style={{ backgroundColor: '#FFFFFF' }}>
                {loading ? (
                  <Skeleton circle={true} height={100} width={100} />
                ) : (
                  <div style={{ width: '100px', height: '100px', margin: '0 auto' }}>
                    <Pie data={pieDataMyRange} options={pieOptions} />
                  </div>
                )}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#FFE8CC' }}>
              <td className="px-4 py-2 border border-gray-300">Time Above Range &gt;5.5.0mmol/l</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${timeAboveMyRange.toFixed(1)}%`}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#FFD6D6' }}>
              <td className="px-4 py-2 border border-gray-300">Time Below Range %lt;3.8mmol/l</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${timeBelowMyRange.toFixed(1)}%`}
              </td>
            </tr>
          </tbody>
        </table>


        <table className="table-auto w-full text-left border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border border-gray-300 col-span-3"  colSpan={3}>Carbs</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 border border-gray-300">Total Carbs Eaten</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${totalCarbs.toFixed(2)} g`}
              </td>
            </tr>
            {['1w', '1m', '3m'].includes(range) && (
              <tr>
                <td className="px-4 py-2 border border-gray-300">Average Carbs Per Day</td>
                <td className="px-4 py-2 border border-gray-300">
                  {loading ? <Skeleton width={100} /> : `${averageCarbsPerDay.toFixed(2)} g/day`}
                </td>
              </tr>
            )}
            </tbody>
        </table>
        <table className="table-auto w-full text-left border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border border-gray-300 col-span-3"  colSpan={3}>Insulin</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 border border-gray-300">Total Insulin</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? (
                  <Skeleton width={150} />
                ) : (
                  `${totalInsulin.basal + totalInsulin.bolus} U`
                )}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 border border-gray-300">Total Basal</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? (
                  <Skeleton width={150} />
                ) : (
                  `${totalInsulin.basal} U`
                )}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 border border-gray-300">Total Bolus</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? (
                  <Skeleton width={150} />
                ) : (
                  `${totalInsulin.bolus} U`
                )}
              </td>
            </tr>
            {['1w', '1m', '3m'].includes(range) && (
            <tr>
              <td className="px-4 py-2 border border-gray-300">Average Daily Insulin</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${averageDailyInsulin.toFixed(2)} U/day`}
              </td>
            </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatisticsWidget;