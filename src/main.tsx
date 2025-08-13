import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Simple initialization log
console.log('🚀 Initializing app...');

// Get root element and render app directly
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(<App />);

console.log('✅ App rendered successfully');
        <button onclick="window.location.reload()" style="
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 16px;
        ">Recarregar Página</button>
      </div>
    </div>
  `
}
