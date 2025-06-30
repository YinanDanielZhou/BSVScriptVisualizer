import { Spend } from '@bsv/sdk';
import React, { useState } from 'react';

interface ScriptsInputPanelProps {
  handleStartSimulation: (lockingScriptHex: string, unlockingScriptHex: string) => void;
  handleQuitSimulation: () => void;
  spendSimulation: Spend | null;
  highlightStart: number;
  highlightEnd: number;
}

export const ScriptsInputPanel: React.FC<ScriptsInputPanelProps> = ({
  handleStartSimulation,
  handleQuitSimulation,
  spendSimulation,
  highlightStart,
  highlightEnd,
}) => {
  const [unlockingScriptHex, setUnlockingScriptHex] = useState('');
  const [lockingScriptHex, setLockingScriptHex] = useState('');

  const renderHighlightedText = (text: string, start?: number, end?: number) => {
    if (start === undefined || end === undefined || start < 0 || end > text.length || start >= end) {
      return text;
    }

    const beforeHighlight = text.substring(0, start);
    const highlighted = text.substring(start, end);
    const afterHighlight = text.substring(end);

    return (
      <>
        {beforeHighlight}
        <span style={{ backgroundColor: 'yellow', fontWeight: 'bold' }}>
          {highlighted}
        </span>
        {afterHighlight}
      </>
    );
  };

  const bothScriptsEntered = lockingScriptHex !== '' && unlockingScriptHex !== '';

  return (
    <>
      <h3>Unlocking Script Input</h3>
      {spendSimulation === null ? (
        /* Editable textarea */
        <textarea
          value={unlockingScriptHex}
          onChange={(e) => setUnlockingScriptHex(e.target.value)}
          rows={10}
          style={{ width: '100%', resize: 'vertical' }}
          placeholder="Enter unlocking script hex..."
        />
      ) : (
        /* Highlighted display version */
        <div
          style={{
            width: '100%',
            minHeight: '80px',
            maxHeight: '400px',
            border: '1px solid #ccc',
            padding: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            backgroundColor: '#f9f9f9',
            overflowY: 'scroll',
            marginBottom: '10px'
          }}
        >
          {spendSimulation.context === 'UnlockingScript' && spendSimulation.programCounter < spendSimulation.unlockingScript.chunks.length ? (
            renderHighlightedText(unlockingScriptHex, highlightStart, highlightEnd)
          ) : (
            // the highlighting is not needed here, we render the text as is
            renderHighlightedText(unlockingScriptHex, undefined, undefined)
          )}
        </div>
      )}


      <h3>Locking Script Input</h3>
      

      {spendSimulation === null ? (
        /* Editable textarea */
        <textarea
          value={lockingScriptHex}
          onChange={(e) => setLockingScriptHex(e.target.value)}
          rows={10}
          style={{ width: '100%', resize: 'vertical' }}
        />
      ) : (
        /* Highlighted display version */
        <div
          style={{
            width: '100%',
            minHeight: '80px',
            maxHeight: '400px',
            border: '1px solid #ccc',
            padding: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            backgroundColor: '#f9f9f9',
            overflowY: 'scroll',
            marginBottom: '10px'
          }}
        >
          {spendSimulation.context === 'LockingScript' || spendSimulation.programCounter === spendSimulation.unlockingScript.chunks.length ? (
            renderHighlightedText(lockingScriptHex, highlightStart, highlightEnd)
          ) : (
            // the highlighting is not needed here, we render the text as is
            renderHighlightedText(lockingScriptHex, undefined, undefined)
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px'}}>
        {spendSimulation === null ? (
          <button
            onClick={() => handleStartSimulation(lockingScriptHex, unlockingScriptHex)}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: bothScriptsEntered ?  '#4caf50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor:bothScriptsEntered ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.3s, transform 0.1s',}}
            disabled={ !bothScriptsEntered }
            onMouseDown={(e) => {
              if (bothScriptsEntered) e.currentTarget.style.transform = 'scale(0.96)';
            }}
            onMouseUp={(e) => {
              if (bothScriptsEntered) e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              if (bothScriptsEntered) e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Simulate Validation
          </button>
        ) : (
          <button
            onClick={handleQuitSimulation}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background-color 0.3s, transform 0.1s',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.96)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Quit Simulation
          </button>
        )}
      </div>
    </>
  );
};
