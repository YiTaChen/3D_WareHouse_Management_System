import React, { useEffect, useRef } from 'react';
import OperatorPanel from './subPages/OperatorPanel.jsx';
import './SubPanelProduction.css';

export default function SubPanelProduction( {setShowSubPanel}) {

    const panelRef = useRef(null);


    const dragHandleRef = useRef(null); // Reference to the specific drag handle area


    useEffect(() => {
    const ui = panelRef.current;
    const dragHandle = dragHandleRef.current;

    if (!ui || !dragHandle) return;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const handleMouseDown = (e) => {
    //   if (e.target.tagName === 'BUTTON') return;
        if (e.target === dragHandle && e.button === 0) {
          
            isDragging = true;
            offsetX = e.clientX - ui.offsetLeft;
            offsetY = e.clientY - ui.offsetTop;

            ui.style.cursor = 'grabbing';
            e.preventDefault();
        }
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        // setPanelPosition({
        //             x: e.clientX - offsetX,
        //             y: e.clientY - offsetY,
        //         });
       
        ui.style.left = `${e.clientX - offsetX}px`;
        ui.style.top = `${e.clientY - offsetY}px`;
      }
    };

    const handleMouseUp = () => {
    //   isDragging = false;

      if (isDragging) { // Only reset if a drag was in progress
                isDragging = false;
                ui.style.cursor = 'grab'; // Reset cursor
            }
    };

    // ui.addEventListener('mousedown', handleMouseDown);
    dragHandle.addEventListener('mousedown', handleMouseDown);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
        
    //   ui.removeEventListener('mousedown', handleMouseDown);
      dragHandle.removeEventListener('mousedown', handleMouseDown);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);





  return (
    <div 
        ref={panelRef}
        className="operator-shell"
      >
      {/* 分頁標籤 */}


       <div className="operator-shell__header">
        <div className="operator-shell__title">
          <span className="operator-shell__eyebrow">Warehouse Demo</span>
          <span className="operator-shell__heading">Operator Control Panel</span>
        </div>
        <button className="operator-shell__close" onClick={()=> setShowSubPanel(false)}>Close</button>
        </div>
                <div
                    ref={dragHandleRef} // Attach ref here
                    className="operator-shell__drag-handle"
                >
                    Drag panel
    </div>

      {/* 分頁內容 */}
      <div className="operator-shell__content">
        <OperatorPanel />
      </div>
    </div>
  );
}
