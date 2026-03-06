import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Mesh } from 'three'
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
    </group>
  )
}
