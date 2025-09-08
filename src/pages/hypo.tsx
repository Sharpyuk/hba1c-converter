import React, { useEffect, useState } from "react";

const HypoPage: React.FC = () => {
  const [status, setStatus] = useState<null | { message: string; date: string }>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/nightscout-hypo")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Unknown error");
        }
        return res.json();
      })
      .then((data) => setStatus({ message: data.message, date: data.date }))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-lg text-center">
      <h1 className="text-2xl font-bold mb-4">Hypo Treatment Trigger</h1>
      {status && (
        <div className="text-green-700 font-semibold">
          {status.message}
          <br />
          <span className="text-gray-700 text-sm">
            {`Time: ${new Date(status.date).toLocaleString()}`}
          </span>
        </div>
      )}
      {error && (
        <div className="text-red-700 font-semibold">
          Error: {error}
        </div>
      )}
      {!status && !error && (
        <div className="text-gray-500">Adding hypo treatment...</div>
      )}
    </div>
  );
};

export default HypoPage;