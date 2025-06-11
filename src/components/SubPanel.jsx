import React, { useState, useEffect, useRef } from 'react';
import Box from './Box';
import BoxCreate from './subPages/BoxCreate';

// 假設你未來會有多個功能模組，每個模組對應一個分頁內容
// 這裡我們只是 placeholders
const TabContent1 = () => (
  <BoxCreate tabId={1} />
);

const TabContent2 = () => (
  <div style={{ padding: '10px' }}>
    <h3>Tab 2 Content (Maybe some box information )</h3>
    
    <p> too tire, wait for next time   </p>
  </div>
);

const TabContent3 = () => (
  <div style={{ padding: '10px' }}>
    <h3>Tab 3 Content (All Sensor Status)</h3>

    <p> Under construction ... </p>
  </div>
);

// 你可以在這裡定義更多的 TabContentX 元件

export default function SubPanel( {setShowSubPanel}) {

    const panelRef = useRef(null);

    useEffect(() => {
    const ui = panelRef.current;
    if (!ui) return;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const handleMouseDown = (e) => {
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      offsetX = e.clientX - ui.offsetLeft;
      offsetY = e.clientY - ui.offsetTop;
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        ui.style.left = `${e.clientX - offsetX}px`;
        ui.style.top = `${e.clientY - offsetY}px`;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    ui.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      ui.removeEventListener('mousedown', handleMouseDown);
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
      top: '20px', // 調整位置
      right: '20px', // 調整位置
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
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #ccc',
      }}>

        <div><button onClick={()=> setShowSubPanel(false)}>Close SubPanel</button>
        <br />
        <label > this tab can be dragged </label>
        </div>


        <TabButton isActive={activeTab === 'tab1'} onClick={() => setActiveTab('tab1')}>
          Add New Box
        </TabButton>
        <TabButton isActive={activeTab === 'tab2'} onClick={() => setActiveTab('tab2')}>
          Inventory information
        </TabButton>
        <TabButton isActive={activeTab === 'tab3'} onClick={() => setActiveTab('tab3')}>
          Sensor Status
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