import React, { useState, useEffect, useRef } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import Hls from "hls.js";
import { loadChannels } from "../utils/fetchChannels";
import "./GengasTV.css";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Load globe + channels
  useEffect(() => {
    (async () => {
      const worldRes = await fetch("/world-110m.json");
      const world = await worldRes.json();
      const feats = topojson.feature(world, world.objects.countries).features;
      setCountries(feats);

      const ch = await loadChannels();
      setChannels(ch || {});
    })();
  }, []);

  // Auto-suggest
  useEffect(() => {
    if (!search) return setSuggestions([]);
    const matches = Object.keys(channels)
      .filter(k => k.toLowerCase().startsWith(search.toLowerCase()))
      .slice(0, 8);
    setSuggestions(matches);
  }, [search, channels]);

  // Handle search select
  const handleSearch = (name) => {
    const match = Object.keys(channels).find(
      k => k.toLowerCase() === name.toLowerCase()
    );
    if (match) setSelectedCountry({ name: match });
    setSuggestions([]);
  };

  const handleCountryClick = (country) => {
    const match = channels[country.properties.name];
    if (match) {
      setSelectedCountry({
        name: country.properties.name,
        data: match.channels,
      });
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
    }
  };

  const handlePlay = (ch) => {
    setSelectedChannel(ch);
  };

  const renderVideo = (url, type) => {
    if (type === "youtube") {
      return (
        <iframe
          src={url}
          title="YouTube player"
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      );
    } else if (type === "iptv") {
      return <HlsPlayer src={url} />;
    }
    return <p>Unsupported stream type</p>;
  };

  return (
    <div className="tv-container">
      <div className="header">
        <div className="logo">🌍 Genga Garden TV</div>
        <div className="search-box">
          <input
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((s) => (
                <div key={s} onClick={() => handleSearch(s)}>{s}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="main">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundColor="black"
          polygonsData={countries}
          polygonCapColor={() =>
            `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.8)`
          }
          polygonSideColor={() => "rgba(0,100,255,0.05)"}
          polygonStrokeColor={() => "#111"}
          onPolygonClick={handleCountryClick}
        />

        {selectedCountry && (
          <div className="sidebar">
            <h2>{selectedCountry.name}</h2>
            <div className="channels">
              {(channels[selectedCountry.name]?.channels || []).map((ch, i) => (
                <div
                  key={i}
                  className="channel"
                  onClick={() => handlePlay(ch)}
                >
                  <b>{ch.name}</b>
                  <div className="lang">{ch.language?.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedChannel && (
          <div className="player">
            <div className="player-header">
              <span>{selectedChannel.name}</span>
              <button onClick={() => setSelectedChannel(null)}>✖</button>
            </div>
            <div className="player-body">
              {renderVideo(selectedChannel.url, selectedChannel.type)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// lightweight HLS wrapper
function HlsPlayer({ src }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(ref.current);
      return () => hls.destroy();
    } else if (ref.current) {
      ref.current.src = src;
    }
  }, [src]);
  return <video ref={ref} controls autoPlay style={{ width: "100%", height: "100%" }} />;
}
