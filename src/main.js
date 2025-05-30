import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xf0f0f0)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(5, 3, 7)

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('app'), antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(-5, 10, -7)
scene.add(light)

const loader = new GLTFLoader()
let boxModel, boxInstance
const conveyor1 = new THREE.Group()
const conveyor2 = new THREE.Group()
const rackGroup = new THREE.Group()


loader.load('/box.gltf', gltf => {
  boxModel = gltf.scene
})

loader.load('/conveyor.gltf', gltf => {
  const model = gltf.scene

  const first = model.clone()
  first.position.set(-2, 0, 0)
  first.scale.set(2.5, 1, 1)
  conveyor1.add(first)
  scene.add(conveyor1)

  const second = model.clone()
  second.rotation.y = Math.PI / 2 // 轉彎90度
  second.position.set(1, 0, 2)
  second.scale.set(2.5, 1, 1)
  conveyor2.add(second)
  scene.add(conveyor2)
})

loader.load('/rack.gltf', gltf => {
  const model = gltf.scene

  const rack1 = model.clone()
  rack1.position.set(0, -1, 16)
  rack1.scale.set(2.5, 1.1, 1)
  rackGroup.add(rack1)
  scene.add(rackGroup)
})


const boxes = []

// Box movement control
let isMoving = false
const speed = 0.03
let phase = 0 // 0: conveyor1, 1: turning, 2: conveyor2

function spawnBox() {
  if (!boxModel) return

  const newBox = boxModel.clone()
  newBox.position.set(-3, 0.6, 0)
  newBox.scale.set(0.3, 0.3, 0.3)
  scene.add(newBox)

  boxes.push({ mesh: newBox, phase: 0 })
}

function moveBox() {
  // if (!boxInstance) return
  isMoving = !isMoving
}

function animate() {
  requestAnimationFrame(animate)
  if (isMoving) {
    // 遍歷並移動箱子
    for (let i = boxes.length - 1; i >= 0; i--) {
      const box = boxes[i]
      const { mesh } = box

      if (box.phase === 0) {
        mesh.position.x += speed
        if (mesh.position.x >= 0.9) box.phase = 1
      } else if (box.phase === 1) {
        mesh.position.z += speed * 0.7
        if (mesh.position.z >= 2) box.phase = 2
      } else if (box.phase === 2) {
        mesh.position.z += speed
      }

      // 檢查是否超出 z >= 20
      if (mesh.position.z >= 15) {

        // mesh.position.z
        // scene.remove(mesh) // 從場景移除
        boxes.splice(i, 1) // 從陣列移除
      }
    }
  }

  controls.update()
  renderer.render(scene, camera)
}
animate()

document.getElementById('spawnBtn').addEventListener('click', spawnBox)
document.getElementById('moveBtn').addEventListener('click', moveBox)