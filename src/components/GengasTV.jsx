import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimes, FaPlay } from "react-icons/fa";

const CHANNELS_URL =
  "https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/channels.json";
const COUNTRIES_URL =
  "https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/countries.geojson.txt";

export default function GengasTV() {
  const globeRef = useRef();
  const [worldData, setWorldData] = useState(null);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [playerChannel, setPlayerChannel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // 🌍 Load countries
  useEffect(() => {
    fetch(COUNTRIES_URL)
      .then((res) => res.json())
      .then((data) => setWorldData(data))
      .catch((err) => console.error("❌ Failed to load countries:", err));
  }, []);

  // 📺 Load channels
  useEffect(() => {
    fetch(CHANNELS_URL)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Channels loaded:", Object.keys(data).length);
        setChannels(data);
      })
      .catch((err) => console.error("❌ Failed to load channels:", err));
  }, []);

  // 🎨 Configure Globe (multi-color)
  useEffect(() => {
    if (!globeRef.current || !worldData) return;
    const g = globeRef.current;

    const colors = [
      "#FF595E",
      "#FFCA3A",
      "#8AC926",
      "#1982C4",
      "#6A4C93",
      "#2A9D8F",
      "#F4A261",
    ];

    // ensure correct API
    if (typeof g.polygonsData === "function") {
      g.polygonsData(worldData.features)
        .polygonCapColor(() => colors[Math.floor(Math.random() * colors.length)])
        .polygonSideColor(() => "rgba(0,0,0,0.25)")
        .polygonStrokeColor(() => "#111")
        .polygonAltitude(() => 0.015)
        .onPolygonClick((feat) => {
          const name = feat.properties.name;
          if (channels[name]) setSelectedCountry(name);
        });
    }

    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.7;
    g.pointOfView({ lat: 20, lng: 0, altitude: 2 });
  }, [worldData, channels]);

  // 🔍 Search
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (!term) return setSuggestions([]);
    const match = Object.keys(channels)
      .filter((c) => c.toLowerCase().includes(term))
      .slice(0, 6);
    setSuggestions(match);
  };

  const handleSelectSuggestion = (country) => {
    setSelectedCountry(country);
    setSearchTerm("");
    setSuggestions([]);
    setSearchOpen(false);
  };

  // 🎬 Channel control
  const handleChannelClick = (ch) => {
    setPlayerChannel(ch); // directly switch to new channel
  };

  const handleClosePlayer = () => {
    setPlayerChannel(null);
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
      {/* 🌍 Globe */}
      <div className="absolute inset-0 z-0">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundColor="#000000"
        />
      </div>

      {/* 🧭 Top Bar */}
      <div className="absolute top-0 left-0 w-full bg-black/50 flex justify-between items-center px-6 py-3 z-50">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🌍 <span className="text-cyan-400">Genga TV</span>
        </h1>

        {/* 🔍 Search */}
        <motion.div
          className="relative flex items-center"
          animate={{ width: searchOpen ? 260 : 40 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 bg-cyan-500/20 rounded-full hover:bg-cyan-500/40"
          >
            <FaSearch className="text-cyan-400" />
          </button>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.3 }}
                className="absolute right-10"
              >
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search country..."
                  className="p-2 pl-3 rounded-md bg-black/70 border border-white/20 text-white placeholder-gray-400 w-52 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                {suggestions.length > 0 && (
                  <ul className="absolute right-0 mt-2 bg-black/90 border border-white/10 rounded-md text-left w-52 z-50">
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 📡 Sidebar Channel List */}
      <AnimatePresence>
        {selectedCountry && (
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
            {selectedChannels.length === 0 ? (
              <p className="text-gray-400">No channels available</p>
            ) : (
              <ul>
                {selectedChannels.map((ch, i) => (
                  <li
                    key={i}
                    onClick={() => handleChannelClick(ch)}
                    className={`p-2 flex justify-between items-center hover:bg-white/10 cursor-pointer ${
                      playerChannel?.name === ch.name
                        ? "bg-cyan-700/30 border-l-2 border-cyan-400"
                        : ""
                    }`}
                  >
                    {ch.name}
                    <FaPlay className="text-xs" />
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎬 Player */}
      <AnimatePresence>
        {playerChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50"
          >
            <div className="relative w-[80vw] max-w-5xl aspect-video bg-black rounded-lg shadow-lg overflow-hidden border border-cyan-700/40">
              <div className="absolute top-0 left-0 w-full flex justify-between items-center bg-cyan-900/50 px-4 py-2 z-10">
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

              <div className="absolute inset-0 mt-8">
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
