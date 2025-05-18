import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Layout({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div>
      {/* Navigation Menu */}
      <nav className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg fixed top-0 left-0 w-full z-50">
        <div className="container mx-auto flex justify-between items-center p-4">
          {/* Left Links */}
          <div className="flex space-x-6">
            <Link
              href="/"
              className="text-lg font-semibold px-3 py-2 rounded hover:bg-white hover:bg-opacity-20 transition duration-300 ease-in-out"
            >
              Home
            </Link>
            <Link
              href="/reports"
              className="text-lg font-semibold px-3 py-2 rounded hover:bg-white hover:bg-opacity-20 transition duration-300 ease-in-out"
            >
              Reports
            </Link>
          </div>

          {/* Right Side: About Me or User Info/Sign Out */}
          <div className="flex items-center">
            {session ? (
              <>
                <span className="mr-4">
                  Signed in as {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-lg font-semibold px-3 py-2 rounded hover:bg-white hover:bg-opacity-20 transition duration-300 ease-in-out"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/about"
                className="text-lg font-semibold px-3 py-2 rounded hover:bg-white hover:bg-opacity-20 transition duration-300 ease-in-out"
              >
                About Me
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="sm:px-0 lg:px-6 pt-8 w-full">{children}</main>
    </div>
  );
};

