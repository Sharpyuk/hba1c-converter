import React, { useState, useEffect, useContext } from 'react';
import StatisticsWidget from '../components/StatisticsWidget';
import AGPGraph from '../components/AGPGraph';
import PercentileWidget from '../components/PercentileWidget';
import CarbsChart from '../components/CarbsChart';
import Layout from '../components/Layout';
import GMI from '../components/GMI';
import { AuthContext } from "./_app";

interface Person {
  name: string;
  nightscout_address: string;
  nightscout_api_secret?: string;
}

const DEFAULT_NIGHTSCOUT_URL = "https://sharpy-cgm.up.railway.app";

const Reports: React.FC = () => {
  const { token } = useContext(AuthContext);
  const [range, setRange] = useState<string>('today');
  const [loading, setLoading] = useState<boolean>(false);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [carbsData, setCarbsData] = useState<{ time: string; carbs: number }[]>([]);
  const [defaultUser, setDefaultUser] = useState<Person | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Fetch default user and managed people
  useEffect(() => {
    if (!token) return;
    fetch(`/api/user-settings?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.defaultUser) setDefaultUser(data.defaultUser);
        if (data.people) setPeople(data.people);
      });
  }, [token]);

  const allTabs = [
    ...(defaultUser ? [defaultUser] : []),
    ...people,
  ];
  const selectedPerson = allTabs[selectedIdx] || { nightscout_address: DEFAULT_NIGHTSCOUT_URL, name: "Default" };

  // Fetch carbs data based on the selected range and person
  useEffect(() => {
    const fetchCarbsData = async () => {
      if (!selectedPerson?.nightscout_address || !token) return;
      const response = await fetch(
        `/api/carbs?range=${range}&nightscoutUrl=${encodeURIComponent(selectedPerson.nightscout_address)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setCarbsData(data);
    };
    fetchCarbsData();
  }, [range, selectedPerson, token]);

  // Fetch graph data based on the selected range and person
  const fetchGraphData = async (range: string, url: string) => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate = new Date();

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

      const query = `find[dateString][$gte]=${startDate.toISOString()}&find[dateString][$lte]=${now.toISOString()}`;
      const response = await fetch(
        `${url}/api/v1/entries.json?${query}&count=10000`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch graph data: ${response.status}`);
      }

      const data = await response.json();
      setGraphData(data.reverse());
    } catch (error) {
      console.error('Error fetching graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPerson?.nightscout_address && token) {
      fetchGraphData(range, selectedPerson.nightscout_address);
    }
  }, [range, selectedPerson, token]);

  if (!token) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">Please log in to view reports.</h2>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-20 sm:px-6 lg:px-8">
        {/* Tabs for people */}
        {allTabs.length > 0 && (
          <div className="flex gap-2 mb-4 max-w-screen-sm mx-auto">
            {allTabs.map((person, idx) => (
              <button
                key={person.name + idx}
                className={`px-4 py-2 rounded-t ${idx === selectedIdx ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                onClick={() => setSelectedIdx(idx)}
              >
                {person.name}
              </button>
            ))}
          </div>
        )}

        {/* StatisticsWidget */}
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          <StatisticsWidget
            range={range}
            setRange={setRange}
            loading={loading}
            setLoading={setLoading}
            nightscoutUrl={selectedPerson.nightscout_address}
          />
        </div>
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          {selectedPerson && (
            <GMI nightscoutUrl={selectedPerson.nightscout_address} />
          )}
        </div>
        {/* AGPGraph */}
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          <AGPGraph range={range} graphData={graphData} />
        </div>

        {/* CarbsChart */}
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          <CarbsChart range={range} carbsData={carbsData} />
        </div>

        {/* PercentileWidget */}
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          <PercentileWidget range={range} nightscoutUrl={selectedPerson.nightscout_address} />
        </div>
      </div>
    </Layout>
  );
};

export default Reports;