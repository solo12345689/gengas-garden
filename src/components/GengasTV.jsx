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

  // 🎨 Generate consistent color per country
  const getRandomColor = (id) => {
    const hue = (id * 45) % 360;
    return `hsl(${hue}, 70%, 55%)`;
  };

  // 🌍 Load world map + channels
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/world-110m.json");
        const worldData = await res.json();
        const features = topojson.feature(worldData, worldData.objects.countries).features;
        setCountries(features);
      } catch (err) {
        console.error("Failed to load world map:", err);
      }

      const ch = await loadChannels();
      if (ch) setChannels(ch);

      setLoading(false);
    };

    loadData();
  }, []);

  // 🖱️ Handle click (match ISO code properly)
  const handleClick = (f) => {
    if (!f) return;

    const isoCode =
      f.properties?.iso_a2?.toUpperCase() ||
      f.properties?.iso_a3?.toUpperCase() ||
      f.properties?.name?.toUpperCase();

    console.log("Clicked country:", f.properties.name, "→", isoCode);

    const countryData =
      channels[isoCode] ||
      Object.values(channels).find(
        (c) =>
          c.name?.toLowerCase() === f.properties.name?.toLowerCase() ||
          c.code?.toUpperCase() === isoCode
      );

    if (countryData && countryData.channels?.length) {
      setSelectedCountry({
        code: isoCode,
        name: f.properties.name,
        channels: countryData.channels,
      });
    } else {
      console.warn("No match for", f.properties.name, isoCode);
      setSelectedCountry({
        code: isoCode,
        name: f.properties.name,
        channels: [],
      });
    }
  };

  // 🌈 Country colors
  const getCountryColor = (country) => {
    const id = country.id || 0;
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
      {/* 🌍 Interactive Globe */}
      <Globe
        ref={globeRef}
        width={window.innerWidth}
        height={window.innerHeight}
        backgroundColor="rgba(0,0,0,1)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        polygonsData={countries}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => "rgba(255,255,255,0.05)"}
        polygonStrokeColor={() => "#111"}
        onPolygonClick={handleClick}
        polygonLabel={(d) => `${d.properties.name}`}
        showAtmosphere={true}
        atmosphereColor="deepskyblue"
        atmosphereAltitude={0.25}
      />

      {/* 🌐 Gengas TV Title */}
      <div className="absolute top-5 left-5 text-4xl font-bold text-white drop-shadow-md">
        🌐 Gengas TV
      </div>

      {/* 📺 Sidebar for country channels */}
      {selectedCountry && (
        <div className="absolute right-0 top-0 h-full w-80 bg-[#0b0b0b]/95 text-white p-5 overflow-y-auto border-l border-gray-800 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">
            {selectedCountry.name} ({selectedCountry.code})
          </h2>

          {selectedCountry.channels.length > 0 ? (
            <div className="space-y-4">
              {selectedCountry.channels.map((ch, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] transition"
                >
                  <h3 className="font-medium text-lg">{ch.name}</h3>
                  <p className="text-sm text-gray-400 mb-1">
                    {ch.language?.toUpperCase() || "Unknown"}
                  </p>
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm hover:underline"
                  >
                    ▶ Watch Channel
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
