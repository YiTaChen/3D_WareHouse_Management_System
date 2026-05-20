import {
  crane001InboundMissionParamTemplate,
  crane002InboundMissionParamTemplate,
  crane003InboundMissionParamTemplate,
  crane001_OutboundMissionTemplate,
  crane002_OutboundMissionTemplate,
  crane003_OutboundMissionTemplate,
} from '../craneMissionData';
import { createMissionBuilders } from './missionBuilderCore.js';
import {
  buildInboundProductionMission,
  buildOutboundProductionMission,
} from './productionMissionFactory.js';

const inboundMissionConfigs = {
  Port1: {
    template: crane001InboundMissionParamTemplate,
    templateFunction: buildInboundProductionMission,
  },
  Port3: {
    template: crane002InboundMissionParamTemplate,
    templateFunction: (params) => buildInboundProductionMission({
      ...params,
      useCrane2ConveyorSequence: true,
    }),
  },
  Port4: {
    template: crane003InboundMissionParamTemplate,
    templateFunction: buildInboundProductionMission,
  },
};

const outboundMissionConfigs = {
  Port2: {
    template: crane001_OutboundMissionTemplate,
    templateFunction: buildOutboundProductionMission,
  },
  Port3: {
    template: crane002_OutboundMissionTemplate,
    templateFunction: (params) => buildOutboundProductionMission({
      ...params,
      useCrane2ConveyorSequence: true,
    }),
  },
  Port5: {
    template: crane003_OutboundMissionTemplate,
    templateFunction: buildOutboundProductionMission,
  },
};

export const { buildInboundMission, buildOutboundMission } = createMissionBuilders({
  inboundMissionConfigs,
  outboundMissionConfigs,
});
