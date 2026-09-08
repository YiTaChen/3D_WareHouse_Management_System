import process from 'node:process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [{ name: 'conveyor-regression-panel', enforce: 'pre', transform(code, id) {
    if (process.env.CONVEYOR_BASELINE === '1' && id.endsWith('/src/components/rollerContact.js')) return code.replace('contactEquationRelaxation: 20', 'contactEquationRelaxation: 3');
    if (!id.endsWith('/src/App.jsx')) return;
    return "import ConveyorRegression from '../tools/physics/ConveyorRegression.jsx';\n" + code.replace('<DatabaseSwitcher />', '<DatabaseSwitcher /><ConveyorRegression />');
  } }, react()],
});
