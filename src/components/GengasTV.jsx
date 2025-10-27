import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import * as THREE from "three";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [worldData, setWorldData] = useState(null);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCountries, setFilteredCountries] = useState([]);

  // Load world data
  useEffect(() => {
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((topology) => {
        const features = topojson.feature(topology, topology.objects.countries)
          .features;
        setWorldData(features);
      })
      .catch((err) => console.error("Failed to load world map", err));
  }, []);

  // Load channel data
  useEffect(() => {
    loadChannels().then((data) => {
      if (data) setChannels(data);
    });
  }, []);

  const handleCountryClick = (country) => {
    const name = country.properties.name;
    setSelectedCountry(name);
    const found = Object.keys(channels).find(
      (key) => key.toLowerCase() === name.toLowerCase()
    );
    setSelectedChannel(found ? channels[found].channels[0] : null);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!worldData) return;
    const matches = worldData
      .map((f) => f.properties.name)
      .filter((n) => n.toLowerCase().includes(query.toLowerCase()));
    setFilteredCountries(matches.slice(0, 5));
  };

  const handleSearchSelect = (countryName) => {
    const feature = worldData.find(
      (f) => f.properties.name.toLowerCase() === countryName.toLowerCase()
    );
    if (feature && globeRef.current) {
      const { lat, lng } = {
        lat: feature.properties.latitude || 0,
        lng: feature.properties.longitude || 0,
      };
      globeRef.current.pointOfView({ lat, lng, altitude: 1.8 }, 1000);
      handleCountryClick(feature);
    }
    setFilteredCountries([]);
    setSearchQuery("");
  };

  const channelList =
    selectedCountry && channels[selectedCountry]
      ? channels[selectedCountry].channels
      : [];

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background:
          "radial-gradient(circle at center, #020617, #000) fixed",
        overflow: "hidden",
        position: "relative",
        color: "white",
      }}
    >
      {/* App Header */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 5,
        }}
      >
        <h2 style={{ fontSize: "1.5rem", color: "#93c5fd" }}>
          🌍 Genga Garden TV
        </h2>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search country..."
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              outline: "none",
              fontSize: "14px",
            }}
          />
          {filteredCountries.length > 0 && (
            <div
              style={{
                position: "absolute",
                background: "#1e293b",
                top: "110%",
                left: 0,
                right: 0,
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              {filteredCountries.map((country) => (
                <div
                  key={country}
                  onClick={() => handleSearchSelect(country)}
                  style={{
                    padding: "8px",
                    cursor: "pointer",
                    borderBottom: "1px solid #334155",
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
      {worldData && (
        <Globe
          ref={globeRef}
          globeMaterial={new THREE.MeshPhongMaterial({
            color: "#1d4ed8",
            emissive: "#0f172a",
            shininess: 10,
            transparent: false,
          })}
          backgroundColor="rgba(0,0,0,0)"
          width={window.innerWidth}
          height={window.innerHeight}
          hexPolygonsData={worldData}
          hexPolygonResolution={3}
          hexPolygonMargin={0.5}
          hexPolygonColor={() =>
            `hsl(${Math.random() * 360}, 70%, 55%)`
          }
          onHexPolygonClick={handleCountryClick}
        />
      )}

      {/* Sidebar */}
      {selectedCountry && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "320px",
            height: "100%",
            background: "rgba(15,23,42,0.95)",
            padding: "20px",
            overflowY: "auto",
            color: "white",
            backdropFilter: "blur(8px)",
            transition: "transform 0.4s ease-in-out",
            transform: selectedCountry ? "translateX(0)" : "translateX(100%)",
          }}
        >
          <h3 style={{ color: "#93c5fd" }}>{selectedCountry}</h3>
          {channelList.length > 0 ? (
            channelList.map((ch, i) => (
              <div
                key={i}
                style={{
                  padding: "8px",
                  marginTop: "6px",
                  background: "#1e3a8a",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
                onClick={() => setSelectedChannel(ch)}
              >
                {ch.name}
              </div>
            ))
          ) : (
            <p>No channels available</p>
          )}
        </div>
      )}

      {/* Video Player */}
      {selectedChannel && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#000",
            padding: "12px",
            borderRadius: "10px",
            zIndex: 10,
            boxShadow: "0 0 20px rgba(0,0,0,0.8)",
            animation: "fadeIn 0.5s ease",
          }}
        >
          {selectedChannel.type === "youtube" ? (
            <iframe
              src={selectedChannel.url}
              title={selectedChannel.name}
              width="640"
              height="360"
              allow="autoplay; fullscreen"
              style={{ border: "none", borderRadius: "10px" }}
            />
          ) : (
            <video
              src={selectedChannel.url}
              controls
              autoPlay
              width="640"
              height="360"
              style={{ borderRadius: "10px" }}
            />
          )}
        </div>
      )}
    </div>
  );
}
