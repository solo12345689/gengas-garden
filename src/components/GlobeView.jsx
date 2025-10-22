import React, { useEffect, useRef, useState } from "react";
import Globe from "globe.gl";
import * as topojson from "topojson-client";

function colorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 80%, 55%)`;
}

export default function GlobeView({ onCountrySelect }) {
  const containerRef = useRef();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const globe = Globe()(containerRef.current);
    globe
      .backgroundColor("#01020A")
      .showGraticules(false)
      .globeImageUrl(null)
      .polygonCapColor((d) => d.properties.color)
      .polygonSideColor(() => "rgba(0, 0, 0, 0.2)")
      .polygonStrokeColor(() => "#111")
      .polygonAltitude(0.01)
      .onPolygonClick((d) => {
        if (onCountrySelect) {
          onCountrySelect(
            d.properties.name || d.properties.ADMIN,
            d.id || d.properties.iso_a2
          );
        }
      });

    (async () => {
      try {
        const res = await fetch("/world-110m.json");
        const world = await res.json();

        // find the correct object key
        const objectKey = Object.keys(world.objects)[0];
        const countries = topojson.feature(world, world.objects[objectKey]).features;

        countries.forEach((c) => {
          c.properties.color = colorFromString(c.id || c.properties.name);
        });

        globe.polygonsData(countries);
        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = 0.4;
        setLoading(false);
      } catch (err) {
        console.error("Failed to load world map:", err);
      }
    })();
  }, [onCountrySelect]);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            padding: "6px 12px",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            borderRadius: "6px",
          }}
        >
          Loading globe...
        </div>
      )}
    </div>
  );
}
