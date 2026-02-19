
import { ComponentType, ComponentInstance } from './types';

export const COMPONENT_ARCHETYPES: Record<ComponentType, Partial<ComponentInstance>> = {
  [ComponentType.TP]: {
    ports: [
      { id: 'out-1', type: 'OUTPUT', label: 'L1', isPowered: false }
    ],
    capacity: 2000,
    isOn: true,
  },
  [ComponentType.DGU]: {
    ports: [
      { id: 'in-start', type: 'INPUT', label: 'START', isPowered: false },
      { id: 'in-bypass', type: 'INPUT', label: 'BYPASS', isPowered: false },
      { id: 'out-power', type: 'OUTPUT', label: 'LOAD', isPowered: false }
    ],
    capacity: 2000,
    isOn: false,
    transferDelay: 30000, // 30s startup
    state: 'OFF',
    startCountdown: 0,
  },
  [ComponentType.DGU_AVR]: {
    ports: [
      { id: 'in-1', type: 'INPUT', label: 'Monitor', isPowered: false },
      { id: 'out-1', type: 'OUTPUT', label: 'Trigger', isPowered: false }
    ],
    isOn: true,
    internalTimer: 0,
    state: 'NORMAL',
  },
  [ComponentType.AVR]: {
    ports: [
      { id: 'in-1', type: 'INPUT', label: 'Main', isPowered: false },
      { id: 'in-2', type: 'INPUT', label: 'Backup', isPowered: false },
      { id: 'out-1', type: 'OUTPUT', label: 'Load', isPowered: false }
    ],
    transferDelay: 100, // standard switch
    isOn: true,
    state: 'NORMAL',
  },
  [ComponentType.UPS]: {
    ports: [
      { id: 'in-1', type: 'INPUT', label: 'In', isPowered: false },
      { id: 'out-1', type: 'OUTPUT', label: 'Out', isPowered: false }
    ],
    batteryLevel: 100,
    capacity: 500,
    isOn: true,
    state: 'NORMAL',
  },
  [ComponentType.STS]: {
    ports: [
      { id: 'in-1', type: 'INPUT', label: 'A', isPowered: false },
      { id: 'in-2', type: 'INPUT', label: 'B', isPowered: false },
      { id: 'out-1', type: 'OUTPUT', label: 'Out', isPowered: false }
    ],
    transferDelay: 0, // 0ms default
    isOn: true,
    state: 'NORMAL',
  },
  [ComponentType.ATS]: {
    ports: [
      { id: 'in-1', type: 'INPUT', label: 'A', isPowered: false },
      { id: 'in-2', type: 'INPUT', label: 'B', isPowered: false },
      { id: 'out-1', type: 'OUTPUT', label: 'Out', isPowered: false }
    ],
    transferDelay: 5000, // 5s switch
    isOn: true,
    state: 'NORMAL',
  },
  [ComponentType.RACK_SINGLE]: {
    ports: [
      { id: 'in-1', type: 'INPUT', label: 'PSU1', isPowered: false }
    ],
    load: 5,
    isOn: true,
    state: 'NORMAL',
    rebootProgress: 100,
    isAlarmActive: false,
  },
  [ComponentType.RACK_DUAL]: {
    ports: [
      { id: 'in-1', type: 'INPUT', label: 'PSU1', isPowered: false },
      { id: 'in-2', type: 'INPUT', label: 'PSU2', isPowered: false }
    ],
    load: 5,
    isOn: true,
    state: 'NORMAL',
    rebootProgress: 100,
    isAlarmActive: false,
  },
};
