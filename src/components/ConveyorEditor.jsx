import React, { useMemo } from 'react';

import { getConveyorById, getVisibleConveyors } from '../conveyors/conveyorLayout.js';
import {
  degreesToRadians,
  radiansToDegrees,
  updateVectorComponent,
} from '../conveyors/conveyorTransform.js';
import { useConveyorLayoutStore } from '../stores/conveyorLayoutStore.js';
import './ConveyorEditor.css';

const AXES = ['X', 'Y', 'Z'];
const CONVEYOR_TYPES = ['straight', 'turn', 'slope'];

export default function ConveyorEditor() {
  const conveyors = useConveyorLayoutStore((state) => state.conveyors);
  const selectedConveyorId = useConveyorLayoutStore((state) => state.selectedConveyorId);
  const selectConveyor = useConveyorLayoutStore((state) => state.selectConveyor);
  const addConveyor = useConveyorLayoutStore((state) => state.addConveyor);
  const updateConveyor = useConveyorLayoutStore((state) => state.updateConveyor);
  const removeConveyor = useConveyorLayoutStore((state) => state.removeConveyor);
  const restoreConveyor = useConveyorLayoutStore((state) => state.restoreConveyor);

  const visibleConveyors = useMemo(() => getVisibleConveyors(conveyors), [conveyors]);
  const removedConveyors = useMemo(() => (
    conveyors.filter((conveyor) => conveyor.isRemoved)
  ), [conveyors]);
  const selectedConveyor = getConveyorById(conveyors, selectedConveyorId);

  const updatePosition = (axisIndex, value) => {
    if (!selectedConveyor) return;

    updateConveyor(selectedConveyor.id, {
      position: updateVectorComponent(selectedConveyor.position, axisIndex, value),
    });
  };

  const updateRotation = (axisIndex, value) => {
    if (!selectedConveyor) return;

    const nextRotation = [...selectedConveyor.rotation];
    nextRotation[axisIndex] = degreesToRadians(value);

    updateConveyor(selectedConveyor.id, {
      rotation: nextRotation,
    });
  };

  const updateType = (type) => {
    if (!selectedConveyor) return;
    updateConveyor(selectedConveyor.id, { type });
  };

  const handleAddConveyor = () => {
    const basePosition = selectedConveyor?.position || [0, 0, 0];

    addConveyor({
      position: [basePosition[0] + 2, basePosition[1], basePosition[2]],
      rotation: selectedConveyor?.rotation || [0, 0, 0],
      type: selectedConveyor?.type || 'straight',
    });
  };

  return (
    <section className="conveyor-editor" aria-label="Conveyor editor">
      <div className="conveyor-editor__header">
        <span className="conveyor-editor__title">Conveyor Edit</span>
        <span className="conveyor-editor__count">
          {visibleConveyors.length}/{conveyors.length}
        </span>
      </div>

      <div className="conveyor-editor__actions">
        <button type="button" onClick={handleAddConveyor}>Add</button>
        <button
          type="button"
          onClick={() => selectedConveyor && removeConveyor(selectedConveyor.id)}
          disabled={!selectedConveyor}
        >
          Soft Remove
        </button>
      </div>

      <label className="conveyor-editor__field">
        <span>Selected</span>
        <select
          value={selectedConveyor?.id || ''}
          onChange={(event) => selectConveyor(event.target.value)}
          disabled={visibleConveyors.length === 0}
        >
          {visibleConveyors.length === 0 && <option value="">None</option>}
          {visibleConveyors.map((conveyor) => (
            <option key={conveyor.id} value={conveyor.id}>
              {conveyor.id}
            </option>
          ))}
        </select>
      </label>

      {selectedConveyor && (
        <div className="conveyor-editor__body">
          <label className="conveyor-editor__field">
            <span>Type</span>
            <select
              value={selectedConveyor.type}
              onChange={(event) => updateType(event.target.value)}
            >
              {CONVEYOR_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <div className="conveyor-editor__group">
            <span className="conveyor-editor__group-title">Position</span>
            <div className="conveyor-editor__grid">
              {AXES.map((axis, index) => (
                <label key={axis} className="conveyor-editor__field">
                  <span>{axis}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedConveyor.position[index]}
                    onChange={(event) => updatePosition(index, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="conveyor-editor__group">
            <span className="conveyor-editor__group-title">Rotation</span>
            <div className="conveyor-editor__grid">
              {AXES.map((axis, index) => (
                <label key={axis} className="conveyor-editor__field">
                  <span>{axis}</span>
                  <input
                    type="number"
                    step="15"
                    value={radiansToDegrees(selectedConveyor.rotation[index])}
                    onChange={(event) => updateRotation(index, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {removedConveyors.length > 0 && (
        <div className="conveyor-editor__removed">
          <span className="conveyor-editor__group-title">Removed</span>
          {removedConveyors.map((conveyor) => (
            <button
              key={conveyor.id}
              type="button"
              onClick={() => restoreConveyor(conveyor.id)}
            >
              Restore {conveyor.id}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
