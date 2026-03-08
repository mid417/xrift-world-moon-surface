import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BackSide, FrontSide, Mesh } from 'three'
import { useXRift } from '@xrift/world-components'

export interface EarthProps {
  /** 配置位置 */
  position?: [number, number, number]
  /** 球体の半径 */
  radius?: number
}

/** 地軸の傾き（度） */
const AXIAL_TILT_DEG = 23.5
/** 地軸の傾き（ラジアン） */
const AXIAL_TILT_RAD = (AXIAL_TILT_DEG * Math.PI) / 180
/** 自転速度: 1時間で1回転 = 2π / 3600 rad/sec */
const ROTATION_SPEED = (2 * Math.PI) / 1000

const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);

    vNormal = worldNormal;
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const atmosphereFrontFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    float facing = clamp(dot(normalize(vNormal), normalize(vViewDirection)), 0.0, 1.0);
    float haze = pow(facing, 1.1) * 0.55;
    vec3 color = vec3(0.2, 0.5, 1.0) * haze;

    gl_FragColor = vec4(color, haze * 0.7);
  }
`

const atmosphereGlowFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    float facing = clamp(dot(normalize(-vNormal), normalize(vViewDirection)), 0.0, 1.0);
    // facing: 外縁（limb）≈ 0、内縁（地球表面寄り）≈ 大きい値
    // → facing を直接使うことで内側を明るく、外側を暗く
    float glow = pow(facing, 1.8) * 2.0;
    vec3 color = vec3(0.15, 0.5, 1.0) * glow;

    gl_FragColor = vec4(color, min(glow * 0.85, 1.0));
  }
`

/**
 * 地球コンポーネント
 * 月面の空に浮かぶ地球を表示します。
 * 地軸23.5°の傾きと自転アニメーション付き。
 */
export const Earth: React.FC<EarthProps> = ({
  position = [0, 40, -80],
  radius = 15,
}) => {
  const meshRef = useRef<Mesh>(null)
  const { baseUrl } = useXRift()
  const texture = useTexture(`${baseUrl}land_ocean_ice_cloud_2048.jpg`)
  const atmosphereScale = 1.06
  const atmosphereGlowScale = 1.25
  const atmosphereUniforms = useMemo(() => ({}), [])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += ROTATION_SPEED * delta
    }
  })

  return (
    // group で地軸の傾きを保持（23.5°Z 軸傾き）
    // 内側の mesh がローカル Y 軸（= 傾いた地軸）で自転する
    <group position={position} rotation={[0, 0, AXIAL_TILT_RAD]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      <mesh scale={atmosphereScale}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          uniforms={atmosphereUniforms}
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFrontFragmentShader}
          side={FrontSide}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh scale={atmosphereGlowScale}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          uniforms={atmosphereUniforms}
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereGlowFragmentShader}
          side={BackSide}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
