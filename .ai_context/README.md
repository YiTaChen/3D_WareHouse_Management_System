# AI Context for 3D Warehouse Management System

這個資料夾是給後續 AI agent 與工程維護者使用的 repo 索引。它不是產品文件，而是「修改程式前要先讀的工程上下文」。

Repo root:

`/Users/adam/git/3d_warehause/3D_WareHouse_Management_System`

建議閱讀順序:

1. `agent_entrypoint.md`：最短入口，告訴 agent 要先讀哪些檔案。
2. `repo_overview.md`：系統是什麼、技術棧、主要資料流。
3. `repo_structure.md`：每個資料夾與重要檔案用途。
4. `feature_map.md`：依功能查要改哪些檔案。
5. `function_index.md`：function/component/store/API 索引。
6. `functions/`：需要深入時再讀詳細 function 說明。
7. `known_risks.md` 與 `change_guidelines.md`：修改前必讀。

文件分層原則:

- 結構與用途放在 `repo_structure.md`。
- 功能流程放在 `feature_map.md`。
- API 與資料表放在 `api_routes.md`、`data_model.md`。
- 詳細 function/component/store 說明放在 `functions/*.md`。
- 已知 bug、技術債、測試缺口放在 `known_risks.md`。

最後更新: 2026-05-19
