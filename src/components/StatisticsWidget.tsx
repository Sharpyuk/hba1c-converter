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
  created_at: string; // Timestamp when the treatment was created
  duration?: number; // Duration in minutes (optional, for temp basal)
  rate?: number; // Basal rate in units per hour (optional, for temp basal)
}

interface StatisticsWidgetProps {
  range: string;
  setRange: (range: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  nightscoutUrl: string; 
  selectedPerson?: string ; 
}

const safeNumber = (value: number) => (isNaN(value) || value === undefined ? 0 : value);

const StatisticsWidget: React.FC<StatisticsWidgetProps> = ({ range, setRange, loading, setLoading, nightscoutUrl, selectedPerson  }) => {
  const [timeInRange, setTimeInRange] = useState<number>(0);
  const [timeAboveRange, setTimeAboveRange] = useState<number>(0);
  const [timeBelowRange, setTimeBelowRange] = useState<number>(0);
  const [timeInMyRange, setTimeInMyRange] = useState<number>(0);
  const [timeAboveMyRange, setTimeAboveMyRange] = useState<number>(0);
  const [timeBelowMyRange, setTimeBelowMyRange] = useState<number>(0);
  const [totalCarbs, setTotalCarbs] = useState<number>(0);
  const [averageCarbsPerDay, setAverageCarbsPerDay] = useState<number>(0);
  const [averageCarbLoadPerDay, setAverageCarbLoadPerDay] = useState<number>(0);
  
  const [totalInsulin, setTotalInsulin] = useState<{ basal: number; bolus: number }>({
    basal: 0,
    bolus: 0,
  });
  const [averageDailyInsulin, setAverageDailyInsulin] = useState<number>(0);
  const [proteinCarbs, setProteinCarbs] = useState<number>(0);
  const [totalCarbLoad, setTotalCarbLoad] = useState<number>(0);

  // Add these lines right here:
const hasCarbData =
  totalCarbs > 0 ||
  proteinCarbs > 0 ||
  totalCarbLoad > 0 ||
  averageCarbsPerDay > 0 ||
  averageCarbLoadPerDay > 0;

const hasInsulinData =
  (!isNaN(totalInsulin.basal) && totalInsulin.basal > 0) ||
  (!isNaN(totalInsulin.bolus) && totalInsulin.bolus > 0) ||
  (!isNaN(averageDailyInsulin) && averageDailyInsulin > 0);
  
  useEffect(() => {
    fetchStatistics();
  }, [range, nightscoutUrl]);

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
  
      // console.log('Range:', range);
      // console.log('Start Date (UTC):', startDate.toISOString());
      // console.log('End Date (UTC):', now.toISOString());
  
      // Fetch blood sugar data for TIR, TAR, and TBR
      const entriesQuery = `find[dateString][$gte]=${startDate.toISOString()}&find[dateString][$lte]=${now.toISOString()}`;
      const entriesResponse = await fetch(
        `${nightscoutUrl}/api/v1/entries.json?${entriesQuery}&count=10000`
      );
  
      if (!entriesResponse.ok) {
        throw new Error(`Failed to fetch blood sugar data: ${entriesResponse.status}`);
      }
  
      const bloodSugarData: BloodSugarData[] = await entriesResponse.json();
      const totalReadings = bloodSugarData.length;
  
      // Calculate TIR, TAR, and TBR as percentages
      const inRange = bloodSugarData.filter((entry) => entry.sgv / 18 >= 3.9 && entry.sgv / 18 <= 10).length;
      const aboveRange = bloodSugarData.filter((entry) => entry.sgv / 18 > 10).length;
      const belowRange = bloodSugarData.filter((entry) => entry.sgv / 18 < 3.9).length;
  
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
      const treatmentsQuery = `find[created_at][$gte]=${startDate.toISOString()}&find[created_at][$lt]=${now.toISOString()}`;
      const treatmentsResponse = await fetch(
        `${nightscoutUrl}/api/v1/treatments.json?count=100000&${treatmentsQuery}`
      );
  
      if (!treatmentsResponse.ok) {
        throw new Error(`Failed to fetch treatment data: ${treatmentsResponse.status}`);
      }
  
      const treatmentData: TreatmentData[] = await treatmentsResponse.json();
  
      // Log the treatment data to the console
      //console.log('Fetched Treatment Data:', treatmentData);
  
      // Calculate protein/fat converted carbs (Gluconeogenesis)
      const proteinCarbs = treatmentData
      .filter((entry, index, array) => {
        // Check if the entry is a duplicate (same carbs value) within a 10-minute interval
        const entryTime = new Date(entry.created_at).getTime();
        return array.some((otherEntry) => {
          const otherTime = new Date(otherEntry.created_at).getTime();
          return (
            entry.eventType === 'Carb Correction' && // Ensure it's a "Carb Correction"
            entry.carbs === otherEntry.carbs && // Same carbs value
            otherTime > entryTime && // Other entry is after the current entry
            otherTime <= entryTime + 10 * 60 * 1000 // Within 10 minutes
          );
        });
      })
      .reduce((sum, entry) => sum + (entry.carbs || 0), 0);

      // Calculate actual carbs (excluding protein/fat converted carbs)
      const actualCarbs = treatmentData
      .filter((entry, index, array) => {
        // Exclude entries that are part of the proteinCarbs calculation
        const entryTime = new Date(entry.created_at).getTime();
        const isProteinCarb = array.some((otherEntry) => {
          const otherTime = new Date(otherEntry.created_at).getTime();
          return (
            entry.eventType === 'Carb Correction' && // Ensure it's a "Carb Correction"
            entry.carbs === otherEntry.carbs && // Same carbs value
            otherTime > entryTime && // Other entry is after the current entry
            otherTime <= entryTime + 10 * 60 * 1000 // Within 10 minutes
          );
        });
        return entry.eventType === 'Carb Correction' && entry.carbs > 1.9 && !isProteinCarb;
      })
      .reduce((sum, entry) => sum + (entry.carbs || 0), 0);

      setTotalCarbs(actualCarbs);
      setProteinCarbs(proteinCarbs);
      setTotalCarbLoad(actualCarbs + proteinCarbs);
      // Calculate average carbs per day
      const daysInRange = range === '1w' ? 7 : range === '1m' ? 30 : range === '3m' ? 90 : 1;
      setAverageCarbsPerDay(actualCarbs / daysInRange);
      setAverageCarbLoadPerDay((actualCarbs + proteinCarbs) / daysInRange);
  
      // Fetch basal profile
      const fetchBasalProfile = async (): Promise<{ time: string; rate: number }[]> => {
        const response = await fetch(`${nightscoutUrl}/api/v1/profile.json`);
        if (!response.ok) {
          throw new Error(`Failed to fetch basal profile: ${response.status}`);
        }
        const profileData = await response.json();
        //return profileData[0]?.store?.Default || [];
        // Nightscout profile.json structure:
        // [ { store: { ProfileName: { basal: [...] } }, ... } ]
        const store = profileData[0]?.store;
        const profileName = store ? Object.keys(store)[0] : null;
        const basalProfile = profileName ? store[profileName].basal : [];

        return basalProfile; // This is now an array
      };
  
      // Calculate basal insulin
      const calculateBasalInsulin = async (treatmentData: TreatmentData[], startDate: Date, endDate: Date) => {
        const basalProfile = await fetchBasalProfile();
        let totalBasalInsulin = 0;
  
        // Sort Temp Basals by start time
        const tempBasals = treatmentData
          .filter((entry) => 
            entry.eventType.toLowerCase().includes('temp basal') &&
            entry.created_at && // Ensure created_at exists
            entry.duration > 0 // Exclude entries with no duration
          )
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
        // Iterate through the time range minute-by-minute
        for (let currentTime = startDate.getTime(); currentTime < endDate.getTime(); currentTime += 60 * 1000) {
          const activeTempBasal = tempBasals.find((entry) => {
            const startTime = new Date(entry.created_at).getTime();
            const endTime = startTime + (entry.duration || 0) * 60 * 1000;
            return currentTime >= startTime && currentTime < endTime;
          });
  
          // Determine the basal rate for the current time
          let rate = 0;
          if (activeTempBasal) {
            rate = activeTempBasal.rate; // Use Temp Basal rate if active
          } else {
            // Use the basal profile rate
            const currentMinutes = (currentTime - startDate.setUTCHours(0, 0, 0, 0)) / (60 * 1000);
            const profileEntry = basalProfile.find((entry) => {
              const profileMinutes = parseInt(entry.time.split(':')[0]) * 60 + parseInt(entry.time.split(':')[1]);
              return currentMinutes >= profileMinutes;
            });
            rate = profileEntry ? profileEntry.rate : 0;
          }
  
          // Add the insulin contribution for this minute
          totalBasalInsulin += rate / 60; // Convert hourly rate to per-minute contribution
        }
  
        // Round the total basal insulin to avoid floating-point inaccuracies
        return Math.round(totalBasalInsulin * 100) / 100;
      };
  
      const roundedBasalInsulin = await calculateBasalInsulin(treatmentData, startDate, now);
  
      // Calculate bolus insulin
      const bolusInsulin = treatmentData
        .filter((entry) => 
          entry.eventType.toLowerCase().includes('bolus') || 
          entry.eventType.toLowerCase().includes('smb')
        )
        .reduce((sum, entry) => sum + (entry.insulin || 0), 0);
  
      const roundedBolusInsulin = Math.round(bolusInsulin * 100) / 100;

      const safeBasal = safeNumber(roundedBasalInsulin);
      const safeBolus = safeNumber(roundedBolusInsulin);
      const safeTotal = safeBasal + safeBolus;
      const safeAverage = safeNumber((safeBasal + safeBolus) / daysInRange);

      setTotalInsulin({ basal: safeBasal, bolus: safeBolus });
      setAverageDailyInsulin(safeAverage);
  
      // Set the total insulin and average daily insulin
      //setTotalInsulin({ basal: roundedBasalInsulin, bolus: roundedBolusInsulin });
      //setAverageDailyInsulin((roundedBasalInsulin + roundedBolusInsulin) / daysInRange);
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Statistics</h2>
        <a
          href={`${nightscoutUrl.replace(/\/$/, '')}/report`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 hover:underline"
        >
          <img
            src="nightscout.png"
            alt="Nightscout Logo"
            className="w-6 h-6"
          />
          <span className="text-blue-600 font-semibold">View Nightscout Report</span>
        </a>
      </div>

      <div className="flex justify-center mb-4 gap-2 sm:gap-4">
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
              <th className="px-4 py-2 border border-gray-300"  colSpan={4}>Time in Range (Internationally Recognised Range)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#DFF5E1' }}>
              <td className="px-4 py-2 border border-gray-300">Time in Range</td>
              <td className="px-4 py-2 border border-gray-300">3.9 - 10 mmol/l</td>
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
              <td className="px-4 py-2 border border-gray-300">Time Above Range</td>
              <td className="px-4 py-2 border border-gray-300">&gt;10 mmol/l</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${timeAboveRange.toFixed(1)}%`}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#FFD6D6' }}>
              <td className="px-4 py-2 border border-gray-300">Time Below Range</td>
              <td className="px-4 py-2 border border-gray-300">&lt;3.9 mmol/l</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${timeBelowRange.toFixed(1)}%`}
              </td>
            </tr>
          </tbody>
        </table>
        {selectedPerson == "Sharpy" && (
        <table className="table-auto w-full text-left border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 col-span-3">
              <th className="px-4 py-2 border border-gray-300"  colSpan={4}>Time in Range (My Desired Range)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#DFF5E1' }}>
              <td className="px-4 py-2 border border-gray-300">Time in Range</td>
              <td className="px-4 py-2 border border-gray-300">3.8 - 5.5 mmol/l</td>
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
              <td className="px-4 py-2 border border-gray-300">Time Above Range</td>
              <td className="px-4 py-2 border border-gray-300">&gt;5.5 mmol/l</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${timeAboveMyRange.toFixed(1)}%`}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#FFD6D6' }}>
              <td className="px-4 py-2 border border-gray-300">Time Below Range</td>
              <td className="px-4 py-2 border border-gray-300">&lt;3.8 mmol/l</td>
              <td className="px-4 py-2 border border-gray-300">
                {loading ? <Skeleton width={100} /> : `${timeBelowMyRange.toFixed(1)}%`}
              </td>
            </tr>
          </tbody>
        </table>
        )}

        {hasCarbData ? (
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
              <tr>
                <td className="px-4 py-2 border border-gray-300">Protein/Fat Converted to Carbs (Gluconeogenesis)</td>
                <td className="px-4 py-2 border border-gray-300">
                  {loading ? <Skeleton width={100} /> : `${proteinCarbs.toFixed(2)}g`}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">Total Carb Load</td>
                <td className="px-4 py-2 border border-gray-300">
                  {loading ? <Skeleton width={100} /> : `${totalCarbLoad.toFixed(2)}g`}
                </td>
              </tr>
              {['1w', '1m', '3m'].includes(range) && (
                <tr>
                  <td className="px-4 py-2 border border-gray-300">Average Carbs Eaten Per Day</td>
                  <td className="px-4 py-2 border border-gray-300">
                    {loading ? <Skeleton width={100} /> : `${averageCarbsPerDay.toFixed(2)} g/day`}
                  </td>
                </tr>
              )}
              {['1w', '1m', '3m'].includes(range) && (
                <tr>
                  <td className="px-4 py-2 border border-gray-300">Average Carb Load Per Day</td>
                  <td className="px-4 py-2 border border-gray-300">
                    {loading ? <Skeleton width={100} /> : `${averageCarbLoadPerDay.toFixed(2)} g/day`}
                  </td>
                </tr>
              )}
              </tbody>
          </table>
        ) : (
          <div className="my-4 text-center text-gray-500 italic">
            {loading ? <Skeleton width={200} /> : "No carb data available for this period."}
          </div>
        )}

        {hasInsulinData ? (
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
        ) : (
          <div className="my-4 text-center text-gray-500 italic">
            {loading ? <Skeleton width={200} /> : "No insulin data available for this period."}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsWidget;