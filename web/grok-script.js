// 全局变量
let scene, camera, renderer, clock;
let material; // 用于背景特效的材质
let uniforms; // 用于着色器的参数
let lightningTimeout; // 用于控制闪电间隔的定时器

// 初始化场景
function init() {
  // 1. 设置 Three.js 基础
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.z = 2; // 调整相机位置

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1.0);
  document.getElementById('webgl-container').appendChild(renderer.domElement);

  clock = new THREE.Clock();

  // 2. 创建背景平面
  const geometry = new THREE.PlaneGeometry(
    (window.innerWidth / window.innerHeight) * 4,
    4,
    1,
  );

  // 3. 定义 GLSL 着色器
  const vertexShader = `
        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

  const fragmentShader = `
        uniform float time;
        uniform vec2 resolution;
        uniform vec3 lightColor;
        uniform float lightningIntensity;
        uniform vec2 mousePosition;
        uniform float mouseLightning;

        // 高质量 Simplex Noise 实现
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
            const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                                0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                                -0.577350269189626,  // -1.0 + 2.0 * C.x
                                0.024390243902439); // 1.0 / 41.0
            
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);

            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;

            i = mod289(i); // Avoid truncation effects in permutation
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));

            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;

            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;

            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        // Fractal Brownian Motion (FBM) 用于复杂噪声
        float fbm(vec2 coord) {
            float value = 0.0;
            float scale = 0.5;
            float total = 0.0;
            
            for (int i = 0; i < 6; ++i) {
                value += snoise(coord) * scale;
                total += scale;
                coord *= 2.0;
                scale *= 0.5;
            }
            return value / total;
        }

        // 高级闪电生成函数
        float generateLightning(vec2 uv, float t) {
            // 多个闪电源点 (调整到新的光源位置)
            vec2 lightPos1 = vec2(0.95, 0.6);
            vec2 lightPos2 = vec2(0.98, 0.4);
            vec2 lightPos3 = vec2(0.92, 0.5);
            
            float lightning = 0.0;
            
            // 主闪电分支
            for (int i = 0; i < 3; i++) {
                vec2 lightPos = (i == 0) ? lightPos1 : (i == 1) ? lightPos2 : lightPos3;
                vec2 toLight = uv - lightPos;
                float dist = length(toLight);
                
                // 闪电路径的噪声扭曲
                float angle = atan(toLight.y, toLight.x);
                float noiseOffset = snoise(vec2(angle * 8.0 + t * 20.0, dist * 15.0)) * 0.15;
                float pathNoise = snoise(vec2(uv.x * 20.0, uv.y * 20.0 + t * 30.0)) * 0.08;
                
                // 闪电分支的锯齿形状
                float zigzag = sin(dist * 50.0 + t * 100.0 + noiseOffset * 10.0) * 0.02;
                float branchNoise = snoise(vec2(dist * 25.0, angle * 15.0 + t * 25.0)) * 0.03;
                
                // 计算到闪电路径的距离
                float lightningPath = abs(sin(angle * 3.0 + t * 15.0) * 0.1 + noiseOffset + zigzag + branchNoise);
                
                // 闪电强度衰减
                float intensity = 1.0 / (dist * dist * 20.0 + 1.0);
                float pathIntensity = 1.0 / (lightningPath * 200.0 + 0.01);
                
                // 闪电核心和光晕
                float core = smoothstep(0.02, 0.0, lightningPath) * intensity;
                float glow = smoothstep(0.1, 0.0, lightningPath) * intensity * 0.3;
                
                lightning += (core + glow) * (float(i) == 0.0 ? 1.0 : 0.6);
            }
            
            return clamp(lightning, 0.0, 1.0);
        }

        // 动态光源效果
        float dynamicLight(vec2 uv, vec2 center, float t) {
            float dist = distance(uv, center);
            
            // 光源呼吸效果
            float pulse = 0.8 + sin(t * 1.5) * 0.2 + sin(t * 3.7) * 0.1;
            
            // 基础光照衰减 (更强的光效)
            float baseLight = pulse / (dist * dist * 8.0 + 0.2);
            
            // 添加光源闪烁
            float flicker = 1.0 + sin(t * 25.0) * 0.05 + sin(t * 47.0) * 0.03;
            
            return baseLight * flicker;
        }

        // 鼠标烟雾拖尾效果
        float generateMouseSmoke(vec2 uv, vec2 mousePos, float t, float intensity) {
            vec2 toMouse = uv - mousePos;
            float dist = length(toMouse);
            
            if (dist > 0.2) return 0.0; // 限制烟雾范围
            
            // 烟雾在鼠标身后产生
            float angle = atan(toMouse.y, toMouse.x);
            
            // 创建烟雾拖尾效果
            float smokeNoise = snoise(uv * 15.0 + vec2(t * 2.0, t * 1.5));
            float smokeDensity = smoothstep(0.2, 0.0, dist) * (0.5 + smokeNoise * 0.5);
            
            // 烟雾飘散效果
            float dissipation = 1.0 - smoothstep(0.0, 1.0, intensity); // intensity 从1到0时烟雾飘散
            
            return smokeDensity * dissipation;
        }

        // 真实烟雾流动效果 (降低速度)
        float generateSmoke(vec2 uv, float t) {
            // 主烟雾流从右向左 (降低流动速度)
            vec2 flow = vec2(-0.08, 0.01); // 减慢流动速度
            vec2 smokeUv = uv + flow * t;
            
            // 多层烟雾噪声
            float smoke = 0.0;
            float amplitude = 1.0;
            vec2 coord = smokeUv * 3.0;
            
            for (int i = 0; i < 5; i++) {
                // 添加涡流效果 (减慢涡流速度)
                float swirl = sin(coord.x * 2.0 + t * 0.25) * 0.1;
                vec2 swirlCoord = coord + vec2(0.0, swirl);
                
                smoke += snoise(swirlCoord + vec2(t * 0.15, t * 0.05)) * amplitude;
                coord *= 2.0;
                amplitude *= 0.5;
            }
            
            // 添加湍流效果 (减慢湍流速度)
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
            vec2 normalizedUv = uv * 2.0 - 1.0;
            normalizedUv.x *= resolution.x / resolution.y;

            // 主光源位置
            vec2 center = vec2(0.95, 0.5);
            
            // 生成真实烟雾
            float smoke = generateSmoke(uv, time);
            
            // 烟雾密度基于距离光源的远近
            float distToLight = distance(uv, center);
            float smokeDensity = smoothstep(0.8, 0.0, distToLight) * (0.5 + smoke * 0.5);
            
            // 主光源效果
            float mainLight = dynamicLight(uv, center, time);
            
            // 烟雾散射光线效果
            float scatteredLight = mainLight * smokeDensity * 2.0;
            scatteredLight += mainLight * abs(smoke) * 0.3;
            
            // 光晕效果
            float halo = 1.0 / (distToLight * distToLight * 15.0 + 1.0) * 0.8;
            float outerGlow = 1.0 / (distToLight * distToLight * 3.0 + 1.0) * 0.3;
            
            // 颜色混合
            vec3 finalColor = vec3(0.0);
            
            // 烟雾颜色 - 根据密度和光照变化
            vec3 smokeColor = vec3(0.1, 0.15, 0.3); // 深蓝色烟雾
            vec3 lightSmokeColor = vec3(0.4, 0.6, 1.0); // 被光照亮的烟雾
            vec3 brightSmokeColor = vec3(0.8, 0.9, 1.0); // 最亮的烟雾
            
            // 根据光照强度混合烟雾颜色
            vec3 currentSmokeColor = mix(smokeColor, lightSmokeColor, clamp(scatteredLight * 3.0, 0.0, 1.0));
            currentSmokeColor = mix(currentSmokeColor, brightSmokeColor, clamp(scatteredLight * 8.0, 0.0, 1.0));
            
            // 应用烟雾
            finalColor += currentSmokeColor * smokeDensity;
            
            // 主光源 (进一步降低亮度让烟雾更可见)
            vec3 lightColor = vec3(0.4, 0.5, 0.7);
            finalColor += lightColor * mainLight * 0.4; // 进一步降低光源强度
            finalColor += vec3(0.15, 0.3, 0.6) * halo * 0.4;
            finalColor += vec3(0.03, 0.15, 0.4) * outerGlow * 0.3;
            
            // 闪电特效已移除
            
            // 鼠标特效已移除
            
            // 最终颜色调整
            finalColor = clamp(finalColor, 0.0, 1.0);
            finalColor = finalColor / (finalColor + vec3(1.0));
            finalColor = pow(finalColor, vec3(0.9));
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

  // 4. 定义 uniforms
  uniforms = {
    time: { value: 0.0 },
    resolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    lightColor: { value: new THREE.Color(0x87cefa) },
    lightningIntensity: { value: 0.0 },
    mousePosition: { value: new THREE.Vector2(0.5, 0.5) },
    mouseLightning: { value: 0.0 },
  };

  material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
  });

  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);

  // 5. 启动闪电效果
  triggerLightning();

  // 6. 响应式调整
  window.addEventListener('resize', onWindowResize, false);
}

