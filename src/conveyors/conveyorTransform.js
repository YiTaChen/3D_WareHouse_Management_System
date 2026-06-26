const roundToThreeDecimals = (value) => Math.round(value * 1000) / 1000;

const parseFormNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

export const radiansToDegrees = (radians) => (
  roundToThreeDecimals(parseFormNumber(radians) * 180 / Math.PI)
);

export const degreesToRadians = (degrees) => (
  parseFormNumber(degrees) * Math.PI / 180
);

export const updateVectorComponent = (vector = [0, 0, 0], index, value) => {
  const nextVector = [...vector];
  nextVector[index] = parseFormNumber(value);

  return nextVector;
};
