import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaPlay, FaSearch, FaTimes } from "react-icons/fa";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [worldData, setWorldData] = useState(null);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [playerChannel, setPlayerChannel] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  // 🗺️ Load world countries (GeoJSON)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/countries.geojson.txt");
        const json = await res.json();
        const geo = topojson.feature(json, json.objects.countries);
        console.log("🌍 Loaded", geo.features.length, "countries");
        setWorldData(geo);
      } catch (err) {
        console.error("❌ Failed to load countries:", err);
      }
    })();
  }, []);

  // 📺 Load channels
  useEffect(() => {
    (async () => {
      const data = await loadChannels();
      console.log("✅ Channels loaded:", data ? Object.keys(data).length : 0);
      if (data) setChannels(data);
    })();
  }, []);

  // 🎨 Setup globe when ready
  useEffect(() => {
    if (!globeRef.current || !worldData) return;
    const g = globeRef.current;

    const setupGlobe = () => {
      if (typeof g.polygonsData !== "function") {
        console.warn("⚠️ Globe not ready yet, retrying...");
        setTimeout(setupGlobe, 500);
        return;
      }

      g.polygonsData(worldData.features)
        .polygonCapColor(() => {
          const r = Math.floor(Math.random() * 255);
          const g = Math.floor(Math.random() * 255);
          const b = Math.floor(Math.random() * 255);
          return `rgba(${r},${g},${b},0.8)`;
        })
        .polygonSideColor(() => "rgba(0,0,0,0.15)")
        .polygonStrokeColor(() => "#111")
        .polygonAltitude(() => 0.01)
        .backgroundColor("#020314");
    };

    setupGlobe();
  }, [worldData]);

  // 🌍 Handle click on country
  const handleCountryClick = (polygon) => {
    if (!polygon) return;
    const name = polygon.properties?.name;
    setSelectedCountry(name);
    setPlayerChannel(null);
    setShowSidebar(true);
  };

  // 🔍 Handle search
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (!term) return setSuggestions([]);
    const matches = Object.keys(channels)
      .filter((c) => c.toLowerCase().includes(term))
      .slice(0, 6);
    setSuggestions(matches);
  };

  const handleSelectSuggestion = (country) => {
    setSelectedCountry(country);
    setSuggestions([]);
  };

  const selectedChannels = channels[selectedCountry]?.channels || [];

  // 🎥 Handle channel click
  const handleChannelClick = (ch) => {
    setPlayerChannel(ch);
  };

  // ❌ Close player and return to search
  const closePlayer = () => {
    setPlayerChannel(null);
    setSelectedCountry(null);
    setShowSidebar(true);
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden text-white"
      style={{
        background: "radial-gradient(circle at 20% 20%, #04061a 0%, #000010 100%)",
      }}
    >
      {/* Globe */}
      <div className="absolute inset-0">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="#000000"
          onPolygonClick={handleCountryClick}
          polygonsTransitionDuration={300}
          enablePointerInteraction={true}
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 w-full flex justify-between items-center p-4 bg-black/30 backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-wide">🌍 Genga TV</h1>
        {!playerChannel && selectedCountry && (
          <button
            onClick={() => setSelectedCountry(null)}
            className="text-white/80 hover:text-white text-lg flex items-center gap-2"
          >
            <FaArrowLeft /> Back
          </button>
        )}
      </div>

      {/* Search Box */}
      {!selectedCountry && !playerChannel && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-80 text-center">
          <div className="relative">
            <input
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search country..."
              className="w-full p-3 rounded-md bg-black/50 border border-white/20 text-white outline-none"
            />
            <FaSearch className="absolute right-3 top-3 text-white/40" />
          </div>
          {suggestions.length > 0 && (
            <ul className="bg-black/80 mt-2 rounded-md">
              {suggestions.map((c) => (
                <li
                  key={c}
                  className="p-2 hover:bg-white/20 cursor-pointer"
                  onClick={() => handleSelectSuggestion(c)}
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sidebar - Channel list */}
      <AnimatePresence>
        {selectedCountry && !playerChannel && showSidebar && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.4 }}
            className="absolute left-0 top-0 h-full w-80 bg-black/70 backdrop-blur-md p-4 overflow-y-auto"
          >
            <h2 className="text-xl font-semibold mb-3">
              {selectedCountry} ({selectedChannels.length})
            </h2>
            {selectedChannels.length === 0 && (
              <p className="text-gray-400">No channels available</p>
            )}
            <ul>
              {selectedChannels.map((ch, i) => (
                <li
                  key={i}
                  onClick={() => handleChannelClick(ch)}
                  className="p-2 hover:bg-white/10 cursor-pointer flex justify-between items-center"
                >
                  {ch.name}
                  <FaPlay className="text-xs" />
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player */}
      <AnimatePresence>
        {playerChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-lg"
          >
            <div className="relative w-[80%] h-[70%] bg-black rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={closePlayer}
                className="absolute top-3 right-3 text-white text-2xl hover:text-red-400"
              >
                <FaTimes />
              </button>
              {playerChannel.type === "youtube" ? (
                <iframe
                  src={playerChannel.url}
                  title={playerChannel.name}
                  className="w-full h-full"
                  allowFullScreen
                ></iframe>
              ) : (
                <video src={playerChannel.url} controls autoPlay className="w-full h-full" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