// 渲染循环
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  uniforms.time.value += delta;

  renderer.render(scene, camera);
}

// 窗口大小调整
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.resolution.value.set(window.innerWidth, window.innerHeight);

  // 更新平面几何体以适应新的宽高比
  const newGeometry = new THREE.PlaneGeometry(
    (window.innerWidth / window.innerHeight) * 4,
    4,
    1,
  );
  scene.children[0].geometry.dispose();
  scene.children[0].geometry = newGeometry;
}

// 闪电触发函数
function triggerLightning() {
  if (lightningTimeout) clearTimeout(lightningTimeout);

  // 随机间隔：3-10秒
  const delay = Math.random() * 7000 + 3000;

  lightningTimeout = setTimeout(() => {
    // 闪电开始
    uniforms.lightningIntensity.value = 1.0;

    // 闪电持续时间：50-250ms
    const duration = Math.random() * 200 + 50;

    setTimeout(() => {
      uniforms.lightningIntensity.value = 0.0;
      // 递归调用下一次闪电
      triggerLightning();
    }, duration);
  }, delay);
}

// 启动应用
function startApp() {
  init();
  animate();

  // 鼠标交互
  let mouseTimeout;
  let smokeStartTime = 0;

  document.addEventListener('mousemove', (e) => {
    // 更新鼠标位置 (归一化到 0-1)
    uniforms.mousePosition.value.x = e.clientX / window.innerWidth;
    uniforms.mousePosition.value.y = 1.0 - e.clientY / window.innerHeight; // 翻转Y轴

    // 触发鼠标烟雾效果
    uniforms.mouseLightning.value = 1.0;
    smokeStartTime = performance.now();

    // 清除之前的超时
    if (mouseTimeout) clearTimeout(mouseTimeout);

    // 烟雾逐渐飘散效果 (1秒内从1.0降到0.0)
    const fadeSmoke = () => {
      const elapsed = performance.now() - smokeStartTime;
      const fadeTime = 1000; // 1秒飘散时间

      if (elapsed < fadeTime) {
        uniforms.mouseLightning.value = 1.0 - elapsed / fadeTime;
        requestAnimationFrame(fadeSmoke);
      } else {
        uniforms.mouseLightning.value = 0.0;
      }
    };

    // 开始飘散动画
    requestAnimationFrame(fadeSmoke);
  });

  // 输入框交互
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');

  // 发送按钮点击事件
  sendButton.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
      console.log('发送消息:', message);
      chatInput.value = '';
      // 这里可以添加实际的消息处理逻辑
    }
  });

  // 回车键发送
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendButton.click();
    }
  });

  // 输入框焦点效果已通过CSS实现
}

// 等待页面加载完成后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
