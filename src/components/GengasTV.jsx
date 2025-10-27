import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { loadChannels } from "../utils/fetchChannels";
import { motion, AnimatePresence } from "framer-motion";
import { FaGlobe, FaSearch, FaTimes, FaPlay } from "react-icons/fa";
import * as THREE from "three";

export default function GengasTV() {
  const globeRef = useRef(null);
  const [worldData, setWorldData] = useState(null);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(null);

  // Load map and channel data
  useEffect(() => {
    Promise.all([
      d3.json("/data/world-110m.json"),
      loadChannels(),
    ]).then(([world, ch]) => {
      setWorldData(topojson.feature(world, world.objects.countries));
      setChannels(ch);
      setFilteredCountries(Object.keys(ch));
    });
  }, []);

  // Three.js Globe setup
  useEffect(() => {
    if (!globeRef.current || !worldData) return;

    const container = globeRef.current;
    container.innerHTML = "";

    const width = container.clientWidth;
    const height = container.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(5, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0x000000,
        shininess: 50,
        emissive: 0x111111,
      })
    );
    scene.add(globe);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(ambientLight, pointLight);

    camera.position.z = 10;
    function animate() {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.001;
      renderer.render(scene, camera);
    }
    animate();

    // handle resize
    window.addEventListener("resize", () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    return () => {
      renderer.dispose();
    };
  }, [worldData]);

  // Handle search and autosuggest
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim() === "") {
      setFilteredCountries(Object.keys(channels));
    } else {
      const filtered = Object.keys(channels).filter((c) =>
        c.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  };

  // Handle selecting country
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setSelectedChannel(null);
  };

  // Handle selecting a channel
  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
  };

  // Close player
  const closePlayer = () => setSelectedChannel(null);

  return (
    <div
      className="relative w-full h-screen overflow-hidden text-white"
      style={{
        background: "radial-gradient(circle at center, #01010a, #000)",
      }}
    >
      {/* --- Top Bar --- */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center px-6 py-3 bg-black/40 backdrop-blur-sm text-lg font-semibold z-50">
        <div className="flex items-center gap-2">
          <FaGlobe className="text-cyan-400" />
          <span className="text-cyan-400 text-2xl font-bold">Genga TV</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter Countries..."
            value={searchTerm}
            onChange={handleSearch}
            className="px-3 py-2 rounded-lg text-black w-64"
          />
          <FaSearch className="text-cyan-300 text-xl" />
        </div>
      </div>

      {/* --- Globe --- */}
      <div
        ref={globeRef}
        className="absolute inset-0 flex justify-center items-center"
      ></div>

      {/* --- Sidebar --- */}
      <AnimatePresence>
        {filteredCountries && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute right-0 top-16 w-80 h-[90vh] bg-black/60 backdrop-blur-md overflow-y-auto p-4 border-l border-cyan-500"
          >
            <h2 className="text-cyan-300 mb-4 text-xl font-semibold">
              {selectedCountry || "Select a Country"}
            </h2>
            {selectedCountry && channels[selectedCountry] ? (
              channels[selectedCountry].channels.map((ch, i) => (
                <div
                  key={i}
                  onClick={() => handleChannelSelect(ch)}
                  className="cursor-pointer border-b border-gray-700 py-2 hover:text-cyan-300 transition"
                >
                  {ch.name}
                </div>
              ))
            ) : (
              filteredCountries.map((c, i) => (
                <div
                  key={i}
                  onClick={() => handleCountrySelect(c)}
                  className="cursor-pointer border-b border-gray-800 py-1 hover:text-cyan-400 transition"
                >
                  {c}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Player Modal --- */}
      <AnimatePresence>
        {selectedChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
          >
            <div className="relative w-[80%] max-w-3xl bg-black border border-cyan-500 rounded-2xl shadow-xl">
              <button
                onClick={closePlayer}
                className="absolute top-3 right-3 text-cyan-400 hover:text-red-400 text-2xl"
              >
                <FaTimes />
              </button>
              <div className="p-4 text-cyan-300 text-lg font-semibold">
                {selectedChannel.name}
              </div>
              <div className="w-full aspect-video">
                <video
                  src={selectedChannel.url}
                  controls
                  autoPlay
                  className="w-full h-full rounded-b-2xl"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
