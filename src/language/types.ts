/**
 * Types for the Debugging Tools System
 */

export interface DebugCommand {
  name: string;
  description: string;
  execute: (...args: any[]) => void;
}

export interface DebugConsole {
  history: string[];
  commands: Map<string, DebugCommand>;
  executeCommand(command: string, ...args: any[]): void;
  addCommand(command: DebugCommand): void;
  getHistory(): string[];
}

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface MemorySnapshot {
  timestamp: number;
  totalHeapSize: number;
  usedHeapSize: number;
  objectCounts: Map<string, number>;
}

export interface DebugDrawCommand {
  type: 'line' | 'box' | 'sphere' | 'text';
  position: { x: number; y: number; z: number };
  color: { r: number; g: number; b: number; a: number };
  duration: number;
  data: any;
}

export interface DebuggerState {
  isEnabled: boolean;
  isProfiling: boolean;
  isMemoryTracking: boolean;
  isVisualDebugging: boolean;
}

export interface CallStackEntry {
  functionName: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

export interface BreakpointInfo {
  id: string;
  fileName: string;
  lineNumber: number;
  condition?: string;
  isEnabled: boolean;
}

export interface WatchVariable {
  name: string;
  expression: string;
  value: any;
  type: string;
}

export interface LogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  metadata?: Record<string, any>;
}
