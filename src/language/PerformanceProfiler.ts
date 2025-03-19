import { PerformanceMetric } from "./types";

export class PerformanceProfiler {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private activeMetrics: Map<string, PerformanceMetric> = new Map();
  private static instance: PerformanceProfiler;

  private constructor() {}

  public static getInstance(): PerformanceProfiler {
    if (!PerformanceProfiler.instance) {
      PerformanceProfiler.instance = new PerformanceProfiler();
    }
    return PerformanceProfiler.instance;
  }

  public startMetric(name: string, metadata?: Record<string, any>): void {
    if (this.activeMetrics.has(name)) {
      console.warn(`Metric ${name} is already being tracked`);
      return;
    }

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.activeMetrics.set(name, metric);
  }

  public endMetric(name: string): void {
    const metric = this.activeMetrics.get(name);
    if (!metric) {
      console.warn(`No active metric found with name: ${name}`);
      return;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);
    this.activeMetrics.delete(name);
  }

  public getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    return Array.from(this.metrics.values()).flat();
  }

  public getAverageMetric(name: string): number {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return 0;
    }

    const totalDuration = metrics.reduce((sum, metric) => {
      return sum + (metric.duration || 0);
    }, 0);

    return totalDuration / metrics.length;
  }

  public clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  public getActiveMetrics(): Map<string, PerformanceMetric> {
    return new Map(this.activeMetrics);
  }

  public generateReport(): string {
    let report = "Performance Profiling Report\n";
    report += "==========================\n\n";

    for (const [name, metrics] of this.metrics.entries()) {
      const avgDuration = this.getAverageMetric(name);
      const count = metrics.length;

      report += `${name}:\n`;
      report += `  Count: ${count}\n`;
      report += `  Average Duration: ${avgDuration.toFixed(2)}ms\n`;
      report += `  Total Duration: ${(avgDuration * count).toFixed(2)}ms\n\n`;
    }

    return report;
  }
}
