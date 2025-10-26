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
  const [loading, setLoading] = useState(true);

  // Load world map + channels
  useEffect(() => {
    (async () => {
      try {
        const worldRes = await fetch("/world-110m.json");
        const worldData = await worldRes.json();

        const countriesData = topojson.feature(worldData, worldData.objects.countries).features;
        setCountries(countriesData);

        const channelData = await loadChannels();
        if (channelData) setChannels(channelData);

        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setLoading(false);
      }
    })();
  }, []);

  // Handle country click
  const handleClick = (country) => {
    const countryName = country?.properties?.name;
    if (!countryName) return;

    console.log(`Clicked country: ${countryName}`);
    const matched = Object.entries(channels).find(
      ([key]) => key.toLowerCase() === countryName.toLowerCase()
    )?.[1];

    if (matched && matched.channels?.length > 0) {
      setSelectedCountry({ name: countryName, channels: matched.channels });
      setCurrentChannel(matched.channels[0]);
    } else {
      setSelectedCountry({ name: countryName, channels: [] });
      setCurrentChannel(null);
    }
  };

  // Initialize HLS for IPTV channels
  useEffect(() => {
    if (!currentChannel || currentChannel.type !== "iptv") return;

    const video = document.getElementById("tv-player");
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(currentChannel.url);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = currentChannel.url;
    }
  }, [currentChannel]);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#0ff",
          fontSize: "1.5em",
        }}
      >
        Loading Genga Garden TV...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "#000",
        color: "#fff",
      }}
    >
      <div style={{ flex: 1 }}>
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          backgroundColor="#000"
          polygonsData={countries}
          polygonCapColor={() =>
            `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.8)`
          }
          polygonSideColor={() => "rgba(0,0,0,0.15)"}
          polygonStrokeColor={() => "#111"}
          polygonLabel={({ properties: d }) => `${d.name}`}
          onPolygonClick={handleClick}
          polygonsTransitionDuration={300}
          atmosphereColor="#00ffff"
          atmosphereAltitude={0.3}
        />
      </div>

      {/* Sidebar */}
      <div
        style={{
          width: "340px",
          background: "#0a0a0a",
          borderLeft: "2px solid #00ffcc",
          padding: "20px",
          overflowY: "auto",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#00ffcc",
            fontSize: "1.4em",
            marginBottom: "10px",
          }}
        >
          🌍 Genga Garden TV
        </h1>

        {selectedCountry ? (
          <>
            <h2 style={{ color: "#0ff" }}>{selectedCountry.name}</h2>
            {selectedCountry.channels.length > 0 ? (
              <>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {selectedCountry.channels.map((ch, i) => (
                    <li
                      key={i}
                      style={{
                        background:
                          currentChannel?.name === ch.name
                            ? "#00ffcc33"
                            : "#111",
                        margin: "8px 0",
                        padding: "8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                      onClick={() => setCurrentChannel(ch)}
                    >
                      <strong>{ch.name}</strong>
                      <div style={{ fontSize: "0.8em", opacity: 0.7 }}>
                        {ch.language?.toUpperCase() || ""}
                      </div>
                    </li>
                  ))}
                </ul>

                {currentChannel && (
                  <div style={{ marginTop: "12px" }}>
                    {currentChannel.type === "youtube" ? (
                      <iframe
                        src={currentChannel.url}
                        width="100%"
                        height="200"
                        title={currentChannel.name}
                        allowFullScreen
                        style={{ borderRadius: "8px" }}
                      ></iframe>
                    ) : (
                      <video
                        id="tv-player"
                        controls
                        autoPlay
                        width="100%"
                        height="200"
                        style={{ borderRadius: "8px" }}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <p style={{ opacity: 0.7 }}>No channels available</p>
            )}
          </>
        ) : (
          <p style={{ opacity: 0.7 }}>Select a country to view channels</p>
        )}
      </div>
    </div>
  );
}
