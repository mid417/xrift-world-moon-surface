import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BackSide, ShaderMaterial } from 'three'

export interface SkyboxProps {
  /** skyboxのサイズ（半径） */
  radius?: number
}

const vertexShader = /* glsl */ `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vPosition;

  // Hash function for pseudo-random values
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    // Normalize position for consistent star placement
    vec3 dir = normalize(vPosition);

    // Background gradient: dark black to deep navy
    float gradient = smoothstep(-1.0, 1.0, dir.y);
    vec3 bgColor = mix(vec3(0.0, 0.0, 0.02), vec3(0.02, 0.02, 0.08), gradient);

    // Star layers
    vec3 starColor = vec3(0.0);

    // Create multiple layers of stars with different densities and sizes
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float scale = 200.0 + fi * 150.0;
      vec2 uv = dir.xz / (dir.y + 1.001) * scale + fi * 100.0;
      // Use a second projection for stars below horizon too
      if (dir.y < 0.0) {
        uv = dir.xz / (-dir.y + 1.001) * scale + fi * 100.0 + 500.0;
      }

      vec2 gridId = floor(uv);
      vec2 gridUv = fract(uv) - 0.5;

      float rnd = hash(gridId + fi * 17.0);
      float rnd2 = hash(gridId + fi * 31.0 + 7.0);

      // Star threshold - controls density
      float threshold = 0.92 - fi * 0.03;
      if (rnd > threshold) {
        // Star position within grid cell
        vec2 starPos = (vec2(hash(gridId + 1.0), hash(gridId + 2.0)) - 0.5) * 0.6;
        float dist = length(gridUv - starPos);

        // Star size varies
        float starSize = 0.01 + rnd2 * 0.02 + fi * 0.005;
        float brightness = smoothstep(starSize, 0.0, dist);

        // Twinkle animation - each star has its own phase and speed
        float twinklePhase = rnd * 6.2831;
        float twinkleSpeed = 0.5 + rnd2 * 1.5;
        float twinkle = 0.5 + 0.5 * sin(uTime * twinkleSpeed + twinklePhase);
        twinkle = mix(0.3, 1.0, twinkle);

        // Star color variation (mostly white, some slightly blue or warm)
        vec3 sColor = vec3(1.0);
        if (rnd2 > 0.7) {
          sColor = vec3(0.8, 0.85, 1.0); // slightly blue
        } else if (rnd2 < 0.2) {
          sColor = vec3(1.0, 0.95, 0.8); // slightly warm
        }

        starColor += brightness * twinkle * sColor * (1.0 - fi * 0.2);
      }
    }

    gl_FragColor = vec4(bgColor + starColor, 1.0);
  }
`

/**
 * Skyboxコンポーネント
 * カスタムシェーダーによる星空背景を表示します
 */
export const Skybox: React.FC<SkyboxProps> = ({ radius = 500 }) => {
  const materialRef = useRef<ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    [],
  )

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta
    }
  })

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 32]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
