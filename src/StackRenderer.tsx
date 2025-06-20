import React, { useState, useEffect } from 'react';
import { StackElement } from './StackElement';
import { OP } from '@bsv/sdk';

interface StackRendererProps {
  stack: number[][];
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  setHoveredElement: (element: StackElement | null) => void;
  hoverTimeoutRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
}



export const StackRenderer: React.FC<StackRendererProps> = ({
  stack,
  hoveredIndex,
  setHoveredIndex,
  setHoveredElement,
  hoverTimeoutRef,
}) => {
  // State to track clicked elements
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  // Clear clicked state when stack changes (element no longer rendered)
  useEffect(() => {
    // Clear clicked state when stack changes
    setClickedIndex(null);
    setHoveredIndex(null);
    setHoveredElement(null);
  }, [stack, setHoveredIndex, setHoveredElement]);
  
  const renderStackElement = (el: StackElement, index: number) => {
    const isClicked = clickedIndex === el.renderID;
    const isHovered = hoveredIndex === el.renderID;
    const isActive = isClicked || isHovered;

    return (
      <div
          key={el.renderID}
          onMouseEnter={() => {
              // Only set hover if not clicked
              if (!isClicked) {
                  hoverTimeoutRef.current = setTimeout(() => {
                  setHoveredIndex(el.renderID);
                  setHoveredElement(el);
                  }, 500);
              }
          }}
          onMouseLeave={() => {
              // Only clear hover if not clicked
              if (!isClicked) {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                  setHoveredIndex(null);
                  setHoveredElement(null);
              }
          }}
          onClick={() => {
              // Clear any pending hover timeout
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

              if (isClicked) {
                  // If already clicked, unclick it
                  setClickedIndex(null);
                  setHoveredIndex(null);
                  setHoveredElement(null);
              } else {
                  // Click to activate
                  setClickedIndex(el.renderID);
                  setHoveredIndex(el.renderID);
                  setHoveredElement(el);
              }
          }}
          style={{
              width: '100%',
              height: '30px',
              margin: '2px 0',
              backgroundColor: el.color,
              border: isActive ? '3px solid rgb(255, 255, 64)' : '1px solid #333',
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
            {index}
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

  const makeStackElement = (numberArray: number[]) => {
    if (numberArray.length === 0) {
        return new StackElement("00", "MainStackElement")
    } else {
        return new StackElement(numberArray.map(byte => byte.toString(16).padStart(2, '0')).join(''), "MainStackElement")
    }
  }

  const renderStack = () => {
    const total = stack.length;
    const stackLengthThreshold = 30 // multiple of 10

    if (total <= stackLengthThreshold) {
        return stack.map((numberArray) => makeStackElement(numberArray)).map((el, index) => renderStackElement(el, total - 2 - index))
    }

    const top = stack.slice(total - stackLengthThreshold * 0.7);
    const bottom = stack.slice(0, stackLengthThreshold * 0.3);
    const hiddenCount = total - top.length - bottom.length;

    return [
      ...bottom.map((numberArray) => makeStackElement(numberArray)).map((el, index) => renderStackElement(el, index)),
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
      ...top.map((numberArray) => makeStackElement(numberArray)).map((el, index) => renderStackElement(el, index)),
    ];
  };

  return <>{renderStack()}</>;
};
