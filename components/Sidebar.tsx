
import React from 'react';
import { 
  Zap, 
  Settings, 
  Battery, 
  RotateCw, 
  Server, 
  Cpu,
  Factory,
  Cpu as CpuIcon
} from 'lucide-react';
import { ComponentType } from '../types';

interface SidebarProps {
  onDragStart: (e: React.DragEvent, type: ComponentType) => void;
  t: (key: string) => string;
}

const Sidebar: React.FC<SidebarProps> = ({ onDragStart, t }) => {
  const categories = [
    {
      name: 'Power Sources',
      items: [
        { type: ComponentType.TP, icon: <Factory />, desc: 'Main Grid Feed' },
        { type: ComponentType.DGU, icon: <Settings />, desc: 'Emergency Backup' },
        { type: ComponentType.DGU_AVR, icon: <CpuIcon />, desc: 'Gen Auto Trigger' },
      ]
    },
    {
      name: 'Switching',
      items: [
        { type: ComponentType.AVR, icon: <RotateCw />, desc: 'Auto Voltage Reserve' },
        { type: ComponentType.ATS, icon: <RotateCw />, desc: 'Auto Transfer Switch' },
        { type: ComponentType.STS, icon: <Zap />, desc: 'Static Transfer Switch' },
      ]
    },
    {
      name: 'Protection',
      items: [
        { type: ComponentType.UPS, icon: <Battery />, desc: 'Uninterrupted Power' },
      ]
    },
    {
      name: 'Loads',
      items: [
        { type: ComponentType.RACK_SINGLE, icon: <Server />, desc: 'Single-Input Rack' },
        { type: ComponentType.RACK_DUAL, icon: <Cpu />, desc: 'Dual-Input Rack' },
      ]
    }
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-30">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Components</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {categories.map((cat) => (
          <div key={cat.name}>
            <h3 className="text-xs font-medium text-slate-400 mb-2 px-1">{cat.name}</h3>
            <div className="grid grid-cols-1 gap-2">
              {cat.items.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type)}
                  className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-slate-600 group"
                >
                  <div className="p-2 bg-slate-900 rounded-md text-emerald-400 group-hover:scale-110 transition-transform">
                    {React.cloneElement(item.icon as React.ReactElement<any>, { size: 18 })}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{t(item.type)}</div>
                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
