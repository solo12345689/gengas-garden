import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { loadChannels } from "../utils/fetchChannels";

export default function GlobeView({ onCountrySelect }) {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [hoverD, setHoverD] = useState();

  // Load map + channels
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/world-110m.json");
        const data = await res.json();

        // Check if GeoJSON or TopoJSON
        const features =
          data.features || (data.objects && Object.values(data.objects)[0].geometries);
        if (!features) throw new Error("Invalid GeoJSON/TopoJSON data");

        setCountries(features);
        const ch = await loadChannels();
        setChannels(ch || {});
      } catch (err) {
        console.error("Failed to load world map:", err);
      }
    })();
  }, []);

  // Random bright color
  const getColor = (code) => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 80%, 55%)`;
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/starfield.jpg"
        polygonsData={countries}
        polygonAltitude={(d) => (d === hoverD ? 0.04 : 0.01)}
        polygonCapColor={(d) =>
          d === hoverD ? "orange" : getColor(d.properties?.ISO_A2 || "")
        }
        polygonSideColor={() => "rgba(0, 150, 255, 0.25)"}
        polygonStrokeColor={() => "#000"}
        onPolygonHover={setHoverD}
        onPolygonClick={(d) => {
          const code = d.properties?.ISO_A2;
          if (channels[code]) onCountrySelect(code);
        }}
        atmosphereColor="#00ffff"
        atmosphereAltitude={0.25}
      />
    </div>
  );
}
