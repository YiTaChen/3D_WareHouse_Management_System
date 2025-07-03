import { create } from 'zustand';

export const useUIStore = create((set) => ({
  highlightPosition: null, // 用於儲存高亮的 [x, y, z] 座標

  /**
   * 設定一個 3D 位置進行高亮顯示。
   * 會在設定後 3 秒自動清除高亮。
   * @param {number[] | null} position - 要高亮的位置 [x, y, z]，如果為 null 則清除高亮。
   */
  setHighlightPosition: (position) => {
    set({ highlightPosition: position });

    // 如果設定了高亮位置，則在 3 秒後自動清除
    if (position) {
      setTimeout(() => {
        set({ highlightPosition: null });
      }, 5000); // 5 秒
    }
  },

  // future feature:   notificationMessage 等等
}));








