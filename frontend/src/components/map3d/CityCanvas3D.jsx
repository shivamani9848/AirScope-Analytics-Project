import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Deterministic pseudo-random generator so procedural buildings remain identical across renders
function pseudoRandom(seed) {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
  } catch (e) {
    return false
  }
}

export default function CityCanvas3D({
  metrics,
  city = 'London',
  is2D = false,
  onPinProject,
  onResetView,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const isWebGLAvailable = useRef(checkWebGLSupport())

  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const animationFrameRef = useRef(null)
  const buildingsGroupRef = useRef(null)

  // Floating pins 3D anchor points
  const pinAnchors = useRef([
    { id: 'rainfall', pos: new THREE.Vector3(-14, 15, -4) },
    { id: 'humidity', pos: new THREE.Vector3(4, 25, -8) },
    { id: 'temp', pos: new THREE.Vector3(-6, 12, 10) },
    { id: 'visibility', pos: new THREE.Vector3(15, 18, 6) },
    { id: 'station', pos: new THREE.Vector3(0, 6, 0) },
  ])

  // Camera transition target state
  const cameraTargetPos = useRef(new THREE.Vector3(45, 50, 45))
  const isTransitioning = useRef(false)

  // Generate the procedural low-poly isometric city
  const buildCity = useCallback((scene, currentAqiHex = '#22c55e') => {
    if (buildingsGroupRef.current) {
      scene.remove(buildingsGroupRef.current)
      // Dispose old geometries & materials
      buildingsGroupRef.current.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    }

    const cityGroup = new THREE.Group()
    buildingsGroupRef.current = cityGroup

    // Materials
    const neutralLightMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.65,
      metalness: 0.1,
    })
    const neutralDarkMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.7,
      metalness: 0.15,
    })
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.8,
      metalness: 0.1,
    })

    // Parse the live AQI color into Three.Color for the highlighted pollution corridor
    const aqiColor = new THREE.Color(currentAqiHex)
    const corridorMat = new THREE.MeshStandardMaterial({
      color: aqiColor,
      roughness: 0.45,
      metalness: 0.2,
      emissive: aqiColor,
      emissiveIntensity: 0.15,
    })

    const corridorAccentMat = new THREE.MeshStandardMaterial({
      color: aqiColor.clone().offsetHSL(0.04, 0.1, 0.05),
      roughness: 0.4,
      metalness: 0.25,
      emissive: aqiColor,
      emissiveIntensity: 0.2,
    })

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(90, 90)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.9,
      metalness: 0.05,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.05
    ground.receiveShadow = true
    cityGroup.add(ground)

    // Street Grid Helper
    const gridHelper = new THREE.GridHelper(90, 30, 0xcbd5e1, 0xe2e8f0)
    gridHelper.position.y = 0.01
    cityGroup.add(gridHelper)

    // Grid coordinates: 12 x 12 blocks with streets
    const gridSize = 12
    const blockSpacing = 6.2
    let seed = 42

    for (let i = -gridSize / 2; i < gridSize / 2; i++) {
      for (let j = -gridSize / 2; j < gridSize / 2; j++) {
        seed++
        const posX = i * blockSpacing + (pseudoRandom(seed++) - 0.5) * 1.2
        const posZ = j * blockSpacing + (pseudoRandom(seed++) - 0.5) * 1.2

        // Distance from diagonal avenue (x - z) defines the pollution dispersion corridor
        const corridorDist = Math.abs(posX - posZ)
        const isCorridor = corridorDist < 7.5

        // Height variation: taller buildings in downtown corridor and central blocks
        const centerDist = Math.sqrt(posX * posX + posZ * posZ)
        let height = 3 + (1 - Math.min(centerDist / 35, 1)) * 14 + pseudoRandom(seed++) * 8
        if (isCorridor) {
          height += 4 + pseudoRandom(seed++) * 6
        }
        height = Math.max(height, 2.5)

        const width = 3.2 + (pseudoRandom(seed++) - 0.5) * 1.0
        const depth = 3.2 + (pseudoRandom(seed++) - 0.5) * 1.0

        // Building geometry
        const boxGeo = new THREE.BoxGeometry(width, height, depth)
        // Select material based on whether building is inside the pollution measurement corridor
        let buildingMat
        if (isCorridor) {
          buildingMat = corridorDist < 3.5 ? corridorAccentMat : corridorMat
        } else {
          buildingMat = pseudoRandom(seed++) > 0.4 ? neutralLightMat : neutralDarkMat
        }

        const building = new THREE.Mesh(boxGeo, buildingMat)
        building.position.set(posX, height / 2, posZ)
        building.castShadow = true
        building.receiveShadow = true
        cityGroup.add(building)

        // Add architectural rooftop step-back or penthouse for taller buildings
        if (height > 10) {
          const capHeight = 1.5 + pseudoRandom(seed++) * 2
          const capWidth = width * 0.65
          const capDepth = depth * 0.65
          const capGeo = new THREE.BoxGeometry(capWidth, capHeight, capDepth)
          const cap = new THREE.Mesh(capGeo, isCorridor ? corridorMat : roofMat)
          cap.position.set(posX, height + capHeight / 2, posZ)
          cap.castShadow = true
          cap.receiveShadow = true
          cityGroup.add(cap)
        }
      }
    }

    scene.add(cityGroup)
  }, [])

  // Initialize Three.js scene
  useEffect(() => {
    if (!isWebGLAvailable.current || !containerRef.current || !canvasRef.current) {
      return
    }

    const container = containerRef.current
    const canvas = canvasRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf8fafc)
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.009)
    sceneRef.current = scene

    // Camera (Isometric perspective FOV 36°)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000)
    camera.position.set(45, 50, 45)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    rendererRef.current = renderer

    // OrbitControls
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.maxPolarAngle = Math.PI / 2 - 0.05 // Don't go below ground
    controls.minDistance = 25
    controls.maxDistance = 140
    controls.target.set(0, 2, 0)
    controlsRef.current = controls

    // Lighting (Warm directional sun with soft architectural shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
    scene.add(ambientLight)

    const hemisphereLight = new THREE.HemisphereLight(0xf8fafc, 0xcbd5e1, 0.6)
    scene.add(hemisphereLight)

    const sunLight = new THREE.DirectionalLight(0xfffaf0, 1.3)
    sunLight.position.set(50, 70, 30)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 10
    sunLight.shadow.camera.far = 160
    sunLight.shadow.camera.left = -45
    sunLight.shadow.camera.right = 45
    sunLight.shadow.camera.top = 45
    sunLight.shadow.camera.bottom = -45
    sunLight.shadow.bias = -0.0005
    scene.add(sunLight)

    // Build initial city geometry
    buildCity(scene, metrics?.aqiHex || '#22c55e')

    // Animation Loop with pin projection
    function animate() {
      animationFrameRef.current = requestAnimationFrame(animate)

      // Smooth camera transition when toggling 2D/3D or resetting
      if (isTransitioning.current) {
        camera.position.lerp(cameraTargetPos.current, 0.08)
        if (camera.position.distanceTo(cameraTargetPos.current) < 0.2) {
          camera.position.copy(cameraTargetPos.current)
          isTransitioning.current = false
        }
      }

      controls.update()
      renderer.render(scene, camera)

      // Project 3D anchor points to 2D screen coordinates
      if (onPinProject && containerRef.current) {
        const w = containerRef.current.clientWidth
        const h = containerRef.current.clientHeight
        const projectedPins = pinAnchors.current.map((anchor) => {
          const v = anchor.pos.clone().project(camera)
          const isBehind = v.z > 1
          return {
            id: anchor.id,
            x: (v.x * 0.5 + 0.5) * w,
            y: (-(v.y * 0.5) + 0.5) * h,
            visible: !isBehind,
          }
        })
        onPinProject(projectedPins)
      }
    }

    animate()

    // Handle container resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH
          camera.updateProjectionMatrix()
          renderer.setSize(newW, newH)
        }
      }
    })
    resizeObserver.observe(container)

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.dispose()
    }
  }, [buildCity])

  // Update building colors whenever AQI changes
  useEffect(() => {
    if (sceneRef.current && metrics?.aqiHex) {
      buildCity(sceneRef.current, metrics.aqiHex)
    }
  }, [metrics?.aqiHex, city, buildCity])

  // Handle 2D / 3D toggle
  useEffect(() => {
    if (!cameraRef.current) return
    isTransitioning.current = true
    if (is2D) {
      // Orthogonal top-down view
      cameraTargetPos.current.set(0.001, 85, 0.001)
      controlsRef.current?.target.set(0, 0, 0)
    } else {
      // Isometric 45-degree view
      cameraTargetPos.current.set(45, 50, 45)
      controlsRef.current?.target.set(0, 2, 0)
    }
  }, [is2D])

  // Handle external reset view trigger
  const handleReset = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return
    isTransitioning.current = true
    cameraTargetPos.current.set(45, 50, 45)
    controlsRef.current.target.set(0, 2, 0)
    onResetView?.()
  }, [onResetView])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] overflow-hidden select-none bg-slate-50"
    >
      {isWebGLAvailable.current ? (
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing outline-none" />
      ) : (
        /* Fallback 2D Isometric City SVG when WebGL is unavailable */
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-100">
          <svg className="w-48 h-48 text-emerald-600/40 mb-4" viewBox="0 0 200 200" fill="currentColor">
            <path d="M100 20 L180 65 L180 145 L100 190 L20 145 L20 65 Z" fill="#e2e8f0" />
            <path d="M100 20 L180 65 L100 110 L20 65 Z" fill="#cbd5e1" />
            <path d="M100 110 L180 65 L180 145 L100 190 Z" fill="#94a3b8" />
            <path d="M100 110 L20 65 L20 145 L100 190 Z" fill="#64748b" />
          </svg>
          <h3 className="font-bold text-slate-800 text-base">2D Architectural Fallback Active</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            WebGL is not supported or hardware acceleration is disabled. Environmental measurements are operating smoothly.
          </p>
        </div>
      )}
    </div>
  )
}
