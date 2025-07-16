import React, { useState } from 'react';
import ReactJson from '@uiw/react-json-view';

import { rawTxHexToJson, TxHexJsonObject } from './rawTxToJson';
import './Visualizer.css'

function RawTxVisualizer() {
    const [rawTxInput, setrawTxInput] = useState<string>("");
    const [jsonOutput, setJsonOutput] = useState<TxHexJsonObject | null>(null);
    
    function handleConvert(): void {
        const [jsonObject, remainingHex] = rawTxHexToJson(rawTxInput)
        setJsonOutput(jsonObject)
    }
    
    return (
        <div className='container'>
            <div className='container'>
                <textarea
                    className="hexInputTextarea"
                    rows={10}
                    value={rawTxInput}
                    onChange={(e) => setrawTxInput(e.target.value)}
                    placeholder="Enter rawTx hex string..."
                />
                <button className='centered-button' onClick={handleConvert}>
                    Convert and Visualize
                </button>
            </div>
            
            <div>
                {jsonOutput && (
                    <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">JSON Output</h2>
                    <ReactJson value={jsonOutput} collapsed={false}/>
                    </div>
                )}
            </div>
        </div>
    )
};

export default RawTxVisualizer;