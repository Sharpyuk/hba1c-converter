import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const DEFAULT_NIGHTSCOUT_URL = "https://sharpy-cgm.up.railway.app";
const BG_THRESHOLD = 4.3;

const HypoPage: React.FC = () => {
  const { data: session } = useSession();
  const [nightscoutUrl, setNightscoutUrl] = useState(DEFAULT_NIGHTSCOUT_URL);
  const [urlLoaded, setUrlLoaded] = useState(false);
  const [currentBg, setCurrentBg] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch user's Nightscout URL
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/user-settings?userId=${session.user.email}`)
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
  }, [session]);

  // Fetch current blood glucose
  useEffect(() => {
    if (!urlLoaded) return;
    fetch(`${nightscoutUrl}/api/v1/entries.json?count=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setCurrentBg(data[0].sgv / 18); // Convert mg/dL to mmol/L
        }
      });
  }, [nightscoutUrl, urlLoaded]);

  // Attempt to register hypo automatically if BG is below threshold
  useEffect(() => {
    if (currentBg !== null && !registering && !message) {
      if (currentBg < BG_THRESHOLD) {
        registerHypo();
      } else {
        setShowConfirm(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBg]);

  const registerHypo = () => {
    setRegistering(true);
    fetch("/api/nightscout-hypo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        glucose: currentBg,
      }),
    })
      .then(res => res.json())
      .then(data => {
        setMessage("Hypo registered successfully!");
      })
      .catch(() => setMessage("Failed to register hypo."))
      .finally(() => setRegistering(false));
  };

  if (!urlLoaded || currentBg === null) return <div>Loading...</div>;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-lg text-center">
      <h2 className="text-2xl font-bold mb-4">Register Hypo</h2>
      <p className="mb-4">
        Current Blood Glucose: {currentBg.toFixed(1)} mmol/L
      </p>
      {message && <div className="mb-4 text-green-600">{message}</div>}
      {showConfirm && !message && (
        <div>
          <p className="mb-4 text-yellow-700 font-semibold">
            Current Reading is too high, are you sure you are treating a hypo?
          </p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            onClick={() => {
              setShowConfirm(false);
              registerHypo();
            }}
            disabled={registering}
          >
            Yes
          </button>
          <button
            className="bg-gray-400 text-white px-4 py-2 rounded"
            onClick={() => setShowConfirm(false)}
            disabled={registering}
          >
            No
          </button>
        </div>
      )}
    </div>
  );
};

export default HypoPage;