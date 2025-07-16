import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import { ScriptExecutionVisualizer } from './spendSimulation/ScriptExecutionVisualizer';
import BEEFVisualizer from './hexVisualizers/BEEFVisualizer';
import BUMPVisualizer from './hexVisualizers/BUMPVisualizer';
import RawTxVisualizer from './hexVisualizers/rawTxVisualizer';
import ScriptVisualizer from './hexVisualizers/scriptVisualizer';
import NotFound from './NotFound';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router basename="/BSVScriptVisualizer">
        <Routes>
          <Route path="/" element={<ScriptExecutionVisualizer />} />
          <Route path="/HexToJson" element={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: "center", justifyContent: 'center' }}>
              <BEEFVisualizer />
              <BUMPVisualizer />
              <RawTxVisualizer />
              <ScriptVisualizer />
              <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <Link to="/" style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  ← Back to Script Visualizer
                </Link>
              </div>
            </div>
            } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
  </React.StrictMode>
);
