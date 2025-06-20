import React, { useMemo } from 'react';
import { getOPName, StackElement } from './StackElement';
import { OPCodeArgumentCount } from './utils';


interface StackRendererProps {
  stack: number[][];
  pendingStackElement: StackElement | null;
  clickedElement: StackElement | null;
  setClickedElement: (element: StackElement | null) => void;
  setHoveredElement: (element: StackElement | null) => void;
  hoverTimeoutRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  focusedElement: StackElement | null;
}



  // // Whenever the pending stack element changes,
  // // update the number of top stack elements that are used as its arguments
  // // e.g. OP_ADD uses 2
  // useEffect(() => {
  //   if (pendingStackElement && pendingStackElement.type === "PendingOP") {
  //     setNumStackElementsUsedByPendingOP(OPCodeArgumentCount[getOPName(parseInt(pendingStackElement.contentHex, 16))]);
  //   } else {
  //     setNumStackElementsUsedByPendingOP(0);
  //   }
  // }, [pendingStackElement]);


export const StackRenderer: React.FC<StackRendererProps> = ({
  stack,
  pendingStackElement,
  clickedElement,
  setClickedElement,
  setHoveredElement,
  hoverTimeoutRef,
  focusedElement,
}) => {
  const renderStackElement = (el: StackElement, depth: number, isArgToPendingOP: boolean) => {
    return (
      <div
          key={el.renderID}
          onMouseEnter={() => {
              hoverTimeoutRef.current = setTimeout(() => {
                  setHoveredElement(el);
                  }, 500);
          }}
          onMouseLeave={() => {
              if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                  setHoveredElement(null);  
              }
          }}
          onClick={() => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
            if (clickedElement === el) {
              setClickedElement(null);
              return;
            }
            setClickedElement(el);
          }}
          style={{
              width: '100%',
              height: '30px',
              margin: '2px 0',
              backgroundColor: isArgToPendingOP ? "orange" : el.color,
              border: focusedElement === el ? '3px solid rgb(255, 255, 64)' : '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 'bold',
              color: '#000',
              transition: 'border 0.2s',
              cursor: 'pointer',
          }}
          >
        <div style={{
            minWidth: '30px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'HighlightText',
            borderRight: '1px solid HighlightText',
            paddingRight: '5px',
            marginRight: '5px'
        }}>
            {depth < 0 ? "n: " : depth}
        </div>
        <div style={{
            flex: 1,
            textAlign: 'center'
        }}>
            {el.getDisplayString()}
        </div>
        </div>
      );
  };

  // Memoize stack elements to maintain object identity
  const stackElements = useMemo(() => {
    return stack.map((numberArray) => {
      if (numberArray.length === 0) {
        return new StackElement("00", "MainStackElement")
      } else {
        return new StackElement(numberArray.map(byte => byte.toString(16).padStart(2, '0')).join(''), "MainStackElement")
      }
    });
  }, [stack]);

  const renderStack = () => {
    const total = stackElements.length;
    // The maximum number of stack elements to show before we start hiding
    // must be a multiple of 10; otherwise the calculation later may not work correctly
    const stackLengthThreshold = 30 
  
    let depthDisplayOffset = 0;
    const numArgsToPendingOP = pendingStackElement ? OPCodeArgumentCount[getOPName(parseInt(pendingStackElement.contentHex, 16))] : 0;
    if (pendingStackElement && pendingStackElement.type === "PendingOP") {
      const opName = pendingStackElement.getDisplayString();
      if (opName === "OP_PICK" || opName === "OP_ROLL") {
        // when executing OP_PICK or OP_ROLL, the top stack element should not be counted toward the stack depth
        // the second to top element should have a depth 0 instead.
        depthDisplayOffset = 1;
      }
    }

    if (total <= stackLengthThreshold) {
        return stackElements.map((el, index) => {
          let depth = total - 1 - index;
          const isArgToPendingOP = depth < numArgsToPendingOP;
          depth -= depthDisplayOffset;
          return renderStackElement(el, depth, isArgToPendingOP);
        })
    }

    const top = stackElements.slice(total - stackLengthThreshold * 0.7);
    const bottom = stackElements.slice(0, stackLengthThreshold * 0.3);
    const hiddenCount = total - top.length - bottom.length;

    return [
      ...bottom.map((el, index) => {
        let depth = total - 1 - index;
        const isArgToPendingOP = depth < numArgsToPendingOP;
        depth -= depthDisplayOffset;
        return renderStackElement(el, depth, isArgToPendingOP)
      }),
      <div
        key="ellipsis"
        style={{
          width: '100%',
          textAlign: 'center',
          fontSize: '0.9em',
          fontStyle: 'italic',
          margin: '4px 0',
          color: '#888',
        }}
      >
        ... {hiddenCount} hidden stack elements ...
      </div>,
      ...top.map((el, index) => {
        let depth = top.length - 1 - index;
        const isArgToPendingOP = depth < numArgsToPendingOP;
        depth -= depthDisplayOffset;
        return renderStackElement(el, depth, isArgToPendingOP)
      }),
    ];
  };

  return <>{renderStack()}</>;
};
