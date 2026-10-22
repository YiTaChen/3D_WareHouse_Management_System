import { ProductList } from '../data/ProductList.js';
import { createDemoApi } from './demoApi.js';

// Every browser defaults to an isolated, fully interactive demo.
// No administrator credential may ever be put in VITE_* or the browser bundle.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';
const demoFetch = createDemoApi({
  products: ProductList.ProductList.map(item => ({ item_id: item.id,
    item_name: item.ProductName, category: item.category || item.catogory })),
});
export const apiFetch = (input, init) => DEMO_MODE ? demoFetch(input, init) : globalThis.fetch(input, init);
