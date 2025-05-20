import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Layout from "../components/Layout"; // Import the Layout component


const Settings = () => {
  const { data: session } = useSession();
  const [nightscoutAddress, setNightscoutAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/user-settings?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.nightscout_address) {
            setNightscoutAddress(data.nightscout_address);
          }
        });
    }
  }, [session]);

  const handleSave = async () => {
    if (!session?.user?.id) {
      alert("You must be logged in to save settings.");
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch("/api/user-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          nightscoutAddress,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to save settings");
      }
  
      alert("Settings saved successfully!");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <p>Please log in to access settings.</p>;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Nightscout Address
          </label>
          <input
            type="text"
            value={nightscoutAddress}
            onChange={(e) => setNightscoutAddress(e.target.value)}
            placeholder="https://your-nightscout-url"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-500"
          />
          <button
            onClick={handleSave}
            className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;