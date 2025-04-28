import React, { useEffect, useState } from 'react';
import StatisticsWidget from '../components/StatisticsWidget';
import AGPGraph from '../components/AGPGraph';

interface BloodSugarData {
  sgv: number; // Sensor Glucose Value
  dateString: string; // Timestamp
}

const Reports: React.FC = () => {
  const [graphData, setGraphData] = useState<BloodSugarData[]>([]);
  const [range, setRange] = useState<string>('1w'); // Default range is 1 week
  const [loading, setLoading] = useState<boolean>(false);

  const fetchGraphData = async (range: string) => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();


      if (range === 'today') {
        startDate.setUTCHours(0, 0, 0, 0); // Set to the start of the day
        endDate.setUTCHours(23, 59, 59, 999); // Set to the end of the day
      }
      if (range === 'yesterday') {
        startDate.setUTCDate(now.getUTCDate() - 1);
        startDate.setUTCHours(0, 0, 0, 0); // Start of yesterday
        endDate.setUTCDate(now.getUTCDate() - 1);
        endDate.setUTCHours(23, 59, 59, 999); // End of yesterday
      }
      if (range === '3d') {
        startDate.setUTCDate(now.getUTCDate() - 3);
        startDate.setUTCHours(0, 0, 0, 0); // Start of 3 days ago
      }
      if (range === '1w') {
        startDate.setUTCDate(now.getUTCDate() - 7);
        startDate.setUTCHours(0, 0, 0, 0); // Start of 1 week ago
      }
      if (range === '1m') {
        startDate.setUTCMonth(now.getUTCMonth() - 1);
        startDate.setUTCHours(0, 0, 0, 0); // Start of 1 month ago
      }
      if (range === '3m') {
        startDate.setUTCMonth(now.getUTCMonth() - 3);
        startDate.setUTCHours(0, 0, 0, 0); // Start of 3 months ago
      }
      
      const query = `find[dateString][$gte]=${startDate.toISOString()}&find[dateString][$lte]=${endDate.toISOString()}`;
      const response = await fetch(
        `https://sharpy-cgm.up.railway.app/api/v1/entries.json?${query}&count=10000`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch graph data');
      }
      const data: BloodSugarData[] = await response.json();
      setGraphData(data.reverse());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData(range);
  }, [range]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Diabetes Report</h1>
      <StatisticsWidget range={range} setRange={setRange} loading={loading} setLoading={setLoading} />
      <AGPGraph range={range} graphData={graphData} />
    </div>
  );
};

export default Reports;