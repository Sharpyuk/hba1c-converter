import React from 'react';
import Link from 'next/link';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

          {/* Right Link */}
          <div>
            <Link
              href="/about"
              className="text-lg font-semibold px-3 py-2 rounded hover:bg-white hover:bg-opacity-20 transition duration-300 ease-in-out"
            >
              About Me
            </Link>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="sm:px-0 lg:px-6 pt-20 w-full">{children}</main>
    </div>
  );
};

export default Layout;