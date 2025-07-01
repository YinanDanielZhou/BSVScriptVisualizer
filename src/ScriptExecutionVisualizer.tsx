import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { StackElement } from './StackElement';
import { StackRenderer } from './StackRenderer';
import { PendingStackElementRenderer } from './PendingStackElementRenderer';
import { ScriptsInputPanel } from './ScriptsInputPanel';
import { InspectionPanel } from './InspectionPanel';
import { LockingScript, Script, Spend, UnlockingScript } from '@bsv/sdk';
import { minBytesNeededToPushDataOfLength } from './utils';

// Number of steps to advance when the "Advance many Steps" button is clicked
// must be a number greater than 0
const multipleStepCount : number = 10;

export const ScriptExecutionVisualizer: React.FC = () => {
  const [spendSimulation, setSpendSimulation] = useState<Spend | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [simulationStepsTaken, setSimulationStepsTaken] = useState<number>(0);

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
    setIsSimulationRunning(true);
    setSimulationStepsTaken(0);
  }

  const handleQuitSimulation = () => {
    setSpendSimulation(null);
    setIsSimulationRunning(false);
    setSimulationStepsTaken(0);
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
  const advanceSimulation = (spendSimulation: Spend, scriptRange: { start: number; end: number }, isSimulationCompleted: { status: boolean }) => {

    try {
      let stepSuccessful = spendSimulation.step();
      if (!stepSuccessful) {
        console.log("Step failed");
        // a failed step implies the simulation is over
        isSimulationCompleted.status = true;
        return;
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
        scriptRange.start = 0;
        scriptRange.end = 0;
      } else {
        // the simulation is done
        isSimulationCompleted.status = true;
        return;
      }
    }
    
    const nextOperation = currentScript.chunks[currentProgramCounter]
    if (nextOperation.data) {
      scriptRange.start = scriptRange.end;
      scriptRange.end = scriptRange.end + minBytesNeededToPushDataOfLength(nextOperation.data.length) * 2; // each byte is 2 characters long in hex string
    } else {
      scriptRange.start = scriptRange.end;
      scriptRange.end = scriptRange.end + 2;  // every OP code that does not push data is 2 characters long in hex string (1 byte)
    }
    return;
  }

  const handleAdvanceOneStep = useCallback(() => {
    if (spendSimulation === null) return;
    let currentHighlightRange = {...scriptHighlightRange};
    let isSimulationOver = { status: false };

    advanceSimulation(spendSimulation, currentHighlightRange, isSimulationOver);

    // Do rerendering
    setSimulationStepsTaken(simulationStepsTaken + 1);
    if (isSimulationOver.status) {
      setIsSimulationRunning(false);
    }
    setStacks({
      main: [...spendSimulation.stack],
      alt: [...spendSimulation.altStack],
      if: [...spendSimulation.ifStack]
    });
    setScriptHighlightRange(currentHighlightRange);
  }, [spendSimulation, scriptHighlightRange, simulationStepsTaken]);

  const handleAdvanceManySteps = useCallback((stepsToTake: number) => {
    if (spendSimulation === null) return;
    if (stepsToTake <= 0) return;

    let currentHighlightRange = {...scriptHighlightRange};
    let isSimulationOver = { status: false };
    let stepsTaken;
    for (stepsTaken = 0; stepsTaken < stepsToTake; stepsTaken++) {
      advanceSimulation(spendSimulation, currentHighlightRange, isSimulationOver);
      if (isSimulationOver.status) {
        break;
      }
    }
    // Do rerendering
    setSimulationStepsTaken(simulationStepsTaken + stepsTaken);
    if (isSimulationOver.status) { setIsSimulationRunning(false); }
    setStacks({
      main: [...spendSimulation.stack],
      alt: [...spendSimulation.altStack],
      if: [...spendSimulation.ifStack]
    });
    setScriptHighlightRange(currentHighlightRange);
  }, [spendSimulation, scriptHighlightRange, simulationStepsTaken]);

  const handleAdvanceToNextComputation = useCallback(() => {
    if (spendSimulation === null) return;

    let currentPendingElement = getPendingStackElementHelper();
    let isScriptExecuting;
    let currentHighlightRange = {...scriptHighlightRange};
    let isSimulationOver = { status: false };
    let stepsTaken = 0;
    do {
      advanceSimulation(spendSimulation, currentHighlightRange, isSimulationOver);
      stepsTaken++;
      if (isSimulationOver.status) { break; }

      isScriptExecuting = !spendSimulation.ifStack.includes(false);
      if (isScriptExecuting) {
        // update the pending element only if the script is within a true IF branch
        currentPendingElement = getPendingStackElementHelper();
      }
    } while (!isScriptExecuting || (currentPendingElement && !currentPendingElement.triggersComputation()))

    // Do rerendering
    setSimulationStepsTaken(simulationStepsTaken + stepsTaken);
    if (isSimulationOver.status) { setIsSimulationRunning(false); }
    setStacks({
      main: [...spendSimulation.stack],
      alt: [...spendSimulation.altStack],
      if: [...spendSimulation.ifStack]
    });
    setScriptHighlightRange(currentHighlightRange);
  }, [spendSimulation, scriptHighlightRange, simulationStepsTaken]);

  const handleRevertOneStep = useCallback(() => {
    if (spendSimulation === null) return;
    if (simulationStepsTaken <= 0) return;

    const newSpendSimulation = new Spend({
      sourceTXID: "mockTxID",
      sourceOutputIndex: 0,
      sourceSatoshis: 0,
      lockingScript: Script.fromHex(spendSimulation.lockingScript.toHex()) as LockingScript,
      transactionVersion: 0,
      otherInputs: [],
      outputs: [],
      unlockingScript: Script.fromHex(spendSimulation.unlockingScript.toHex()) as UnlockingScript,
      inputSequence: 0,
      inputIndex: 0,
      lockTime: 0
    })

    let stepsToTake = simulationStepsTaken - 1;
    let currentHighlightRange;
    const firstOperation = newSpendSimulation.unlockingScript.chunks[0]
    if (firstOperation.data) {
      currentHighlightRange = {start: 0, end: minBytesNeededToPushDataOfLength(firstOperation.data.length) * 2}; // each byte is 2 characters long in hex string
    } else {
      currentHighlightRange = {start: 0, end: 2};  // every OP code that does not push data is 2 characters long in hex string (1 byte)
    }
    let isSimulationOver = { status: false };
    let stepsTaken;
    for (stepsTaken = 0; stepsTaken < stepsToTake; stepsTaken++) {
      advanceSimulation(newSpendSimulation, currentHighlightRange, isSimulationOver);
      if (isSimulationOver.status) {
        break;
      }
    }

    // Do rerendering
    setSpendSimulation(newSpendSimulation);
    setSimulationStepsTaken(stepsTaken);
    setIsSimulationRunning(!isSimulationOver.status);
    setStacks({
      main: [...newSpendSimulation.stack],
      alt: [...newSpendSimulation.altStack],
      if: [...newSpendSimulation.ifStack]
    });
    setScriptHighlightRange(currentHighlightRange);
  }, [spendSimulation, simulationStepsTaken]);

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
          <button onClick={handleAdvanceOneStep} style={{ marginRight: '10px' }} disabled={!isSimulationRunning}>Advance 1 Step</button>
          <button onClick={() => handleAdvanceManySteps(multipleStepCount)} style={{ marginRight: '10px' }} disabled={!isSimulationRunning}>Advance {multipleStepCount} Steps</button>
          <button onClick={handleAdvanceToNextComputation} style={{ marginRight: '10px' }} disabled={!isSimulationRunning}>Advance to the Next Computation</button>
          <button onClick={handleRevertOneStep} style={{ marginRight: '10px' }} >Revert 1 Step</button>
          <button onClick={handleResetSimulation}>Reset Simulation</button>
        </div>

        <div style={{height: '10px'}}>
          steps taken: {simulationStepsTaken}
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

          {/* AltStack */}
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
