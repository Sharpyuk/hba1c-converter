import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Layout from "../components/Layout";

interface Person {
  name: string;
  nightscout_address: string;
  nightscout_api_secret?: string;
}

const Settings = () => {
  const { data: session } = useSession();
  const [defaultName, setDefaultName] = useState("Me");
  const [defaultUrl, setDefaultUrl] = useState("");
  const [defaultSecret, setDefaultSecret] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Form state for adding/editing
  const [personName, setPersonName] = useState("");
  const [personUrl, setPersonUrl] = useState("");
  const [personSecret, setPersonSecret] = useState("");

  // Load settings from backend
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/user-settings?userId=${encodeURIComponent(session.user.email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.defaultUser) {
          setDefaultName(data.defaultUser.name || "Me");
          setDefaultUrl(data.defaultUser.nightscout_address || "");
          setDefaultSecret(data.defaultUser.nightscout_api_secret || "");
        }
        if (data.people) setPeople(data.people);
      });
  }, [session]);

  // Save default user settings
  const saveDefault = async () => {
    if (!session?.user?.email) return;
    await fetch("/api/user-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.email,
        defaultName,
        nightscoutAddress: defaultUrl,
        nightscoutApiSecret: defaultSecret,
      }),
    });
    alert("Default user updated!");
  };

  // Save managed people
  const savePeople = async (newPeople: Person[]) => {
    if (!session?.user?.email) return;
    await fetch("/api/user-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.email,
        people: newPeople,
      }),
    });
  };

  // Add or update a person
  const handlePersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !personUrl.trim()) return;
    let newPeople = [...people];
    if (editingIdx !== null) {
      newPeople[editingIdx] = {
        name: personName.trim(),
        nightscout_address: personUrl.trim(),
        nightscout_api_secret: personSecret.trim(),
      };
    } else {
      newPeople.push({
        name: personName.trim(),
        nightscout_address: personUrl.trim(),
        nightscout_api_secret: personSecret.trim(),
      });
    }
    setPeople(newPeople);
    await savePeople(newPeople);
    setPersonName("");
    setPersonUrl("");
    setPersonSecret("");
    setEditingIdx(null);
  };

  // Edit a person
  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setPersonName(people[idx].name);
    setPersonUrl(people[idx].nightscout_address);
    setPersonSecret(people[idx].nightscout_api_secret || "");
  };

  // Remove a person
  const handleRemove = async (idx: number) => {
    const newPeople = people.filter((_, i) => i !== idx);
    setPeople(newPeople);
    await savePeople(newPeople);
    if (editingIdx === idx) {
      setEditingIdx(null);
      setPersonName("");
      setPersonUrl("");
      setPersonSecret("");
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingIdx(null);
    setPersonName("");
    setPersonUrl("");
    setPersonSecret("");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          {/* Default user */}
          <h2 className="text-lg font-semibold mb-2">Your Nightscout Account</h2>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={defaultName}
              onChange={e => setDefaultName(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-2"
              placeholder="Your name"
            />
            <label className="block mb-1 text-sm font-medium text-gray-700">Nightscout URL</label>
            <input
              type="text"
              value={defaultUrl}
              onChange={e => setDefaultUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-2"
              placeholder="https://your-nightscout-url"
            />
            <label className="block mb-1 text-sm font-medium text-gray-700">API Secret</label>
            <input
              type="password"
              value={defaultSecret}
              onChange={e => setDefaultSecret(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="API Secret"
            />
            <button
              onClick={saveDefault}
              className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
            >
              Save Default
            </button>
          </div>
          <hr className="my-6" />
          {/* Managed people */}
          <h2 className="text-lg font-semibold mb-2">People You Manage</h2>
          <form onSubmit={handlePersonSubmit} className="mb-4">
            <div className="mb-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={personName}
                onChange={e => setPersonName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Person's name"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">Nightscout URL</label>
              <input
                type="text"
                value={personUrl}
                onChange={e => setPersonUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="https://their-nightscout-url"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">API Secret</label>
              <input
                type="password"
                value={personSecret}
                onChange={e => setPersonSecret(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="API Secret"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="mt-2 flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
              >
                {editingIdx !== null ? "Update Person" : "Add Person"}
              </button>
              {editingIdx !== null && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="mt-2 flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          {people.length === 0 ? (
            <div className="text-gray-500 italic">No people added yet.</div>
          ) : (
            <table className="w-full text-sm mb-2">
              <thead>
                <tr>
                  <th className="px-2 py-1 border">Name</th>
                  <th className="px-2 py-1 border">Nightscout URL</th>
                  <th className="px-2 py-1 border">API Secret</th>
                  <th className="px-2 py-1 border"></th>
                </tr>
              </thead>
              <tbody>
                {people.map((person, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 border">{person.name}</td>
                    <td className="px-2 py-1 border">{person.nightscout_address}</td>
                    <td className="px-2 py-1 border">
                      {person.nightscout_api_secret ? "••••••••" : <span className="text-gray-400">None</span>}
                    </td>
                    <td className="px-2 py-1 border">
                      <button
                        className="text-blue-600 underline text-xs mr-2"
                        onClick={() => handleEdit(idx)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 underline text-xs"
                        onClick={() => handleRemove(idx)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Settings;