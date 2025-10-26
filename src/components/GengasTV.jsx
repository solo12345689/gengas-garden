import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import * as d3 from "d3";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hovered, setHovered] = useState(null);

  // 🌍 Load TopoJSON world data
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((res) => res.json())
      .then((topo) => {
        const geo = topojson.feature(topo, topo.objects.countries).features;
        setCountries(geo);
      })
      .catch((err) => console.error("Failed to load world map:", err));
  }, []);

  // 📡 Load channels from GitHub / local fallback
  useEffect(() => {
    loadChannels()
      .then((data) => {
        if (data) setChannels(data);
        else console.error("Channels JSON missing or invalid");
      })
      .catch((e) => console.error("Failed to load channels:", e));
  }, []);

  // 🎨 Color each country differently
  const getColor = (f) => {
    if (hovered === f) return "orange";
    return d3.schemeCategory10[Math.floor(Math.random() * 10)];
  };

  // 🖱️ Handle click to show channels
  const handleClick = (f) => {
    const code = f?.properties?.iso_a2 || f.id;
    const match = channels[code];
    if (match && match.channels?.length) {
      setSelectedCountry({
        code,
        name: f.properties.name,
        channels: match.channels,
      });
    } else {
      setSelectedCountry({
        code,
        name: f.properties.name,
        channels: [],
      });
    }
  };

  return (
    <div style={{ height: "100vh", background: "#000", position: "relative" }}>
      {/* 🌐 Title */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "#00ffff",
          fontSize: "1.8rem",
          fontFamily: "Poppins, sans-serif",
          fontWeight: "bold",
          textShadow: "0 0 10px #00ffff, 0 0 20px #00ffff",
          zIndex: 9999,
        }}
      >
        🌐 Gengas TV
      </div>

      {/* 🪐 Globe */}
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={countries}
        polygonCapColor={getColor}
        polygonSideColor={() => "rgba(0,0,0,0.2)"}
        polygonStrokeColor={() => "#111"}
        onPolygonHover={setHovered}
        onPolygonClick={handleClick}
        polygonsTransitionDuration={400}
        atmosphereColor="#00ffff"
        atmosphereAltitude={0.25}
      />

      {/* 📺 Sidebar */}
      {selectedCountry && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            height: "100%",
            width: "300px",
            background: "rgba(10,10,10,0.9)",
            color: "#fff",
            overflowY: "auto",
            padding: "20px",
            boxShadow: "0 0 15px #00ffff88",
            borderLeft: "1px solid #00ffff44",
            zIndex: 9998,
          }}
        >
          <h2
            style={{
              color: "#00ffff",
              textShadow: "0 0 8px #00ffff",
              borderBottom: "1px solid #00ffff33",
              paddingBottom: "5px",
            }}
          >
            {selectedCountry.name}
          </h2>
          {selectedCountry.channels.length ? (
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {selectedCountry.channels.map((ch, i) => (
                <li key={i} style={{ margin: "8px 0" }}>
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#0ff",
                      textDecoration: "none",
                      fontWeight: "500",
                    }}
                  >
                    📺 {ch.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#999" }}>No channels available</p>
          )}
        </div>
      )}
    </div>
  );
}
