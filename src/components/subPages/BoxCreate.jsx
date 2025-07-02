import React, { useEffect, useState } from 'react'
import { useBoxStore } from '../../stores/boxStore'
// import { ProductList } from '../../data/ProductList' // 假設你有一個產品列表數據
// import { useBoxStore } from '../../stores/boxStore';

import { useProductStore } from '../../stores/productStore'; // 引入你的產品 store






// const categories = [...new Set(ProductList.ProductList.map(p => p.catogory))];

const generateNewItem = () => ({
  category: '',
  product: '',
  quantity: 1,
});



export default function BoxCreate({ tabId }) {


    const addSingleBox = useBoxStore((state) => state.handleAddSingleBox)
    const addBox = useBoxStore((state) => state.addBox);

    // const addSingleBoxWithData = () => {
    //     const boxData = {
    //         id: `box-${Date.now()}`, // 確保每個 box 有唯一 ID
    //         name: 'New Box',
    //         content: 'Default Content',
    //     };
    //     addSingleBox(boxData.id,boxData);
        
    // }



    // 從 Product Store 取得產品資料、類別、載入狀態和錯誤
    const products = useProductStore((state) => state.products);
    const categories = useProductStore((state) => state.categories); // 現在從 store 取得
    const isLoadingProducts = useProductStore((state) => state.isLoading);
    const productFetchError = useProductStore((state) => state.error);
    const getProductById = useProductStore((state) => state.getProductById); // 用於透過 ID 查找產品


    

   

   


    const [position, setPosition] = useState({ x: 0, y: 4, z: 0 });

    const [items, setItems] = useState([
        generateNewItem(),
        generateNewItem(),
        generateNewItem(),
    ]);



    // 當產品資料載入完成或變化時，確保選中的 product ID 仍然有效
    useEffect(() => {
      // 遍歷所有選定的 item，如果其 product ID 不再 products 列表中，則清空
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.product && !getProductById(item.product)) {
            return { ...item, product: '' }; // 如果產品ID無效，則重置 product
          }
          return item;
        })
      );
      // 如果類別也需要重置，可以在這裡添加類似邏輯
      // 例如：如果當前選中的 category 不在新的 categories 列表中，則重置它
      setItems((prevItems) => 
          prevItems.map((item) => {
              if (item.category && !categories.includes(item.category)) {
                  return { ...item, category: '', product: '' };
              }
              return item;
          })
      );
    }, [products, categories, getProductById]); // 依賴 products 和 categories


    

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



  //  const addSingleBoxWithData = () => {
  //     const allContent = {};

  //     items.forEach((item) => {
  //       if (!item.product) return; // 忽略沒選產品的列
  //       // console.log("itemddddm");
  //       const product = ProductList.ProductList.find(p => p.id === item.product);
  //       if (!product) return;

  //       const oneContent = {
  //         id: `ID-product-Item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  //         name: product.ProductName,
  //         content: product.catogory,
  //         quantity: item.quantity,
  //         position: [position.x, position.y, position.z],
  //       };

  //       allContent[product.id] = oneContent;
  //     });

  //     if (Object.keys(allContent).length === 0) {
  //       alert("Please select at least one product before adding a box.");
  //       return;
  //     }

  //     const boxData = {
  //       id: `box-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  //       content: allContent,
  //       position: [position.x, position.y, position.z],
  //     };

  //     addSingleBox(boxData.id, boxData);
  //   };



    const addSingleBoxWithData = () => {
      const allContent = {};

      items.forEach((item) => {
        if (!item.product) return; // 忽略沒選產品的列

        // 使用 getProductById 從產品列表中查找產品
        const product = getProductById(item.product); 
        if (!product) return; // 如果找不到產品，則跳過

        const oneContent = {
          // ID 應該在 Box 中唯一，如果需要 item 級別的唯一 ID，可以在此生成
          id: product.id, // 使用 product 的 ID 作為 content 內的 ID
          name: product.ProductName,
          content: product.category, // 使用 category 作為 content
          quantity: item.quantity,
          // position 通常是 Box 的屬性，而不是 item 內容的屬性
          // 這裡不需要在 oneContent 中包含 position
        };
        // console.log("oneContent", oneContent); // 確認 oneContent 結構
        
        // 每個 product ID 應該只儲存一次，數量可以疊加，或根據你的需求決定
        // 這裡假設如果同一個 product ID 被多次選中，只會保留最後一個
        allContent[product.id] = oneContent; 
      });

      if (Object.keys(allContent).length === 0) {
        alert("Please select at least one product before adding a box.");
        return;
      }

      const boxData = {
        id: `box-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content: allContent, // 儲存所有選定的產品內容
        position: [position.x, position.y, position.z],
      };
      // console.log("Box Data to be added:", boxData); // 確認 boxData 結構

      addSingleBox(boxData.id, boxData);
      // alert(`Box ${boxData.id} with items added!`); // 提示成功
    };    






     if (isLoadingProducts) {
        return <div style={{ padding: '10px', textAlign: 'center' }}>Loading product data...</div>;
      }

      // 如果產品載入失敗且沒有任何產品資料（即便使用預設），可以考慮顯示錯誤訊息
      // 由於我們預設會使用 defaultProductList，通常不會出現沒有 products 的情況
      if (productFetchError && products.length === 0) {
        return <div style={{ padding: '10px', color: 'red' }}>Error loading product data: {productFetchError}. Using default data.</div>;
      }

    return (
        <div style={{ padding: '10px' }}>
    <h3>Please choose your box content </h3>
    {/* 未來這裡可以放你的速度控制 UI */}
    <p>Press "Add Box" button to add new box </p>


        <div style={{ padding: '1rem' }}>
      {items.map((item, index) => {
        // const products = ProductList.ProductList.filter(  // change this to use productstore 
        //   p => p.catogory === item.category
        // );
        const productsInSelectedCategory = item.category
            ? products.filter((p) => p.category === item.category)
            : [];

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
              
              {productsInSelectedCategory.map((p) => (
              // {products.map(p => (
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















