import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { feature } from "topojson-client";

export default function GlobeView() {
  const globeRef = useRef();

  useEffect(() => {
    let scene, camera, renderer, globe, frameId;
    const container = globeRef.current;

    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 2.2;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(ambientLight, directionalLight);

    // Globe geometry & material
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: 0x0044ff,
      emissive: 0x111133,
      shininess: 15,
      transparent: true,
      opacity: 0
    });
    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Smooth fade-in after globe loads
    const fadeIn = () => {
      let opacity = 0;
      const fade = () => {
        opacity += 0.02;
        material.opacity = opacity;
        if (opacity < 1) requestAnimationFrame(fade);
      };
      fade();
    };

    // Load world map data
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((data) => {
        const countries = feature(data, data.objects.countries);
        const edges = new THREE.Group();

        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });

        countries.features.forEach((country) => {
          country.geometry.coordinates.forEach((multiPolygon) => {
            multiPolygon.forEach((polygon) => {
              const points = polygon.map(([lon, lat]) => {
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = (lon + 180) * (Math.PI / 180);
                const x = -Math.sin(phi) * Math.cos(theta);
                const y = Math.cos(phi);
                const z = Math.sin(phi) * Math.sin(theta);
                return new THREE.Vector3(x, y, z);
              });
              const geo = new THREE.BufferGeometry().setFromPoints(points);
              const line = new THREE.Line(geo, lineMaterial);
              edges.add(line);
            });
          });
        });

        scene.add(edges);
        fadeIn();
      })
      .catch((err) => console.error("Failed to load world map:", err));

    // Animation loop
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      globe.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
    };
  }, []); // ✅ Runs only once — no restart on click

  return (
    <div
      ref={globeRef}
      style={{
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(circle at 50% 50%, #000020, #000010)",
        overflow: "hidden",
      }}
    />
  );
}
