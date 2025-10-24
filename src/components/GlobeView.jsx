import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import { loadChannels } from "../utils/fetchChannels";
import * as THREE from "three";

export default function GlobeView() {
  const globeEl = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [time, setTime] = useState(new Date());

  // Load world map + channels
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/world-110m.json", { cache: "no-store" });
        const world = await res.json();
        const features = topojson.feature(world, world.objects.countries).features;
        setCountries(features);
      } catch (err) {
        console.error("Failed to load world map:", err);
      }

      const data = await loadChannels();
      if (data) setChannels(data);
    }
    init();
  }, []);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Click country → select + fly to
  const handleCountryClick = (country) => {
    setSelectedCountry(country);
    const centroid = new THREE.Vector3(
      ...globeEl.current
        .getCoords(country)
        .slice(0, 2)
        .concat([globeEl.current.getGlobeRadius()])
    );
    globeEl.current.pointOfView({ lat: country.lat || 0, lng: country.lng || 0 }, 1000);
  };

  const formatTime = (d) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Generate random flag emoji from country ISO (for style)
  const getFlagEmoji = (country) => {
    const name = country?.properties?.name || "";
    const code = (country?.id || "").toUpperCase();
    if (!code || code.length !== 2) return "🏳️";
    return String.fromCodePoint(
      ...[...code].map((c) => 127397 + c.charCodeAt())
    );
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "radial-gradient(circle at 25% 25%, #06141a 0%, #000 70%)",
        color: "white",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* 🌎 Left: Globe */}
      <div style={{ flex: 1, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            fontSize: "1.4em",
            fontWeight: "bold",
            color: "#00ffff",
            textShadow: "0 0 8px #00ffff",
          }}
        >
          🌐 Gengas TV
        </div>

        <Globe
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          polygonsData={countries}
          polygonCapColor={() =>
            `rgba(${Math.random() * 200},${Math.random() * 200},${
              Math.random() * 255
            },0.85)`
          }
          polygonSideColor={() => "rgba(0,0,0,0.15)"}
          polygonStrokeColor={() => "#222"}
          polygonAltitude={0.01}
          onPolygonClick={handleCountryClick}
          atmosphereColor="deepskyblue"
          atmosphereAltitude={0.25}
          autoRotate={false}
          enablePointerInteraction={true}
        />
      </div>

      {/* 📜 Right: Sidebar */}
      <div
        style={{
          width: "340px",
          background: "rgba(0,0,0,0.7)",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* 🕒 Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#00ffff",
          }}
        >
          <span style={{ fontWeight: "bold" }}>Live Channels</span>
          <span>{formatTime(time)}</span>
        </div>

        {/* 🌍 Country List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 20px",
          }}
        >
          {countries.length ? (
            countries.map((country) => (
              <div
                key={country.id}
                onClick={() => handleCountryClick(country)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background:
                    selectedCountry?.id === country.id
                      ? "rgba(0,255,255,0.15)"
                      : "transparent",
                  transition: "0.3s",
                  marginBottom: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.3em" }}>{getFlagEmoji(country)}</span>
                  <span style={{ fontSize: "0.95em" }}>
                    {country.properties.name}
                  </span>
                </div>
                <span style={{ opacity: 0.6, fontSize: "0.85em" }}>
                  {channels[country.id]?.channels?.length || 0}
                </span>
              </div>
            ))
          ) : (
            <p>Loading countries...</p>
          )}
        </div>

        {/* 📺 Selected Country Channels */}
        {selectedCountry && (
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.5)",
              padding: "15px 20px",
              maxHeight: "40vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ color: "#00ffff", marginBottom: "10px" }}>
              {selectedCountry.properties.name}
            </h3>
            {channels[selectedCountry.id]?.channels?.length ? (
              channels[selectedCountry.id].channels.map((ch, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: "10px",
                    padding: "8px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "6px",
                  }}
                >
                  <strong>{ch.name}</strong>
                  <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
                    {ch.language?.toUpperCase() || "Unknown"}
                  </div>
                  {ch.url && (
                    <a
                      href={ch.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#00ffff",
                        fontSize: "0.85em",
                        textDecoration: "none",
                      }}
                    >
                      ▶ Watch
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p>No channels found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
