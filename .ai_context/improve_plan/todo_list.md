# Todo List

這裡用來記錄後續改善項目。若某個項目需要更完整的 plan、方針、設計細項或實作筆記，請在 `todo_list_planAndFeature/` 底下新增對應文件，並從此清單連結過去。

## Mission Flow Refactor

- [x] 拆分目前 hard-coded mission flow，逐步整理成 config + builder + runner + adapters 架構。
  - Plan: `todo_list_planAndFeature/mission_flow_refactor_plan.md`
- [x] 為 mission builder 補上 TDD 測試，先覆蓋 inbound / outbound 任務生成與 step 順序。
  - Plan: `todo_list_planAndFeature/mission_flow_refactor_plan.md`
- [x] 為 mission runner 補上 TDD 測試，覆蓋 step 成功、失敗、未知 functionKey 與 async 執行順序。
  - Plan: `todo_list_planAndFeature/mission_flow_refactor_plan.md`

## Demo Operator UI

- [ ] 將目前偏工程/測試用途的控制介面整理成適合面試展示的簡化操作員介面。
  - Plan: `todo_list_planAndFeature/demo_operator_ui_plan.md`

## Notes

- 新項目請保持小而可執行。
- 若項目有詳細計畫，請放到 `todo_list_planAndFeature/`。
