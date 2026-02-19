
export enum ComponentType {
  TP = 'Transformer Substation',
  DGU = 'Diesel Generator',
  DGU_AVR = 'DGU AVR',
  AVR = 'AVR Switch',
  UPS = 'UPS Unit',
  STS = 'Static Transfer Switch',
  ATS = 'Automatic Transfer Switch',
  RACK_SINGLE = 'Server Rack (Single PSU)',
  RACK_DUAL = 'Server Rack (Dual PSU)',
}

export type PortType = 'INPUT' | 'OUTPUT';

export interface Port {
  id: string;
  type: PortType;
  label: string;
  isPowered: boolean;
}

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  label: string;
  isFaulty: boolean;
  isOn: boolean;
  capacity?: number; // kW
  load?: number; // Current consumption
  batteryLevel?: number; // 0-100 for UPS
  ports: Port[];
  transferDelay?: number; // ms
  internalTimer?: number; // for logic like DGU AVR
  startCountdown?: number; // for DGU start delay
  state: 'NORMAL' | 'WARNING' | 'FAULT' | 'OFF' | 'STARTING' | 'RUNNING' | 'REBOOTING';
  
  // Logic & Status Extensions
  activeInputId?: string | null;
  switchingTimer?: number; // ms spent in switching state
  lastPowerLostAt?: number | null; // Timestamp (ms)
  rebootProgress?: number; // 0-100
  isAlarmActive?: boolean;
}

export interface Connection {
  id: string;
  fromId: string;
  fromPortId: string;
  toId: string;
  toPortId: string;
  isActive: boolean;
  isDamaged?: boolean;
}

export type Language = 'EN' | 'RU' | 'TR';

export interface SimulationState {
  language: Language;
  isGridDown: boolean;
  isGenRunning: boolean;
  totalLoad: number;
  components: ComponentInstance[];
  connections: Connection[];
}
