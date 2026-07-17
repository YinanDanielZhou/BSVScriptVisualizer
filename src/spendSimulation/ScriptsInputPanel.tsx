import { LockingScript, Script, Spend, Transaction, UnlockingScript } from '@bsv/sdk';
import React, { useState } from 'react';
import { getOutputSatoshis } from './WocConnector';

interface ScriptsInputPanelProps {
  handleStartSimulation: (newSpendSimulation: Spend) => void;
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
  const [txRawHex, setTxRawHex] = useState<string>('');
  const [txInputIndex, setTxInputIndex] = useState<number>(0);

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

  const bothScriptsEntered = lockingScriptHex !== '' && (unlockingScriptHex !== '' || txRawHex !== '');

  return (
    <>
      <h3>Unlocking Script Input (hex)</h3>
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
            padding: '2px',
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


      <h3>Locking Script Input (hex)</h3>
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
            padding: '2px',
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
            onClick={async () => {
              if (txRawHex === "") {
                const mockSpendSimulation = new Spend({
                  sourceTXID: "0000000000000000000000000000000000000000000000000000000000000000",
                  sourceOutputIndex: 0,
                  sourceSatoshis: 1,
                  lockingScript: LockingScript.fromHex(lockingScriptHex),
                  transactionVersion: 1,
                  otherInputs: [],
                  outputs: [],
                  unlockingScript: UnlockingScript.fromHex(unlockingScriptHex),
                  inputSequence: 0xffffffff,  // this need to be changed to the correct value for ChECKSIG to work
                  inputIndex: 0,
                  lockTime: 0
                })

                try {
                  console.log(mockSpendSimulation.validate())
                  mockSpendSimulation.reset()
                } catch {
                  console.error("failed to validate")
                }

                setLockingScriptHex(mockSpendSimulation.lockingScript.toHex())
                setUnlockingScriptHex(mockSpendSimulation.unlockingScript.toHex())
                handleStartSimulation(mockSpendSimulation)
              } else {
                const tx = Transaction.fromHex(txRawHex);
                const inputIndex = txInputIndex
                const sourceTXID = tx.inputs[inputIndex].sourceTXID!
                const sourceOutputIndex = tx.inputs[inputIndex].sourceOutputIndex
                const sourceSatoshis = await getOutputSatoshis(sourceTXID, sourceOutputIndex)

                const newSpendSimulation = new Spend({
                      sourceTXID: sourceTXID,
                      sourceOutputIndex: sourceOutputIndex,
                      sourceSatoshis: sourceSatoshis,
                      lockingScript: LockingScript.fromHex(lockingScriptHex),
                      transactionVersion: tx.version,
                      otherInputs: tx.inputs.slice(0, inputIndex).concat(tx.inputs.slice(inputIndex + 1)),
                      outputs: tx.outputs,
                      unlockingScript: tx.inputs[inputIndex].unlockingScript!,
                      inputSequence: tx.inputs[inputIndex].sequence!,
                      inputIndex: inputIndex,
                      lockTime: tx.lockTime
                })

                try {
                  console.log(newSpendSimulation.validate())
                  newSpendSimulation.reset()
                } catch {
                  console.error("failed to validate")
                }
                setLockingScriptHex(newSpendSimulation.lockingScript.toHex())
                setUnlockingScriptHex(newSpendSimulation.unlockingScript.toHex())
                handleStartSimulation(newSpendSimulation)
              }
            }}
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

      <h3>Tx Raw Hex Input</h3>
      <textarea
        value={txRawHex}
        onChange={(e) => {setTxRawHex(e.target.value)}}
        rows={10}
        style={{ width: '100%', resize: 'vertical' }}
        placeholder="Enter transaction raw hex..."
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
        <h3>Input Index</h3>
        <input
          type="number"
          value={txInputIndex}
          onChange={(e) => {
            setTxInputIndex(Number(e.target.value))
          }}
          min="0"
          style={{ width: '100px', fontSize: '16px', padding: '5px' }}
          placeholder="The input index to simulate spending."
        />
      </div>
    </>
  );
};
