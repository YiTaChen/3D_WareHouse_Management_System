
// export const ShelfData ={
//   shelves: [

//     { id: 'shelf001', position: [-0, 0, -0], rotation: [0, 0, 0] },
    
//     // { id: 'shelf001', position: [-8, 0, -8], rotation: [0, 0, 0] },
//     // { id: 'shelf0001', position: [-8, 2, -8], rotation: [0, 0, 0] },
//     // { id: 'shelf002', position: [-8, 0,  -6], rotation: [0, 0, 0] },
//     // { id: 'shelf003', position: [-8, 0, -4], rotation: [0, 0, 0] },
//     // { id: 'shelf004', position: [-8, 0, -2], rotation: [0, 0, 0] },
//     // { id: 'shelf005', position: [-8, 0, 0], rotation: [0, 0, 0] },
//     // { id: 'shelf006', position: [-8, 0, 2], rotation: [0, 0, 0] },
//     // { id: 'shelf007', position: [-8, 0, 4], rotation: [0, 0, 0] },
//     // { id: 'shelf008', position: [-8, 0, 6], rotation: [0, 0, 0] },
//     // { id: 'shelf009', position: [-8, 0, 8], rotation: [0, 0, 0] },
 
 
  
//   ]
// }

// export default ShelfData;




// const shelves = [];

// let count = 0;



// for (let z = -8; z <= 8; z += 2) {
//   const zPassNumber = new Set([-6, 0, 6, 8]);
//   if (zPassNumber.has(z)) continue; // 跳過 z = 0 的層


//   for (let j = 0; j < 5; j++) {
//       for (let i = 0; i < 20; i++) {
//         shelves.push({
//           id: `shelf${String(count + 5).padStart(3, '0')}`, // shelf005 ~ shelf009
//           position: [i*2 + 2, ( 2 * j ) , z ],
//           rotation: [0, 0, 0],
//         });
//         count++;
//       }
//   }
// }

// export const ShelfData = {
//   shelves,
// };

// export default ShelfData;





const shelves = [];

let count = 0;



for (let z = -8; z <= 8; z += 2) {
  const zPassNumber = new Set([-6, 0, 6, 8]);
  if (zPassNumber.has(z)) continue; // 跳過 z = 0 的層


  for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 6; i++) {
        shelves.push({
          id: `shelf${String(count + 1).padStart(3, '0')}`, // shelf005 ~ shelf009
          position: [i*2 + 2, ( 2 * j ) , z ],
          rotation: [0, 0, 0],
        });
        count++;
      }
  }
}

export const ShelfData = {
  shelves,
};

export default ShelfData;