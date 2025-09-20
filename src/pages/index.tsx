import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import BloodSugarWidget from '../components/BloodSugarWidget';
//import ConverterForm from '../components/ConverterForm';
import HypoTreatmentsWidget from "../components/HypoWidget";
//import CarbCalculatorWidget from "../components/CarbCalculatorWidget";
import IOBCOBWidget from "../components/IOBCOBWidget";
import { useSession } from "next-auth/react";

interface Person {
  name: string;
  nightscout_address: string;
  nightscout_api_secret?: string;
}

const Home = () => {
  const { data: session } = useSession();
  const [defaultUser, setDefaultUser] = useState<Person | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/user-settings?userId=${encodeURIComponent(session.user.email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.defaultUser) setDefaultUser(data.defaultUser);
        if (data.people) setPeople(data.people);
      });
  }, [session]);

  // Combine default user and managed people for tabs
  const allTabs = [
    ...(defaultUser ? [defaultUser] : []),
    ...people,
  ];
  const selectedPerson = allTabs[selectedIdx];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-16 sm:px-6 lg:px-8 w-full">
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
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

                      borderLeft: '1px solid #9ca3af',   // blue-600
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
              <div className="bg-white rounded-b-lg shadow p-4 border-2 border-t-0 border-gray-300">
                {/* Tab content goes here */}
                {selectedPerson && (
                  <>
                    <BloodSugarWidget nightscoutUrl={selectedPerson.nightscout_address} />
                    <IOBCOBWidget nightscoutUrl={selectedPerson.nightscout_address} />
                    <HypoTreatmentsWidget 
                      personId={selectedIdx === 0 ? selectedPerson.name : selectedPerson.name}
                      nightscoutUrl={selectedPerson.nightscout_address} 
                    />
                  </>
                )}
              </div>
            </div>
          )}
          
        </div>
        
        <div className="text-center mt-6">
          <Link href="/privacy" className="text-blue-500 underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Home;