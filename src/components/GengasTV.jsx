import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import * as THREE from "three";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCountries, setFilteredCountries] = useState([]);

  // Load world map
  useEffect(() => {
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((topology) => {
        const features = topojson.feature(topology, topology.objects.countries).features;
        setCountries(features);
      })
      .catch((err) => console.error("World map load failed:", err));
  }, []);

  // Load channel list
  useEffect(() => {
    loadChannels().then((data) => {
      if (data) setChannels(data);
    });
  }, []);

  const handleCountryClick = (country) => {
    if (!country?.properties?.name) return;
    const name = country.properties.name.trim();
    setSelectedCountry(name);

    // Find by name
    const match = Object.keys(channels).find(
      (key) => key.toLowerCase() === name.toLowerCase()
    );
    if (match) setSelectedChannel(channels[match].channels[0]);
    else setSelectedChannel(null);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query || !countries.length) {
      setFilteredCountries([]);
      return;
    }
    const matches = countries
      .map((f) => f.properties.name)
      .filter((n) => n.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);
    setFilteredCountries(matches);
  };

  const handleSearchSelect = (name) => {
    const country = countries.find(
      (f) => f.properties.name.toLowerCase() === name.toLowerCase()
    );
    if (country && globeRef.current) {
      const centroid = new THREE.Vector3();
      const coords = country.geometry.coordinates[0][0];
      centroid.set(coords[0], coords[1], 0);
      globeRef.current.pointOfView({ lat: coords[1], lng: coords[0], altitude: 1.8 }, 1000);
      handleCountryClick(country);
    }
    setFilteredCountries([]);
    setSearchQuery("");
  };

  const countryColor = () => `hsl(${Math.random() * 360}, 70%, 55%)`;

  const selectedChannels =
    selectedCountry && channels[selectedCountry]
      ? channels[selectedCountry].channels
      : [];

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "radial-gradient(circle at center, #020617, #000000)",
        position: "relative",
        color: "white",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <h2 style={{ fontSize: "1.6rem", color: "#60a5fa" }}>🌍 Genga Garden TV</h2>
        <div style={{ position: "relative" }}>
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search country..."
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "none",
              outline: "none",
              fontSize: "14px",
            }}
          />
          {filteredCountries.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                left: 0,
                right: 0,
                background: "#1e293b",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                zIndex: 11,
              }}
            >
              {filteredCountries.map((c) => (
                <div
                  key={c}
                  onClick={() => handleSearchSelect(c)}
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #334155",
                    cursor: "pointer",
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Globe */}
      {countries.length > 0 && (
        <Globe
          ref={globeRef}
          width={window.innerWidth}
          height={window.innerHeight}
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={true}
          atmosphereColor="lightskyblue"
          polygonsData={countries}
          polygonCapColor={countryColor}
          polygonSideColor={() => "rgba(0,100,200,0.2)"}
          polygonStrokeColor={() => "#111827"}
          onPolygonClick={handleCountryClick}
        />
      )}

      {/* Sidebar */}
      {selectedCountry && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "300px",
            height: "100%",
            background: "rgba(15,23,42,0.95)",
            backdropFilter: "blur(6px)",
            padding: "16px",
            overflowY: "auto",
            transform: selectedCountry ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.4s ease",
          }}
        >
          <h3 style={{ color: "#93c5fd" }}>{selectedCountry}</h3>
          {selectedChannels.length > 0 ? (
            selectedChannels.map((ch, i) => (
              <div
                key={i}
                onClick={() => setSelectedChannel(ch)}
                style={{
                  marginTop: "8px",
                  padding: "8px",
                  background: "#1e3a8a",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {ch.name}
              </div>
            ))
          ) : (
            <p>No channels available</p>
          )}
        </div>
      )}

      {/* Player */}
      {selectedChannel && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 20,
            background: "#000",
            padding: "10px",
            borderRadius: "10px",
            boxShadow: "0 0 25px rgba(0,0,0,0.8)",
          }}
        >
          {selectedChannel.type === "youtube" ? (
            <iframe
              src={selectedChannel.url}
              width="640"
              height="360"
              title={selectedChannel.name}
              allow="autoplay; fullscreen"
              style={{ border: "none", borderRadius: "8px" }}
            />
          ) : (
            <video
              src={selectedChannel.url}
              controls
              autoPlay
              width="640"
              height="360"
              style={{ borderRadius: "8px" }}
            />
          )}
        </div>
      )}
    </div>
  );
}
