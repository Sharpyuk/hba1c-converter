import React, { useEffect, useRef, useState } from 'react';
import { AgCharts } from 'ag-charts-enterprise';
import CubicSpline from 'cubic-spline';

interface BloodSugarData {
  sgv: number; // Sensor Glucose Value
  dateString: string; // Timestamp
}

const Reports: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null); // To store the chart instance
  const [graphData, setGraphData] = useState<BloodSugarData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<string>('1w'); // Default range is 1 week

  const fetchGraphData = async (range: string) => {
    try {
      // Calculate the start date for the selected range
      const now = new Date();
      let startDate = new Date();
      if (range === '3d') startDate.setDate(now.getDate() - 3);
      if (range === '1w') startDate.setDate(now.getDate() - 7);
      if (range === '1m') startDate.setMonth(now.getMonth() - 1);
      if (range === '3m') startDate.setMonth(now.getMonth() - 3);
  
      console.log(`Fetching data from ${startDate.toISOString()} to ${now.toISOString()}`);
  
      // Use the `find` parameter to query the API
      const query = `find[dateString][$gte]=${startDate.toISOString()}&find[dateString][$lte]=${now.toISOString()}`;
      const response = await fetch(
        `https://sharpy-cgm.up.railway.app/api/v1/entries.json?${query}&count=10000`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch graph data');
      }
      const data: BloodSugarData[] = await response.json();
      console.log(`Raw Data for range ${range}:`, data);
  
      // No need to filter locally since the API query already filters the data
      setGraphData(data.reverse()); // Reverse to show oldest first
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    console.log('Selected range:', range);
    fetchGraphData(range); // Fetch data based on the selected range
  }, [range]);

  useEffect(() => {
    console.log('Graph data updated:', graphData);
  
    if (graphData.length > 0) {
      const processedData = processAGPData();
      console.log('Processed Data:', processedData);
  
      createChart(processedData);
    } else {
      console.log('Graph data is empty or invalid.');
    }
  
    // Cleanup the chart instance when the component unmounts or data changes
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [graphData]);
  
  const findNearestValidAverage = (array: number[], index: number): number => {
    let prev = index - 1;
    let next = index + 1;
  
    // Variables to store the nearest valid values
    let prevValue: number | null = null;
    let nextValue: number | null = null;
  
    // Search backward for the nearest valid value
    while (prev >= 0) {
      if (!isNaN(array[prev])) {
        prevValue = array[prev];
        break;
      }
      prev--;
    }
  
    // Search forward for the nearest valid value
    while (next < array.length) {
      if (!isNaN(array[next])) {
        nextValue = array[next];
        break;
      }
      next++;
    }
  
    // If both previous and next values are found, return their average
    if (prevValue !== null && nextValue !== null) {
      return (prevValue + nextValue) / 2;
    }
  
    // If only the previous value is found, return it
    if (prevValue !== null) {
      return prevValue;
    }
  
    // If only the next value is found, return it
    if (nextValue !== null) {
      return nextValue;
    }
  
    // If no valid values are found, search further in the array
    for (let i = 1; i < array.length; i++) {
      if (index - i >= 0 && !isNaN(array[index - i])) {
        return array[index - i];
      }
      if (index + i < array.length && !isNaN(array[index + i])) {
        return array[index + i];
      }
    }
  
    return 0; // Fallback value if no valid values are found
  };

  const createChart = (agpData: any) => {
    const data = agpData.labels.map((time: string, index: number) => ({
      time,
      range10Low: agpData.range10[index]?.lower ?? null, // Preserve null for missing values
      range10High: agpData.range10[index]?.upper ?? null, // Preserve null for missing values
      range50Low: agpData.range50[index]?.lower ?? null, // Preserve null for missing values
      range50High: agpData.range50[index]?.upper ?? null, // Preserve null for missing values
      median: agpData.median[index] ?? null, // Preserve null for missing values
    }));
  
    console.log('Chart Data:', data);
  
    const options = {
      container: chartRef.current,
      data,
      title: {
        text: 'Ambulatory Glucose Profile (AGP)',
        fontSize: 18,
      },
      series: [
        {
          type: 'range-area',
          xKey: 'time',
          yLowKey: 'range10Low',
          yHighKey: 'range10High',
          fillOpacity: 0.2,
          fill: 'rgba(128, 128, 255, 0.2)',
          stroke: 'rgba(128, 128, 255, 0.2)',
          tooltip: { enabled: false },
        },
        {
          type: 'range-area',
          xKey: 'time',
          yLowKey: 'range50Low',
          yHighKey: 'range50High',
          fillOpacity: 0.4,
          fill: 'rgba(91, 89, 89, 0.4)',
          stroke: 'rgba(91, 89, 89, 0.4)',
          tooltip: { enabled: false },
        },
        {
          type: 'line',
          xKey: 'time',
          yKey: 'median',
          stroke: 'blue',
          strokeWidth: 2,
          marker: { enabled: false },
          tooltip: {
            enabled: true,
            renderer: (params: any) => {
              if (params.yValue !== undefined && params.yValue !== null) {
                return { content: `Median: ${params.yValue.toFixed(2)} mmol/L` };
              }
              return { content: 'No data available' };
            },
          },
        },
      ],
      axes: [
        { type: 'category', position: 'bottom', title: { text: 'Time of Day' } },
        { type: 'number', position: 'left', title: { text: 'Blood Sugar (mmol/L)' } },
      ],
      legend: { position: 'bottom' },
    };
  
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
  
    chartInstance.current = AgCharts.create(options);
  };

  const processAGPData = () => {
    console.log('Starting data processing...');
    console.log('Raw Graph Data:', graphData);
  
    const chunkedData: { [key: string]: number[] } = {};
  
    // Group data into 5-minute chunks
    graphData.forEach((entry) => {
      const date = new Date(entry.dateString);
  
      // Round the minutes down to the nearest 5-minute interval
      const roundedMinutes = Math.floor(date.getMinutes() / 5) * 5;
      const chunkKey = `${date.getHours().toString().padStart(2, '0')}:${roundedMinutes
        .toString()
        .padStart(2, '0')}`;
  
      if (!chunkedData[chunkKey]) {
        chunkedData[chunkKey] = [];
      }
      chunkedData[chunkKey].push(entry.sgv / 18); // Convert to mmol/L
    });
  
    console.log('Chunked Data:', chunkedData);
  
    const labels: string[] = [];
    const range10: { lower: number | null; upper: number | null }[] = [];
    const range50: { lower: number | null; upper: number | null }[] = [];
    const medianPoints: (number | null)[] = [];
  
    Object.keys(chunkedData)
      .sort()
      .forEach((chunkKey) => {
        const values = chunkedData[chunkKey].sort((a, b) => a - b);
  
        if (values.length > 0) {
          // Calculate the 10th, 25th, 75th, and 90th percentiles
          const p10 = values[Math.floor(values.length * 0.1)] || null;
          const p25 = values[Math.floor(values.length * 0.25)] || null;
          const p75 = values[Math.floor(values.length * 0.75)] || null;
          const p90 = values[Math.floor(values.length * 0.9)] || null;
  
          labels.push(chunkKey);
          range10.push({ lower: p10, upper: p90 });
          range50.push({ lower: p25, upper: p75 });
          medianPoints.push(p25 !== null && p75 !== null ? (p25 + p75) / 2 : null);
        }
      });
  
    console.log('Processed Data:', { labels, range10, range50, median: medianPoints });
  
    return { labels, range10, range50, median: medianPoints };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Ambulatory Glucose Profile (AGP)</h1>
      <div className="flex justify-center mb-4">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="border border-gray-300 rounded-md p-2"
        >
          <option value="3d">Last 3 Days</option>
          <option value="1w">Last 1 Week</option>
          <option value="1m">Last 1 Month</option>
          <option value="3m">Last 3 Months</option>
        </select>
      </div>
      {error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (
        <div className="bg-white p-4 rounded-md shadow-md">
          <div ref={chartRef} style={{ height: '400px' }}></div>
        </div>
      )}
    </div>
  );
};

export default Reports;