
import React from 'react';
import { SimulationState } from '../types';
import { Activity, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface MetricsPanelProps {
  state: SimulationState;
  t: (key: string) => string;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ state, t }) => {
  const activeRacks = state.components.filter(c => 
    (c.type === 'Server Rack (Single PSU)' || c.type === 'Server Rack (Dual PSU)') && 
    c.state === 'NORMAL'
  ).length;

  const totalRacks = state.components.filter(c => 
    (c.type === 'Server Rack (Single PSU)' || c.type === 'Server Rack (Dual PSU)')
  ).length;

  const healthScore = totalRacks === 0 ? 100 : Math.round((activeRacks / totalRacks) * 100);

  return (
    <div className="h-20 bg-slate-900 border-t border-slate-800 px-6 flex items-center gap-12 z-20">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Activity className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('Total Active Load')}</div>
          <div className="text-xl font-mono font-bold text-slate-100">{state.totalLoad.toLocaleString()} <span className="text-xs text-slate-400">kW</span></div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Cpu className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('Operational Racks')}</div>
          <div className="text-xl font-mono font-bold text-slate-100">{activeRacks} / {totalRacks}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('Site Health')}</div>
          <div className={`text-xl font-mono font-bold ${healthScore > 90 ? 'text-emerald-400' : healthScore > 50 ? 'text-amber-400' : 'text-red-500'}`}>
            {healthScore}%
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
        <div className={`w-2 h-2 rounded-full ${state.isGridDown ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">{t('Grid Status')}: {state.isGridDown ? t('CRITICAL') : t('OPTIMAL')}</span>
      </div>
    </div>
  );
};

export default MetricsPanel;
