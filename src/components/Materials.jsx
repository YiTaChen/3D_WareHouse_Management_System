// import {Physics, Debug, useContactMaterial } from '@react-three/cannon'

// export default function Materials() {
//   useContactMaterial('roller', 'box', {
//     friction: 0.001,
//     restitution: 0,
//   })

//   return null
// }

import { useContactMaterial } from '@react-three/cannon'

export default function Materials() {
  useContactMaterial('roller', 'box', { friction: 0.001, restitution: 0 })
  useContactMaterial('box', 'invisible', { friction: 0, restitution: 0 }) // Box 與隱形材料
  useContactMaterial('box', 'default', { friction: 0.5, restitution: 0.1 }) // Box 與感應器 (如果沒有特定材質，使用 default)
  // 可以根據需要為 sensor1, sensor2 定義專屬材質



  useContactMaterial('box', 'shelfTable', { friction: 20, restitution: 0.00 })
  
  useContactMaterial('box', 'craneTable', { friction: 10, restitution: 0 })

  useContactMaterial('box', 'CraneMeshBody', { friction: 1000, restitution: 0 })


  return null
}




