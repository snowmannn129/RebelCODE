import { DebugDrawCommand } from "./types";

export class VisualDebugger {
  private static instance: VisualDebugger;
  private drawCommands: DebugDrawCommand[] = [];
  private isEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): VisualDebugger {
    if (!VisualDebugger.instance) {
      VisualDebugger.instance = new VisualDebugger();
    }
    return VisualDebugger.instance;
  }

  public drawLine(
    start: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number },
    color: { r: number; g: number; b: number; a: number },
    duration: number = 0
  ): void {
    if (!this.isEnabled) return;

    this.drawCommands.push({
      type: "line",
      position: start,
      color,
      duration,
      data: { end }
    });
  }

  public drawBox(
    position: { x: number; y: number; z: number },
    size: { width: number; height: number; depth: number },
    color: { r: number; g: number; b: number; a: number },
    duration: number = 0
  ): void {
    if (!this.isEnabled) return;

    this.drawCommands.push({
      type: "box",
      position,
      color,
      duration,
      data: { size }
    });
  }

  public drawSphere(
    position: { x: number; y: number; z: number },
    radius: number,
    color: { r: number; g: number; b: number; a: number },
    duration: number = 0
  ): void {
    if (!this.isEnabled) return;

    this.drawCommands.push({
      type: "sphere",
      position,
      color,
      duration,
      data: { radius }
    });
  }

  public drawText(
    position: { x: number; y: number; z: number },
    text: string,
    color: { r: number; g: number; b: number; a: number },
    duration: number = 0
  ): void {
    if (!this.isEnabled) return;

    this.drawCommands.push({
      type: "text",
      position,
      color,
      duration,
      data: { text }
    });
  }

  public update(deltaTime: number): void {
    if (!this.isEnabled) return;

    // Remove expired commands
    this.drawCommands = this.drawCommands.filter(cmd => {
      if (cmd.duration <= 0) return true;
      cmd.duration -= deltaTime;
      return cmd.duration > 0;
    });
  }

  public clear(): void {
    this.drawCommands = [];
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
    this.clear();
  }

  public getDrawCommands(): DebugDrawCommand[] {
    return [...this.drawCommands];
  }

  public isDebugEnabled(): boolean {
    return this.isEnabled;
  }
}
