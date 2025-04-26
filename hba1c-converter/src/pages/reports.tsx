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
    const range10: { lower: number; upper: number }[] = [];
    const range50: { lower: number; upper: number }[] = [];
  
    const timePoints: number[] = [];
    const lowerPoints: number[] = [];
    const upperPoints: number[] = [];
    const medianPoints: number[] = [];
  
    Object.keys(chunkedData)
      .sort()
      .forEach((chunkKey, index) => {
        const values = chunkedData[chunkKey].sort((a, b) => a - b);
  
        if (values.length > 0) {
          // Calculate the 10th, 25th, 75th, and 90th percentiles
          const p10 = values[Math.floor(values.length * 0.1)] || NaN;
          const p25 = values[Math.floor(values.length * 0.25)] || NaN;
          const p75 = values[Math.floor(values.length * 0.75)] || NaN;
          const p90 = values[Math.floor(values.length * 0.9)] || NaN;
  
          labels.push(chunkKey);
          range10.push({ lower: p10, upper: p90 });
          range50.push({ lower: p25, upper: p75 });
  
          // Use timestamps for timePoints
          const [hours, minutes] = chunkKey.split(':').map(Number);
          const timestamp = hours * 60 + minutes; // Convert time to minutes since midnight
          timePoints.push(timestamp);
          lowerPoints.push(isNaN(p25) ? 0 : p25);
          upperPoints.push(isNaN(p75) ? 0 : p75);
          medianPoints.push(isNaN(p25) || isNaN(p75) ? 0 : (p25 + p75) / 2); // Median is the average of 25th and 75th percentiles
        }
      });
  
    console.log('Time Points:', timePoints);
    console.log('Lower Points:', lowerPoints);
    console.log('Upper Points:', upperPoints);
    console.log('Median Points:', medianPoints);
  
    // Apply cubic spline interpolation for smoothing
    const splineLower = new CubicSpline(timePoints, lowerPoints);
    const splineUpper = new CubicSpline(timePoints, upperPoints);
    const splineMedian = new CubicSpline(timePoints, medianPoints);
  
    const smoothedRange50: { lower: number; upper: number }[] = [];
    const smoothedMedian: number[] = [];
    for (let i = 0; i < timePoints.length; i++) {
      let lower = splineLower.at(timePoints[i]);
      let upper = splineUpper.at(timePoints[i]);
      let median = splineMedian.at(timePoints[i]);
  
      // Handle NaN values by taking the average of the previous and next values
      if (isNaN(lower)) {
        lower = i > 0 && i < timePoints.length - 1
          ? (splineLower.at(timePoints[i - 1]) + splineLower.at(timePoints[i + 1])) / 2
          : (i > 0 ? splineLower.at(timePoints[i - 1]) : splineLower.at(timePoints[i + 1])) || 0;
      }
      if (isNaN(upper)) {
        upper = i > 0 && i < timePoints.length - 1
          ? (splineUpper.at(timePoints[i - 1]) + splineUpper.at(timePoints[i + 1])) / 2
          : (i > 0 ? splineUpper.at(timePoints[i - 1]) : splineUpper.at(timePoints[i + 1])) || 0;
      }
      if (isNaN(median)) {
        median = i > 0 && i < timePoints.length - 1
          ? (splineMedian.at(timePoints[i - 1]) + splineMedian.at(timePoints[i + 1])) / 2
          : (i > 0 ? splineMedian.at(timePoints[i - 1]) : splineMedian.at(timePoints[i + 1])) || 0;
      }
  
      // Ensure no NaN values are pushed to the smoothed arrays
      smoothedRange50.push({
        lower: isNaN(lower) ? 0 : lower,
        upper: isNaN(upper) ? 0 : upper,
      });
      smoothedMedian.push(isNaN(median) ? 0 : median);
    }
  
    console.log('Smoothed Range 50:', smoothedRange50);
    console.log('Smoothed Median:', smoothedMedian);
  
    return { labels, range10, range50: smoothedRange50, median: smoothedMedian };
  };

  const createChart = (agpData: any) => {
    const data = agpData.labels.map((time: string, index: number) => ({
      time,
      range10Low: agpData.range10[index]?.lower ?? 0,
      range10High: agpData.range10[index]?.upper ?? 0,
      range50Low: agpData.range50[index]?.lower ?? 0,
      range50High: agpData.range50[index]?.upper ?? 0,
      median: agpData.median[index] ?? 0, // Use smoothed median
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