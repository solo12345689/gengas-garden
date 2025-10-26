import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);

  // Load world map and channels
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/world-110m.json");
        const worldData = await res.json();

        if (!worldData.objects || !worldData.objects.countries) {
          console.error("Invalid world data format", worldData);
          return;
        }

        const countriesData = topojson.feature(worldData, worldData.objects.countries).features;
        setCountries(countriesData);

        const channelData = await loadChannels();
        setChannels(channelData || {});
      } catch (err) {
        console.error("Failed to load data", err);
      }
    }
    loadData();
  }, []);

  // Random color per country
  const getCountryColor = (d) =>
    `hsl(${Math.random() * 360}, 80%, 60%)`;

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#000", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        position: "absolute",
        top: 20,
        left: 20,
        color: "#00ffff",
        fontFamily: "Poppins, sans-serif",
        fontSize: "1.5rem",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
      }}>
        🌐 Gengas TV
      </div>

      {/* Right Sidebar */}
      <div style={{
        position: "absolute",
        top: 70,
        right: 20,
        width: "280px",
        height: "85vh",
        background: "rgba(0, 0, 0, 0.6)",
        borderRadius: "10px",
        color: "#fff",
        padding: "15px",
        overflowY: "auto"
      }}>
        <h3 style={{ marginBottom: "10px", color: "#0ff" }}>Select a Country</h3>
        {selectedCountry ? (
          <>
            <h4>{selectedCountry}</h4>
            {channels[selectedCountry]?.channels?.length ? (
              <ul>
                {channels[selectedCountry].channels.map((ch, i) => (
                  <li key={i} style={{ marginBottom: "10px" }}>
                    <strong>{ch.name}</strong> <br />
                    <small>{ch.type}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No channels available</p>
            )}
          </>
        ) : (
          <p>Click on the globe to select</p>
        )}
      </div>

      {/* Globe */}
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={countries}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => "rgba(0, 100, 255, 0.15)"}
        polygonStrokeColor={() => "#111"}
        onPolygonClick={(polygon) => {
          const countryCode = polygon.id;
          const match = Object.keys(channels).find(
            (key) => key.toUpperCase() === countryCode?.toUpperCase()
          );
          setSelectedCountry(match || null);
        }}
        polygonsTransitionDuration={300}
        showGlobe={true}
        showAtmosphere={true}
        atmosphereColor="deepskyblue"
        atmosphereAltitude={0.25}
      />
    </div>
  );
}
