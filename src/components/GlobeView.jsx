import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { loadChannels } from "../utils/fetchChannels";

export default function GlobeView({ onCountrySelect }) {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [hoverD, setHoverD] = useState();

  // Load GeoJSON + channels
  useEffect(() => {
    Promise.all([
      fetch("/world-110m.json").then((res) => res.json()),
      loadChannels()
    ])
      .then(([geoData, ch]) => {
        setCountries(geoData.features);
        setChannels(ch || {});
      })
      .catch((err) => console.error("Error loading data:", err));
  }, []);

  // Random bright colors
  const getColor = (code) => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 80%, 55%)`;
  };

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "black" }}>
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/starfield.jpg"
        polygonsData={countries}
        polygonAltitude={(d) => (d === hoverD ? 0.04 : 0.01)}
        polygonCapColor={(d) => (d === hoverD ? "orange" : getColor(d.properties.ISO_A2))}
        polygonSideColor={() => "rgba(0, 100, 255, 0.15)"}
        polygonStrokeColor={() => "#111"}
        onPolygonHover={setHoverD}
        onPolygonClick={(d) => {
          const code = d.properties.ISO_A2;
          if (channels[code]) onCountrySelect(code);
        }}
        atmosphereColor="#0ff"
        atmosphereAltitude={0.25}
      />
    </div>
  );
}
