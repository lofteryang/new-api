/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const SmokeEffect = () => {
  const isMobile = useIsMobile();
  const webglContainerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!webglContainerRef.current) return;

    // 获取容器尺寸
    const container = webglContainerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 初始化 Three.js 场景
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setClearColor(0x000000, 1.0); // 黑色背景
    webglContainerRef.current.appendChild(renderer.domElement);

    const clock = new THREE.Clock();

    // 创建背景平面
    const geometry = new THREE.PlaneGeometry(4, 6, 1);

    // GLSL 着色器
    const vertexShader = `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform vec2 resolution;

      // Simplex Noise 实现
      vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec2 mod289(vec2 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec3 permute(vec3 x) {
        return mod289(((x*34.0)+1.0)*x);
      }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float dynamicLight(vec2 uv, vec2 center, float t) {
        float dist = distance(uv, center);
        float pulse = 0.8 + sin(t * 1.5) * 0.2 + sin(t * 3.7) * 0.1;
        float baseLight = pulse / (dist * dist * 8.0 + 0.2);
        float flicker = 1.0 + sin(t * 25.0) * 0.05 + sin(t * 47.0) * 0.03;
        return baseLight * flicker;
      }

      float generateSmoke(vec2 uv, float t) {
        vec2 flow = vec2(-0.08, 0.01);
        vec2 smokeUv = uv + flow * t;
        float smoke = 0.0;
        float amplitude = 1.0;
        vec2 coord = smokeUv * 3.0;
        
        for (int i = 0; i < 5; i++) {
          float swirl = sin(coord.x * 2.0 + t * 0.25) * 0.1;
          vec2 swirlCoord = coord + vec2(0.0, swirl);
          smoke += snoise(swirlCoord + vec2(t * 0.15, t * 0.05)) * amplitude;
          coord *= 2.0;
          amplitude *= 0.5;
        }
        
        vec2 turbulence = vec2(
          snoise(uv * 8.0 + vec2(t * 0.1, 0.0)) * 0.05,
          snoise(uv * 6.0 + vec2(0.0, t * 0.08)) * 0.03
        );
        
        float turbulentSmoke = snoise((uv + turbulence) * 4.0 + vec2(t * 0.05, t * 0.04));
        smoke += turbulentSmoke * 0.3;
        
        return clamp(smoke, -1.0, 1.0);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 center = vec2(0.95, 0.5);
        
        float smoke = generateSmoke(uv, time);
        float distToLight = distance(uv, center);
        float smokeDensity = smoothstep(0.8, 0.0, distToLight) * (0.5 + smoke * 0.5);
        
        float mainLight = dynamicLight(uv, center, time);
        float scatteredLight = mainLight * smokeDensity * 2.0;
        scatteredLight += mainLight * abs(smoke) * 0.3;
        
        float halo = 1.0 / (distToLight * distToLight * 15.0 + 1.0) * 0.8;
        float outerGlow = 1.0 / (distToLight * distToLight * 3.0 + 1.0) * 0.3;
        
        vec3 finalColor = vec3(0.0);
        vec3 smokeColor = vec3(0.1, 0.15, 0.3);
        vec3 lightSmokeColor = vec3(0.4, 0.6, 1.0);
        vec3 brightSmokeColor = vec3(0.8, 0.9, 1.0);
        
        vec3 currentSmokeColor = mix(smokeColor, lightSmokeColor, clamp(scatteredLight * 3.0, 0.0, 1.0));
        currentSmokeColor = mix(currentSmokeColor, brightSmokeColor, clamp(scatteredLight * 8.0, 0.0, 1.0));
        
        finalColor += currentSmokeColor * smokeDensity;
        
        vec3 lightColor = vec3(0.4, 0.5, 0.7);
        finalColor += lightColor * mainLight * 0.4;
        finalColor += vec3(0.15, 0.3, 0.6) * halo * 0.4;
        finalColor += vec3(0.03, 0.15, 0.4) * outerGlow * 0.3;
        
        finalColor = clamp(finalColor, 0.0, 1.0);
        finalColor = finalColor / (finalColor + vec3(1.0));
        finalColor = pow(finalColor, vec3(0.9));
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // 创建材质
    const uniforms = {
      time: { value: 0.0 },
      resolution: { value: new THREE.Vector2(containerWidth, containerHeight) }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // 窗口大小调整
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      uniforms.resolution.value.set(newWidth, newHeight);
      
      const newGeometry = new THREE.PlaneGeometry(4, 6, 1);
      plane.geometry.dispose();
      plane.geometry = newGeometry;
    };

    // 动画循环
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      uniforms.time.value += delta;
      renderer.render(scene, camera);
    };

    window.addEventListener('resize', handleResize);
    animate();

    // 保存引用
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (renderer) {
        renderer.dispose();
      }
      if (webglContainerRef.current && renderer.domElement) {
        webglContainerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* WebGL Canvas 容器 */}
      <div
        ref={webglContainerRef}
        className="absolute inset-0"
        style={{
          width: '100%',
          height: '100%'
        }}
      />

      {/* KyberCore 文字 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div
            className={`${isMobile ? 'text-6xl' : 'text-8xl'} font-black`}
            style={{
              letterSpacing: '-0.04em',
              color: '#e5e7eb', // 直接设置白灰色
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.9), 0 0 30px rgba(229, 231, 235, 0.4), 0 0 60px rgba(209, 213, 219, 0.3)',
              filter: 'drop-shadow(0 0 20px rgba(229, 231, 235, 0.3))',
            }}
          >
            <span>Kyber </span>
            <span style={{ color: '#d1d5db' }}>Core</span>
          </div>
          <div 
            className={`${isMobile ? 'text-lg' : 'text-xl'} mt-4 font-medium`}
            style={{
              color: '#d1d5db', // 直接设置白灰色
              textShadow: '0 3px 6px rgba(0, 0, 0, 0.8), 0 0 15px rgba(209, 213, 219, 0.4)',
              filter: 'drop-shadow(0 0 10px rgba(209, 213, 219, 0.2))',
            }}
          >
            全球大模型尽在掌握
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmokeEffect;
