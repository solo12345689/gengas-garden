import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaTimes, FaSearch } from "react-icons/fa";
import fetchChannels from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [search, setSearch] = useState("");
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 🌍 Load world and channels
  useEffect(() => {
    async function loadData() {
      try {
        const worldRes = await fetch("/countries.geojson");
        const world = await worldRes.json();
        setCountries(world.features);
        console.log(`🌍 Loaded ${world.features.length} countries`);
      } catch (err) {
        console.error("❌ Failed to load countries.geojson", err);
      }

      const data = await fetchChannels();
      if (!data || Object.keys(data).length === 0) {
        console.warn("⚠️ No channels loaded (empty or undefined)");
      } else {
        console.log(`✅ Channels loaded: ${Object.keys(data).length}`);
        setChannels(data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // 🎨 Colorful countries
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || countries.length === 0) return;
    if (typeof globe.polygonsData !== "function") {
      console.warn("⚠️ Globe init skipped (not ready yet)");
      return;
    }

    globe
      .polygonsData(countries)
      .polygonCapColor(() =>
        new THREE.Color(`hsl(${Math.random() * 360}, 60%, 55%)`)
      )
      .polygonSideColor(() => "rgba(0, 100, 255, 0.15)")
      .polygonStrokeColor(() => "#111")
      .onPolygonClick(handleCountryClick);
  }, [countries]);

  // 🖱️ Handle clicking a country
  const handleCountryClick = (country) => {
    const name = country?.properties?.ADMIN;
    if (!name) return;
    setSelectedChannel(null);
    setSelectedCountry(name);
    setSidebarOpen(true);
  };

  // 🔍 Handle search and autosuggest
  const handleSearchChange = (e) => {
    const text = e.target.value;
    setSearch(text);
    if (text.trim() === "") {
      setFilteredCountries([]);
      return;
    }
    const results = countries
      .map((c) => c.properties.ADMIN)
      .filter((n) => n.toLowerCase().includes(text.toLowerCase()))
      .slice(0, 10);
    setFilteredCountries(results);
  };

  const handleSearchSelect = (countryName) => {
    setSelectedCountry(countryName);
    setFilteredCountries([]);
    setSearch(countryName);
  };

  const currentChannels = selectedCountry
    ? channels[selectedCountry]?.channels || []
    : [];

  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden">
      {/* 🌌 Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0a0a1a_0%,#000_100%)] z-0" />

      {/* 🌍 Globe */}
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundColor="rgba(0,0,0,0)"
        height={window.innerHeight}
        width={window.innerWidth}
      />

      {/* 🔝 Top bar */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-md z-10">
        <h1 className="text-2xl font-bold text-blue-400">🌍 Genga TV</h1>
        <div className="flex items-center gap-3">
          {selectedCountry && (
            <button
              onClick={() => setSelectedCountry(null)}
              className="text-gray-300 hover:text-white transition"
              title="Back to globe"
            >
              <FaArrowLeft size={20} />
            </button>
          )}
        </div>
      </div>

      {/* 🔍 Search box */}
      {!selectedChannel && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 z-10">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search for a country..."
              className="w-full bg-gray-800/80 text-white pl-10 pr-3 py-2 rounded-lg outline-none border border-gray-600 focus:border-blue-400 transition"
            />
          </div>
          {filteredCountries.length > 0 && (
            <ul className="absolute bg-gray-900/90 mt-1 rounded-lg w-full border border-gray-700 max-h-48 overflow-y-auto">
              {filteredCountries.map((c) => (
                <li
                  key={c}
                  onClick={() => handleSearchSelect(c)}
                  className="px-3 py-2 hover:bg-blue-600 cursor-pointer"
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 📺 Sidebar */}
      <AnimatePresence>
        {selectedCountry && !selectedChannel && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="absolute right-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-lg p-4 overflow-y-auto z-20"
          >
            <h2 className="text-xl font-semibold mb-4 text-blue-300">
              {selectedCountry}
            </h2>
            {currentChannels.length > 0 ? (
              currentChannels.map((ch, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedChannel(ch)}
                  className="p-2 bg-gray-800 hover:bg-blue-700 rounded-md mb-2 cursor-pointer"
                >
                  <p className="font-medium">{ch.name}</p>
                  <p className="text-xs text-gray-400">{ch.language}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No channels available</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎬 Player overlay */}
      <AnimatePresence>
        {selectedChannel && (
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 flex items-center justify-center z-30"
          >
            <div className="relative w-[80%] max-w-3xl bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800">
              <button
                onClick={() => {
                  setSelectedChannel(null);
                  setSelectedCountry(null);
                }}
                className="absolute top-3 right-3 text-white hover:text-red-500 z-50"
              >
                <FaTimes size={22} />
              </button>

              {selectedChannel.type === "youtube" ? (
                <iframe
                  src={selectedChannel.url}
                  title={selectedChannel.name}
                  className="w-full h-[70vh]"
                  allowFullScreen
                />
              ) : (
                <video
                  controls
                  autoPlay
                  className="w-full h-[70vh] bg-black"
                  src={selectedChannel.url}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
