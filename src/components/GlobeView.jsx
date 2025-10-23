import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { feature } from "topojson-client";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { loadChannels } from "../utils/fetchChannels";

export default function GlobeView() {
  const mountRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    let scene, camera, renderer, controls, globeMesh;
    let animationFrame;

    async function init() {
      try {
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.z = 2.5;

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        mountRef.current.appendChild(renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(5, 3, 5);
        scene.add(directional);

        // Globe (base sphere)
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const material = new THREE.MeshPhongMaterial({
          color: 0x0077ff,
          emissive: 0x111111,
          shininess: 10,
        });
        globeMesh = new THREE.Mesh(geometry, material);
        scene.add(globeMesh);

        // Orbit controls (manual only)
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = false;

        // Load world borders
        fetch("/world-110m.json")
          .then((res) => res.json())
          .then((data) => {
            const countries = feature(data, data.objects.countries);
            const edges = new THREE.Group();

            countries.features.forEach((country) => {
              const geometryType = country.geometry.type;
              const coordinates = country.geometry.coordinates;

              const polygons =
                geometryType === "Polygon" ? [coordinates] : coordinates;

              polygons.forEach((polygon) => {
                polygon.forEach((ring) => {
                  if (!Array.isArray(ring)) return;

                  const points = ring
                    .filter((p) => Array.isArray(p) && p.length === 2)
                    .map(([lon, lat]) => {
                      const phi = (90 - lat) * (Math.PI / 180);
                      const theta = (lon + 180) * (Math.PI / 180);
                      const x = -Math.sin(phi) * Math.cos(theta);
                      const y = Math.cos(phi);
                      const z = Math.sin(phi) * Math.sin(theta);
                      return new THREE.Vector3(x, y, z);
                    });

                  if (points.length < 2) return;

                  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
                  const lineMat = new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    opacity: 0.4,
                    transparent: true,
                  });
                  const line = new THREE.Line(lineGeo, lineMat);
                  line.userData.country = country.properties.name;
                  edges.add(line);
                });
              });
            });

            scene.add(edges);
          })
          .catch((err) => {
            console.error("Failed to load world map:", err);
            setError("Failed to load world data");
          });

        // Load channels (your fetchChannels.js)
        const ch = await loadChannels();
        if (ch) setChannels(ch);

        // Animation loop
        function animate() {
          animationFrame = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
        animate();

        // Resize handler
        const handleResize = () => {
          const { clientWidth, clientHeight } = mountRef.current;
          camera.aspect = clientWidth / clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(clientWidth, clientHeight);
        };
        window.addEventListener("resize", handleResize);

        setLoading(false);

        return () => {
          cancelAnimationFrame(animationFrame);
          window.removeEventListener("resize", handleResize);
          if (renderer) mountRef.current.removeChild(renderer.domElement);
        };
      } catch (err) {
        console.error("Globe initialization error:", err);
        setError("Failed to initialize Gengas TV globe");
        setLoading(false);
      }
    }

    init();
  }, []);

  return (
    <div className="w-full h-full relative text-white">
      <div
        ref={mountRef}
        className="w-full h-full bg-black overflow-hidden rounded-2xl"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xl font-semibold">
          Loading Gengas TV...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-red-400 text-lg">
          {error}
        </div>
      )}
      <div className="absolute top-3 left-4 text-2xl font-bold text-blue-400">
        Gengas TV
      </div>
    </div>
  );
}
