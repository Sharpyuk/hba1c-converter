import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import BloodSugarWidget from '../components/BloodSugarWidget';
import HypoTreatmentsWidget from "../components/HypoWidget";
import IOBCOBWidget from "../components/IOBCOBWidget";
import { AuthContext } from "./_app"; // Import AuthContext
import MobileLogin from "../components/MobileLogin"; // Import your login component

interface Person {
  name: string;
  nightscout_address: string;
  nightscout_api_secret?: string;
}

const Home = () => {
  const { token } = useContext(AuthContext); // Get token from context
  const [defaultUser, setDefaultUser] = useState<Person | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Only fetch user settings if authenticated
  useEffect(() => {
    if (!token) return;
    fetch(`/api/user-settings?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.defaultUser) setDefaultUser(data.defaultUser);
        if (data.people) setPeople(data.people);
      });
  }, [token]);

  // Combine default user and managed people for tabs
  const allTabs = [
    ...(defaultUser ? [defaultUser] : []),
    ...people,
  ];
  const selectedPerson = allTabs[selectedIdx];

  // Show login screen if not authenticated
  if (!token) {
    return <MobileLogin />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-16 sm:px-6 lg:px-8 w-full">
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          {allTabs.length > 0 && (
            <div className="flex gap-2 mb-4">
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
          {selectedPerson && (
            <>
              <BloodSugarWidget nightscoutUrl={selectedPerson.nightscout_address} />
              <IOBCOBWidget nightscoutUrl={selectedPerson.nightscout_address} />
            </>
          )}
        </div>
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          {selectedPerson && (
            <HypoTreatmentsWidget 
              personId={selectedIdx === 0 ? selectedPerson.name : selectedPerson.name}
              nightscoutUrl={selectedPerson.nightscout_address} 
            />
          )}
        </div>
        <div className="text-center mt-6">
          <Link href="/reports" className="text-blue-500 underline">
            View Reports
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Home;