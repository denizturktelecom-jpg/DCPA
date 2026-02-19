import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Zap, 
  Activity, 
  Trash2, 
  Download,
  Upload,
  Power,
  Globe
} from 'lucide-react';
import { ComponentType, ComponentInstance, Connection, SimulationState, Language } from './types';
import { COMPONENT_ARCHETYPES } from './constants';
import { TRANSLATIONS } from './translations';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import ControlPanel from './components/ControlPanel';
import MetricsPanel from './components/MetricsPanel';

// Simulation step in ms
const SIM_STEP = 20; 
const RACK_INERTIA = 20; // ms

const INITIAL_STATE: SimulationState = {
  language: (localStorage.getItem('ps_lang') as Language) || 'EN',
  isGridDown: false,
  isGenRunning: false,
  totalLoad: 0,
  components: [],
  connections: [],
};

const SEED_DATA: SimulationState = {
  language: (localStorage.getItem('ps_lang') as Language) || 'EN',
  isGridDown: false,
  isGenRunning: false,
  totalLoad: 0,
  components: [
    { ...COMPONENT_ARCHETYPES[ComponentType.TP], id: 'tp1', label: 'Grid Source A', x: 50, y: 50, isFaulty: false, state: 'NORMAL' },
    { ...COMPONENT_ARCHETYPES[ComponentType.TP], id: 'tp2', label: 'Grid Source B', x: 50, y: 250, isFaulty: false, state: 'NORMAL' },
    { ...COMPONENT_ARCHETYPES[ComponentType.DGU_AVR], id: 'dguavr1', label: 'DGU Control', x: 250, y: 500, isFaulty: false, state: 'NORMAL', internalTimer: 0 },
    { ...COMPONENT_ARCHETYPES[ComponentType.DGU], id: 'dgu1', label: 'Diesel Backup', x: 50, y: 500, isFaulty: false, state: 'OFF', startCountdown: 0, isOn: false },
    { ...COMPONENT_ARCHETYPES[ComponentType.AVR], id: 'avr1', label: 'AVR Main/Gen', x: 450, y: 350, isFaulty: false, state: 'NORMAL' },
    { ...COMPONENT_ARCHETYPES[ComponentType.UPS], id: 'ups1', label: 'UPS-A', x: 650, y: 150, isFaulty: false, state: 'NORMAL' },
    { ...COMPONENT_ARCHETYPES[ComponentType.UPS], id: 'ups2', label: 'UPS-B', x: 650, y: 450, isFaulty: false, state: 'NORMAL' },
    { ...COMPONENT_ARCHETYPES[ComponentType.STS], id: 'sts1', label: 'Rack STS', x: 900, y: 300, isFaulty: false, state: 'NORMAL' },
    { ...COMPONENT_ARCHETYPES[ComponentType.RACK_DUAL], id: 'rack1', label: 'Core Switch Rack', x: 1150, y: 300, isFaulty: false, state: 'NORMAL' },
  ] as ComponentInstance[],
  connections: [
    { id: 'c1', fromId: 'tp2', fromPortId: 'out-1', toId: 'avr1', toPortId: 'in-1', isActive: true },
    { id: 'c2', fromId: 'dgu1', fromPortId: 'out-power', toId: 'avr1', toPortId: 'in-2', isActive: false },
    { id: 'c3', fromId: 'tp1', fromPortId: 'out-1', toId: 'ups1', toPortId: 'in-1', isActive: true },
    { id: 'c4', fromId: 'avr1', fromPortId: 'out-1', toId: 'ups2', toPortId: 'in-1', isActive: true },
    { id: 'c5', fromId: 'ups1', fromPortId: 'out-1', toId: 'sts1', toPortId: 'in-1', isActive: true },
    { id: 'c6', fromId: 'ups2', fromPortId: 'out-1', toId: 'sts1', toPortId: 'in-2', isActive: true },
    { id: 'c7', fromId: 'sts1', fromPortId: 'out-1', toId: 'rack1', toPortId: 'in-1', isActive: true },
    { id: 'c8', fromId: 'tp1', fromPortId: 'out-1', toId: 'dguavr1', toPortId: 'in-1', isActive: true },
    { id: 'c9', fromId: 'dguavr1', fromPortId: 'out-1', toId: 'dgu1', toPortId: 'in-start', isActive: false },
    { id: 'c10', fromId: 'tp1', fromPortId: 'out-1', toId: 'dgu1', toPortId: 'in-bypass', isActive: true },
  ],
};

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>(SEED_DATA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [viewTransform, setViewTransform] = useState({ scale: 1, x: 0, y: 0 });

  const t = useCallback((key: string) => {
    const dict = TRANSLATIONS[state.language];
    return dict[key] || key;
  }, [state.language]);

  const updateComponentInternalFlow = (comp: ComponentInstance, nextGlobal: SimulationState) => {
    if (comp.isFaulty) {
      comp.state = 'FAULT';
      comp.ports.forEach(p => { if(p.type === 'OUTPUT') p.isPowered = false; });
      return;
    }

    const inputMap = new Map(comp.ports.filter(p => p.type === 'INPUT').map(p => [p.id, p]));
    const outputPorts = comp.ports.filter(p => p.type === 'OUTPUT');

    switch (comp.type) {
      case ComponentType.TP: {
        const outPort = outputPorts[0];
        if (nextGlobal.isGridDown) {
          if (outPort) outPort.isPowered = false;
          comp.state = 'OFF';
        } else {
          if (outPort) outPort.isPowered = true;
          comp.state = 'NORMAL';
        }
        break;
      }
      case ComponentType.DGU_AVR: {
        const monitor = inputMap.get('in-1');
        const trigger = outputPorts[0];
        if (monitor && !monitor.isPowered) {
          comp.internalTimer = (comp.internalTimer || 0) + SIM_STEP;
          if (comp.internalTimer >= 3000) { // 3s monitoring
            if (trigger) trigger.isPowered = true;
            comp.state = 'RUNNING';
          } else {
            comp.state = 'WARNING';
          }
        } else {
          comp.internalTimer = 0;
          if (trigger) trigger.isPowered = false;
          comp.state = 'NORMAL';
        }
        break;
      }
      case ComponentType.DGU: {
        const startInput = inputMap.get('in-start');
        const bypassInput = inputMap.get('in-bypass');
        const powerOut = outputPorts[0];

        // Generator logic
        if (startInput && startInput.isPowered) {
          if (!comp.isOn) {
            comp.startCountdown = (comp.startCountdown || 0) + SIM_STEP;
            if (comp.startCountdown >= (comp.transferDelay || 30000)) {
              comp.isOn = true;
            }
          }
        } else {
          comp.isOn = false;
          comp.startCountdown = 0;
        }

        // Output and State Priority
        if (bypassInput && bypassInput.isPowered) {
          if (powerOut) powerOut.isPowered = true;
          // Even if generator is starting/running, bypass takes precedence for the main state label unless generator is explicitly needed
          comp.state = 'NORMAL'; 
        } else if (comp.isOn) {
          if (powerOut) powerOut.isPowered = true;
          comp.state = 'RUNNING';
        } else if (comp.startCountdown && comp.startCountdown > 0) {
          if (powerOut) powerOut.isPowered = false;
          comp.state = 'STARTING';
        } else {
          if (powerOut) powerOut.isPowered = false;
          comp.state = 'OFF';
        }
        break;
      }
      case ComponentType.AVR:
      case ComponentType.ATS:
      case ComponentType.STS: {
        const mainIn = inputMap.get('in-1');
        const backIn = inputMap.get('in-2');
        const outPort = outputPorts[0];
        const delay = comp.transferDelay || 0;

        // Switching logic: Main is Priority 1, Backup is Priority 2
        if (mainIn && mainIn.isPowered) {
          if (comp.activeInputId !== 'in-1') {
            comp.switchingTimer = (comp.switchingTimer || 0) + SIM_STEP;
            if (comp.switchingTimer >= delay) {
              comp.activeInputId = 'in-1';
              comp.switchingTimer = 0;
            }
          } else {
            comp.switchingTimer = 0;
          }
        } else if (backIn && backIn.isPowered) {
          if (comp.activeInputId !== 'in-2') {
            comp.switchingTimer = (comp.switchingTimer || 0) + SIM_STEP;
            if (comp.switchingTimer >= delay) {
              comp.activeInputId = 'in-2';
              comp.switchingTimer = 0;
            }
          } else {
            comp.switchingTimer = 0;
          }
        } else {
          comp.activeInputId = null;
          comp.switchingTimer = 0;
        }

        // Output logic based on active input
        const activePort = comp.activeInputId ? inputMap.get(comp.activeInputId) : null;
        if (activePort && activePort.isPowered && comp.switchingTimer === 0) {
          if (outPort) outPort.isPowered = true;
          comp.state = comp.activeInputId === 'in-1' ? 'NORMAL' : 'WARNING';
        } else {
          if (outPort) outPort.isPowered = false;
          comp.state = 'OFF';
        }
        break;
      }
      case ComponentType.UPS: {
        const mainIn = inputMap.get('in-1');
        const outPort = outputPorts[0];
        if (mainIn && mainIn.isPowered) {
          if (outPort) outPort.isPowered = true;
          comp.batteryLevel = Math.min(100, (comp.batteryLevel || 0) + (SIM_STEP/100));
          comp.state = 'NORMAL';
        } else {
          comp.batteryLevel = Math.max(0, (comp.batteryLevel || 0) - (SIM_STEP/500));
          if (comp.batteryLevel > 0) {
            if (outPort) outPort.isPowered = true;
            comp.state = 'WARNING';
          } else {
            if (outPort) outPort.isPowered = false;
            comp.state = 'OFF';
          }
        }
        break;
      }
      case ComponentType.RACK_SINGLE:
      case ComponentType.RACK_DUAL: {
        const powered = comp.ports.some(p => p.type === 'INPUT' && p.isPowered);
        const now = Date.now();

        if (powered) {
          // Power just returned or is stable
          if (comp.lastPowerLostAt !== null) {
            const downtime = now - comp.lastPowerLostAt;
            if (downtime > RACK_INERTIA) {
              comp.isAlarmActive = true;
              comp.state = 'REBOOTING';
              comp.rebootProgress = 0;
            }
            comp.lastPowerLostAt = null;
          }

          if (comp.state === 'REBOOTING') {
            comp.rebootProgress = (comp.rebootProgress || 0) + (SIM_STEP / 50); // 5s reboot approx
            if (comp.rebootProgress >= 100) {
              comp.state = 'NORMAL';
            }
          } else {
            comp.state = 'NORMAL';
          }
        } else {
          // No power
          if (comp.lastPowerLostAt === null) {
            comp.lastPowerLostAt = now;
          }
          comp.state = 'FAULT';
        }
        break;
      }
      default: {
        const hasInput = Array.from(inputMap.values()).some(p => p.isPowered);
        if (hasInput && outputPorts[0]) {
          outputPorts[0].isPowered = true;
          comp.state = 'NORMAL';
        } else {
          comp.state = 'OFF';
        }
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        const next = { ...prev };
        
        const updatedComponents = next.components.map(c => ({
          ...c,
          ports: c.ports.map(p => ({ ...p, isPowered: false }))
        }));

        // Reset power flow but calculate source starts
        updatedComponents.forEach(c => {
          if (c.type === ComponentType.TP) {
            updateComponentInternalFlow(c, next);
          }
        });

        // 5 propagation passes to handle nested switches
        for (let i = 0; i < 5; i++) {
          for (const conn of next.connections) {
            if (conn.isDamaged) {
              conn.isActive = false;
              continue;
            }
            const fromComp = updatedComponents.find(c => c.id === conn.fromId);
            const toComp = updatedComponents.find(c => c.id === conn.toId);
            if (!fromComp || !toComp) continue;

            const fromPort = fromComp.ports.find(p => p.id === conn.fromPortId);
            const toPort = toComp.ports.find(p => p.id === conn.toPortId);
            if (!fromPort || !toPort) continue;

            if (fromPort.isPowered) {
              toPort.isPowered = true;
              conn.isActive = true;
            } else {
              conn.isActive = false;
            }

            updateComponentInternalFlow(toComp, next);
          }
        }

        const total = updatedComponents
          .filter(c => (c.type === ComponentType.RACK_SINGLE || c.type === ComponentType.RACK_DUAL) && c.state === 'NORMAL')
          .reduce((acc, c) => acc + (c.load || 0), 0);

        return { ...next, components: updatedComponents, totalLoad: total };
      });
    }, SIM_STEP);

    return () => clearInterval(timer);
  }, []);

  const addComponent = (type: ComponentType, x: number, y: number) => {
    const archetype = COMPONENT_ARCHETYPES[type];
    if (!archetype) return;

    const newComp: ComponentInstance = {
      ...archetype,
      id: `comp-${Date.now()}`,
      type,
      x: (x - viewTransform.x) / viewTransform.scale,
      y: (y - viewTransform.y) / viewTransform.scale,
      label: `${t(type)} ${state.components.length + 1}`,
      isFaulty: false,
      state: archetype.state || 'OFF',
      isOn: archetype.isOn ?? true,
      ports: (archetype.ports || []).map(p => ({ ...p, isPowered: false })),
      lastPowerLostAt: null,
      isAlarmActive: false,
      rebootProgress: 100,
    } as ComponentInstance;
    setState(prev => ({ ...prev, components: [...prev.components, newComp] }));
  };

  const removeComponent = (id: string) => {
    setState(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== id),
      connections: prev.connections.filter(conn => conn.fromId !== id && conn.toId !== id),
    }));
    setSelectedId(null);
  };

  const removeConnection = (id: string) => {
    setState(prev => ({
      ...prev,
      connections: prev.connections.filter(c => c.id !== id),
    }));
    setSelectedConnectionId(null);
  };

  const addConnection = (fromId: string, fromPortId: string, toId: string, toPortId: string) => {
    const newConn: Connection = {
      id: `conn-${Date.now()}`,
      fromId,
      fromPortId,
      toId,
      toPortId,
      isActive: false,
      isDamaged: false
    };
    setState(prev => ({
      ...prev,
      connections: [...prev.connections, newConn],
    }));
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(state);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'dc-power-topology.json');
    linkElement.click();
  };

  const selectedComp = state.components.find(c => c.id === selectedId);
  const selectedConn = state.connections.find(c => c.id === selectedConnectionId);

  const clearSelection = () => {
    setSelectedId(null);
    setSelectedConnectionId(null);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans select-none">
      <Sidebar 
        onDragStart={(e, type) => {
          e.dataTransfer.setData('componentType', type);
        }} 
        t={t}
      />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="h-14 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span className="font-bold tracking-tight text-lg">PowerSim <span className="text-slate-500 font-medium text-sm">v1.8</span></span>
            </div>
            <div className="h-6 w-[1px] bg-slate-700 mx-2" />
            <button 
              onClick={() => setState(p => ({ ...p, isGridDown: !p.isGridDown }))}
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${state.isGridDown ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
            >
              <Zap className={`w-4 h-4 ${state.isGridDown ? 'fill-current' : ''}`} />
              {state.isGridDown ? t('GRID FAIL ACTIVE') : t('GRID NORMAL')}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => {
                const langs: Language[] = ['EN', 'RU', 'TR'];
                const next = langs[(langs.indexOf(state.language) + 1) % langs.length];
                setState(prev => ({ ...prev, language: next }));
                localStorage.setItem('ps_lang', next);
            }} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 font-bold">
              <Globe className="w-5 h-5" />
              {state.language}
            </button>
            <button onClick={handleExport} className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title={t('Export JSON')}>
              <Download className="w-5 h-5 text-slate-400" />
            </button>
            <label className="p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title={t('Import JSON')}>
              <Upload className="w-5 h-5 text-slate-400" />
              <input 
                type="file" 
                className="hidden" 
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                      try {
                        const imported = JSON.parse(re.target?.result as string);
                        setState({ ...imported, language: state.language });
                      } catch (err) { alert('Invalid topology file'); }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
            <button onClick={() => setState(INITIAL_STATE)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors" title={t('Clear All')}>
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        <Canvas 
          state={state} 
          setState={setState}
          selectedId={selectedId}
          setSelectedId={(id) => { setSelectedId(id); setSelectedConnectionId(null); }}
          selectedConnectionId={selectedConnectionId}
          setSelectedConnectionId={(id) => { setSelectedConnectionId(id); setSelectedId(null); }}
          onDrop={(type, x, y) => addComponent(type, x, y)}
          onConnect={addConnection}
          viewTransform={viewTransform}
          setViewTransform={setViewTransform}
          t={t}
          clearSelection={clearSelection}
        />

        <MetricsPanel state={state} t={t} />
      </div>

      {(selectedComp || selectedConn) && (
        <ControlPanel 
          selectedComponent={selectedComp}
          selectedConnection={selectedConn}
          onUpdate={(updated) => {
            if ('ports' in updated) {
              setState(prev => ({
                ...prev,
                components: prev.components.map(c => c.id === updated.id ? (updated as ComponentInstance) : c)
              }));
            } else {
              setState(prev => ({
                ...prev,
                connections: prev.connections.map(c => c.id === updated.id ? (updated as Connection) : c)
              }));
            }
          }}
          onDelete={() => {
            if (selectedComp) removeComponent(selectedComp.id);
            else if (selectedConn) removeConnection(selectedConn.id);
          }}
          onClose={clearSelection}
          t={t}
        />
      )}
    </div>
  );
};

export default App;
