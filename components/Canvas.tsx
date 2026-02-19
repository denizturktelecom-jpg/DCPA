import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ComponentInstance, Connection, SimulationState, ComponentType, Port } from '../types';
import { AlertTriangle, Trash2, RotateCw, AlertCircle } from 'lucide-react';

interface CanvasProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedConnectionId: string | null;
  setSelectedConnectionId: (id: string | null) => void;
  onDrop: (type: ComponentType, x: number, y: number) => void;
  onConnect: (fromId: string, fromPortId: string, toId: string, toPortId: string) => void;
  viewTransform: { scale: number; x: number; y: number };
  setViewTransform: React.Dispatch<React.SetStateAction<{ scale: number; x: number; y: number }>>;
  t: (key: string) => string;
  clearSelection: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  state, 
  setState, 
  selectedId, 
  setSelectedId, 
  selectedConnectionId,
  setSelectedConnectionId,
  onDrop, 
  onConnect,
  viewTransform,
  setViewTransform,
  t,
  clearSelection
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connecting, setConnecting] = useState<{ id: string; portId: string; type: 'INPUT' | 'OUTPUT' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [hoveredCompId, setHoveredCompId] = useState<string | null>(null);
  const [hoveredConnId, setHoveredConnId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, connId: string } | null>(null);

  const mousedownPos = useRef({ x: 0, y: 0 });

  const getCanvasMousePos = (e: React.MouseEvent | React.TouchEvent | React.DragEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
    const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as any).clientY;
    return {
      x: (clientX - rect.left - viewTransform.x) / viewTransform.scale,
      y: (clientY - rect.top - viewTransform.y) / viewTransform.scale
    };
  };

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent, comp?: ComponentInstance) => {
    const pos = getCanvasMousePos(e);
    mousedownPos.current = pos;
    setHasDragged(false);

    if (comp) {
      e.stopPropagation();
      setDraggingCompId(comp.id);
      setDragOffset({
        x: pos.x - comp.x,
        y: pos.y - comp.y
      });
    }
  };

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasMousePos(e);
    setMousePos(pos);

    if (draggingCompId) {
      const dist = Math.sqrt(Math.pow(pos.x - mousedownPos.current.x, 2) + Math.pow(pos.y - mousedownPos.current.y, 2));
      if (dist > 8) { 
        setHasDragged(true);
        setState(prev => ({
          ...prev,
          components: prev.components.map(c => 
            c.id === draggingCompId 
              ? { ...c, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
              : c
          )
        }));
      }
    }
  };

  const onMouseUp = (e: React.MouseEvent | React.TouchEvent, comp?: ComponentInstance) => {
    if (!hasDragged) {
      if (comp) {
        e.stopPropagation(); 
        setSelectedId(comp.id);
      } else {
        if (e.target === containerRef.current || (e.target as any).tagName === 'svg') {
           clearSelection();
           setConnecting(null);
           setContextMenu(null);
        }
      }
    }
    setDraggingCompId(null);
    setHasDragged(false);
  };

  const handlePortClick = (e: React.MouseEvent | React.TouchEvent, componentId: string, port: Port) => {
    e.stopPropagation();
    if (!connecting) {
      setConnecting({ id: componentId, portId: port.id, type: port.type });
    } else {
      if (connecting.type !== port.type && connecting.id !== componentId) {
        const from = connecting.type === 'OUTPUT' ? connecting : { id: componentId, portId: port.id };
        const to = connecting.type === 'INPUT' ? connecting : { id: componentId, portId: port.id };
        
        onConnect(from.id, from.portId, to.id, to.portId);
      }
      setConnecting(null);
    }
  };

  const getPortPosition = (compId: string, portId: string) => {
    const comp = state.components.find(c => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    
    const portIndex = comp.ports.findIndex(p => p.id === portId);
    if (portIndex === -1) return { x: comp.x, y: comp.y };

    const portCount = comp.ports.length;
    const isOutput = comp.ports[portIndex].type === 'OUTPUT';
    
    return {
      x: comp.x + (isOutput ? 160 : 0),
      y: comp.y + (portIndex + 1) * (140 / (portCount + 1)), 
    };
  };

  return (
    <div 
      ref={containerRef}
      className={`flex-1 relative bg-slate-900 grid-bg overflow-hidden ${draggingCompId ? 'cursor-grabbing' : 'cursor-crosshair'}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
          e.preventDefault();
          const clientRect = containerRef.current?.getBoundingClientRect();
          if (!clientRect) return;
          const x = (e.clientX - clientRect.left - viewTransform.x) / viewTransform.scale;
          const y = (e.clientY - clientRect.top - viewTransform.y) / viewTransform.scale;
          const typeStr = e.dataTransfer.getData('componentType');
          if (typeStr) onDrop(typeStr as ComponentType, x, y);
      }}
      onMouseMove={onMouseMove}
      onMouseUp={(e) => onMouseUp(e)}
      onTouchMove={onMouseMove}
      onTouchEnd={(e) => onMouseUp(e)}
      onClick={() => setContextMenu(null)}
    >
      <div 
        style={{ 
          transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
          transformOrigin: '0 0'
        }}
      >
        <svg className="absolute inset-0 pointer-events-none w-[5000px] h-[5000px]">
          {state.connections.map(conn => {
            const start = getPortPosition(conn.fromId, conn.fromPortId);
            const end = getPortPosition(conn.toId, conn.toPortId);
            const midX = (start.x + end.x) / 2;
            const isHovered = hoveredConnId === conn.id;
            const isSelected = selectedConnectionId === conn.id;
            
            return (
              <g key={conn.id} className="pointer-events-auto">
                <path
                  d={`M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`}
                  stroke="transparent"
                  strokeWidth="20"
                  fill="none"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredConnId(conn.id)}
                  onMouseLeave={() => setHoveredConnId(null)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, connId: conn.id });
                    setSelectedConnectionId(conn.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!hasDragged) setSelectedConnectionId(conn.id);
                  }}
                />
                
                {isSelected && (
                  <path
                    d={`M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`}
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeOpacity="0.3"
                    fill="none"
                    style={{ filter: 'blur(3px)' }}
                  />
                )}

                <path
                  d={`M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`}
                  stroke={conn.isDamaged ? '#ef4444' : (isSelected ? '#3b82f6' : (conn.isActive ? '#10b981' : '#334155'))}
                  strokeWidth={isHovered || isSelected ? "5" : "3"}
                  strokeDasharray={conn.isDamaged ? "6,4" : "none"}
                  fill="none"
                  className={conn.isActive && !conn.isDamaged ? 'animate-flow' : ''}
                  style={{ transition: 'stroke-width 0.2s, stroke 0.2s' }}
                />
                
                {conn.isDamaged && (
                   <foreignObject x={midX - 12} y={(start.y + end.y)/2 - 12} width="24" height="24">
                     <AlertTriangle className="text-red-500 w-6 h-6 drop-shadow-lg animate-bounce" />
                   </foreignObject>
                )}
              </g>
            );
          })}
          
          {connecting && (
            <path
              d={`M ${getPortPosition(connecting.id, connecting.portId).x} ${getPortPosition(connecting.id, connecting.portId).y} L ${mousePos.x} ${mousePos.y}`}
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
            />
          )}
        </svg>

        {state.components.map(comp => {
          const isSelected = selectedId === comp.id;
          const isDragging = draggingCompId === comp.id;
          const isHovered = hoveredCompId === comp.id;
          
          // Labels for active states
          let statusBadge = null;
          if (comp.type === ComponentType.AVR || comp.type === ComponentType.ATS || comp.type === ComponentType.STS) {
             if (comp.activeInputId === 'in-1') statusBadge = <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-[70]">{t('MAIN ACTIVE')}</div>;
             else if (comp.activeInputId === 'in-2') statusBadge = <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-[70]">{t('RESERVE ACTIVE')}</div>;
          } else if (comp.type === ComponentType.DGU) {
             const bypass = comp.ports.find(p => p.id === 'in-bypass')?.isPowered;
             if (bypass) statusBadge = <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-[70]">{t('BYPASS ACTIVE')}</div>;
             else if (comp.isOn) statusBadge = <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-[70]">{t('GENERATOR ACTIVE')}</div>;
          }
          
          return (
            <div
              key={comp.id}
              onMouseDown={(e) => onMouseDown(e, comp)}
              onTouchStart={(e) => onMouseDown(e, comp)}
              onMouseUp={(e) => onMouseUp(e, comp)}
              onTouchEnd={(e) => onMouseUp(e, comp)}
              onMouseEnter={() => setHoveredCompId(comp.id)}
              onMouseLeave={() => setHoveredCompId(null)}
              style={{ left: comp.x, top: comp.y }}
              className={`absolute w-40 min-h-[140px] p-3 rounded-xl border-2 transition-all bg-slate-800 shadow-2xl ${
                isSelected ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-blue-500/10 scale-[1.02]' : 'border-slate-700'
              } ${isDragging ? 'opacity-60 scale-105 z-[60] cursor-grabbing shadow-none border-dashed' : 'z-50'} 
              ${comp.state === 'FAULT' ? 'animate-pulse' : ''}`}
            >
              {statusBadge}
              
              {isDragging && (
                 <div className="absolute -bottom-7 left-0 right-0 text-center text-[10px] font-bold text-blue-400 uppercase tracking-widest animate-pulse">DRAGGING</div>
              )}
              
              <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                <div className={`w-2 h-2 rounded-full ${
                  comp.state === 'NORMAL' || comp.state === 'RUNNING' ? 'bg-emerald-400' : 
                  comp.state === 'WARNING' || comp.state === 'STARTING' ? 'bg-amber-400' : 
                  comp.state === 'REBOOTING' ? 'bg-blue-400' :
                  comp.state === 'FAULT' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-slate-600'
                }`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{t(comp.type)}</span>
                {comp.isAlarmActive && (
                  <AlertCircle size={14} className="text-red-500 ml-auto animate-pulse" />
                )}
              </div>

              <div className="text-xs font-medium text-slate-100 mb-1 truncate">{comp.label}</div>
              <div className="text-[10px] text-slate-500 font-mono italic">
                  {t(comp.state.charAt(0).toUpperCase() + comp.state.slice(1).toLowerCase())}
                  {comp.state === 'REBOOTING' && ` (${Math.round(comp.rebootProgress || 0)}%)`}
              </div>
              
              <div className="space-y-1 mt-2">
                {comp.capacity && <div className="text-[10px] text-slate-500">Cap: {comp.capacity}kW</div>}
                {comp.batteryLevel !== undefined && (
                  <div className="w-full h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${comp.batteryLevel > 20 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                      style={{ width: `${comp.batteryLevel}%` }} 
                    />
                  </div>
                )}
                {comp.startCountdown !== undefined && comp.startCountdown > 0 && comp.state === 'STARTING' && (
                   <div className="w-full h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-blue-500 animate-pulse" style={{ width: `${(comp.startCountdown/(comp.transferDelay || 30000))*100}%` }} />
                   </div>
                )}
                {comp.switchingTimer !== undefined && comp.switchingTimer > 0 && (
                   <div className="w-full h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${(comp.switchingTimer/(comp.transferDelay || 1))*100}%` }} />
                   </div>
                )}
              </div>

              {(isHovered || connecting || isSelected) && comp.ports.map((port, idx) => {
                const isThisPortConnecting = connecting?.id === comp.id && connecting?.portId === port.id;
                const isActiveSwitchInput = comp.activeInputId === port.id;
                
                return (
                  <div
                    key={port.id}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => handlePortClick(e, comp.id, port)}
                    className={`absolute w-4 h-4 rounded-full border-2 cursor-pointer transition-all z-[100] ${
                      isThisPortConnecting ? 'bg-amber-400 border-white ring-4 ring-amber-400/30' : 
                      isActiveSwitchInput ? 'bg-emerald-500 border-white ring-2 ring-emerald-500/50 scale-125' :
                      port.isPowered ? 'bg-emerald-500 border-emerald-300' : 'bg-slate-900 border-slate-600 hover:border-slate-400'
                    } ${port.type === 'INPUT' ? '-left-2' : '-right-2'}`}
                    style={{ 
                      top: `${(idx + 1) * (100 / (comp.ports.length + 1))}%`, 
                      transform: 'translateY(-50%)',
                      boxShadow: isThisPortConnecting ? '0 0 12px rgba(251, 191, 36, 0.8)' : (isActiveSwitchInput ? '0 0 8px #10b981' : 'none')
                    }}
                    title={`${port.label} (${port.type}) ${port.isPowered ? '(POWERED)' : ''}`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <div 
          className="fixed bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-2 z-[200] text-sm font-medium animate-in fade-in zoom-in duration-150"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="w-full px-4 py-2 hover:bg-slate-800 text-left text-slate-300 flex items-center gap-2"
            onClick={() => {
              const target = state.connections.find(c => c.id === contextMenu.connId);
              if (target) {
                setState(prev => ({
                  ...prev,
                  connections: prev.connections.map(c => c.id === target.id ? { ...c, isDamaged: !c.isDamaged } : c)
                }));
              }
              setContextMenu(null);
            }}
          >
            <AlertTriangle size={14} className="text-amber-500" />
            {state.connections.find(c => c.id === contextMenu.connId)?.isDamaged ? t('Repair Connection') : t('Damage Connection')}
          </button>
          <button 
            className="w-full px-4 py-2 hover:bg-red-500/20 text-left text-red-500 flex items-center gap-2"
            onClick={() => {
              setState(prev => ({
                ...prev,
                connections: prev.connections.filter(c => c.id !== contextMenu.connId)
              }));
              setContextMenu(null);
            }}
          >
            <Trash2 size={14} />
            {t('Delete Connection')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Canvas;
