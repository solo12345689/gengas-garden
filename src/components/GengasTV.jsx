import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import Hls from "hls.js";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [hoverD, setHoverD] = useState();

  // 🗺️ Load world map & channels
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/world-110m.json");
        const world = await res.json();
        const features = topojson.feature(world, world.objects.countries)
          .features;
        setCountries(features);

        const ch = await loadChannels();
        setChannels(ch || {});
      } catch (err) {
        console.error("Failed to load globe data:", err);
      }
    })();
  }, []);

  // 🖱️ Handle country click
  const handleClick = (country) => {
    if (!country || !channels) return;
    const countryName = country.properties.name;
    console.log("Clicked country:", countryName);

    const channelData = Object.entries(channels).find(
      ([key]) => key.toLowerCase() === countryName.toLowerCase()
    )?.[1];

    if (channelData && channelData.channels?.length > 0) {
      setSelectedCountry({
        name: countryName,
        channels: channelData.channels,
      });
      setCurrentChannel(channelData.channels[0]);
    } else {
      console.warn("No channels found for", countryName);
      setSelectedCountry({
        name: countryName,
        channels: [],
      });
      setCurrentChannel(null);
    }
  };

  // 📺 Play IPTV streams using HLS.js if needed
  useEffect(() => {
    if (!currentChannel || currentChannel.type !== "iptv") return;
    const video = document.getElementById("tv-player");
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(currentChannel.url);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = currentChannel.url;
    }
  }, [currentChannel]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "radial-gradient(circle at center, #00111a 0%, #000 100%)",
        color: "#fff",
      }}
    >
      {/* 🌍 The Globe */}
      <div style={{ flex: 1 }}>
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)"
          polygonsData={countries}
          polygonCapColor={() => `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.8)`}
          polygonSideColor={() => "rgba(0,0,0,0.15)"}
          polygonStrokeColor={() => "#111"}
          polygonLabel={({ properties: d }) => `${d.name}`}
          onPolygonClick={handleClick}
          onPolygonHover={setHoverD}
          polygonsTransitionDuration={300}
        />
      </div>

      {/* 📋 Sidebar for country channels */}
      <div
        style={{
          width: "380px",
          background: "#0a0a0a",
          borderLeft: "2px solid #00ffcc",
          padding: "20px",
          overflowY: "auto",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#00ffcc",
            fontSize: "1.8em",
            marginBottom: "15px",
          }}
        >
          🌍 Genga Garden TV
        </h1>

        {selectedCountry ? (
          <>
            <h2
              style={{
                color: "#00ffff",
                fontSize: "1.3em",
                marginBottom: "10px",
              }}
            >
              {selectedCountry.name}
            </h2>

            {selectedCountry.channels.length > 0 ? (
              <>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {selectedCountry.channels.map((ch, i) => (
                    <li
                      key={i}
                      style={{
                        padding: "8px",
                        margin: "5px 0",
                        background:
                          currentChannel?.name === ch.name
                            ? "#00ffcc22"
                            : "#111",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                      onClick={() => setCurrentChannel(ch)}
                    >
                      <strong>{ch.name}</strong>
                      <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
                        {ch.language?.toUpperCase() || ""}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Video Player */}
                {currentChannel && (
                  <div style={{ marginTop: "15px" }}>
                    {currentChannel.type === "youtube" ? (
                      <iframe
                        title={currentChannel.name}
                        src={currentChannel.url}
                        width="100%"
                        height="200"
                        allowFullScreen
                        style={{ border: "none", borderRadius: "8px" }}
                      />
                    ) : (
                      <video
                        id="tv-player"
                        controls
                        autoPlay
                        width="100%"
                        height="200"
                        style={{
                          borderRadius: "8px",
                          background: "#000",
                        }}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <p>No channels available</p>
            )}
          </>
        ) : (
          <p>Select a country to view its channels.</p>
        )}
      </div>
    </div>
  );
}
