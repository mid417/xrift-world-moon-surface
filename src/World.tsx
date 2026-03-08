import { SpawnPoint } from '@xrift/world-components'
import { Skybox } from './components/Skybox'
import { Earth } from './components/Earth'
import { MoonSurface } from './components/MoonSurface'

export interface WorldProps {
  position?: [number, number, number]
  scale?: number
}

export const World: React.FC<WorldProps> = ({ position = [0, 0, 0], scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
      {/* シェーダーベースの星空 */}
      <Skybox radius={500} />

      {/* プレイヤーのスポーン地点 - 月面中央、北（地球方向）を向く */}
      <group position={[0, 0, 30]} rotation={[0, 0, 0]}>
        <SpawnPoint />
      </group>

      {/* 照明設定 - 宇宙空間なので暗め */}
      <ambientLight intensity={0.3} color="#ffffff" />
      <directionalLight
        position={[20, 30, 10]}
        intensity={0.8}
        color="#fffaf0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={100}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
      />

      {/* 月面（地面） */}
      <MoonSurface />

      {/* 地球 - 北方向の空に配置 */}
      <Earth position={[0, 150, -800]} radius={100} />
    </group>
  )
}
