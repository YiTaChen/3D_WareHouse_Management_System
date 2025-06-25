// src/data/layoutData.js
// export const layoutData ={
//   conveyors: [
//     // { id: 'conv1', position: [-4, 0, 4], rotation: [0, Math.PI /2, 0] },
//     // { id: 'conv5', position: [6, 0, 6], rotation: [0, 0, 0] },
//     { id: 'conv2', position: [0, 0, 0], rotation: [0, 0, 0] },
//     { id: 'conv3', position: [2, 0, 0], rotation: [0, 0, 0] },
//     { id: 'conv4', position: [4, 0, 0], rotation: [0, 0, 0] },
//     { id: 'conv5', position: [6, 0, 0], rotation: [0, 0, 0] },
//     { id: 'conv6', position: [8, 0, 0], rotation: [0, 0, 0] },
//     { id: 'conv7', position: [10, 0, 0], rotation: [0, -Math.PI /2, 0] },
//     { id: 'conv8', position: [10, 0, 2], rotation: [0, -Math.PI /2, 0] },
//     { id: 'conv9', position: [10, 0, 4], rotation: [0, -Math.PI /2, 0] },
//     { id: 'conv10', position: [10, 0, 6], rotation: [0, -Math.PI /2, 0] },
//     { id: 'conv11', position: [10, 0, 8], rotation: [0, -Math.PI , 0] },
//     { id: 'conv12', position: [8, 0, 8], rotation: [0, -Math.PI , 0] },
//     { id: 'conv13', position: [6, 0, 8], rotation: [0, -Math.PI, 0] },
//     { id: 'conv14', position: [4, 0, 8], rotation: [0, -Math.PI, 0] },
//     { id: 'conv15', position: [2, 0, 8], rotation: [0, -Math.PI, 0] },
//     { id: 'conv16', position: [0, 0, 8], rotation: [0, -Math.PI, 0] },
//     { id: 'conv17', position: [-2, 0, 8], rotation: [0, -Math.PI , 0] },
//     { id: 'conv18', position: [-4, 0, 8], rotation: [0, Math.PI /2 , 0] },
//     { id: 'conv19', position: [-4, 0, 6], rotation: [0, Math.PI /2 , 0] },
//     { id: 'conv20', position: [-4, 0, 4], rotation: [0, Math.PI /2 , 0] },
//     { id: 'conv21', position: [-4, 0, 2], rotation: [0, Math.PI /2 , 0] },
//     { id: 'conv22', position: [-4, 0, 0], rotation: [0, Math.PI /2 , 0] },
//     { id: 'conv23', position: [-4, 0, -2], rotation: [0, Math.PI /2 , 0] },
//     { id: 'conv24', position: [-4, 0, -4], rotation: [0, Math.PI /2 , 0] },
  
//   ]
// }

const r90 = - Math.PI / 2;
const r180 = -Math.PI /2;
const r270 = Math.PI /2;

export const layoutData ={

  

  conveyors: [

    { id: 'conv1', position: [-8, 0, -8], rotation: [0, 0, 0] , type: 'straight'},
    { id: 'conv2', position: [-6, 0, -8], rotation: [0, 0, 0] , type: 'straight'},
    { id: 'conv3', position: [-4, 0, -8], rotation: [0, 0, 0] , type: 'straight'},
    { id: 'conv4', position: [-8, 0, -4], rotation: [0, 0, 0] , type: 'straight'},
    { id: 'conv5', position: [-6, 0, -4], rotation: [0, 0, 0] , type: 'straight'},
    { id: 'conv6', position: [-4, 0, -4], rotation: [0, 0, 0] , type: 'straight'},
    
    { id: 'conv7', position: [-8, 0, 2], rotation: [0, 0, 0] , type: 'straight'},
    { id: 'conv8', position: [-6, 0, 2], rotation: [0, 0, 0] , type: 'straight'},
    { id: 'conv9', position: [-4, 0, 2], rotation: [0, 0, 0] , type: 'straight'},

    { id: 'conv10', position: [-8, 0, 8], rotation: [0, 0, 0] , type: 'straight'},
    { id: 'conv11', position: [-6, 0, 8], rotation: [0, 0, 0] , type: 'straight'},
    { id: 'conv12', position: [-4, 0, 8], rotation: [0, 0, 0] , type: 'straight'},


    { id: 'conv13', position: [-4, 2, 8], rotation: [0, 0, 0] , type: 'straight'},
    { id: 'conv14', position: [-6, 2, 8], rotation: [0, r270, 0], type: 'turn' },
    { id: 'conv16', position: [-6, 1.67, 9.1], rotation: [ 0.18 * Math.PI, r270, 0] , type: 'slope'},
    { id: 'conv17', position: [-6, 0.71, 10.6], rotation: [ 0.18 * Math.PI, r270, 0], type: 'slope' },
    
    // { id: 'conv17', position: [-6, 0.71, 10.6], rotation: [ 0, r270,  1/2* Math.PI] },
    
    { id: 'conv18', position: [-6, 0, 13.0], rotation: [ 0, r270, 0] , type: 'straight'},
    { id: 'conv19', position: [-6, 0, 15.0], rotation: [ 0, r270, 0] , type: 'straight'},
    
 
  ]
}
export const ConveyorData = layoutData


export default layoutData;

