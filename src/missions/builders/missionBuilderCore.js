const defaultCloneTemplate = (template) => JSON.parse(JSON.stringify(template));

const isMissing = (value) => value == null || value === '';

const ensureMissionInput = ({ portId, boxId, shelfPosition }, missionType) => {
  if (isMissing(portId)) {
    throw new Error(`[missionBuilder] ${missionType} mission requires portId.`);
  }

  if (isMissing(boxId)) {
    throw new Error(`[missionBuilder] ${missionType} mission requires boxId.`);
  }

  if (isMissing(shelfPosition)) {
    throw new Error(`[missionBuilder] ${missionType} mission requires shelfPosition.`);
  }
};

export const createMissionBuilders = ({
  inboundMissionConfigs = {},
  outboundMissionConfigs = {},
  cloneTemplate = defaultCloneTemplate,
} = {}) => {
  const buildMission = ({ template, templateFunction, boxId, shelfPosition }) => {
    const missionParams = {
      ...cloneTemplate(template),
      boxId,
      shelfPosition,
    };

    return templateFunction(missionParams);
  };

  const buildInboundMission = ({ portId, boxId, shelfPosition } = {}) => {
    ensureMissionInput({ portId, boxId, shelfPosition }, 'inbound');

    const config = inboundMissionConfigs[portId];
    if (!config) {
      throw new Error(`[missionBuilder] Unsupported inbound portId: ${portId}.`);
    }

    return buildMission({ ...config, boxId, shelfPosition });
  };

  const buildOutboundMission = ({ portId, boxId, shelfPosition } = {}) => {
    ensureMissionInput({ portId, boxId, shelfPosition }, 'outbound');

    const config = outboundMissionConfigs[portId];
    if (!config) {
      throw new Error(`[missionBuilder] Unsupported outbound portId: ${portId}.`);
    }

    return buildMission({ ...config, boxId, shelfPosition });
  };

  return {
    buildInboundMission,
    buildOutboundMission,
  };
};
