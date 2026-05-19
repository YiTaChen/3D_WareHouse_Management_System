import {
  crane001InboundMissionParamTemplate,
  crane002InboundMissionParamTemplate,
  crane003InboundMissionParamTemplate,
  crane001_OutboundMissionTemplate,
  crane002_OutboundMissionTemplate,
  crane003_OutboundMissionTemplate,
  inboundTemplateFunction,
  inboundTemplateFunctionForCrane2,
  outboundTemplateFunction,
  outboundTemplateFunctionForCrane2,
} from '../craneMissionData';
import { createMissionBuilders } from './missionBuilderCore.js';

const inboundMissionConfigs = {
  Port1: {
    template: crane001InboundMissionParamTemplate,
    templateFunction: inboundTemplateFunction,
  },
  Port3: {
    template: crane002InboundMissionParamTemplate,
    templateFunction: inboundTemplateFunctionForCrane2,
  },
  Port4: {
    template: crane003InboundMissionParamTemplate,
    templateFunction: inboundTemplateFunction,
  },
};

const outboundMissionConfigs = {
  Port2: {
    template: crane001_OutboundMissionTemplate,
    templateFunction: outboundTemplateFunction,
  },
  Port3: {
    template: crane002_OutboundMissionTemplate,
    templateFunction: outboundTemplateFunctionForCrane2,
  },
  Port5: {
    template: crane003_OutboundMissionTemplate,
    templateFunction: outboundTemplateFunction,
  },
};

export const { buildInboundMission, buildOutboundMission } = createMissionBuilders({
  inboundMissionConfigs,
  outboundMissionConfigs,
});
