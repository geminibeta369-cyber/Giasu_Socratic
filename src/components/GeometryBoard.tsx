import React, { useEffect, useRef, useState } from 'react';
import JXG from 'jsxgraph';
import '../jsxgraph.css';
import { Grid3X3, Move, Maximize, RotateCcw } from 'lucide-react';

interface GeometryBoardProps {
  id: string;
  code: string;
}

const GeometryBoard: React.FC<GeometryBoardProps> = ({ id, code }) => {
  const boardRef = useRef<any>(null);
  const [showAxis, setShowAxis] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    // Clean up existing board if any
    if (boardRef.current) {
      JXG.JSXGraph.freeBoard(boardRef.current);
    }

    try {
      // The code from AI is expected to use 'box' as the ID, 
      // so we need to replace it with our unique ID.
      const sanitizedCode = code.replace(/'box'/g, `'${id}'`).replace(/"box"/g, `"${id}"`);
      
      // Execute the code
      // We wrap it in a function to avoid global scope issues
      const draw = new Function('JXG', sanitizedCode + '; return board;');
      const board = draw(JXG);
      boardRef.current = board;

      // Initial state and extra options
      if (board) {
        board.setAttribute({
          showCopyright: false,
          showNavigation: true,
          pan: { enabled: true, needShift: false },
          zoom: { 
            wheel: true, 
            pinch: true,
            factorX: 1.2, 
            factorY: 1.2 
          },
          browser: { touch: true }
        });
        
        // Ensure all points are fixed by default unless explicitly allowed
        // (This is a safety measure in case AI forgets fixed:true)
        board.on('update', () => {
          board.objectsList.forEach((obj: any) => {
            if (obj.elType === 'point' && obj.getAttribute('fixed') === undefined) {
              obj.setAttribute({ fixed: true });
            }
          });
        });

        updateBoardVisibility(board, showAxis, showGrid);
        board.update();
      }
    } catch (error) {
      console.error("Error rendering JSXGraph:", error);
    }

    return () => {
      // Cleanup on unmount
      if (boardRef.current) {
        JXG.JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }
    };
  }, [id, code]);

  const updateBoardVisibility = (board: any, axis: boolean, grid: boolean) => {
    if (!board) return;
    
    board.suspendUpdate();
    
    // Toggle Axis
    if (board.defaultAxes) {
      if (board.defaultAxes.x) board.defaultAxes.x.setAttribute({ visible: axis });
      if (board.defaultAxes.y) board.defaultAxes.y.setAttribute({ visible: axis });
    }

    // Toggle Grid
    if (board.defaultAxes) {
      if (board.defaultAxes.x && board.defaultAxes.x.grid) board.defaultAxes.x.grid.setAttribute({ visible: grid });
      if (board.defaultAxes.y && board.defaultAxes.y.grid) board.defaultAxes.y.grid.setAttribute({ visible: grid });
    }
    
    board.unsuspendUpdate();
  };

  const toggleAxis = () => {
    const next = !showAxis;
    setShowAxis(next);
    if (boardRef.current) {
      updateBoardVisibility(boardRef.current, next, showGrid);
    }
  };

  const toggleGrid = () => {
    const next = !showGrid;
    setShowGrid(next);
    if (boardRef.current) {
      updateBoardVisibility(boardRef.current, showAxis, next);
    }
  };

  const resetView = () => {
    if (boardRef.current) {
      boardRef.current.setBoundingBox([-5, 5, 5, -5]);
    }
  };

  return (
    <div className="w-full aspect-square max-w-[400px] mx-auto bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden relative group">
      <div id={id} className="w-full h-full jxgbox" />
      
      {/* Controls */}
      <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={toggleAxis}
          className={`p-1.5 rounded-lg border shadow-sm transition-all ${
            showAxis ? 'bg-brand-600 text-white border-brand-700' : 'bg-white text-slate-400 border-slate-200'
          }`}
          title={showAxis ? "Ẩn hệ trục" : "Hiện hệ trục"}
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={toggleGrid}
          className={`p-1.5 rounded-lg border shadow-sm transition-all ${
            showGrid ? 'bg-brand-600 text-white border-brand-700' : 'bg-white text-slate-400 border-slate-200'
          }`}
          title={showGrid ? "Ẩn lưới" : "Hiện lưới"}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={resetView}
          className="p-1.5 rounded-lg border bg-white text-slate-400 border-slate-200 shadow-sm hover:text-brand-600 hover:border-brand-200 transition-all"
          title="Đặt lại góc nhìn"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-400 border border-slate-100 uppercase tracking-widest pointer-events-none">
        JSXGraph Board
      </div>
      
      <div className="absolute bottom-2 left-2 bg-white/60 backdrop-blur-sm px-2 py-1 rounded text-[8px] text-slate-400 pointer-events-none">
        Kéo chuột để di chuyển • Cuộn để phóng to
      </div>
    </div>
  );
};

export default GeometryBoard;
