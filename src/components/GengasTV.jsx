import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import { loadChannels } from "../utils/fetchChannels";
import * as THREE from "three";

export default function GengasTV() {
  const globeRef = useRef();
  const [worldData, setWorldData] = useState(null);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  // Load world map
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((res) => res.json())
      .then((world) => {
        const features = topojson.feature(world, world.objects.countries)
          .features;
        setWorldData(features);
      });
  }, []);

  // Load channels
  useEffect(() => {
    async function loadAll() {
      const ch = await loadChannels();
      console.log("✅ Channels loaded:", Object.keys(ch).slice(0, 10));
      setChannels(ch);
    }
    loadAll();
  }, []);

  // Search filter
  useEffect(() => {
    if (!worldData) return;
    const results = worldData
      .map((c) => c.properties.name)
      .filter((n) =>
        n.toLowerCase().includes(searchTerm.toLowerCase())
      );
    setFilteredCountries(results.slice(0, 10));
  }, [searchTerm, worldData]);

  // When clicking country
  const handleCountryClick = (country) => {
    if (!country || !country.properties) return;
    const name = country.properties.name.trim();
    console.log("🌍 Clicked:", name);

    // Try to find best key
    let foundKey =
      Object.keys(channels).find(
        (k) => k.toLowerCase() === name.toLowerCase()
      ) ||
      Object.keys(channels).find((k) =>
        k.toLowerCase().includes(name.toLowerCase())
      );

    if (foundKey) {
      setSelectedCountry({
        name: foundKey,
        channels: channels[foundKey].channels || [],
      });
      console.log("✅ Matched:", foundKey);
    } else {
      console.warn("❌ No match for", name);
      setSelectedCountry({ name, channels: [] });
    }
  };

  // Fix Globe colors
  useEffect(() => {
    if (!globeRef.current) return;
    const globe = globeRef.current;
    globe
      .polygonsData(worldData || [])
      .polygonAltitude(0.01)
      .polygonCapColor(() => "#" + Math.floor(Math.random() * 16777215).toString(16))
      .polygonSideColor(() => "rgba(0,0,0,0.2)")
      .onPolygonClick(handleCountryClick);
  }, [worldData, channels]);

  const playChannel = (ch) => {
    setSelectedChannel(ch);
  };

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden">
      {/* Background Stars */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle at 50% 50%, #000010, #000000)",
          zIndex: 0,
        }}
      ></div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between p-4 bg-black/40 backdrop-blur-sm z-20">
        <h1 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
          🌍 Genga TV
        </h1>
        <div className="relative">
          <input
            className="px-3 py-2 rounded bg-black/60 text-white outline-none w-64"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredCountries.length > 0 && (
            <div className="absolute bg-black/90 text-white mt-1 w-64 rounded shadow-lg">
              {filteredCountries.map((country) => (
                <div
                  key={country}
                  className="px-3 py-2 hover:bg-cyan-600 cursor-pointer"
                  onClick={() => {
                    const match = worldData.find(
                      (c) =>
                        c.properties.name.toLowerCase() ===
                        country.toLowerCase()
                    );
                    if (match) handleCountryClick(match);
                    setSearchTerm("");
                  }}
                >
                  {country}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Globe */}
      <div className="absolute inset-0 z-10">
        {worldData && (
          <Globe
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            backgroundColor="rgba(0,0,0,0)"
          />
        )}
      </div>

      {/* Sidebar */}
      {selectedCountry && (
        <div className="absolute right-0 top-0 h-full w-80 bg-black/80 p-4 overflow-y-auto z-30 backdrop-blur-lg">
          <h2 className="text-xl font-bold text-cyan-400 mb-2">
            {selectedCountry.name}
          </h2>
          {selectedCountry.channels?.length > 0 ? (
            selectedCountry.channels.map((ch, i) => (
              <div
                key={i}
                className="p-2 border-b border-gray-700 hover:bg-cyan-800 cursor-pointer"
                onClick={() => playChannel(ch)}
              >
                <div className="font-semibold">{ch.name}</div>
                <div className="text-sm opacity-70">{ch.type}</div>
              </div>
            ))
          ) : (
            <p className="opacity-70">No channels available.</p>
          )}
        </div>
      )}

      {/* Player */}
      {selectedChannel && (
        <div className="absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2 bg-black/90 rounded-xl shadow-lg p-4 w-[640px]">
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
              className="w-full h-96 rounded-lg"
              controls
              autoPlay
              src={selectedChannel.url}
            ></video>
          )}
          <button
            className="mt-3 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded"
            onClick={() => setSelectedChannel(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
