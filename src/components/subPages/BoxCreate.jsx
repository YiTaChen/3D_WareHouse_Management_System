import React, { useEffect, useState } from 'react'
import { useBoxStore } from '../../stores/boxStore'
import { ProductList } from '../../data/ProductList' // 假設你有一個產品列表數據






const categories = [...new Set(ProductList.ProductList.map(p => p.catogory))];

const generateNewItem = () => ({
  category: '',
  product: '',
  quantity: 1,
});



export default function BoxCreate({ tabId }) {


    const addSingleBox = useBoxStore((state) => state.handleAddSingleBox)


    // const addSingleBoxWithData = () => {
    //     const boxData = {
    //         id: `box-${Date.now()}`, // 確保每個 box 有唯一 ID
    //         name: 'New Box',
    //         content: 'Default Content',
    //     };
    //     addSingleBox(boxData.id,boxData);
        
    // }

    const addSingleBoxWithData = () => {

        const allContent ={};
        

        items.forEach((item) => {
        const product = ProductList.ProductList.find(p => p.id === item.product);
        if (!product) return;
            const oneContent = {
                id: `ID-product-Item-${Date.now()}-${Math.random().toString(36).slice(2)}`, // 唯一 ID
                name: product.ProductName,
                content: product.catogory,
                quantity: item.quantity,
            };
            allContent[product.id] = oneContent;
        })
        const boxData = {
            NewBoxId: `box-${Date.now()}-${Math.random().toString(36).slice(2)}`, // 唯一 ID
            content: allContent,
            AddNewBoxPosition: [position.x, position.y, position.z],

        };

        
        addSingleBox(boxData.NewBoxId, boxData);
        ;
    };



    const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });

    const [items, setItems] = useState([
        generateNewItem(),
        generateNewItem(),
        generateNewItem(),
    ]);

    const handleItemChange = (index, key, value) => {
        const newItems = [...items];
        newItems[index][key] = value;

        // Reset product if category changes
        if (key === 'category') newItems[index].product = '';

        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, generateNewItem()]);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };


    const handlePositionChange = (axis, value) => {
    setPosition((prev) => ({ ...prev, [axis]: parseInt(value) }));
  };



    return (
        <div style={{ padding: '10px' }}>
    <h3>Please choose your box content </h3>
    {/* 未來這裡可以放你的速度控制 UI */}
    <p>Press "Add Box" button to add new box </p>


        <div style={{ padding: '1rem' }}>
      {items.map((item, index) => {
        const products = ProductList.ProductList.filter(
          p => p.catogory === item.category
        );

        return (
            
          <div key={index} style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
            {/* Category Select */}
            <select
              value={item.category}
              onChange={e => handleItemChange(index, 'category', e.target.value)}
            >
              <option value=''>Choose Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Product Select */}
            <select
              value={item.product}
              onChange={e => handleItemChange(index, 'product', e.target.value)}
              disabled={!item.category}
            >
              <option value=''>Choose Product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.ProductName}</option>
              ))}
            </select>

            {/* Quantity Select */}
            <select
              value={item.quantity}
              onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))}
            >
              {[...Array(20)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>

            {/* Delete Button */}
            <button onClick={() => handleRemoveItem(index)}>Delete</button>
          </div>

         
          
        );
      })}

      <button onClick={handleAddItem}>Add New Item</button>
    </div>
        

       <div>
            <label >Initial Position ( x , z , y ) : </label>
            {['x', 'y', 'z'].map((axis) => (
            <select
                key={axis}
                value={position[axis]}
                onChange={(e) => handlePositionChange(axis, e.target.value)}
            >
                {Array.from({ length: 41 }, (_, i) => {
                    const value = i - 20; // -20 to 20 
                    return (
                        <option key={value} value={value}>
                        {value}
                        </option>
                    );
                })} 
            </select>
            ))}


          </div>

    <button onClick={addSingleBoxWithData}>Add Box</button>
  </div>
    )



}















