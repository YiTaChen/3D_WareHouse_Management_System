
import { create } from 'zustand';
import { ProductList } from '../data/ProductList'; // 引入預設資料

// 根據你的專案設定，選擇正確的環境變數前綴
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL;

export const useProductStore = create((set, get) => ({
  products: [], // 儲存從 API 取得的產品列表
  categories: [], // 儲存從 API 取得的產品類別列表
  isLoading: false, // 表示是否正在載入資料
  error: null, // 儲存錯誤訊息

    defaultProductList: ProductList.ProductList, // 使用預設產品資料


  /**
   * 初始化產品資料：嘗試從 API 載入，失敗則使用預設資料。
   */
  fetchProductsAndCategories: async () => {
    set({ isLoading: true, error: null }); // 設定載入狀態
    // console.log("Initializing product data...");
    try {

        // console.log("Fetching product data from API...");
      // 1. 取得所有產品
      const productsResponse = await fetch(`${API_BASE_URL}/items`);
      if (!productsResponse.ok) {
        throw new Error(`Failed to fetch products: ${productsResponse.statusText}`);
      }
      const productsData = await productsResponse.json();

      // 將後端傳來的 item_id, item_name 映射為 id, ProductName
      const formattedProducts = productsData.map(item => ({
        id: item.item_id,
        category: item.category,
        ProductName: item.item_name,
        // price 和 weight 之後再加，這裡先給預設值或從後端資料中取得（如果有的話）
        price: 0, // 暫時預設
        weight: 0, // 暫時預設
      }));


      // 2. 取得所有類別
      const categoriesResponse = await fetch(`${API_BASE_URL}/items/categories`);
      if (!categoriesResponse.ok) {
        throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
      }
      const categoriesData = await categoriesResponse.json();

      // 更新 store 狀態
      set({
        products: formattedProducts,
        categories: categoriesData,
        isLoading: false,
      });

    } catch (err) {
      console.error("Error fetching product data from API, using default data:", err);
      // 如果 API 載入失敗，則使用預設資料
      set({
        products: defaultProductList.map(item => ({
            id: item.id,
            category: item.category,
            ProductName: item.ProductName,
            price: 0, // 暫時預設
            weight: 0, // 暫時預設
        })),
        // 從預設資料中提取類別
        categories: [...new Set(defaultProductList.map(item => item.category))],
        isLoading: false,
        error: err.message,
      });
    }
  },

  /**
   * 根據類別獲取產品列表。
   * @param {string} category - 產品類別。
   * @returns {Array<object>} 符合該類別的產品列表。
   */
  getProductsByCategory: (category) => {
    // console.log("Fetching products for category:", category);

    const products = get().products;
    return products.filter(product => product.category === category);
  },

  /**
   * 根據產品ID獲取單一產品資訊。
   * @param {string} productId - 產品的 ID。
   * @returns {object|undefined} 產品物件，如果找不到則返回 undefined。
   */
  getProductById: (productId) => {
    // console.log("Fetching product by ID:", productId);
    const products = get().products;
    return products.find(product => product.id === productId);
  },
}));

