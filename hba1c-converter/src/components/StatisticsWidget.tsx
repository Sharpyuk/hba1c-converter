import React, { useEffect, useState } from 'react';

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

const StatisticsWidget: React.FC = () => {
  const [range, setRange] = useState<string>('today'); // Default range is "today"
  const [timeInRange, setTimeInRange] = useState<number>(0);
  const [timeAboveRange, setTimeAboveRange] = useState<number>(0);
  const [timeBelowRange, setTimeBelowRange] = useState<number>(0);
  const [totalCarbs, setTotalCarbs] = useState<number>(0);
  const [totalInsulin, setTotalInsulin] = useState<{ basal: number; bolus: number }>({
    basal: 0,
    bolus: 0,
  });

  const fetchStatistics = async () => {
    try {
      const now = new Date();
      let startDate = new Date();
  
      if (range === 'today') {
        startDate.setUTCHours(0, 0, 0, 0); // Start of today in UTC
        now.setUTCHours(23, 59, 59, 999); // End of today in UTC
      } else if (range === 'yesterday') {
        startDate.setUTCDate(now.getUTCDate() - 1);
        startDate.setUTCHours(0, 0, 0, 0); // Start of yesterday in UTC
        now.setUTCDate(now.getUTCDate() - 1);
        now.setUTCHours(23, 59, 59, 999); // End of yesterday in UTC
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
      const entriesText = await entriesResponse.text();
      console.log('Entries Raw Response:', entriesText);
  
      if (!entriesResponse.ok) {
        throw new Error(`Failed to fetch blood sugar data: ${entriesResponse.status}`);
      }
  
      const bloodSugarData: BloodSugarData[] = JSON.parse(entriesText);
      console.log('Blood Sugar Data:', bloodSugarData);
  
      if (bloodSugarData.length === 0) {
        console.warn('No blood sugar data found for the specified range.');
      }
  
      const totalReadings = bloodSugarData.length;
  
      // Calculate TIR, TAR, and TBR as percentages
      const inRange = bloodSugarData.filter((entry) => entry.sgv / 18 >= 4 && entry.sgv / 18 <= 8)
        .length;
      const aboveRange = bloodSugarData.filter((entry) => entry.sgv / 18 > 8).length;
      const belowRange = bloodSugarData.filter((entry) => entry.sgv / 18 < 4).length;
  
      setTimeInRange(totalReadings > 0 ? (inRange / totalReadings) * 100 : 0);
      setTimeAboveRange(totalReadings > 0 ? (aboveRange / totalReadings) * 100 : 0);
      setTimeBelowRange(totalReadings > 0 ? (belowRange / totalReadings) * 100 : 0);
  
      // Fetch treatment data for insulin and carbs
      const treatmentsQuery = `find[created_at][$gte]=${startDate.toISOString()}&find[created_at][$lt]=${now.toISOString()}`;
      const treatmentsResponse = await fetch(
        `https://sharpy-cgm.up.railway.app/api/v1/treatments.json?${treatmentsQuery}`
      );
      const treatmentsText = await treatmentsResponse.text();
      console.log('Treatments Raw Response:', treatmentsText);
  
      if (!treatmentsResponse.ok) {
        throw new Error(`Failed to fetch treatment data: ${treatmentsResponse.status}`);
      }
  
      const treatmentData: TreatmentData[] = JSON.parse(treatmentsText);
      console.log('Treatment Data:', treatmentData);
  
      if (treatmentData.length === 0) {
        console.warn('No treatment data found for the specified range.');
      }
  
      // Calculate total carbs and insulin
      const totalCarbsEaten = treatmentData.reduce((sum, entry) => {
        if (entry.carbs) {
          return sum + entry.carbs;
        }
        return sum;
      }, 0);
  
      const basalInsulin = treatmentData
        .filter((entry) => entry.eventType.toLowerCase().includes('basal'))
        .reduce((sum, entry) => sum + (entry.insulin || 0), 0);
      const bolusInsulin = treatmentData
        .filter((entry) => entry.eventType.toLowerCase().includes('bolus'))
        .reduce((sum, entry) => sum + (entry.insulin || 0), 0);
  
      setTotalCarbs(totalCarbsEaten);
      setTotalInsulin({ basal: basalInsulin, bolus: bolusInsulin });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [range]);

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
      <div className="text-center">
        <p className="text-lg font-semibold">Time in Range: {timeInRange.toFixed(1)}%</p>
        <p className="text-lg font-semibold">Time Above Range: {timeAboveRange.toFixed(1)}%</p>
        <p className="text-lg font-semibold">Time Below Range: {timeBelowRange.toFixed(1)}%</p>
        <p className="text-lg font-semibold mt-4">Total Carbs Eaten: {totalCarbs} g</p>
        <p className="text-lg font-semibold">
          Total Insulin: {totalInsulin.basal + totalInsulin.bolus} U (Basal: {totalInsulin.basal} U,
          Bolus: {totalInsulin.bolus} U)
        </p>
      </div>
    </div>
  );
};

export default StatisticsWidget;