import React, { useState } from 'react';
import ReactJson from '@uiw/react-json-view';

import scriptToJson, { ScriptJsonObject } from './scriptToJson';
import './Visualizer.css'

function ScriptVisualizer() {
    const [scriptInput, setscriptInput] = useState<string>("");
    const [jsonOutput, setJsonOutput] = useState<ScriptJsonObject | null>(null);
    
    function handleConvert(): void {
        const jsonObject= scriptToJson(scriptInput)
        setJsonOutput(jsonObject)
    }
    
    return (
        <div className='container'>
            <div className='container'>
                <textarea
                    className="hexInputTextarea"
                    rows={10}
                    value={scriptInput}
                    onChange={(e) => setscriptInput(e.target.value)}
                    placeholder="Enter script hex string..."
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

export default ScriptVisualizer;