import React, { useState } from 'react';
import ReactJson from '@uiw/react-json-view';

import { BEEFJsonObject, BEEFHexToJson } from './BEEFHexToJson';
import './Visualizer.css'

function BEEFVisualizer() {
    const [BEEFHexInput, setBEEFHexInput] = useState<string>("");
    const [jsonOutput, setJsonOutput] = useState<BEEFJsonObject | null>(null);
    
    function handleConvert(): void {
        const jsonObject = BEEFHexToJson(BEEFHexInput)
        setJsonOutput(jsonObject)
    }

    // Call the function with a container ID
    // visualizeBEEFjson(jsonData, 'container');
    
    return (
        <div className='container'>
            <div className='container'>
                <textarea
                    className="hexInputTextarea"
                    rows={10}
                    value={BEEFHexInput}
                    onChange={(e) => setBEEFHexInput(e.target.value)}
                    placeholder="Enter BEEF hex string..."
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

export default BEEFVisualizer;