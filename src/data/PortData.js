

export const PortData = {
  // 入庫埠定義
  inboundPorts: {
    port1: {
      id: 'port1',
      name: '入庫埠 1 (Crane 001)',
      // Box 在入庫時的最終取貨點輸送帶，以及 Crane 停靠位置
      // cranePickupPointConvId: 'conv3' 表示 Crane 會在 conv3 旁邊等待 Box
      cranePickupPointConvId: 'conv3',
      craneTargetPosition: [-4, 0, -8], // Crane 001 停靠在 conv3 旁邊的取貨位置
      craneId: 'crane001', // 指定哪個 Crane 服務這個 Port
      // 如果需要，可以定義 Box 在輸送帶上的起始 Y 軸高度 (用於 Crane 精準對位)
      boxPickupYOffsetFromConv: 0.1, // Box 實際 Y 軸位置，相對於輸送帶中心 Y
    },
    port3: {
      id: 'port3',
      name: '入庫埠 3 (Crane 002)',
      cranePickupPointConvId: 'conv9',
      craneTargetPosition: [-4, 0, 2], // Crane 002 停靠在 conv9 旁邊的取貨位置
      craneId: 'crane002',
      boxPickupYOffsetFromConv: 0.1,
    },
    port4: {
      id: 'port4',
      name: '入庫埠 4 (Crane 003)',
      cranePickupPointConvId: 'conv12',
      craneTargetPosition: [-4, 0, 8], // Crane 003 停靠在 conv12 旁邊的取貨位置
      craneId: 'crane003',
      boxPickupYOffsetFromConv: 0.1,
    },
  },
  // 出庫埠定義
  outboundPorts: {
    port2: {
      id: 'port2',
      name: '出庫埠 2 (Crane 001)',
      // Crane 放置 Box 的輸送帶，以及 Crane 停靠位置
      craneDropPointConvId: 'conv4',
      craneTargetPosition: [-8, 0, -4], // Crane 001 停靠在 conv4 旁邊的放置位置
      craneId: 'crane001',
      boxDropYOffsetToConv: 0.1, // Box 實際 Y 軸位置，相對於輸送帶中心 Y
    },
    // port3 既是入庫埠也是出庫埠，所以需要在這裡也定義
    port3: {
      id: 'port3',
      name: '出庫埠 3 (Crane 002)',
      craneDropPointConvId: 'conv9', // Crane 002 仍然在 conv9 放置
      craneTargetPosition: [-4, 0, 2],
      craneId: 'crane002',
      boxDropYOffsetToConv: 0.1,
    },
    port5: {
      id: 'port5',
      name: '出庫埠 5 (Crane 003)',
      craneDropPointConvId: 'conv19',
      craneTargetPosition: [-6, 0, 15], // Crane 003 停靠在 conv19 旁邊的放置位置
      craneId: 'crane003',
      boxDropYOffsetToConv: 0.1,
    },
  },
};



