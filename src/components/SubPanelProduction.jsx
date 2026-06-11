import React, { useEffect, useRef, useState } from 'react';
import OperatorPanel from './subPages/OperatorPanel.jsx';

export default function SubPanelProduction( {setShowSubPanel}) {

    const panelRef = useRef(null);


    const [panelPosition, setPanelPosition] = useState({ x: 20, y: 20 }); // Adjusted for 800px width
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
    
      style={{
      position: 'absolute',
      top: panelPosition.y,   //'20px', // 調整位置
      right: panelPosition.x, //'20px', // 調整位置
      zIndex: 100, // 確保在其他元素之上
      backgroundColor: 'rgba(255, 255, 255, 0.9)', // 半透明白色背景
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      width: '800px', // 固定寬度，可調整
      height: 'auto', // 高度自適應內容
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 分頁標籤 */}


       <div><button style={{backgroundColor:'lightgreen' }}  onClick={()=> setShowSubPanel(false)}>Close Control Panel</button>
        <br />
        <label >Demo Operator Panel</label>
        </div>
                <div
                    ref={dragHandleRef} // Attach ref here
                    style={{
                        flexGrow: 1, // Takes up remaining space
                        padding: '5px 10px', // Padding to make it easier to click
                        cursor: 'grab', // Indicate draggable area
                        userSelect: 'none', // Prevent text selection during drag
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#555',
                    }}
                >
                    Drag panel
    </div>

      {/* 分頁內容 */}
      <div style={{ flexGrow: 1, overflowY: 'auto' }}>
        <OperatorPanel />
      </div>
    </div>
  );
}
