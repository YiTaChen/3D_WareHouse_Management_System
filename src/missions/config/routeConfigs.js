export const inboundRouteConfigs = {
  Port1: {
    route: ['conv1', 'conv2', 'conv3'],
    cranePortPosition: [-4, 0, -6],
  },
  Port3: {
    route: ['conv7', 'conv8', 'conv9'],
    cranePortPosition: [-4, 0, 0],
  },
  Port4: {
    route: ['conv10', 'conv11', 'conv12'],
    cranePortPosition: [-4, 0, 6],
  },
};

export const outboundRouteConfigs = {
  Port2: {
    route: ['conv6', 'conv5', 'pass', 'pass', 'pass', 'conv4'],
    cranePortPosition: [-4, 0, -6],
  },
  Port3: {
    route: ['conv9', 'conv8', 'pass', 'pass', 'pass', 'conv7'],
    cranePortPosition: [-4, 0, 0],
  },
  Port5: {
    route: ['conv13', 'conv14', 'conv16', 'conv17', 'conv18', 'conv19'],
    cranePortPosition: [-4, 2, 6],
  },
};
