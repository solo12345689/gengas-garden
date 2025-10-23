import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { feature } from "topojson-client";

const GlobeView = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let scene, camera, renderer, globe, edges;
    const mount = mountRef.current;

    // --- SCENE SETUP ---
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2.5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.7);
    camera.add(pointLight);
    scene.add(camera);

    // --- GLOBE SPHERE ---
    const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x112244,
      emissive: 0x000033,
      shininess: 10,
      transparent: true,
      opacity: 0.95,
    });
    globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // --- COUNTRY LINES ---
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((data) => {
        const countries = feature(data, data.objects.countries);
        edges = new THREE.Group();

        countries.features.forEach((country) => {
          let coords = country.geometry.coordinates;

          // Normalize both Polygon & MultiPolygon
          if (country.geometry.type === "Polygon") {
            coords = [coords];
          }

          coords.forEach((polygonGroup) => {
            polygonGroup.forEach((polygon) => {
              // Safeguard for missing nested arrays
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
              const randomColor = new THREE.Color(
                `hsl(${Math.random() * 360}, 70%, 60%)`
              );
              const material = new THREE.LineBasicMaterial({
                color: randomColor,
                transparent: true,
                opacity: 0.7,
              });
              const line = new THREE.Line(geometry, material);
              edges.add(line);
            });
          });
        });

        scene.add(edges);
        fadeIn();
      })
      .catch((err) => console.error("Failed to load world map:", err));

    // --- ANIMATION LOOP ---
    let opacity = 0;
    const fadeIn = () => {
      const fadeInterval = setInterval(() => {
        if (opacity >= 1) {
          clearInterval(fadeInterval);
        } else {
          opacity += 0.02;
          scene.traverse((child) => {
            if (child.material && child.material.opacity !== undefined) {
              child.material.opacity = Math.min(1, opacity);
            }
          });
        }
      }, 30);
    };

    const animate = () => {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.001;
      if (edges) edges.rotation.y += 0.001;
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

    // --- CLEANUP ---
    return () => {
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100vh",
        background: "radial-gradient(ellipse at center, #0a0f25, #000000)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          color: "#fff",
          fontFamily: "Poppins, sans-serif",
          fontSize: "1.2rem",
          letterSpacing: "0.05em",
        }}
      >
        🌎 GlobeView
      </div>
    </div>
  );
};

export default GlobeView;
