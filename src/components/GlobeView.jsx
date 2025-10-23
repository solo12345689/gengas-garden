import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { feature } from "topojson-client";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const GlobeView = () => {
  const mountRef = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [channels, setChannels] = useState([]);
  const [allChannels, setAllChannels] = useState({});

  useEffect(() => {
    let scene, camera, renderer, globe, raycaster, mouse, controls;
    const mount = mountRef.current;

    // --- SCENE SETUP ---
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2.3;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // --- LIGHTS ---
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const light = new THREE.PointLight(0xffffff, 0.8);
    camera.add(light);
    scene.add(camera);

    // --- BASE GLOBE ---
    const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x001244,
      emissive: 0x000033,
      shininess: 15,
      transparent: true,
      opacity: 0.95
    });
    globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // --- CONTROLS (USER ROTATION ENABLED) ---
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.6;
    controls.enablePan = false;
    controls.minDistance = 1.3;
    controls.maxDistance = 3.5;

    // --- COUNTRY DATA ---
    const countryMeshes = new Map();
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((data) => {
        const countries = feature(data, data.objects.countries);
        const edges = new THREE.Group();

        countries.features.forEach((country) => {
          let coords = country.geometry.coordinates;
          if (country.geometry.type === "Polygon") coords = [coords];

          coords.forEach((polygonGroup) => {
            polygonGroup.forEach((polygon) => {
              const safePoly = Array.isArray(polygon[0])
                ? polygon
                : polygonGroup;

              const points = safePoly.map(([lon, lat]) => {
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = (lon + 180) * (Math.PI / 180);
                const x = -Math.sin(phi) * Math.cos(theta);
                const y = Math.cos(phi);
                const z = Math.sin(phi) * Math.sin(theta);
                return new THREE.Vector3(x, y, z);
              });

              const geometry = new THREE.BufferGeometry().setFromPoints(points);
              const color = new THREE.Color(
                `hsl(${Math.random() * 360}, 80%, 60%)`
              );
              const material = new THREE.LineBasicMaterial({
                color,
                transparent: true,
                opacity: 0.7
              });
              const line = new THREE.Line(geometry, material);
              edges.add(line);
              line.userData.country = country.properties.name;
              countryMeshes.set(line.id, country.properties.name);
            });
          });
        });

        scene.add(edges);
      })
      .catch((err) => console.error("Failed to load world map:", err));

    // --- CHANNEL DATA ---
    fetch("/channels.json")
      .then((res) => res.json())
      .then((data) => setAllChannels(data))
      .catch((err) => console.error("Failed to load channels:", err));

    // --- CLICK TO SELECT COUNTRY ---
    const onClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const object = intersects[0].object;
        const countryName = object.userData.country || countryMeshes.get(object.id);
        if (countryName) {
          setSelectedCountry(countryName);
          const countryChannels = allChannels[countryName] || [];
          setChannels(countryChannels);
        }
      }
    };

    renderer.domElement.addEventListener("click", onClick);

    // --- ANIMATION LOOP ---
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", onClick);
      mount.removeChild(renderer.domElement);
    };
  }, [allChannels]);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100vh",
        background: "radial-gradient(ellipse at center, #060b1a, #000)",
        overflow: "hidden"
      }}
    >
      {/* HEADER */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          color: "#fff",
          fontFamily: "Poppins, sans-serif",
          fontSize: "1.2rem",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "#4ade80",
            boxShadow: "0 0 6px #4ade80"
          }}
        ></span>
        <b>Gengas TV</b>
      </div>

      {/* INFO PANEL */}
      {selectedCountry && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "280px",
            height: "100vh",
            backgroundColor: "rgba(10, 15, 25, 0.95)",
            color: "#fff",
            padding: "20px",
            fontFamily: "Poppins, sans-serif",
            borderLeft: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            overflowY: "auto",
            transition: "0.4s ease-in-out"
          }}
        >
          <h2 style={{ color: "#4ade80", marginBottom: "10px" }}>
            {selectedCountry}
          </h2>
          {channels.length > 0 ? (
            <>
              <h4 style={{ marginTop: "5px", color: "#93c5fd" }}>Channels:</h4>
              <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
                {channels.map((ch, idx) => (
                  <li key={idx}>
                    <b>{ch.name}</b> — {ch.category}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ color: "#9ca3af" }}>No channels available.</p>
          )}
          <button
            onClick={() => setSelectedCountry(null)}
            style={{
              marginTop: "15px",
              padding: "8px 14px",
              backgroundColor: "#ef4444",
              border: "none",
              color: "#fff",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default GlobeView;

