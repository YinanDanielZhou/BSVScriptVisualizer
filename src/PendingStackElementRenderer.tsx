import React from 'react';
import { StackElement } from './StackElement';

interface PendingStackElementRendererProps {
  pendingStackElement: StackElement;
  clickedElement: StackElement | null;
  setClickedElement: (element: StackElement | null) => void;
  setHoveredElement: (element: StackElement | null) => void;
  hoverTimeoutRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  focusedElement: StackElement | null;
}
export const PendingStackElementRenderer: React.FC<PendingStackElementRendererProps> = ({
  pendingStackElement,
  clickedElement,
  setClickedElement,
  setHoveredElement,
  hoverTimeoutRef,
  focusedElement,
}) => {
  return (
    <div
      key={pendingStackElement.renderID}
      onMouseEnter={() => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredElement(pendingStackElement);
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
        if (clickedElement === pendingStackElement) {
            setClickedElement(null);
            return;
        }
        setClickedElement(pendingStackElement)
      }}
      style={{
        width: '200px',
        height: '40px',
        margin: '4px 0',
        backgroundColor: pendingStackElement.color,
        border: focusedElement === pendingStackElement ? '3px solid rgb(255, 255, 64)' : '1px solid #333',
        textAlign: 'center',
        lineHeight: '40px',
        fontWeight: 'bold',
        color: '#000',
        transition: 'border 0.2s',
        cursor: 'pointer',
      }}
    >
      {pendingStackElement.getDisplayString()}
    </div>
  );
};