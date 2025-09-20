import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { Bars3Icon, ArrowRightCircleIcon } from "@heroicons/react/24/outline";

export default function Layout({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);

    // Close dropdown on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
            <Link
              href="/tools"
              className="text-lg font-semibold px-3 py-2 rounded hover:bg-white hover:bg-opacity-20 transition duration-300 ease-in-out"
            >
              Tools
            </Link>
          </div>

          {/* Right Side: Login or Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            {session ? (
              <>
                {/* Burger Menu for Logged-In Users */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-purple-200 transition duration-300 ease-in-out"
                >
                  <Bars3Icon className="h-6 w-6 text-white" />
                </button>
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg"
                    role="menu"
                  >
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-semibold text-gray-700">
                        Logged in as {session.user?.name || session.user?.email}
                      </p>
                    </div>
                    <Link
                      href="/about"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-200 rounded transition duration-200"
                    >
                      About Me
                    </Link>
                    <Link
                      href="/privacy"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-200 rounded transition duration-200"
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-200 rounded transition duration-200"
                      role="menuitem"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-white hover:bg-purple-200 rounded transition duration-200 focus:outline-none"
                      role="menuitem"
                    >
                      <b>Logout</b>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Login Button for Logged-Out Users */}
                <button
                  onClick={() => signIn("google")}
                  className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-purple-200 transition duration-300 ease-in-out"
                >
                  <ArrowRightCircleIcon className="h-6 w-6 text-white" />
                  <span className="text-sm font-semibold">Login</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="sm:px-0 lg:px-6 pt-8 w-full">{children}</main>
    </div>
  );
}