import React from 'react';
import { Link } from 'react-router-dom';
import { Spend } from '@bsv/sdk';
import { StackElement } from './StackElement';

interface InspectionPanelProps {
  spendSimulation: Spend | null;
  stacks: {
    main: number[][];
    alt: number[][];
    if: boolean[];
  };
  focusedElement: StackElement | null;
  simulationError: string;
}

export const InspectionPanel: React.FC<InspectionPanelProps> = ({
  spendSimulation,
  stacks,
  focusedElement,
  simulationError,
}) => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {spendSimulation === null ? (
         <p>Need a unlocking script and a locking script for a simulation</p>
      ) : (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #90caf9',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          <strong>Simulation Current State:</strong>
          <div>Current script: {spendSimulation.context}</div>
          {spendSimulation.context === 'UnlockingScript' ? (
            <div>
              <div>Program counter: {spendSimulation.programCounter} / {spendSimulation.unlockingScript.chunks.length}</div>
              { spendSimulation.programCounter === spendSimulation.unlockingScript.chunks.length ? (
                <div>Finished executing unlocking script, moving to locking script.</div>
              ) : (
                <div></div>
              )}
            </div>
          ) : (
            <div>
              <div>Program counter: {spendSimulation.programCounter} / {spendSimulation.lockingScript.chunks.length}</div>
              { spendSimulation.programCounter === spendSimulation.lockingScript.chunks.length ? (
                <div>Finished executing locking script.</div>
              ) : (
                <div></div>
              )}
            </div>
            
          )}
          
          <div>Main stack size: {stacks.main.length}</div>
          <div>Alt stack size: {stacks.alt.length}</div>
          <div>If stack: {"[" + spendSimulation.ifStack.map(el => el ? 'true' : 'false').join(', ') + "]"}</div>
          { spendSimulation.ifStack.includes(false) ? (
            <div>Inside a false IF branch, skipping operations.</div>
          ) : (
            <div></div>
          )}
          <div>#OPs in unlocking script: {spendSimulation.unlockingScript.chunks.length}</div>
          <div>#OPs in locking script: {spendSimulation.lockingScript.chunks.length}</div>
        </div>
      )}

      {focusedElement ? (
        <div style={{ border: '1px solid #aaa', padding: '10px', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h4>Stack Element Info</h4>
          <p><strong>Description:</strong></p>
          <p style={{wordWrap: 'break-word'}}>{focusedElement.getDetailString()}</p>
        </div>
      ) : (
        <p>Hover over or click a stack element for info...</p>
      )}

      {simulationError ? (
        <div style={{ border: '1px solid #aaa', padding: '10px', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h4>Simulation Error</h4>
          <p><strong>Error:</strong></p>
          <p style={{wordWrap: 'break-word'}}>{simulationError}</p>
        </div>
      ) : (
        <p></p>
      )}

      {/* Spacer to push navigation link to bottom */}
      <div style={{ flex: 1 }}></div>

      {/* Navigation link fixed at the very bottom */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        textAlign: 'center'
      }}>
        <Link to="/HexToJson" style={{
          display: 'inline-block',
          padding: '12px 20px',
          backgroundColor: '#2196f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '14px',
          fontWeight: 'bold',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          Hex Visualizers →
        </Link>
      </div>
    </div>
  );
};
