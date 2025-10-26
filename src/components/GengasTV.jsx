import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as d3 from "d3";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoverD, setHoverD] = useState();

  // 🌍 Load world map
  useEffect(() => {
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((worldData) => {
        try {
          const countriesData = window.topojson.feature(
            worldData,
            worldData.objects.countries
          ).features;
          setCountries(countriesData);
        } catch (err) {
          console.error("Invalid world data format", worldData);
        }
      })
      .catch((err) => console.error("Failed to load world data", err));
  }, []);

  // 📡 Load channel list
  useEffect(() => {
    loadChannels().then((data) => {
      if (data) setChannels(data);
      else console.error("No channels loaded");
    });
  }, []);

  // 🎨 Random bright color per country
  const getCountryColor = (feature) => {
    if (hoverD === feature) return "orange";
    return d3.schemeCategory10[
      Math.floor(Math.random() * d3.schemeCategory10.length)
    ];
  };

  // 🧭 When country is clicked
  const handleCountryClick = (polygon) => {
    const countryCode = polygon?.properties?.iso_a2 || polygon.id;
    const matchKey = Object.keys(channels).find(
      (key) => key.toUpperCase() === countryCode?.toUpperCase()
    );

    if (matchKey) {
      setSelectedCountry({
        code: matchKey,
        name: polygon.properties.name,
        channels: channels[matchKey],
      });
    } else {
      console.warn("No channels found for", countryCode);
      setSelectedCountry(null);
    }
  };

  return (
    <div style={{ position: "relative", height: "100vh", background: "#000" }}>
      {/* 🌐 Gengas TV title */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "#00ffff",
          fontFamily: "Poppins, sans-serif",
          fontSize: "1.8rem",
          fontWeight: "bold",
          textShadow: "0 0 10px #00ffff, 0 0 20px #00ffff",
          zIndex: 9999,
        }}
      >
        🌐 Gengas TV
      </div>

      {/* Loading state */}
      {!countries.length && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#0ff",
            fontSize: "1.2rem",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          🌍 Loading Globe...
        </div>
      )}

      {/* 🪐 The Globe */}
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={countries}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => "rgba(0,0,0,0.15)"}
        polygonStrokeColor={() => "#111"}
        onPolygonHover={setHoverD}
        onPolygonClick={handleCountryClick}
        polygonsTransitionDuration={300}
        atmosphereColor="#00bfff"
        atmosphereAltitude={0.25}
      />

      {/* 📺 Sidebar for selected country */}
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
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {selectedCountry.channels?.length ? (
              selectedCountry.channels.map((ch, i) => (
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
              ))
            ) : (
              <li style={{ color: "#888" }}>No channels available</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
