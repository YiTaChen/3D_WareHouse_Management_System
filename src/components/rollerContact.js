// Keep running traction unchanged. Resting contacts need more solver relaxation
// at the warehouse's 30 Hz physics step to settle instead of continually creeping.
export const RUNNING_ROLLER_CONTACT = { friction: 0.001, restitution: 0 };
export const STOPPED_ROLLER_CONTACT = {
  ...RUNNING_ROLLER_CONTACT,
  contactEquationRelaxation: 20,
};
export const rollerMaterial = rotate => rotate ? 'roller' : 'stoppedRoller';
