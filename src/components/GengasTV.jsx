import React, { useEffect, useState, useRef } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import * as THREE from "three";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🎨 Generate random colors per country
  const getRandomColor = (seed) => {
    const hue = (seed * 137.5) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // 🌍 Load world map and channels
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/world-110m.json");
        const worldData = await res.json();
        const features = topojson.feature(worldData, worldData.objects.countries).features;
        setCountries(features);
      } catch (e) {
        console.error("Failed to load world map:", e);
      }

      const ch = await loadChannels();
      if (ch) setChannels(ch);

      setLoading(false);
    };

    loadData();
  }, []);

  // 🖱️ Handle country click — match ISO codes and names
  const handleClick = (f) => {
    if (!f) return;
    const isoCode = f.properties?.iso_a2 || f.id || f.properties?.name;
    const code = isoCode?.toUpperCase();

    const countryData =
      channels[code] ||
      Object.values(channels).find(
        (c) =>
          c.name?.toLowerCase() === f.properties.name?.toLowerCase() ||
          c.code === code
      );

    if (countryData && countryData.channels?.length) {
      setSelectedCountry({
        code: code,
        name: f.properties.name,
        channels: countryData.channels,
      });
    } else {
      console.warn("No match for", f.properties.name, code);
      setSelectedCountry({
        code: code,
        name: f.properties.name,
        channels: [],
      });
    }
  };

  // 🌈 Country coloring (political style)
  const getCountryColor = (country) => {
    const id = country?.id || 0;
    return getRandomColor(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white text-xl">
        Loading Gengas TV Globe...
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 🌍 Globe */}
      <Globe
        ref={globeRef}
        width={window.innerWidth}
        height={window.innerHeight}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundColor="rgba(0,0,0,1)"
        polygonsData={countries}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => "rgba(0,100,255,0.2)"}
        polygonStrokeColor={() => "#111"}
        onPolygonClick={handleClick}
        polygonLabel={(d) => `${d.properties.name}`}
        showAtmosphere={true}
        atmosphereColor="lightskyblue"
        atmosphereAltitude={0.25}
      />

      {/* 🏷️ Title */}
      <div className="absolute top-6 left-6 text-4xl font-bold text-white drop-shadow-lg">
        🌐 Gengas TV
      </div>

      {/* 📺 Sidebar for channels */}
      {selectedCountry && (
        <div className="absolute right-0 top-0 h-full w-80 bg-[#0b0b0b]/90 text-white p-5 overflow-y-auto border-l border-gray-700">
          <h2 className="text-2xl font-semibold mb-4">
            {selectedCountry.name} ({selectedCountry.code})
          </h2>

          {selectedCountry.channels.length > 0 ? (
            <div className="space-y-4">
              {selectedCountry.channels.map((ch, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#2c2c2c] transition"
                >
                  <h3 className="font-medium">{ch.name}</h3>
                  <p className="text-sm text-gray-400">
                    {ch.language?.toUpperCase() || "Unknown"}
                  </p>
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm hover:underline"
                  >
                    Watch Channel →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No channels available</p>
          )}
        </div>
      )}
    </div>
  );
}
