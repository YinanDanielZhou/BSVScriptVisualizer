import React, { useState } from 'react';
import ReactJson from '@uiw/react-json-view';

import { BUMPHexToJson, BUMPJsonObject } from './BUMPHexToJson';

function BUMPVisualizer() {
    const [BUMPHexInput, setBUMPHexInput] = useState<string>("");
    const [jsonOutput, setJsonOutput] = useState<BUMPJsonObject | null>(null);
    
    function handleConvert(): void {
        const [jsonObject, remainingHex] = BUMPHexToJson(BUMPHexInput)
        setJsonOutput(jsonObject)
    }
    
    return (
        <div className='container'>
            <div className='container'>
                <textarea
                    className="hexInputTextarea"
                    rows={10}
                    value={BUMPHexInput}
                    onChange={(e) => setBUMPHexInput(e.target.value)}
                    placeholder="Enter BUMP hex string..."
                />
                <button className='centered-button' onClick={handleConvert}>
                    Convert and Visualize
                </button>
            </div>
            
            <div>
                {jsonOutput && (
                    <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">JSON Output</h2>
                    <ReactJson value={jsonOutput} collapsed={false} />
                    </div>
                )}
            </div>
        </div>
    )
};

export default BUMPVisualizer;