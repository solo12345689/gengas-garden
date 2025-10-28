import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import * as THREE from "three";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // 🌍 Load countries
  useEffect(() => {
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((world) => {
        const features = topojson.feature(world, world.objects.countries).features;
        setCountries(features);
        console.log("🌍 Loaded", features.length, "countries");
      });
  }, []);

  // 📺 Load channels
  useEffect(() => {
    (async () => {
      const data = await loadChannels();
      if (data) {
        setChannels(data);
        console.log("✅ Channels loaded:", Object.keys(data).length);
      }
    })();
  }, []);

  // 🎨 Globe setup
  useEffect(() => {
    if (!globeRef.current || countries.length === 0) return;

    const globe = globeRef.current;
    const colorFor = (name) => {
      const hue = (name.charCodeAt(0) * 47) % 360;
      return `hsl(${hue}, 70%, 50%)`;
    };

    const wait = setInterval(() => {
      if (typeof globe.polygonsData === "function") {
        globe
          .polygonsData(countries)
          .polygonCapColor((d) => colorFor(d.properties.name))
          .polygonSideColor(() => "rgba(30,30,30,0.3)")
          .polygonStrokeColor(() => "#111")
          .polygonAltitude(0.01)
          .onPolygonClick(handleCountryClick)
          .showAtmosphere(true)
          .atmosphereColor("cyan")
          .atmosphereAltitude(0.25);
        clearInterval(wait);
      }
    }, 500);

    return () => clearInterval(wait);
  }, [countries]);

  // 🕹 Handle country click
  const normalize = (str) => str?.toLowerCase().replace(/[^a-z]/g, "") || "";

  const handleCountryClick = (country) => {
    const name = country?.properties?.name;
    if (!name) return;
    const keys = Object.keys(channels);
    const norm = normalize(name);

    const match =
      keys.find((k) => normalize(k) === norm) ||
      keys.find((k) => normalize(k).includes(norm)) ||
      keys.find((k) => norm.includes(normalize(k)));

    if (match) {
      setSelectedCountry({ name: match, channels: channels[match].channels });
    } else {
      setSelectedCountry({ name, channels: [] });
    }
  };

  // 🔎 Handle search + suggestions
  const handleSearch = (value) => {
    setSearch(value);
    if (!value.trim()) return setSuggestions([]);
    const norm = normalize(value);
    const filtered = Object.keys(channels)
      .filter((k) => normalize(k).includes(norm))
      .slice(0, 10);
    setSuggestions(filtered);
  };

  const handleSuggestionClick = (name) => {
    setSearch(name);
    setSuggestions([]);
    const match = channels[name];
    if (match) {
      setSelectedCountry({ name, channels: match.channels });
    }
  };

  // ▶ IPTV HLS player
  useEffect(() => {
    if (!selectedChannel || selectedChannel.type !== "iptv") return;
    const video = document.getElementById("hls-player");
    if (video && selectedChannel.url.endsWith(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(selectedChannel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = selectedChannel.url;
      }
    }
  }, [selectedChannel]);

  return (
    <div className="relative h-screen w-full overflow-hidden text-white">
      {/* 🌌 Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #000010, #000000) url('https://www.transparenttextures.com/patterns/stardust.png')",
          backgroundSize: "cover",
        }}
      />

      {/* 🧭 Top bar */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between p-4 bg-black/70 z-10 border-b border-cyan-600">
        <h1 className="text-2xl font-bold text-cyan-400">🌐 Genga TV</h1>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search countries..."
            className="p-2 rounded bg-gray-900 text-white border border-cyan-500 w-64"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-black border border-cyan-600 rounded mt-1 z-20">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="px-3 py-2 hover:bg-cyan-700 cursor-pointer"
                  onClick={() => handleSuggestionClick(s)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🌍 Globe */}
      <div className="absolute inset-0 z-0">
        <Globe
          ref={globeRef}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          showAtmosphere
          atmosphereColor="cyan"
          atmosphereAltitude={0.25}
        />
      </div>

      {/* 📜 Sidebar */}
      <AnimatePresence>
        {selectedCountry && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="absolute right-0 top-0 h-full w-80 bg-black/85 p-4 overflow-y-auto z-10 border-l border-cyan-700"
          >
            <h2 className="text-xl font-bold text-cyan-400 mb-3">
              {selectedCountry.name}
            </h2>
            {selectedCountry.channels?.length > 0 ? (
              selectedCountry.channels.map((ch, i) => (
                <div
                  key={i}
                  className="p-2 border-b border-gray-700 hover:bg-cyan-700 cursor-pointer"
                  onClick={() => setSelectedChannel(ch)}
                >
                  <div className="font-semibold">{ch.name}</div>
                  <div className="text-sm opacity-70">{ch.type}</div>
                </div>
              ))
            ) : (
              <p className="opacity-60">No channels available.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ▶ Player */}
      <AnimatePresence>
        {selectedChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/90 rounded-xl p-4 w-[640px] border border-cyan-700 shadow-xl"
          >
            <h3 className="text-lg font-bold mb-2 text-cyan-400">
              {selectedChannel.name}
            </h3>
            {selectedChannel.type === "youtube" ? (
              <iframe
                className="w-full h-96 rounded-lg"
                src={selectedChannel.url}
                allowFullScreen
              ></iframe>
            ) : (
              <video
                id="hls-player"
                className="w-full h-96 rounded-lg"
                controls
                autoPlay
              ></video>
            )}
            <button
              className="mt-3 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded"
              onClick={() => setSelectedChannel(null)}
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
