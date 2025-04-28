import React, { useEffect, useRef } from 'react';
import { AgCharts } from 'ag-charts-enterprise';
import { AgCartesianChartOptions } from 'ag-charts-enterprise';

interface AGPGraphProps {
  range: string;
  graphData: any[]; // Replace `any` with the appropriate type for your graph data
}

const AGPGraph: React.FC<AGPGraphProps> = ({ range, graphData }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (graphData.length > 0) {
      const processedData = processAGPData();
      createChart(processedData);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [graphData]);

  const processAGPData = () => {
    const chunkedData: { [key: string]: number[] } = {};
    graphData.forEach((entry) => {
      const date = new Date(entry.dateString);
      const roundedMinutes = Math.floor(date.getMinutes() / 5) * 5;
      const chunkKey = `${date.getHours().toString().padStart(2, '0')}:${roundedMinutes
        .toString()
        .padStart(2, '0')}`;

      if (!chunkedData[chunkKey]) {
        chunkedData[chunkKey] = [];
      }
      chunkedData[chunkKey].push(entry.sgv / 18); // Convert to mmol/L
    });

    const labels: string[] = [];
    const range10: { lower: number | null; upper: number | null }[] = [];
    const range50: { lower: number | null; upper: number | null }[] = [];
    const medianPoints: (number | null)[] = [];

    Object.keys(chunkedData)
      .sort()
      .forEach((chunkKey) => {
        const values = chunkedData[chunkKey].sort((a, b) => a - b);

        if (values.length > 0) {
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

    return { labels, range10, range50, median: medianPoints };
  };

  const createChart = (agpData: any) => {
    const data = agpData.labels.map((time: string, index: number) => ({
      time,
      range10Low: agpData.range10[index]?.lower ?? null,
      range10High: agpData.range10[index]?.upper ?? null,
      range50Low: agpData.range50[index]?.lower ?? null,
      range50High: agpData.range50[index]?.upper ?? null,
      median: agpData.median[index] ?? null,
    }));

    const options: AgCartesianChartOptions = {
      container: chartRef.current!,
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
                return `Median: ${params.yValue.toFixed(2)} mmol/L`;
              }
              return 'No data available';
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
    <div className="bg-white p-4 rounded-md shadow-md">
      <div ref={chartRef} style={{ height: '400px' }}></div>
    </div>
  );
};

export default AGPGraph;