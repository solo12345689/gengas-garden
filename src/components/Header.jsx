import React from "react";
import { FaBars, FaSearch, FaGlobe } from "react-icons/fa";

export default function Header({ onSearch }) {
  return (
    <header
      className="fixed top-0 left-0 w-full z-50 flex items-center justify-between 
                 bg-[#111111]/90 text-white p-3 shadow-md backdrop-blur-md"
    >
      {/* Left Logo */}
      <div className="flex items-center space-x-2">
        <FaBars className="text-gray-400 text-xl cursor-pointer" />
        <div className="flex items-center bg-green-500 rounded-md px-2 py-1">
          <span className="text-black font-bold text-xl">TV</span>
        </div>
        <span className="ml-1 text-lg font-semibold text-white">Genga</span>
      </div>

      {/* Right Search Bar */}
      <div className="flex items-center bg-[#1e1e1e] border border-gray-700 rounded-md px-3 py-1">
        <input
          type="text"
          placeholder="Filter Countries..."
          onChange={(e) => onSearch(e.target.value)}
          className="bg-transparent outline-none text-white placeholder-gray-400"
        />
        <FaSearch className="ml-2 text-gray-400" />
      </div>
    </header>
  );
}
