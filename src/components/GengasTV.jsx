import React, { useEffect, useState, useRef } from "react";
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

  // 🎨 Generate consistent random colors
  const getRandomColor = (id) => {
    const hue = (id * 47) % 360;
    return `hsl(${hue}, 75%, 55%)`;
  };

  // 🌍 Load world map + channels
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/world-110m.json");
        const worldData = await res.json();
        const features = topojson.feature(worldData, worldData.objects.countries).features;
        setCountries(features);
      } catch (err) {
        console.error("Failed to load world map:", err);
      }

      const ch = await loadChannels();
      if (ch) setChannels(ch);

      setLoading(false);
    };

    loadData();
  }, []);

  // 🖱️ Handle country click — tolerant ISO code fallback
  const handleClick = (f) => {
    if (!f) return;

    const props = f.properties || {};
    const isoCode =
      props.iso_a2?.toUpperCase?.() ||
      props.ISO_A2?.toUpperCase?.() ||
      props.ADM0_A3?.slice(0, 2)?.toUpperCase?.() ||
      props.name?.slice(0, 2)?.toUpperCase?.();

    console.log("Clicked country:", props.name, "→", isoCode);

    const countryData =
      channels[isoCode] ||
      Object.values(channels).find(
        (c) =>
          c.code?.toUpperCase() === isoCode ||
          c.name?.toLowerCase() === props.name?.toLowerCase()
      );

    if (countryData && countryData.channels?.length) {
      setSelectedCountry({
        code: isoCode,
        name: props.name,
        channels: countryData.channels,
      });
      setCurrentChannel(countryData.channels[0]); // auto play first channel
    } else {
      console.warn("No match for", props.name, isoCode);
      setSelectedCountry({
        code: isoCode,
        name: props.name,
        channels: [],
      });
      setCurrentChannel(null);
    }
  };

  // 🎥 Handle channel playback
  useEffect(() => {
    if (
      currentChannel &&
      currentChannel.type === "iptv" &&
      currentChannel.url.endsWith(".m3u8")
    ) {
      const video = document.getElementById("livePlayer");
      if (video) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(currentChannel.url);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = currentChannel.url;
        }
      }
    }
  }, [currentChannel]);

  // 🌈 Country color (with fallback)
  const getCountryColor = (country) => {
    try {
      return getRandomColor(country.id || 1);
    } catch {
      return "hsl(200, 50%, 40%)";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white text-xl">
        Loading Gengas TV Globe...
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 🌍 Colorful Globe */}
      <Globe
        ref={globeRef}
        width={window.innerWidth}
        height={window.innerHeight}
        backgroundColor="rgba(0,0,0,1)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        polygonsData={countries}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => "rgba(255,255,255,0.05)"}
        polygonStrokeColor={() => "#222"}
        onPolygonClick={handleClick}
        polygonLabel={(d) => `${d.properties.name}`}
        showAtmosphere={true}
        atmosphereColor="deepskyblue"
        atmosphereAltitude={0.25}
      />

      {/* 🌐 Gengas TV Title */}
      <div className="absolute top-5 left-5 text-4xl font-bold text-white drop-shadow-md">
        🌐 Gengas TV
      </div>

      {/* 📺 Sidebar */}
      {selectedCountry && (
        <div className="absolute right-0 top-0 h-full w-96 bg-[#0b0b0b]/95 text-white p-5 overflow-y-auto border-l border-gray-800 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">
            {selectedCountry.name} ({selectedCountry.code})
          </h2>

          {/* Embedded Player */}
          {currentChannel && (
            <div className="mb-4">
              {currentChannel.type === "youtube" ? (
                <iframe
                  src={currentChannel.url}
                  title={currentChannel.name}
                  className="w-full h-48 rounded-md mb-2"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                ></iframe>
              ) : (
                <video
                  id="livePlayer"
                  className="w-full h-48 rounded-md mb-2 bg-black"
                  controls
                  autoPlay
                ></video>
              )}
              <h3 className="text-lg font-medium">{currentChannel.name}</h3>
            </div>
          )}

          {/* Channel List */}
          {selectedCountry.channels.length > 0 ? (
            <div className="space-y-3">
              {selectedCountry.channels.map((ch, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    currentChannel?.name === ch.name
                      ? "bg-blue-600/60"
                      : "bg-[#1a1a1a] hover:bg-[#2a2a2a]"
                  }`}
                  onClick={() => setCurrentChannel(ch)}
                >
                  <h3 className="font-medium">{ch.name}</h3>
                  <p className="text-xs text-gray-400">
                    {ch.language?.toUpperCase() || "Unknown"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No channels available</p>
          )}
        </div>
      )}
    </div>
  );
}
