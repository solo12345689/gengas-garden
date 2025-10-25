import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Globe from "react-globe.gl";
import { feature } from "topojson-client";
import { loadChannels } from "../utils/fetchChannels";

const GengasTV = () => {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch world data
  useEffect(() => {
    const fetchWorld = async () => {
      try {
        const res = await fetch("/world-110m.json");
        const world = await res.json();
        const worldFeatures = feature(world, world.objects.countries).features;
        setCountries(worldFeatures);
      } catch (err) {
        console.error("Failed to load world map:", err);
      }
    };
    fetchWorld();
  }, []);

  // Fetch channels data
  useEffect(() => {
    const fetchData = async () => {
      const data = await loadChannels();
      if (data) setChannels(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Stop auto-rotation and add lights/background
  useEffect(() => {
    if (!globeRef.current) return;

    const globe = globeRef.current;
    globe.controls().autoRotate = false; // user manually rotates
    globe.controls().enableZoom = true;

    const scene = globe.scene();
    scene.background = new THREE.Color(0x000b1a); // TV Garden deep navy tone

    // Remove old lights (if any)
    scene.children = scene.children.filter(c => !(c instanceof THREE.Light));

    // Add bright multicolor lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(1, 1, 1);
    scene.add(ambient, dir);
  }, [countries]);

  // Pick random bright color for each country
  const getCountryColor = (id) => {
    const colors = [
      "#ff5f5f", "#ffb74d", "#4caf50", "#29b6f6", "#ab47bc",
      "#f06292", "#ba68c8", "#81c784", "#64b5f6", "#ffd54f"
    ];
    return colors[id % colors.length];
  };

  const handleCountryClick = (country) => {
    setSelectedCountry(country);
  };

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #00111f 0%, #000b1a 100%)",
        color: "white",
        height: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "1.5rem",
          }}
        >
          Loading Gengas TV...
        </div>
      )}

      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        polygonsData={countries}
        polygonCapColor={(d) => getCountryColor(d.id)}
        polygonSideColor={() => "rgba(0,0,0,0.15)"}
        polygonStrokeColor={() => "#111"}
        onPolygonClick={handleCountryClick}
        polygonAltitude={0.01}
        backgroundColor="#000b1a"
      />

      {/* Channel Viewer */}
      {selectedCountry && channels && channels[selectedCountry.properties.ISO_A2] && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "rgba(0,0,0,0.75)",
            padding: "20px",
            borderRadius: "12px",
            width: "360px",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 0 15px rgba(0,0,0,0.5)",
          }}
        >
          <h2 style={{ marginBottom: "10px", color: "#ffd54f" }}>
            {selectedCountry.properties.name}
          </h2>
          {channels[selectedCountry.properties.ISO_A2]?.channels?.length > 0 ? (
            channels[selectedCountry.properties.ISO_A2].channels.map((ch, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  marginBottom: "10px",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                <strong>{ch.name}</strong>
                <div style={{ marginTop: "6px" }}>
                  {ch.type === "youtube" ? (
                    <iframe
                      src={ch.url}
                      title={ch.name}
                      width="100%"
                      height="200"
                      allowFullScreen
                      style={{ border: "none", borderRadius: "6px" }}
                    ></iframe>
                  ) : (
                    <video
                      src={ch.url}
                      controls
                      width="100%"
                      height="200"
                      style={{ borderRadius: "6px" }}
                    ></video>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No channels available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GengasTV;
