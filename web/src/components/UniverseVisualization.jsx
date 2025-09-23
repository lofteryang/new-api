import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import starData from '../data.json';

const UniverseVisualization = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const particleSystemRef = useRef(null);
  const animationIdRef = useRef(null);
  const [hoveredStar, setHoveredStar] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // ☒ 将星体数据解析为球面3D坐标
  const convertToSphericalCoordinates = (star, radius = 100) => {
    // 使用恒星的实际坐标作为种子生成球面坐标
    const phi = (star.x % 360) * (Math.PI / 180); // 方位角
    const theta = ((star.y % 180) + 90) * (Math.PI / 180); // 极角
    const r = radius + (star.z % 50); // 半径变化

    return {
      x: r * Math.sin(theta) * Math.cos(phi),
      y: r * Math.cos(theta),
      z: r * Math.sin(theta) * Math.sin(phi)
    };
  };

  // ☒ 恒星亮度和颜色映射
  const getStarProperties = (star) => {
    // 根据视星等计算粒子大小 (视星等越小越亮)
    const size = Math.max(0.5, 5 - star.magnitude);

    // 根据恒星类型和颜色设置材质颜色
    const colorMap = {
      'M-type star': 0xff4500, // 红色
      'K-type star': 0xffa500, // 橙色
      'G-type star': 0xffff00, // 黄色
      'F-type star': 0xfff8e1, // 淡黄色
      'A-type star': 0x87ceeb, // 蓝白色
      'B-type star': 0x4169e1  // 蓝色
    };

    return {
      size,
      color: colorMap[star.type] || 0xffffff,
      opacity: Math.min(1.0, Math.max(0.3, 1 - star.magnitude / 5))
    };
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // ☒ 初始化Three.js场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000008);
    sceneRef.current = scene;

    // 相机设置
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 200);
    cameraRef.current = camera;

    // 渲染器设置
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(350, 350);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ☒ 鼠标轨道和缩放控制
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = false;
    controls.minDistance = 50;
    controls.maxDistance = 300;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // 创建球体框架
    const sphereGeometry = new THREE.SphereGeometry(100, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    });
    const sphereFrame = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphereFrame);

    // ☒ 为星星创建粒子系统
    const particleCount = starData.length;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    starData.forEach((star, i) => {
      // 将星体数据解析为3D坐标
      const sphericalPos = convertToSphericalCoordinates(star);
      const starProps = getStarProperties(star);

      positions[i * 3] = sphericalPos.x;
      positions[i * 3 + 1] = sphericalPos.y;
      positions[i * 3 + 2] = sphericalPos.z;

      // 设置颜色
      const color = new THREE.Color(starProps.color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = starProps.size;
    });

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 创建自定义shader材质
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        uniform float pixelRatio;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // 添加脉动效果
          float pulsation = 1.0 + 0.3 * sin(time * 2.0 + position.x * 0.01);

          gl_PointSize = size * pixelRatio * pulsation * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float strength = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);

          // 创建星形效果
          float angle = atan(gl_PointCoord.y - 0.5, gl_PointCoord.x - 0.5);
          float spike = abs(sin(angle * 4.0)) * 0.3 + 0.7;
          strength *= spike;

          gl_FragColor = vec4(vColor, strength);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    particleSystemRef.current = particleSystem;

    // 鼠标交互
    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      setMousePosition({ x: event.clientX, y: event.clientY });

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      // 检测点击的星星
      const threshold = 10;
      raycasterRef.current.params.Points.threshold = threshold;

      const intersects = raycasterRef.current.intersectObject(particleSystem);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        const starIndex = intersect.index;
        setHoveredStar(starData[starIndex]);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredStar(null);
        renderer.domElement.style.cursor = 'default';
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // 动画循环
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // 更新时间uniform
      if (particleMaterial.uniforms) {
        particleMaterial.uniforms.time.value = Date.now() * 0.001;
      }

      // 更新控制器
      controls.update();

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      controls.dispose();

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={mountRef}
        style={{
          width: '350px',
          height: '350px',
          border: '2px solid rgba(135, 206, 250, 0.3)',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'radial-gradient(circle, rgba(0, 0, 8, 0.9) 0%, rgba(0, 0, 17, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: `
            0 0 30px rgba(135, 206, 250, 0.3),
            inset 0 0 30px rgba(135, 206, 250, 0.1)
          `
        }}
      />

      {/* 星星信息提示 */}
      {hoveredStar && (
        <div
          style={{
            position: 'fixed',
            left: mousePosition.x + 15,
            top: mousePosition.y - 15,
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(135, 206, 250, 0.4)',
            pointerEvents: 'none',
            zIndex: 1001,
            fontSize: '13px',
            maxWidth: '220px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#87CEEB' }}>
            {hoveredStar.name}
          </div>
          <div>Type: <span style={{ color: '#FFD700' }}>{hoveredStar.type}</span></div>
          <div>Magnitude: <span style={{ color: '#98FB98' }}>{hoveredStar.magnitude}</span></div>
        </div>
      )}

      {/* 控制提示 */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        color: 'rgba(135, 206, 250, 0.8)',
        fontSize: '11px',
        background: 'rgba(0, 0, 0, 0.6)',
        padding: '6px 8px',
        borderRadius: '4px',
        border: '1px solid rgba(135, 206, 250, 0.2)'
      }}>
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default UniverseVisualization;