import React, { useContext } from "react";
import { Browser } from "@capacitor/browser";
import { AuthContext } from "../pages/_app";

const BACKEND_URL = "https://craigsharpe.me.uk";

const MobileLogin: React.FC = () => {
  const { setToken } = useContext(AuthContext);

  const handleLogin = async () => {
    // Open Google login in external browser
    await Browser.open({ url: `${BACKEND_URL}/api/auth/signin/google` });
    // After login, your backend should redirect to a deep link like: myapp://auth?token=JWT
    // You need to handle this deep link in your app (see next step)
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <button
        className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow"
        onClick={handleLogin}
      >
        Login with Google
      </button>
    </div>
  );
};

export default MobileLogin;