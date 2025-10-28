import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaPlay, FaSearch, FaTimes } from "react-icons/fa";

// Fetch channels directly from your public GitHub JSON
const CHANNELS_URL =
  "https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/channels.json";

export default function GengasTV() {
  const globeRef = useRef();
  const [worldData, setWorldData] = useState(null);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [playerChannel, setPlayerChannel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Load world map
  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/countries.geojson.txt"
    )
      .then((res) => res.json())
      .then((data) => setWorldData(data))
      .catch((err) => console.error("❌ Error loading world data:", err));
  }, []);

  // Load channels
  useEffect(() => {
    fetch(CHANNELS_URL)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Channels loaded:", Object.keys(data).length);
        setChannels(data);
      })
      .catch((err) => console.error("❌ Channel load error:", err));
  }, []);

  // Setup globe with multicolor countries
  useEffect(() => {
    if (!worldData || !globeRef.current) return;

    const g = globeRef.current;
    if (typeof g.polygonsData !== "function") return;

    const colors = [
      "#E63946",
      "#F1FAEE",
      "#A8DADC",
      "#457B9D",
      "#1D3557",
      "#F4A261",
      "#2A9D8F",
      "#E9C46A",
      "#264653",
    ];

    g.polygonsData(worldData.features)
      .polygonCapColor(() => colors[Math.floor(Math.random() * colors.length)])
      .polygonSideColor(() => "rgba(0,0,0,0.2)")
      .polygonStrokeColor(() => "#000")
      .polygonAltitude(() => 0.02)
      .onPolygonClick((c) => {
        const name = c.properties.name;
        if (channels[name]) {
          setSelectedCountry(name);
        }
      });

    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.4;
  }, [worldData, channels]);

  // Handle search input
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
    setSearchTerm("");
    setSuggestions([]);
  };

  const handleChannelClick = (ch) => {
    setPlayerChannel(ch);
  };

  const handleClosePlayer = () => {
    setPlayerChannel(null);
    setSelectedCountry(null);
  };

  const selectedChannels = channels[selectedCountry]?.channels || [];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, #000010 0%, #020410 100%)",
      }}
    >
      {/* Globe */}
      <div className="absolute inset-0 z-0">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundColor="#000000"
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full bg-black/50 flex justify-between items-center px-6 py-3 z-50">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🌍 <span className="text-cyan-400">Genga TV</span>
        </h1>
        {selectedCountry && !playerChannel && (
          <button
            onClick={() => setSelectedCountry(null)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-full flex items-center gap-2"
          >
            <FaArrowLeft /> Back
          </button>
        )}
      </div>

      {/* Search Section */}
      {!selectedCountry && !playerChannel && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center z-50">
          <div className="relative w-96 mx-auto">
            <input
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search country..."
              className="w-full p-3 rounded-md bg-black/70 border border-white/20 text-white placeholder-gray-400"
            />
            <FaSearch className="absolute right-3 top-3 text-white/60" />
            {suggestions.length > 0 && (
              <ul className="absolute w-full mt-2 bg-black/90 border border-white/10 rounded-md text-left">
                {suggestions.map((s) => (
                  <li
                    key={s}
                    className="p-2 hover:bg-white/10 cursor-pointer"
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Sidebar with Country Channels */}
      <AnimatePresence>
        {selectedCountry && !playerChannel && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4 }}
            className="absolute right-0 top-0 w-80 h-full bg-black/70 p-4 backdrop-blur-md z-40 overflow-y-auto"
          >
            <h2 className="text-xl text-cyan-400 font-semibold mb-4">
              {selectedCountry} Channels
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

      {/* Video Player (centered perfectly) */}
      <AnimatePresence>
        {playerChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50"
          >
            <div className="relative w-[80%] max-w-4xl h-[70%] bg-black rounded-lg shadow-xl overflow-hidden">
              <div className="flex justify-between items-center bg-cyan-900/50 px-4 py-2">
                <h2 className="text-cyan-400 font-semibold text-lg">
                  {playerChannel.name}
                </h2>
                <button
                  onClick={handleClosePlayer}
                  className="text-white text-2xl hover:text-red-400"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="flex-1">
                {playerChannel.type === "youtube" ? (
                  <iframe
                    src={playerChannel.url}
                    title={playerChannel.name}
                    className="w-full h-full"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video
                    src={playerChannel.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
