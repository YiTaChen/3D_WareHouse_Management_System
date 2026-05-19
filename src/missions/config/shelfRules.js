export const shelfSideByZ = {
  [-8]: true,
  [-4]: false,
  [-2]: true,
  2: false,
  4: true,
};

export const craneOperatingZByShelfZ = {
  [-8]: -6,
  [-4]: -6,
  [-2]: 0,
  2: 0,
  4: 6,
};

export const getShelfIsTakeLeft = (shelfZ, fallback = true) =>
  shelfSideByZ[shelfZ] ?? fallback;

export const getCraneOperatingZ = (shelfZ, fallback = 0) =>
  craneOperatingZByShelfZ[shelfZ] ?? fallback;
