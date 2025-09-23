let scene, camera, renderer, clock
let material
let uniforms
let lightningTimeout

function init() {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 2

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  document.getElementById('webgl-container').appendChild(renderer.domElement)

  clock = new THREE.Clock()

  const aspect = window.innerWidth / window.innerHeight
  const geometry = new THREE.PlaneGeometry(aspect * 4, 4, 1)

  const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `

  const fragmentShader = `
        precision highp float;
        uniform float time;
        uniform vec2 resolution;
        uniform vec3 lightColor;
        uniform float lightningIntensity;
        varying vec2 vUv;

        // 2D simplex noise by Ian McEwan, Ashima Arts (public domain)
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        float snoise(vec2 v)
        {
            const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                                0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                               -0.577350269189626,  // -1.0 + 2.0 * C.x
                                0.024390243902439); // 1.0 / 41.0
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
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
            g.x  = a0.x * x0.x + h.x * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        float fbm(vec2 st) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            for (int i = 0; i < 6; i++) {
                value += amplitude * snoise(st * frequency);
                frequency *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        // Signed distance to a noisy lightning curve from right to left
        // Build a base curve y = 0.5 + small wiggles, parameterized by x
        float lightningMask(vec2 uv, float t) {
            // Map uv 0..1
            float x = uv.x;
            float baseY = 0.5 + 0.12 * snoise(vec2(x * 8.0, t * 1.5));
            // Add fast jitter during strike
            baseY += 0.04 * snoise(vec2(x * 40.0, t * 20.0));

            // Distance from pixel to curve
            float d = abs(uv.y - baseY);

            // Make core thin, glow wider
            float core = smoothstep(0.012, 0.0, d);
            float glow = smoothstep(0.08, 0.0, d);

            // Add a few side branches
            float branches = 0.0;
            for (int i = 0; i < 3; i++) {
                float bx = fract(x * (3.0 + float(i))) ;
                float by = baseY + (snoise(vec2(bx * 20.0 + float(i)*7.0, t*10.0)) * 0.15) * (1.0 - x);
                float bd = abs(uv.y - by) + (1.0 - x) * 0.02;
                branches += smoothstep(0.02, 0.0, bd);
            }

            float mask = max(glow, core);
            mask = max(mask, branches * 0.6);

            // Fade-in from right side (origin near 0.8, 0.5)
            float side = smoothstep(1.0, 0.0, x);
            return mask * side;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / resolution.xy;

            // Keep aspect when using vUv for textures if needed
            vec2 p = uv;

            // Light center on right side
            vec2 center = vec2(0.8, 0.5);
            float dist = distance(p, center);

            // Flowing smoke/plasma using animated fbm
            vec2 smokeUv = p * 3.0 + vec2(time * 0.05, time * 0.03);
            float smoke = fbm(smokeUv);
            smoke = 0.5 + 0.5 * smoke; // normalize to 0..1

            float lightPulse = 0.9 + sin(time * 2.0) * 0.1;
            float baseLight = lightPulse / (dist * dist * 8.0 + 0.5);
            baseLight += smoke * 0.5 * baseLight;

            vec3 baseColor = lightColor;
            vec3 color = vec3(0.0);
            color = mix(color, baseColor, clamp(baseLight, 0.0, 1.0));

            if (lightningIntensity > 0.0) {
                float m = lightningMask(p, time);
                // flash brightness ramp for extra punch
                float flash = 1.0 + 1.5 * lightningIntensity;
                vec3 boltColor = baseColor * (1.2 + 0.8 * lightningIntensity);
                color = mix(color, boltColor * flash, clamp(m * lightningIntensity, 0.0, 1.0));
            }

            // Gentle vignette for depth
            float vignette = smoothstep(1.2, 0.3, dist * 1.2);
            color *= vignette;

            gl_FragColor = vec4(color, 1.0);
        }
    `

  uniforms = {
    time: { value: 0.0 },
    resolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    lightColor: { value: new THREE.Color(0x87cefa) },
    lightningIntensity: { value: 0.0 },
  }

  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
  })

  const plane = new THREE.Mesh(geometry, material)
  scene.add(plane)

  triggerLightning()

  window.addEventListener('resize', onWindowResize, false)
}

function animate() {
  requestAnimationFrame(animate)
  const delta = clock.getDelta()
  uniforms.time.value += delta
  renderer.render(scene, camera)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  uniforms.resolution.value.set(window.innerWidth, window.innerHeight)
}

function triggerLightning() {
  if (lightningTimeout) clearTimeout(lightningTimeout)
  const delay = Math.random() * 8000 + 4000
  lightningTimeout = setTimeout(() => {
    uniforms.lightningIntensity.value = 1.0
    setTimeout(() => {
      uniforms.lightningIntensity.value = 0.0
      triggerLightning()
    }, Math.random() * 200 + 100)
  }, delay)
}

init()
animate()

const chatInputContainer = document.getElementById('chat-input-container')
const chatInput = document.getElementById('chat-input')

chatInput.addEventListener('focus', () => {
  chatInputContainer.classList.add('focused')
})

chatInput.addEventListener('blur', () => {
  chatInputContainer.classList.remove('focused')
})

const sendButton = document.getElementById('send-button')
sendButton.addEventListener('click', () => {
  // 占位：点击时短暂闪光，模拟交互
  chatInput.focus()
})
