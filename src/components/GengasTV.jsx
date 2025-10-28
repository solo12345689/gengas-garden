import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaArrowLeft, FaTimes } from "react-icons/fa";
import * as THREE from "three";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  // 🎨 Load countries from local .txt geojson file
  useEffect(() => {
    async function loadWorld() {
      try {
        const res = await fetch("/countries.geojson.txt");
        const json = await res.json();
        const features = json.features.map((d) => ({
          ...d,
          color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        }));
        setCountries(features);
        console.log("🌍 Loaded", features.length, "countries");
      } catch (e) {
        console.error("❌ Failed to load world data:", e);
      }
    }
    loadWorld();
  }, []);

  // 📺 Load channels from GitHub or cache
  useEffect(() => {
    async function fetchAll() {
      const data = await loadChannels();
      console.log("✅ Channels loaded:", data ? Object.keys(data).length : 0);
      if (data) setChannels(data);
    }
    fetchAll();
  }, []);

  // 🌀 Initialize globe when ready
  useEffect(() => {
    if (countries.length && globeRef.current) {
      const g = globeRef.current;
      g
        .polygonsData(countries)
        .polygonCapColor((d) => d.color)
        .polygonSideColor(() => "rgba(0,100,150,0.15)")
        .polygonStrokeColor(() => "#111")
        .onPolygonClick((d) => handleCountryClick(d))
        .backgroundColor("rgba(0,0,0,1)")
        .showAtmosphere(true)
        .atmosphereColor("lightskyblue")
        .atmosphereAltitude(0.2);
    }
  }, [countries]);

  // 🌎 Handle country click
  function handleCountryClick(d) {
    if (!d || !d.properties) return;
    const countryName = d.properties.ADMIN;
    setSelectedCountry(countryName);
    setSelectedChannel(null);
    console.log("🗺 Clicked:", countryName);
  }

  // 🔍 Handle search input and suggestions
  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    if (!val) {
      setSuggestions([]);
      return;
    }
    const all = countries.map((d) => d.properties.ADMIN);
    const filtered = all.filter((name) =>
      name.toLowerCase().includes(val.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 10));
  }

  // 📦 Filter channels for selected country
  const countryChannels =
    selectedCountry && channels[selectedCountry]
      ? channels[selectedCountry].channels
      : [];

  // 🎬 Render player (centered)
  const renderPlayer = () => {
    if (!selectedChannel) return null;
    return (
      <motion.div
        key="player"
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 flex items-center justify-center bg-black/90 z-50"
      >
        <div className="relative w-[90vw] max-w-4xl h-[60vh] bg-black rounded-2xl overflow-hidden shadow-2xl">
          <button
            onClick={() => {
              setSelectedChannel(null);
              setSelectedCountry(null);
            }}
            className="absolute top-3 right-3 text-white bg-red-600 hover:bg-red-700 rounded-full w-10 h-10 flex items-center justify-center z-10"
          >
            <FaTimes size={20} />
          </button>

          {selectedChannel.type === "youtube" ? (
            <iframe
              src={selectedChannel.url}
              className="w-full h-full"
              allowFullScreen
              title={selectedChannel.name}
            />
          ) : (
            <video
              src={selectedChannel.url}
              className="w-full h-full"
              controls
              autoPlay
            />
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      {/* 🌟 Starry background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0b1c2c,_#000)] z-0"></div>

      {/* 🌍 Genga TV Header */}
      {!selectedChannel && (
        <div className="absolute top-0 left-0 w-full flex justify-between items-center p-4 bg-black/70 backdrop-blur-md z-20">
          {selectedCountry ? (
            <button
              onClick={() => setSelectedCountry(null)}
              className="flex items-center gap-2 text-white hover:text-blue-400"
            >
              <FaArrowLeft /> Back
            </button>
          ) : (
            <h1 className="text-2xl font-bold tracking-wide text-blue-400">
              🌍 Genga TV
            </h1>
          )}
          {!selectedCountry && (
            <div className="relative w-64">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-blue-400"
              />
              {suggestions.length > 0 && (
                <div className="absolute mt-1 bg-gray-900 rounded-lg shadow-lg w-full z-30 max-h-48 overflow-y-auto">
                  {suggestions.map((s) => (
                    <div
                      key={s}
                      onClick={() => {
                        setSelectedCountry(s);
                        setSuggestions([]);
                        setSearch("");
                      }}
                      className="px-4 py-2 hover:bg-blue-600 cursor-pointer"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 🌐 Globe */}
      {!selectedChannel && (
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <Globe ref={globeRef} />
        </div>
      )}

      {/* 📋 Sidebar with channels */}
      <AnimatePresence>
        {selectedCountry && !selectedChannel && (
          <motion.div
            key="sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.4 }}
            className="absolute left-0 top-0 h-full w-80 bg-gray-950/90 backdrop-blur-md p-4 overflow-y-auto z-30"
          >
            <h2 className="text-xl font-semibold mb-4 text-blue-400">
              {selectedCountry}
            </h2>
            {countryChannels.length === 0 ? (
              <p className="text-gray-400">No channels available.</p>
            ) : (
              countryChannels.map((ch, idx) => (
                <div
                  key={idx}
                  className="p-3 mb-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-blue-700 transition"
                  onClick={() => setSelectedChannel(ch)}
                >
                  <p className="font-medium">{ch.name}</p>
                  <p className="text-sm text-gray-400">{ch.type}</p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎥 Center Player */}
      <AnimatePresence>{renderPlayer()}</AnimatePresence>
    </div>
  );
}
