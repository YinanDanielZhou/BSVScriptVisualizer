import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { StackElement } from './StackElement';
import { StackRenderer } from './StackRenderer';
import { PendingStackElementRenderer } from './PendingStackElementRenderer';
import { ScriptsInputPanel } from './ScriptsInputPanel';
import { InspectionPanel } from './InspectionPanel';
import { LockingScript, Script, Spend, UnlockingScript } from '@bsv/sdk';
import { minBytesNeededToPushDataOfLength } from './utils';

export const ScriptExecutionVisualizer: React.FC = () => {
  const [spendSimulation, setSpendSimulation] = useState<Spend | null>(null);
  const [simulationCompleted, setSimulationCompleted] = useState<boolean>(false);

  const [stacks, setStacks] = useState<{
    main: number[][];
    alt: number[][];
    if: boolean[];
  }>({
    main: [],
    alt: [],
    if: []
  });

  const [scriptHighlightRange, setScriptHighlightRange] = useState<{ start: number; end: number }>({start: 0, end: 0});

  const handleStartSimulation = (lockingScriptHex: string, unlockingScriptHex: string) => {
    const newSpendSimulation = new Spend({
      sourceTXID: "mockTxID",
      sourceOutputIndex: 0,
      sourceSatoshis: 0,
      lockingScript: Script.fromHex(lockingScriptHex) as LockingScript,
      transactionVersion: 0,
      otherInputs: [],
      outputs: [],
      unlockingScript: Script.fromHex(unlockingScriptHex) as UnlockingScript,
      inputSequence: 0,
      inputIndex: 0,
      lockTime: 0
    })

    setSpendSimulation(newSpendSimulation);
    const firstOperation = newSpendSimulation.unlockingScript.chunks[0]
    if (firstOperation.data) {
      setScriptHighlightRange({start: 0, end: minBytesNeededToPushDataOfLength(firstOperation.data.length) * 2}); // each byte is 2 characters long in hex string
    } else {
      setScriptHighlightRange({start: 0, end: 2});  // every OP code that does not push data is 2 characters long in hex string (1 byte)
    }
    // Initialize the stacks with the new simulation state
    setStacks({
      main: [...newSpendSimulation.stack],
      alt: [...newSpendSimulation.altStack],
      if: [...newSpendSimulation.ifStack]
    });
  }

  const handleQuitSimulation = () => {
    setSpendSimulation(null);

    setStacks({
      main: [],
      alt: [],
      if: []
    });
  }

  const handleResetSimulation = () => {
    if (spendSimulation === null) return;
    handleStartSimulation(spendSimulation.lockingScript.toHex(), spendSimulation.unlockingScript.toHex());
    // The stacks will be updated when the new simulation is created
  };

  // Helper function to advance the simulation by one step
  const advanceSimulation = (spendSimulation: Spend, scriptRange: { start: number; end: number }) => {
    const newRange = {...scriptRange};

    try {
      let stepSuccessful = spendSimulation.step();
      if (!stepSuccessful) {
        console.log("Step failed");
        return newRange;
      };
    } catch (e) {
      console.log(e);
    }

    let currentScript = spendSimulation.context === 'UnlockingScript' ? spendSimulation.unlockingScript : spendSimulation.lockingScript
    let currentProgramCounter = spendSimulation.programCounter;
    
    if (currentProgramCounter >= currentScript.chunks.length) {
      // the current script's execution is done
      if (spendSimulation.context === 'UnlockingScript') {
        // move to locking script
        currentScript = spendSimulation.lockingScript
        currentProgramCounter = 0;
        newRange.start = 0;
        newRange.end = 0;
      } else {
        // the simulation is done, no more pending elements
        return newRange;
      }
    }
    
    const nextOperation = currentScript.chunks[currentProgramCounter]
    if (nextOperation.data) {
      newRange.start = newRange.end;
      newRange.end = newRange.end + minBytesNeededToPushDataOfLength(nextOperation.data.length) * 2; // each byte is 2 characters long in hex string
    } else {
      newRange.start = newRange.end;
      newRange.end = newRange.end + 2;  // every OP code that does not push data is 2 characters long in hex string (1 byte)
    }
    return newRange;
  }

  const handleAdvanceOneStep = useCallback(() => {
    if (spendSimulation === null) return;
    const newRange = advanceSimulation(spendSimulation, scriptHighlightRange);
    // Force re-render by creating new array references - single state update
    setStacks({
      main: [...spendSimulation.stack],
      alt: [...spendSimulation.altStack],
      if: [...spendSimulation.ifStack]
    });
    setScriptHighlightRange(newRange);
  }, [spendSimulation, scriptHighlightRange]);

  const handleAdvanceTenSteps = useCallback(() => {
    if (spendSimulation === null) return;

    let currentHighlightRange = {...scriptHighlightRange};
    for (let i = 0; i < 10; i++) {
      currentHighlightRange = advanceSimulation(spendSimulation, currentHighlightRange);
    }
    // Force re-render by creating new array references - single state update
    setStacks({
      main: [...spendSimulation.stack],
      alt: [...spendSimulation.altStack],
      if: [...spendSimulation.ifStack]
    });
    setScriptHighlightRange(currentHighlightRange);
  }, [spendSimulation, scriptHighlightRange]);

  const handleAdvanceToNextComputation = useCallback(() => {
    if (spendSimulation === null) return;
    let currentPendingElement = getPendingStackElementHelper();
    let isScriptExecuting;
    let currentHighlightRange = {...scriptHighlightRange};
    do {
      currentHighlightRange = advanceSimulation(spendSimulation, currentHighlightRange);
      isScriptExecuting = !spendSimulation.ifStack.includes(false);
      if (isScriptExecuting) {
        currentPendingElement = getPendingStackElementHelper();
      }
    } while (!isScriptExecuting || (currentPendingElement && !currentPendingElement.triggersComputation()))
    // Force re-render by creating new array references - single state update
    setStacks({
      main: [...spendSimulation.stack],
      alt: [...spendSimulation.altStack],
      if: [...spendSimulation.ifStack]
    });
    setScriptHighlightRange(currentHighlightRange);
  }, [spendSimulation, scriptHighlightRange]);

  // Helper function to get pending element
  // The pending element is the next opcode to be executed in the spending simulation
  const getPendingStackElementHelper = () => {
    if (spendSimulation === null) { return null }

    let currentScript = spendSimulation.context === 'UnlockingScript' ? spendSimulation.unlockingScript : spendSimulation.lockingScript
    let currentProgramCounter = spendSimulation.programCounter;

    if (spendSimulation.programCounter >= currentScript.chunks.length) {
      // the current script's execution is done
      if (spendSimulation.context === 'UnlockingScript') {
        // move to locking script
        currentScript = spendSimulation.lockingScript
        currentProgramCounter = 0;
      } else {
        // the simulation is done, no more pending elements
        return null
      }
    }

    const operation = currentScript.chunks[currentProgramCounter]
    if (operation.data) {
      return new StackElement(operation.data.map(byte => byte.toString(16).padStart(2, '0')).join(''), "PendingPushdata");
    } else {
      return new StackElement(operation.op.toString(16), "PendingOP");
    }
  }

  // Memoize the pending stack element result to maintain object identity
  const pendingStackElement = useMemo(() => {
    return getPendingStackElementHelper();
  }, [spendSimulation?.programCounter, spendSimulation?.context]);

  // state to track hovered element
  const [hoveredElement, setHoveredElement] = useState<StackElement | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State to track clicked element
  const [clickedElement, setClickedElement] = useState<StackElement | null>(null);

  // Focused element is either hovered or clicked (from stack or pending)
  const [focusedElement, setFocusedElement] = useState<StackElement | null>(null);


  // Update focusedElement based on hover and click states
  useEffect(() => {
    if (hoveredElement) {
      setFocusedElement(hoveredElement);
    } else if (clickedElement) {
      setFocusedElement(clickedElement);
    } else {
      setFocusedElement(null);
    }
  }, [clickedElement, hoveredElement]);

  // Whenever the pending stack element changes, 
  // update the focused element to either the pending element or null
  useEffect(() => {
    setHoveredElement(null);
    setClickedElement(pendingStackElement);
  }, [pendingStackElement])


  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100vw',
        overflow: 'scroll'
      }}
    >
      {/* Left Section */}
      <div
        style={{
          flexBasis: '25%',
          flexShrink: 0,
          flexGrow: 0,
          backgroundColor: '#f4f4f4',
          padding: '20px',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <ScriptsInputPanel
          handleStartSimulation={handleStartSimulation}
          handleQuitSimulation={handleQuitSimulation}
          spendSimulation={spendSimulation}
          highlightStart={scriptHighlightRange.start}
          highlightEnd={scriptHighlightRange.end}
        />
      </div>

      {/* Middle Section (Main Content) */}
      <div
        style={{
          flexBasis: '50%',
          flexShrink: 0,
          flexGrow: 0,
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Fixed Control Buttons */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#fff',
            zIndex: 1,
            paddingBottom: '10px',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <button onClick={handleAdvanceOneStep} style={{ marginRight: '10px' }}>Advance 1 Step</button>
          <button onClick={handleAdvanceTenSteps} style={{ marginRight: '10px' }}>Advance 10 Step</button>
          <button onClick={handleAdvanceToNextComputation} style={{ marginRight: '10px' }}>Advance to the Next Computation</button>
          <button onClick={handleResetSimulation}>Reset Simulation</button>
        </div>
        
        {pendingStackElement ? (
          <div>
            <h3>Next Op code to be executed:</h3>
            <PendingStackElementRenderer
              pendingStackElement={pendingStackElement}
              clickedElement={clickedElement}
              setClickedElement={setClickedElement}
              setHoveredElement={setHoveredElement}
              hoverTimeoutRef={hoverTimeoutRef}
              focusedElement={focusedElement}
            />
          </div>
        ) : (
          <div></div>
        )}

        {/* Two Stacks Side-by-Side */}
        <div style={{ display: 'flex', justifyContent:'center', gap: '20px', overflowY: 'scroll', paddingTop: '10px', height:'100%'}}>
          {/* Main Stack */}

          <div
            style={{
              width: '200px',
              border: '2px solid black',
              borderTop: "none",
              display: 'flex',
              flexDirection: 'column-reverse',
              alignItems: 'center',
              padding: '10px',
            }}
          >
            <StackRenderer
              stack={stacks.main}
              pendingStackElement={pendingStackElement}
              clickedElement={clickedElement}
              setClickedElement={setClickedElement}
              setHoveredElement={setHoveredElement}
              hoverTimeoutRef={hoverTimeoutRef}
              focusedElement={focusedElement}
            />
            <h3>Main Stack</h3>
          </div>

          {/* AltStack (no controls, readonly) */}
          <div
            style={{
              width: '200px',
              border: '2px dashed gray',
              display: 'flex',
              borderTop: "none",
              flexDirection: 'column-reverse',
              alignItems: 'center',
              padding: '10px',
            }}
          >
            <StackRenderer
              stack={stacks.alt}
              pendingStackElement={pendingStackElement}
              clickedElement={clickedElement}
              setClickedElement={setClickedElement}
              setHoveredElement={setHoveredElement}
              hoverTimeoutRef={hoverTimeoutRef}
              focusedElement={focusedElement}
            />
            <h3>Alt Stack</h3>
          </div>
      </div>
    </div>

      {/* Right Section */}
      <div
        style={{
          flexBasis: '25%',
          flexShrink: 0,
          flexGrow: 0,
          backgroundColor: '#f0f0f0',
          padding: '20px',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <InspectionPanel
          spendSimulation={spendSimulation}
          stacks={stacks}
          focusedElement={focusedElement}
        />
      </div>
    </div>
  );
};
