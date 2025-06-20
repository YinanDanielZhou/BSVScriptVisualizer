import React from 'react';

interface ScriptsInputPanelProps {
  unlockingScriptHex: string;
  setUnlockingScriptHex: (value: string) => void;
  lockingScriptHex: string;
  setLockingScriptHex: (value: string) => void;
  bothScriptsEntered: boolean;
  onSimulateValidation: () => void;
}

export const ScriptsInputPanel: React.FC<ScriptsInputPanelProps> = ({
  unlockingScriptHex,
  setUnlockingScriptHex,
  lockingScriptHex,
  setLockingScriptHex,
  bothScriptsEntered,
  onSimulateValidation,
}) => {
  return (
    <>
      <h3>Unlocking Script Input</h3>
      <textarea
        value={unlockingScriptHex}
        onChange={(e) => setUnlockingScriptHex(e.target.value)}
        rows={10}
        style={{ width: '100%', resize: 'vertical' }}
      />

      <h3>Locking Script Input</h3>
      <textarea
        value={lockingScriptHex}
        onChange={(e) => setLockingScriptHex(e.target.value)}
        rows={10}
        style={{ width: '100%', resize: 'vertical' }}
      />

      <div style={{ textAlign: 'center', marginTop: '20px'}}>
        <button 
          onClick={onSimulateValidation}
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
      </div>
    </>
  );
};
