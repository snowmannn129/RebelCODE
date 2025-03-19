import { DebugConsoleImpl } from "./DebugConsole";
import { PerformanceProfiler } from "./PerformanceProfiler";
import { VisualDebugger } from "./VisualDebugger";
import { DebuggerState, LogEntry } from "./types";

export class DebuggingTools {
  private static instance: DebuggingTools;
  private state: DebuggerState = {
    isEnabled: true,
    isProfiling: false,
    isMemoryTracking: false,
    isVisualDebugging: true
  };

  private console: DebugConsoleImpl;
  private profiler: PerformanceProfiler;
  private visualDebugger: VisualDebugger;
  private logs: LogEntry[] = [];

  private constructor() {
    this.console = new DebugConsoleImpl();
    this.profiler = PerformanceProfiler.getInstance();
    this.visualDebugger = VisualDebugger.getInstance();
    this.registerDefaultCommands();
  }

  public static getInstance(): DebuggingTools {
    if (!DebuggingTools.instance) {
      DebuggingTools.instance = new DebuggingTools();
    }
    return DebuggingTools.instance;
  }

  private registerDefaultCommands(): void {
    this.console.addCommand({
      name: "toggleProfiling",
      description: "Toggles performance profiling on/off",
      execute: () => {
        this.state.isProfiling = !this.state.isProfiling;
        console.log(`Profiling ${this.state.isProfiling ? "enabled" : "disabled"}`);
      }
    });

    this.console.addCommand({
      name: "toggleVisualDebug",
      description: "Toggles visual debugging on/off",
      execute: () => {
        this.state.isVisualDebugging = !this.state.isVisualDebugging;
        if (this.state.isVisualDebugging) {
          this.visualDebugger.enable();
        } else {
          this.visualDebugger.disable();
        }
        console.log(`Visual debugging ${this.state.isVisualDebugging ? "enabled" : "disabled"}`);
      }
    });

    this.console.addCommand({
      name: "showPerformance",
      description: "Shows performance profiling report",
      execute: () => {
        console.log(this.profiler.generateReport());
      }
    });
  }

  public log(level: LogEntry["level"], message: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      metadata
    };

    this.logs.push(entry);
    const prefix = `[${new Date(entry.timestamp).toISOString()}] [${level.toUpperCase()}]`;
    console[level](`${prefix} ${message}`);
  }

  public getLogs(level?: LogEntry["level"]): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public getState(): DebuggerState {
    return { ...this.state };
  }

  public enable(): void {
    this.state.isEnabled = true;
    if (this.state.isVisualDebugging) {
      this.visualDebugger.enable();
    }
  }

  public disable(): void {
    this.state.isEnabled = false;
    this.visualDebugger.disable();
  }

  public update(deltaTime: number): void {
    if (!this.state.isEnabled) return;

    if (this.state.isVisualDebugging) {
      this.visualDebugger.update(deltaTime);
    }
  }

  // Convenience methods for accessing sub-systems
  public get debugConsole(): DebugConsoleImpl {
    return this.console;
  }

  public get performanceProfiler(): PerformanceProfiler {
    return this.profiler;
  }

  public get debugVisualizer(): VisualDebugger {
    return this.visualDebugger;
  }
}
