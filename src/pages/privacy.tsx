import Layout from "../components/Layout";

const PrivacyPolicy = () => (
  <Layout>
    <div className="max-w-2xl mx-auto py-10 px-4 bg-white rounded shadow">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Privacy Policy</h1>
      <p className="mb-4">
        <b>Dejunked Health</b> respects your privacy. This policy explains how we collect, use, and protect your information.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Information We Collect</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>Personal information you provide (such as your name and Nightscout URL).</li>
        <li>Health data you enter or sync from Nightscout.</li>
        <li>Technical data (device type, operating system, etc.) for app improvement.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">How We Use Information</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>To provide app features and personalize your experience.</li>
        <li>To improve app performance and security.</li>
        <li>We do not sell or share your data with third parties except as required by law.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">Data Security</h2>
      <p className="mb-4">
        We use industry-standard security measures to protect your data. You are responsible for keeping your device and credentials secure.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Your Choices</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>You may update or delete your information in the app settings.</li>
        <li>Contact us if you have questions or requests about your data.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
      <p>
        For privacy questions, contact: <a href="mailto:support@sharpestcomputers.com" className="text-blue-600 underline">support@sharpestcomputers.com</a>
      </p>
      <p className="mt-8 text-gray-500 text-sm">Last updated: September 2025</p>
    </div>
  </Layout>
);

export default PrivacyPolicy;