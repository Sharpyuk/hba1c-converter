import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import StatisticsWidget from '../components/StatisticsWidget';
import AGPGraph from '../components/AGPGraph';
import PercentileWidget from '../components/PercentileWidget';
import CarbsChart from '../components/CarbsChart';
import Layout from '../components/Layout';
import GMI from '../components/GMI';

interface Person {
  name: string;
  nightscout_address: string;
  nightscout_api_secret?: string;
}

const DEFAULT_NIGHTSCOUT_URL = "https://sharpy-cgm.up.railway.app";

const Reports: React.FC = () => {
  const { data: session } = useSession();
  const [range, setRange] = useState<string>('today');
  const [loading, setLoading] = useState<boolean>(false);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [carbsData, setCarbsData] = useState<{ time: string; carbs: number }[]>([]);
  const [defaultUser, setDefaultUser] = useState<Person | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Fetch default user and managed people
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/user-settings?userId=${encodeURIComponent(session.user.email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.defaultUser) setDefaultUser(data.defaultUser);
        if (data.people) setPeople(data.people);
      });
  }, [session]);

  const allTabs = [
    ...(defaultUser ? [defaultUser] : []),
    ...people,
  ];
  const selectedPerson = allTabs[selectedIdx] || { nightscout_address: DEFAULT_NIGHTSCOUT_URL, name: "Default" };

  // Fetch carbs data based on the selected range and person
  useEffect(() => {
    const fetchCarbsData = async () => {
      if (!selectedPerson?.nightscout_address) return;
      const response = await fetch(`/api/carbs?range=${range}&nightscoutUrl=${encodeURIComponent(selectedPerson.nightscout_address)}`);
      const data = await response.json();
      setCarbsData(data);
    };
    fetchCarbsData();
  }, [range, selectedPerson]);

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
        `${url}/api/v1/entries.json?${query}&count=10000`
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
    if (selectedPerson?.nightscout_address) {
      fetchGraphData(range, selectedPerson.nightscout_address);
    }
  }, [range, selectedPerson]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-20 sm:px-6 lg:px-8">
        {/* Tabs for people */}
        {allTabs.length > 0 && (
          <div className="w-full max-w-screen-sm mx-auto">
            <div className="flex bg-gray-100 rounded-t-lg border-b-2 border-gray-300">
              {allTabs.map((person, idx) => (
                <button
                  key={person.name + idx}
                  className={`px-6 py-2 font-semibold transition-colors duration-200
                    rounded-t-lg
                    focus:outline-none
                    border-l-2 border-t-2 border-r-2
                    ${idx === selectedIdx
                      ? "bg-white border-blue-600 text-blue-700 z-10 hover:bg-gray-100"
                      : "bg-gray-100 border-gray-400 text-gray-500 hover:text-blue-600 hover:bg-white"
                    }`}
                  style={{
                    marginBottom: idx === selectedIdx ? '-2px' : '0',
                    position: idx === selectedIdx ? 'relative' : 'static',
                    top: idx === selectedIdx ? '2px' : '0',
                    borderLeft: '1px solid #9ca3af',
                    borderTop: '1px solid #9ca3af',
                    borderRight: '1px solid #9ca3af',
                    borderBottom: 'none',
                  }}
                  onClick={() => setSelectedIdx(idx)}
                >
                  {person.name}
                </button>
              ))}
            </div>
            {/* Lower half: tab content area with matching borders */}
            <div
              className="bg-white rounded-b-lg shadow p-4 border-2 border-t-0 border-gray-300 w-full max-w-screen-sm mx-auto"
              style={{
                borderTop: 'none',
                borderLeft: '1px solid #9ca3af',
                borderRight: '1px solid #9ca3af',
                borderBottom: '1px solid #9ca3af',
                borderRadius: '0 0 0.75rem 0.75rem'
              }}
            >
              <div className="mb-6">
                <StatisticsWidget
                  range={range}
                  setRange={setRange}
                  loading={loading}
                  setLoading={setLoading}
                  nightscoutUrl={selectedPerson.nightscout_address}
                />
              </div>
              <div className="mb-6">
                {selectedPerson && (
                  <GMI nightscoutUrl={selectedPerson.nightscout_address} />
                )}
              </div>
              <div className="mb-6">
                <AGPGraph range={range} graphData={graphData} />
              </div>
              <div className="mb-6">
                <CarbsChart range={range} carbsData={carbsData} />
              </div>
              <div className="mb-6">
                <PercentileWidget range={range} nightscoutUrl={selectedPerson.nightscout_address} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;