import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { range } = req.query;

    const now = new Date();
    let startDate = new Date();

    if (range === 'yesterday') {
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      now.setDate(now.getDate() - 1);
      now.setHours(23, 59, 59, 999);
    } else if (range === '1w') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === '1m') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (range === '3m') {
      startDate.setMonth(now.getMonth() - 3);
    } else {
      startDate.setHours(0, 0, 0, 0);
      now.setHours(23, 59, 59, 999);
    }

    // Fetch carb corrections
    const treatmentsQuery = `find[created_at][$gte]=${startDate.toISOString()}&find[created_at][$lt]=${now.toISOString()}`;
    const treatmentsResponse = await fetch(
      `https://sharpy-cgm.up.railway.app/api/v1/treatments.json?${treatmentsQuery}`
    );

    if (!treatmentsResponse.ok) {
      throw new Error(`Failed to fetch treatments: ${treatmentsResponse.status}`);
    }

    const carbCorrections = (await treatmentsResponse.json()).filter(
      (entry: any) => entry.eventType === 'Carb Correction'
    );

    // Debug: Check carb corrections
    //console.log('Carb Corrections:', carbCorrections);

    // Define a slower absorption rate and longer duration
    const absorptionRate = 10; // grams per hour (adjusted for slower burn-down)
    const absorptionInterval = 5; // minutes per step
    const absorptionDuration = 6 * 60; // 6 hours in minutes (extended duration)

    // Group and sum sequential carb entries
    const groupedCorrections: { time: string; carbs: number }[] = [];
    carbCorrections.forEach((entry: any) => {
      const roundedTime = new Date(
        Math.floor(new Date(entry.created_at).getTime() / (absorptionInterval * 60 * 1000)) *
          (absorptionInterval * 60 * 1000)
      ).toISOString();

      const existing = groupedCorrections.find((item) => item.time === roundedTime);
      if (existing) {
        existing.carbs += entry.carbs || 0;
      } else {
        groupedCorrections.push({ time: roundedTime, carbs: entry.carbs || 0 });
      }
    });

    // Debug: Check grouped corrections
    //console.log('Grouped Corrections:', groupedCorrections);

    // Initialize a full-day timeline from 00:00 to 23:59
    const timeline: { time: string; carbs: number }[] = [];
    const midnight = new Date(startDate);
    for (let i = 0; i < 24 * 60; i += absorptionInterval) {
      const time = new Date(midnight.getTime() + i * 60 * 1000);
      timeline.push({ time: time.toISOString(), carbs: 0 });
    }

    // Process grouped carb corrections for COB simulation
    const processedData: { time: string; carbs: number }[] = [];

    groupedCorrections.forEach((entry) => {
      const entryTime = new Date(entry.time);
      const carbs = entry.carbs;

      // Simulate COB decay using exponential decay
      for (let i = 0; i <= absorptionDuration; i += absorptionInterval) {
        const time = new Date(entryTime.getTime() + i * 60 * 1000); // Add i minutes
        const remainingCarbs = carbs * Math.exp(-i / (absorptionDuration / Math.log(2))); // Exponential decay
        processedData.push({
          time: time.toISOString(),
          carbs: parseFloat(remainingCarbs.toFixed(2)), // Round to 2 decimal places
        });
      }
    });

    // Debug: Check processed data
    //console.log('Processed Data:', processedData);

    // Aggregate carbs by time (to handle overlapping entries)
    const aggregatedData = processedData.reduce((acc: any, curr) => {
      const existing = acc.find((item: any) => item.time === curr.time);
      if (existing) {
        existing.carbs += curr.carbs;
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);

    // Debug: Check aggregated data
    //console.log('Aggregated Data:', aggregatedData);

    // Merge aggregated data into the full-day timeline
    const finalData = timeline.map((slot) => {
      const matchingEntry = aggregatedData.find((entry: any) => entry.time === slot.time);
      return {
        time: slot.time,
        carbs: matchingEntry ? matchingEntry.carbs : 0,
      };
    });

    // Debug: Check final data
    //console.log('Final Data:', finalData);

    res.status(200).json(finalData);
  } catch (error) {
    console.error('Error in /api/carbs:', error);
    res.status(500).json({ error: 'Failed to fetch carbs data' });
  }
};

export default handler;