import React, { useEffect, useState } from 'react';

interface BloodSugarData {
  sgv: number; // Sensor Glucose Value
  dateString: string; // Timestamp
}

const GMI: React.FC = () => {
  const [meanGlucose, setMeanGlucose] = useState<number | null>(null);
  const [gmi, setGmi] = useState<{ mmol: string | null; percentage: string | null }>({
    mmol: null,
    percentage: null,
  });
  const [range, setRange] = useState<string>('3m'); // Default range is 3 months
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMeanGlucose = async (range: string) => {
    try {
      setLoading(true);

      // Calculate the start date for the selected range
      const now = new Date();
      let startDate = new Date();
      if (range === '1d') startDate.setDate(now.getDate() - 1);
      if (range === '1w') startDate.setDate(now.getDate() - 7);
      if (range === '1m') startDate.setMonth(now.getMonth() - 1);
      if (range === '3m') startDate.setMonth(now.getMonth() - 3);

      const query = `find[dateString][$gte]=${startDate.toISOString()}&find[dateString][$lte]=${now.toISOString()}`;
      const response = await fetch(
        `https://sharpy-cgm.up.railway.app/api/v1/entries.json?${query}&count=10000`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch glucose data');
      }

      const data: BloodSugarData[] = await response.json();

      if (data.length === 0) {
        setMeanGlucose(null);
        setGmi({ mmol: null, percentage: null });
        setLoading(false);
        return;
      }

      // Filter out invalid glucose values (null, NaN, or zero)
      const validValues = data
        .map((entry) => entry.sgv / 18) // Convert mg/dL to mmol/L
        .filter((value) => value > 0 && !isNaN(value)); // Keep only positive, valid numbers

      if (validValues.length === 0) {
        setMeanGlucose(null);
        setGmi({ mmol: null, percentage: null });
        setLoading(false);
        return;
      }

      // Calculate mean glucose in mmol/L
      const mean = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
      setMeanGlucose(mean);

      // Calculate GMI
      const gmiMmol = 12.71 + 4.70587 * mean;
      const gmiPercentage = gmiMmol / 10.929 + 2.15; // Convert mmol/mol to percentage
      setGmi({
        mmol: gmiMmol.toFixed(1),
        percentage: gmiPercentage.toFixed(1),
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching glucose data:', error);
      setMeanGlucose(null);
      setGmi({ mmol: null, percentage: null });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeanGlucose(range);
  }, [range]);

  return (
    <div className="bg-white p-4 rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4">Estimated HbA1c (GMI)</h2>
      <div className="flex flex-col items-center mb-4">
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : gmi.mmol !== null && gmi.percentage !== null ? (
        <div className="text-center">
          <p className="text-lg">
            <strong>GMI:</strong> {gmi.mmol} mmol/mol ({gmi.percentage}%)
          </p>
          <p className="text-sm text-gray-500">
            Based on mean glucose: {meanGlucose?.toFixed(1)} mmol/L
          </p>
        </div>
      ) : (
        <p className="text-center text-gray-500">No data available for the selected range.</p>
      )}
      <br/>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="range"
              value="1d"
              checked={range === '1d'}
              onChange={(e) => setRange(e.target.value)}
              className="form-radio"
            />
            <span>Last 1 Day</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="range"
              value="1w"
              checked={range === '1w'}
              onChange={(e) => setRange(e.target.value)}
              className="form-radio"
            />
            <span>Last 1 Week</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="range"
              value="1m"
              checked={range === '1m'}
              onChange={(e) => setRange(e.target.value)}
              className="form-radio"
            />
            <span>Last 1 Month</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="range"
              value="3m"
              checked={range === '3m'}
              onChange={(e) => setRange(e.target.value)}
              className="form-radio"
            />
            <span>Last 3 Months</span>
          </label>
        </div>
      </div>
      
    </div>
  );
};

export default GMI;