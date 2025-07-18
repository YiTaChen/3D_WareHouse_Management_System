import React, { useState, useEffect, useRef } from 'react';
import Box from './Box';
import BoxCreate from './subPages/BoxCreate';
import CraneControlPanel  from './subPages/Test';
import ObjectBindingTest from './subPages/ObjectBindingTest';
import BoxControlPanel from './subPages/BoxControlPanel';
import MissionPanel from './subPages/MissionPanel.jsx';
import MissionHighLevelPanel from './subPages/MissionHighLevelPanel.jsx';
import Inventory from './subPages/Inventory.jsx';

// 這裡我們只是 placeholders
const TabContent1 = () => (
  <MissionPanel tabId={1} />
);

const TabContent2 = () => (
  <BoxCreate tabId={2} />
);

const TabContent3 = () => (
  <div> <Inventory tabId={3} />  </div>
);


// 你可以在這裡定義更多的 TabContentX 元件

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





  // 狀態來追蹤當前活躍的分頁
  const [activeTab, setActiveTab] = useState('tab1'); // 預設顯示 tab1

  // 根據 activeTab 渲染不同的內容
  const renderContent = () => {
    switch (activeTab) {
      case 'tab1':
        return <TabContent1 />;
      case 'tab2':
        return <TabContent2 />;
      case 'tab3':
        return <TabContent3 />;
      
      // 這裡可以新增更多 case
      default:
        return <TabContent1 />;
    }
  };

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


       <div><button style={{backgroundColor:'lightgreen' }}  onClick={()=> setShowSubPanel(false)}>Close Main Function Panel</button>
        <br />
        <label > this tab can be dragged </label>
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
                    Drag Here
    </div>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #ccc',
      }}>

       

        <TabButton isActive={activeTab === 'tab1'} onClick={() => setActiveTab('tab1')}>
           Mission Test
        </TabButton>
        <TabButton isActive={activeTab === 'tab2'} onClick={() => setActiveTab('tab2')}>
          Add New Box
        </TabButton>
         <TabButton isActive={activeTab === 'tab3'} onClick={() => setActiveTab('tab3')}>
          View Inventory 
        </TabButton>
        
        {/* 在這裡新增更多 TabButton */}
      </div>

      {/* 分頁內容 */}
      <div style={{ flexGrow: 1, overflowY: 'auto' }}>
        {renderContent()}
      </div>
    </div>
  );
}

// 輔助元件：分頁按鈕
const TabButton = ({ children, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1, // 讓按鈕均勻分佈
      padding: '10px 15px',
      cursor: 'pointer',
      border: 'none',
      backgroundColor: isActive ? '#f0f0f0' : 'transparent',
      borderBottom: isActive ? '2px solid #007bff' : '2px solid transparent',
      color: isActive ? '#007bff' : '#333',
      fontWeight: isActive ? 'bold' : 'normal',
      outline: 'none',
      fontSize: '14px',
      whiteSpace: 'nowrap', // 防止文字換行
      textOverflow: 'ellipsis', // 文字溢出顯示省略號
      overflow: 'hidden', // 隱藏溢出內容
    }}
  >
    {children}
  </button>
);