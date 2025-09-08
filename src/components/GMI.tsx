import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";

interface BloodSugarData {
  sgv: number; // Sensor Glucose Value
  dateString: string; // Timestamp
}

const DEFAULT_NIGHTSCOUT_URL = "https://sharpy-cgm.up.railway.app";

const GMI: React.FC = () => {
  const { data: session } = useSession();
  const [nightscoutUrl, setNightscoutUrl] = useState(DEFAULT_NIGHTSCOUT_URL);
  const [urlLoaded, setUrlLoaded] = useState(false);

  const [meanGlucose, setMeanGlucose] = useState<number | null>(null);
  const [gmi, setGmi] = useState<{ mmol: string | null; percentage: string | null }>({
    mmol: null,
    percentage: null,
  });
  const [range, setRange] = useState<string>('3m'); // Default range is 3 months
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch the user's Nightscout URL if logged in
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/user-settings?userId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.nightscout_address) setNightscoutUrl(data.nightscout_address);
          else setNightscoutUrl(DEFAULT_NIGHTSCOUT_URL);
          setUrlLoaded(true);
        })
        .catch(() => {
          setNightscoutUrl(DEFAULT_NIGHTSCOUT_URL);
          setUrlLoaded(true);
        });
    } else if (session === null) {
      setNightscoutUrl(DEFAULT_NIGHTSCOUT_URL);
      setUrlLoaded(true);
    }
    // Do not set anything if session is undefined (still loading)
  }, [session]);

  useEffect(() => {
    if (urlLoaded) {
      fetchMeanGlucose(range, nightscoutUrl);
    }
  }, [range, nightscoutUrl, urlLoaded]);

  if (!urlLoaded) return <div>Loading...</div>;

  const fetchMeanGlucose = async (range: string, url: string) => {
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
        `${url}/api/v1/entries.json?${query}&count=100000`
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

      // Calculate A1c using the Nathan formula (same as Nightscout)
      const meanMgdl = mean * 18;
      const a1cPercent = (meanMgdl + 46.7) / 28.7;
      const a1cMmol = (a1cPercent - 2.15) * 10.929;

      setGmi({
        mmol: a1cMmol.toFixed(1),
        percentage: a1cPercent.toFixed(1),
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching glucose data:', error);
      setMeanGlucose(null);
      setGmi({ mmol: null, percentage: null });
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchMeanGlucose(range, nightscoutUrl);
  // }, [range, nightscoutUrl]);

  return (
    <div className="bg-white p-4 rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4">Estimated HbA1c (GMI)</h2>
      
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
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => setRange('1d')}
          className={`px-4 py-2 rounded-md font-semibold ${
            range === '1d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
          } hover:bg-blue-500 hover:text-white transition`}
        >
          1 Day
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
    </div>
  );
};

export default GMI;