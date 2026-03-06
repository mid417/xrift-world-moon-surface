import { useTexture } from '@react-three/drei'
import { useXRift } from '@xrift/world-components'
import { RigidBody } from '@react-three/rapier'
import { RepeatWrapping, Texture } from 'three'
import { WORLD_CONFIG } from '../../constants'

export interface MoonSurfaceProps {
  /** 配置位置 */
  position?: [number, number, number]
}

function applyRepeat(texture: Texture) {
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(1, 1) // 200×100m 面を 20m/タイルで分割
  texture.needsUpdate = true
}

/**
 * 月面（地面）コンポーネント
 * 月のテクスチャとバンプマッピングで起伏感のある地面を表示します。
 */
export const MoonSurface: React.FC<MoonSurfaceProps> = ({
  position = [0, 0, 0],
}) => {
  const { baseUrl } = useXRift()
  const moonTexture = useTexture(`${baseUrl}2k_moon.jpg`, applyRepeat)

  return (
    <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0.5}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={position}
        receiveShadow
      >
        <planeGeometry args={[WORLD_CONFIG.width, WORLD_CONFIG.depth]} />
        <meshStandardMaterial
          map={moonTexture}
          bumpMap={moonTexture}
          bumpScale={0.4}
        />
      </mesh>
    </RigidBody>
  )
}
