import React, { useEffect, useState } from 'react';
import { useBoxStore } from '../../stores/boxStore'; // 引入你的 boxStore
import ShelfData from '../../data/ShelfData';



import { useUIStore } from '../../stores/uiStore'; 


// 定義表格列頭的類型和是否可排序
const columns = [
  { id: 'box_id', label: 'Box ID', sortable: true, type: 'string' },
  { id: 'shelf_id', label: 'Shelf', sortable: true, type: 'string' },
  { id: 'item_name', label: 'Item', sortable: true, type: 'string' },
  { id: 'quantity', label: 'Quantity', sortable: true, type: 'number' },
  { id: 'status', label: 'Status', sortable: false, type: 'string' },
  { id: 'highlight', label: '', sortable: false, type: 'button' },
];




export default function Inventory() {
  const getInventoryDataAll = useBoxStore((state) => state.getInventoryDataAll);
  const inventoryData = useBoxStore((state) => state.inventoryData);
  const isLoadingInventory = useBoxStore((state) => state.isLoadingInventory);
  const inventoryError = useBoxStore((state) => state.inventoryError);
 
    // console.log('Inventory Data:', inventoryData); // 確認庫存數據結構

   

    // 從 uiStore 中獲取 setHighlightPosition Action
    const setHighlightPosition = useUIStore((state) => state.setHighlightPosition);



   // 處理點擊 "Check Box Position" 按鈕
  const handleCheckBoxPosition = (position) => {
    setHighlightPosition(position); // 直接呼叫 Store 中的 Action
  };

  // 排序狀態
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' for ascending, 'desc' for descending



  useEffect(() => {
    getInventoryDataAll(); // 元件載入時獲取庫存數據
  }, [getInventoryDataAll]); // 依賴 getInventoryDataAll，確保只在它變化時執行


  // 處理點擊列頭進行排序
  const handleSort = (columnId, columnType) => {
    if (!columns.find(col => col.id === columnId)?.sortable) return; // 只有可排序的列才能觸發

    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc'); // 預設為升序
    }
  };

  // 根據排序狀態對數據進行排序
  const sortedInventoryData = [...inventoryData].sort((a, b) => {
    if (!sortColumn) return 0; // 沒有排序則不變

    const columnInfo = columns.find(col => col.id === sortColumn);
    if (!columnInfo) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    let compareResult = 0;
    if (columnInfo.type === 'number') {
      compareResult = (aValue || 0) - (bValue || 0); // 確保數字排序時處理 null/undefined
    } else { // string or other types
      const sa = String(aValue || '').toLowerCase();
      const sb = String(bValue || '').toLowerCase();
      if (sa < sb) compareResult = -1;
      else if (sa > sb) compareResult = 1;
    }

    return sortDirection === 'asc' ? compareResult : -compareResult;
  });

  const totalBoxes = new Set(inventoryData.map((row) => row.box_id)).size;
  const occupiedShelves = new Set(inventoryData.map((row) => row.shelf_id).filter(Boolean)).size;
  const availableShelves = Math.max((ShelfData.shelves?.length || 0) - occupiedShelves, 0);

  if (isLoadingInventory) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading inventory data...</div>;
  }

  if (inventoryError) {
    return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>Error loading inventory: {inventoryError}</div>;
  }

  return (
    <div style={{ padding: 0, overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
        <SummaryCard label="Total Boxes" value={totalBoxes} />
        <SummaryCard label="Occupied Shelves" value={occupiedShelves} />
        <SummaryCard label="Available Shelves" value={availableShelves} />
      </div>
 

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                style={{
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'left',
                  cursor: col.sortable ? 'pointer' : 'default',
                  backgroundColor: sortColumn === col.id ? '#f0f0f0' : 'white',
                }}
                onClick={() => handleSort(col.id, col.type)}
              >
                {col.label}
                {sortColumn === col.id && (
                  <span>{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
            {sortedInventoryData.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '10px' }}>No inventory data available.</td></tr> // Fix: <td> immediately after <tr>
            ) : (
                sortedInventoryData.map((row, index) => (
                <tr key={index} onClick={() => handleCheckBoxPosition([row.x, row.y, row.z])} style={{ cursor: 'pointer' }}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.box_id}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.shelf_id}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.item_name}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{row.quantity}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>Stored</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <button onClick={(event) => {
                      event.stopPropagation();
                      handleCheckBoxPosition([row.x, row.y, row.z]);
                    }}>Highlight</button>
                    </td>
                </tr>
                ))
            )}
            </tbody>
      </table>
    </div>
  );
}

const SummaryCard = ({ label, value }) => (
  <div style={{ padding: 12, background: '#fff', border: '1px solid #ddd', borderRadius: 6 }}>
    <div style={{ color: '#666', fontSize: 12 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
  </div>
);
