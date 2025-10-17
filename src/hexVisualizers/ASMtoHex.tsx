import React, { useState } from 'react';

import './Visualizer.css'
import { Script } from '@bsv/sdk';

function ASMtoHexConverter() {
    const [scriptInput, setscriptInput] = useState<string>("");
    const [hexOutput, sethexOutput] = useState<string | null>(null);
    
    function handleConvert(): void {
        const script = Script.fromASM(scriptInput)
        sethexOutput(script.toHex())
    }
    
    return (
        <div className='container'>
            <div className='container'>
                <textarea
                    className="hexInputTextarea"
                    rows={40}
                    value={scriptInput}
                    onChange={(e) => setscriptInput(e.target.value)}
                    placeholder="Enter script hex string..."
                />
                <button className='centered-button' onClick={handleConvert}>
                    Convert and Visualize
                </button>
            {hexOutput && (
                    <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">JSON Output</h2>
                    
                    <p style={{wordWrap: 'break-word', width: '700px'}}>{hexOutput}</p>
                    </div>
                )}
            </div>
        </div>
    )
};

export default ASMtoHexConverter;