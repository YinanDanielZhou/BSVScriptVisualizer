import React from 'react';
import { StackElement } from './StackElement';

interface PendingStackElementRendererProps {
  pendingStackElement: StackElement | null;
  clickedPendingIndex: number | null;
  hoveredIndex: number | null;
  setClickedPendingIndex: (index: number | null) => void;
  setHoveredIndex: (index: number | null) => void;
  setHoveredElement: (element: StackElement | null) => void;
  hoverTimeoutRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
}

export const PendingStackElementRenderer: React.FC<PendingStackElementRendererProps> = ({
  pendingStackElement,
  clickedPendingIndex,
  hoveredIndex,
  setClickedPendingIndex,
  setHoveredIndex,
  setHoveredElement,
  hoverTimeoutRef,
}) => {
  if (!pendingStackElement) {
    return <></>;
  }

  return (
    <div
      key={pendingStackElement.renderID}
      onMouseEnter={() => {
        // Only set hover if not clicked
        if (clickedPendingIndex !== pendingStackElement.renderID) {
          hoverTimeoutRef.current = setTimeout(() => {
            setHoveredIndex(pendingStackElement.renderID);
            setHoveredElement(pendingStackElement);
          }, 500);
        }
      }}
      onMouseLeave={() => {
        // Only clear hover if not clicked
        if (clickedPendingIndex !== pendingStackElement.renderID) {
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          setHoveredIndex(null);
          setHoveredElement(null);
        }
      }}
      onClick={() => {
        // Clear any pending hover timeout
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

        if (clickedPendingIndex === pendingStackElement.renderID) {
          // If already clicked, unclick it
          setClickedPendingIndex(null);
          setHoveredIndex(null);
          setHoveredElement(null);
        } else {
          // Click to activate
          setClickedPendingIndex(pendingStackElement.renderID);
          setHoveredIndex(pendingStackElement.renderID);
          setHoveredElement(pendingStackElement);
        }
      }}
      style={{
        width: '200px',
        height: '40px',
        margin: '4px 0',
        backgroundColor: pendingStackElement.color,
        border: (clickedPendingIndex === pendingStackElement.renderID || hoveredIndex === pendingStackElement.renderID) ? '3px solid rgb(255, 255, 64)' : '1px solid #333',
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