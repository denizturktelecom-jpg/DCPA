
import React from 'react';
import { X, Trash2, AlertCircle, Settings2, Zap, RotateCw } from 'lucide-react';
import { ComponentInstance, Connection } from '../types';

interface ControlPanelProps {
  selectedComponent?: ComponentInstance;
  selectedConnection?: Connection;
  onUpdate: (updated: ComponentInstance | Connection) => void;
  onDelete: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  selectedComponent: comp, 
  selectedConnection: conn, 
  onUpdate, 
  onDelete, 
  onClose, 
  t 
}) => {
  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-40 shadow-2xl animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2 text-slate-400">
          <Settings2 size={18} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">{t('Properties')}</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-md transition-colors">
          <X size={18} className="text-slate-500" />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-8 overflow-y-auto">
        {comp ? (
          <>
            <section className="space-y-4">
              <label className="block">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">{t('Identifier')}</span>
                <input 
                  type="text" 
                  value={comp.label}
                  onChange={(e) => onUpdate({ ...comp, label: e.target.value })}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </label>

              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Status</div>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${
                      comp.state === 'NORMAL' || comp.state === 'RUNNING' ? 'bg-emerald-400' : 
                      comp.state === 'WARNING' || comp.state === 'STARTING' ? 'bg-amber-400' : 
                      comp.state === 'REBOOTING' ? 'bg-blue-400 animate-pulse' :
                      'bg-red-500 animate-pulse'
                   }`} />
                   <span className="text-sm font-medium text-slate-200">
                       {t(comp.state)} 
                       {comp.state === 'REBOOTING' && ` (${Math.round(comp.rebootProgress || 0)}%)`}
                   </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className={comp.isFaulty ? 'text-red-500' : 'text-slate-500'} />
                  <span className="text-sm font-medium">{t('Fault Simulation')}</span>
                </div>
                <button
                  onClick={() => onUpdate({ ...comp, isFaulty: !comp.isFaulty })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${comp.isFaulty ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${comp.isFaulty ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {comp.isAlarmActive !== undefined && (
                <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                    <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">Clear Alarm</span>
                    </div>
                    <button
                        onClick={() => onUpdate({ ...comp, isAlarmActive: false })}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-xs font-bold transition-colors"
                    >
                        RESET
                    </button>
                </div>
              )}
            </section>

            {(comp.capacity !== undefined || comp.load !== undefined) && (
              <section className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Power Metrics')}</h3>
                {comp.capacity !== undefined && (
                  <label className="block">
                    <span className="text-xs text-slate-400">{t('Total Capacity')} (kW)</span>
                    <input 
                      type="number" 
                      value={comp.capacity}
                      onChange={(e) => onUpdate({ ...comp, capacity: Number(e.target.value) })}
                      className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm outline-none"
                    />
                  </label>
                )}
                {comp.load !== undefined && (
                  <label className="block">
                    <span className="text-xs text-slate-400">{t('Static Load')} (kW)</span>
                    <input 
                      type="number" 
                      value={comp.load}
                      onChange={(e) => onUpdate({ ...comp, load: Number(e.target.value) })}
                      className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm outline-none"
                    />
                  </label>
                )}
              </section>
            )}

            {comp.transferDelay !== undefined && (
              <section className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Timing')}</h3>
                <label className="block">
                  <span className="text-xs text-slate-400">
                      {comp.type === 'Diesel Generator' ? 'Startup Delay' : 'Transfer Delay'} (ms)
                  </span>
                  <input 
                    type="number" 
                    step="100"
                    value={comp.transferDelay}
                    onChange={(e) => onUpdate({ ...comp, transferDelay: Number(e.target.value) })}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Note: Downstream racks reboot if dead &gt; 20ms.</span>
                </label>
              </section>
            )}
            
            <section className="space-y-2 pt-4 border-t border-slate-800">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Port Matrix</h3>
               <div className="space-y-1">
                  {comp.ports.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-[11px] p-2 bg-slate-800/30 rounded border border-slate-700/30">
                      <span className={`font-medium ${comp.activeInputId === p.id ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {p.label} ({p.type}) {comp.activeInputId === p.id ? ' [ACTIVE]' : ''}
                      </span>
                      <span className={p.isPowered ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                         {p.isPowered ? 'LIVE' : 'OFF'}
                      </span>
                    </div>
                  ))}
               </div>
            </section>
          </>
        ) : conn ? (
          <>
            <section className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-3 shadow-inner">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${conn.isActive ? 'bg-emerald-500/10' : 'bg-slate-700/30'}`}>
                      <Zap size={20} className={conn.isActive ? 'text-emerald-400' : 'text-slate-500'} fill={conn.isActive ? 'currentColor' : 'none'} />
                    </div>
                    <div>
                      <div className="text-sm font-bold uppercase tracking-tight text-slate-100">
                        {conn.isActive ? t('Live Connection') : t('Idle Connection')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Voltage Flow: {conn.isActive ? '220V AC (Standard)' : '0V (No Potential)'}
                      </div>
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 group hover:border-red-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className={conn.isDamaged ? 'text-red-500' : 'text-slate-500'} />
                  <span className={`text-sm font-medium ${conn.isDamaged ? 'text-red-400' : 'text-slate-300'}`}>
                    {conn.isDamaged ? t('Damage Connection') : t('Repair Connection')}
                  </span>
                </div>
                <button
                  onClick={() => onUpdate({ ...conn, isDamaged: !conn.isDamaged })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${conn.isDamaged ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${conn.isDamaged ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </section>
          </>
        ) : null}
      </div>

      <div className="p-6 border-t border-slate-800 space-y-3 bg-slate-950/50">
        <button 
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all font-semibold text-sm border border-red-500/20 shadow-lg"
        >
          <Trash2 size={16} />
          {comp ? t('Delete Component') : t('Delete Connection')}
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
