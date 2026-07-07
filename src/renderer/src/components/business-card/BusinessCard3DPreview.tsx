import React, { Suspense, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { toPng } from 'html-to-image'
import { BusinessCardPreview } from './BusinessCardPreview'
import { BusinessCardConfig } from '@renderer/types'
import { QrConfig } from '@renderer/types/qr'

interface BusinessCard3DPreviewProps {
  config: BusinessCardConfig
  qrConfig: QrConfig
  previewUrl: string
}

// Create a rounded rectangle shape
function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape()
  shape.moveTo(-w / 2 + r, -h / 2)
  shape.lineTo(w / 2 - r, -h / 2)
  shape.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false)
  shape.lineTo(w / 2, h / 2 - r)
  shape.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false)
  shape.lineTo(-w / 2 + r, h / 2)
  shape.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false)
  shape.lineTo(-w / 2, -h / 2 + r)
  shape.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false)
  return shape
}

function CardMesh({ textureDataUrl, borderRadius }: { textureDataUrl: string | null; borderRadius: number }): React.JSX.Element {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  useEffect(() => {
    if (!textureDataUrl || !materialRef.current) return

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)

      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.needsUpdate = true

      if (materialRef.current) {
        materialRef.current.map = tex
        materialRef.current.needsUpdate = true
      }
    }
    img.src = textureDataUrl
  }, [textureDataUrl])

  const width = 6
  const height = width * (55 / 85)
  // Scale borderRadius from CSS pixels (on 850px card) to 3D units
  const r3d = Math.min((borderRadius / 850) * width, width / 4, height / 4)

  const geometry = useMemo(() => {
    const shape = createRoundedRectShape(width, height, r3d)
    const geo = new THREE.ShapeGeometry(shape, 32)
    // Compute UVs so the texture maps correctly
    const pos = geo.attributes.position
    const uvs = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      uvs[i * 2] = (pos.getX(i) + width / 2) / width
      uvs[i * 2 + 1] = (pos.getY(i) + height / 2) / height
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    return geo
  }, [width, height, r3d])

  const backGeometry = useMemo(() => {
    const shape = createRoundedRectShape(width, height, r3d)
    const geo = new THREE.ShapeGeometry(shape, 32)
    return geo
  }, [width, height, r3d])

  return (
    <group>
      {/* Front face - MeshBasicMaterial so the texture shows at true colors */}
      <mesh position={[0, 0, 0.01]} geometry={geometry}>
        <meshBasicMaterial ref={materialRef} color="#ffffff" side={THREE.FrontSide} />
      </mesh>
      {/* Back face */}
      <mesh position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]} geometry={backGeometry}>
        <meshBasicMaterial color="#f5f5f5" side={THREE.FrontSide} />
      </mesh>
    </group>
  )
}

function RendererSetup(): null {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping = THREE.NoToneMapping
    gl.outputColorSpace = THREE.SRGBColorSpace
  }, [gl])
  return null
}

function Scene({ textureDataUrl, borderRadius }: { textureDataUrl: string | null; borderRadius: number }): React.JSX.Element {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(1.5, 1, 5.5)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return (
    <>
      <RendererSetup />
      <ambientLight intensity={1} />

      <CardMesh textureDataUrl={textureDataUrl} borderRadius={borderRadius} />

      <ContactShadows
        position={[0, -2.2, 0]}
        opacity={0.3}
        scale={12}
        blur={2.5}
        far={4}
        color="#000000"
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.5}
        enableZoom={true}
        minDistance={3}
        maxDistance={12}
      />
    </>
  )
}

export function BusinessCard3DPreview({ config, qrConfig, previewUrl }: BusinessCard3DPreviewProps): React.JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null)
  const [textureDataUrl, setTextureDataUrl] = useState<string | null>(null)

  const captureCard = useCallback(() => {
    const el = cardRef.current
    if (!el) return

    toPng(el, { pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff' })
      .then((dataUrl) => {
        setTextureDataUrl(dataUrl)
      })
      .catch((err) => {
        console.error('3D capture failed:', err)
      })
  }, [])

  useEffect(() => {
    const timer = setTimeout(captureCard, 800)
    return () => clearTimeout(timer)
  }, [config, qrConfig, previewUrl, captureCard])

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px', position: 'relative' }}>
      {/* Hidden card for texture capture */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '850px',
        height: '550px',
        pointerEvents: 'none',
        zIndex: -1,
        clipPath: 'inset(100%)'
      }}>
        <BusinessCardPreview
          ref={cardRef}
          config={config}
          qrConfig={qrConfig}
          previewUrl={previewUrl}
          disableScaling={true}
        />
      </div>

      <Suspense
        fallback={
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#888', fontSize: '14px'
          }}>
            Chargement...
          </div>
        }
      >
        <Canvas
          gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
          style={{ borderRadius: '12px', cursor: 'grab' }}
        >
          <Scene textureDataUrl={textureDataUrl} borderRadius={config.borderRadius || 12} />
        </Canvas>
      </Suspense>
    </div>
  )
}
