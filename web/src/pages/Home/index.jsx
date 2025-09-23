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

import React, { useContext, useEffect, useState, useRef } from 'react';
import { StatusContext } from '../../context/Status';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import { API } from '../../helpers';
import * as THREE from 'three';
import { IconUser, IconBell, IconMoon, IconSun, IconGlobe } from '@douyinfe/semi-icons';

const Home = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const isMobile = useIsMobile();
  const webglContainerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);

  // 取消首页自动弹出公告抽屉

  // WebGL 烟雾效果初始化
  useEffect(() => {
    if (!webglContainerRef.current) return;

    // 初始化 Three.js 场景
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1.0);
    webglContainerRef.current.appendChild(renderer.domElement);

    const clock = new THREE.Clock();

    // 创建背景平面
    const geometry = new THREE.PlaneGeometry((window.innerWidth / window.innerHeight) * 4, 4, 1);

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
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // 动画循环
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      uniforms.time.value += delta;
      renderer.render(scene, camera);
    };

    // 窗口大小调整
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
      
      const newGeometry = new THREE.PlaneGeometry((window.innerWidth / window.innerHeight) * 4, 4, 1);
      plane.geometry.dispose();
      plane.geometry = newGeometry;
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
    <>
      <div style={{
        margin: 0,
        overflow: 'hidden',
        backgroundColor: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#fff',
        cursor: 'default',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh'
      }}>
        {/* 首页不自动展示公告抽屉，统一在全局 HeaderBar 的“消息”中手动打开 */}

        {/* WebGL Canvas 容器 */}
        <div
          ref={webglContainerRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1
          }}
        />

        {/* 移除首页自定义头部，统一使用全局 HeaderBar（根据 isHomePage 自动透明/白色、白色文字、无色logo） */}

        {/* 标题区域容器 */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          userSelect: 'none'
        }}>
          {/* 上半句：全球大模型 */}
          <div style={{
            fontSize: '16px',
            fontWeight: 500,
            letterSpacing: '10px',
            color: 'rgba(160, 170, 180, 0.9)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.4), 0 0 8px rgba(120, 160, 200, 0.2)',
            marginBottom: '46px'
          }}>
            [原能引警 - 全球AI大模型生态基座]
          </div>

          {/* Kyber Core 主标题 - 使用图片 */}
          <div style={{
            marginBottom: '41px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img 
              src="/kybercore.png" 
              alt="KyberCore" 
              style={{
                width: isMobile ? '90vw' : '60vw',
                height: 'auto',
                maxWidth: '1063px',
                maxHeight: '224px',
                minWidth: isMobile ? '280px' : '400px',
                filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 15px rgba(120, 160, 200, 0.4))',
                opacity: 0.95
              }}
            />
          </div>

          {/* 立即开始按钮容器 - 带烟雾效果 */}
          <div style={{
            position: 'relative',
            pointerEvents: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* 按钮周围的烟雾效果 */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isMobile ? '220px' : '320px',
              height: isMobile ? '90px' : '120px',
              background: `
                radial-gradient(ellipse 60% 40% at 30% 50%, rgba(120, 160, 200, 0.35) 0%, rgba(120, 160, 200, 0.15) 50%, transparent 80%),
                radial-gradient(ellipse 50% 30% at 70% 60%, rgba(100, 140, 180, 0.28) 0%, rgba(100, 140, 180, 0.12) 45%, transparent 75%),
                radial-gradient(ellipse 40% 50% at 50% 30%, rgba(140, 180, 220, 0.25) 0%, rgba(140, 180, 220, 0.08) 40%, transparent 85%)
              `,
              borderRadius: '50%',
              filter: 'blur(6px)',
              animation: 'smokeFloat 4s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: -1
            }} />

            {/* 额外的烟雾层 - 增强效果 */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isMobile ? '160px' : '240px',
              height: isMobile ? '70px' : '90px',
              background: `
                radial-gradient(ellipse 70% 50% at 40% 40%, rgba(160, 190, 220, 0.2) 0%, transparent 60%),
                radial-gradient(ellipse 60% 40% at 60% 70%, rgba(130, 170, 210, 0.18) 0%, transparent 65%)
              `,
              borderRadius: '50%',
              filter: 'blur(10px)',
              animation: 'smokeFloat 5s ease-in-out infinite reverse',
              pointerEvents: 'none',
              zIndex: -1
            }} />

            {/* 立即体验按钮 */}
            <Link 
              to="/console"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '130px',
                height: '37px',
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: 'rgba(15, 15, 15, 0.95)',
                background: 'rgba(255, 255, 255, 1)',
                border: 'none',
                borderRadius: '22.5px',
                opacity: 1,
                boxShadow: `
                  0 4px 12px rgba(0, 0, 0, 0.15),
                  0 2px 6px rgba(0, 0, 0, 0.1)
                `,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(248, 250, 252, 1)';
                e.target.style.boxShadow = `
                  0 6px 16px rgba(0, 0, 0, 0.2),
                  0 3px 8px rgba(0, 0, 0, 0.15)
                `;
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 1)';
                e.target.style.boxShadow = `
                  0 4px 12px rgba(0, 0, 0, 0.15),
                  0 2px 6px rgba(0, 0, 0, 0.1)
                `;
                e.target.style.transform = 'translateY(0px)';
              }}
            >
              <span>立即体验</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* 响应式样式和动画 */}
        <style>{`
          @keyframes smokeFloat {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1) rotate(0deg);
              opacity: 0.8;
            }
            25% {
              transform: translate(-48%, -52%) scale(1.05) rotate(1deg);
              opacity: 0.9;
            }
            50% {
              transform: translate(-52%, -48%) scale(0.95) rotate(-0.5deg);
              opacity: 0.7;
            }
            75% {
              transform: translate(-49%, -51%) scale(1.02) rotate(0.8deg);
              opacity: 0.85;
            }
          }

          @media (max-width: 480px) {
            .kyber-title {
              font-size: 24vw !important;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default Home;
