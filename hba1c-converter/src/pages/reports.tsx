import React, { useEffect, useRef, useState } from 'react';
import { AgCharts } from 'ag-charts-enterprise';

interface BloodSugarData {
  sgv: number; // Sensor Glucose Value
  dateString: string; // Timestamp
}

const Reports: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null); // To store the chart instance
  const [graphData, setGraphData] = useState<BloodSugarData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchGraphData = async () => {
    try {
      const response = await fetch('https://sharpy-cgm.up.railway.app/api/v1/entries.json?count=50000'); // Fetch more data
      if (!response.ok) {
        throw new Error('Failed to fetch graph data');
      }
      const data: BloodSugarData[] = await response.json();
      console.log('Response ata:', data);
      setGraphData(data.reverse()); // Reverse to show oldest first
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  useEffect(() => {
    if (graphData.length > 0) {
      const processedData = processAGPData();
      createChart(processedData);
    }

    // Cleanup the chart instance when the component unmounts or data changes
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [graphData]);

  const processAGPData = () => {
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
  
    // Debugging: Log grouped data
    console.log('Chunked Data:', chunkedData);
  
    const labels: string[] = [];
    const range50: { lower: number; upper: number }[] = [];
  
    const sortedKeys = Object.keys(chunkedData).sort(); // Sort times for proper ordering
  
    sortedKeys.forEach((chunkKey, index) => {
      const values = chunkedData[chunkKey].sort((a, b) => a - b);
  
      // Debugging: Log sorted values for each chunk
      console.log(`Sorted Values for ${chunkKey}:`, values);
  
      if (values.length > 0) {
        // Calculate the 25th and 75th percentiles
        const lower = values[Math.floor(values.length * 0.25)];
        const upper = values[Math.floor(values.length * 0.75)];
  
        // Avoid duplicate labels
        if (!labels.includes(chunkKey)) {
          labels.push(chunkKey);
          range50.push({ lower, upper });
        }
  
        // Interpolate between this chunk and the next chunk (forward interpolation)
        if (index < sortedKeys.length - 1) {
          const nextChunkKey = sortedKeys[index + 1];
          const nextValues = chunkedData[nextChunkKey].sort((a, b) => a - b);
  
          if (nextValues.length > 0) {
            const nextLower = nextValues[Math.floor(nextValues.length * 0.25)];
            const nextUpper = nextValues[Math.floor(nextValues.length * 0.75)];
  
            // Add an interpolated point halfway between the current and next chunk
            const interpolatedTime = interpolateTime(chunkKey, nextChunkKey);
            const interpolatedLower = (lower + nextLower) / 2;
            const interpolatedUpper = (upper + nextUpper) / 2;
  
            if (!labels.includes(interpolatedTime)) {
              labels.push(interpolatedTime);
              range50.push({ lower: interpolatedLower, upper: interpolatedUpper });
            }
          }
        }
      } else {
        console.warn(`Skipping chunk ${chunkKey} due to insufficient data:`, values);
      }
    });
  
    // Debugging: Log calculated range50
    console.log('Filtered Labels:', labels);
    console.log('Filtered Range50:', range50);
  
    return { labels, range50 };
  };
  
  // Helper function to interpolate time between two 5-minute chunks
  const interpolateTime = (time1: string, time2: string): string => {
    const [hour1, minute1] = time1.split(':').map(Number);
    const [hour2, minute2] = time2.split(':').map(Number);
  
    const totalMinutes1 = hour1 * 60 + minute1;
    const totalMinutes2 = hour2 * 60 + minute2;
  
    const interpolatedMinutes = (totalMinutes1 + totalMinutes2) / 2;
    const interpolatedHour = Math.floor(interpolatedMinutes / 60);
    const interpolatedMinute = Math.floor(interpolatedMinutes % 60);
  
    return `${interpolatedHour.toString().padStart(2, '0')}:${interpolatedMinute
      .toString()
      .padStart(2, '0')}`;
  };

  const createChart = (agpData: any) => {
    // Map the processed data to the chart format
    const data = agpData.labels.map((time: string, index: number) => ({
      time,
      range50Low: agpData.range50[index]?.lower ?? 0, // Lower bound
      range50High: agpData.range50[index]?.upper ?? 0, // Upper bound
      median: (agpData.range50[index]?.lower + agpData.range50[index]?.upper) / 2, // Median
    }));
  
    // Debugging: Log the data to ensure it's valid
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
          type: 'range-area', // Use range-area for the 50% range
          xKey: 'time',
          yLowKey: 'range50Low', // Lower bound
          yHighKey: 'range50High', // Upper bound
          fillOpacity: 0.4,
          fill: 'rgba(192, 192, 192, 0.4)', // Gray for the 50% range
          stroke: 'rgba(192, 192, 192, 0.4)', // Gray for the 50% range
          tooltip: { enabled: false },
        },
        {
          type: 'line', // Add a line series for the median
          xKey: 'time',
          yKey: 'median', // Median values
          stroke: 'blue', // Color of the median line
          strokeWidth: 2, // Thickness of the median line
          marker: {
            enabled: false, // Disable markers on the line
          },
          tooltip: {
            enabled: true, // Enable tooltips for the median line
            renderer: (params: any) => {
              if (params.yValue !== undefined && params.yValue !== null) {
                return { content: `Median: ${params.yValue.toFixed(2)} mmol/L` };
              }
              return { content: 'No data available' }; // Fallback content if yValue is undefined
            },
          },
        },
      ],
      axes: [
        {
          type: 'category',
          position: 'bottom',
          title: { text: 'Time of Day' },
        },
        {
          type: 'number',
          position: 'left',
          title: { text: 'Blood Sugar (mmol/L)' },
          min: undefined, // Let the chart dynamically adjust the minimum value
        },
      ],
      legend: {
        position: 'bottom',
      },
    };
  
    // Destroy the previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
  
    // Create a new chart instance
    chartInstance.current = AgCharts.create(options);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Ambulatory Glucose Profile (AGP)</h1>
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