import { Blueprint, BlueprintNode } from './BlueprintTypes';
import { BlueprintExecutionEngine } from './BlueprintExecutionEngine';

interface NodeExecutionMetrics {
    executionCount: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    lastExecutionTime: number;
    cacheHits: number;
    cacheMisses: number;
    errorCount: number;
    lastError?: Error;
}

interface BlueprintMetrics {
    totalExecutionTime: number;
    frameCount: number;
    averageFrameTime: number;
    peakFrameTime: number;
    nodeMetrics: Map<string, NodeExecutionMetrics>;
    eventQueueLength: number;
    cacheSize: number;
}

export class BlueprintDebugger {
    private static instance: BlueprintDebugger;
    private executionEngine: BlueprintExecutionEngine;
    private metrics: Map<string, BlueprintMetrics> = new Map();
    private isRecording: boolean = false;
    private executionTrace: Array<{
        timestamp: number;
        blueprintId: string;
        nodeId: string;
        action: string;
        data?: any;
    }> = [];

    private constructor() {
        this.executionEngine = BlueprintExecutionEngine.getInstance();
        this.setupEventListeners();
    }

    public static getInstance(): BlueprintDebugger {
        if (!BlueprintDebugger.instance) {
            BlueprintDebugger.instance = new BlueprintDebugger();
        }
        return BlueprintDebugger.instance;
    }

    private setupEventListeners(): void {
        this.executionEngine.on('nodeExecuted', ({ blueprintId, nodeId, result }) => {
            this.recordNodeExecution(blueprintId, nodeId, result);
        });

        this.executionEngine.on('nodeError', ({ blueprintId, nodeId, error }) => {
            this.recordNodeError(blueprintId, nodeId, error);
        });

        this.executionEngine.on('blueprintStarted', (blueprintId) => {
            this.initializeMetrics(blueprintId);
        });
    }

    private initializeMetrics(blueprintId: string): void {
        this.metrics.set(blueprintId, {
            totalExecutionTime: 0,
            frameCount: 0,
            averageFrameTime: 0,
            peakFrameTime: 0,
            nodeMetrics: new Map(),
            eventQueueLength: 0,
            cacheSize: 0
        });
    }

    private recordNodeExecution(blueprintId: string, nodeId: string, result: any): void {
        const metrics = this.metrics.get(blueprintId);
        if (!metrics) return;

        const nodeMetrics = metrics.nodeMetrics.get(nodeId) || {
            executionCount: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0,
            lastExecutionTime: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errorCount: 0
        };

        const executionTime = performance.now();
        nodeMetrics.executionCount++;
        nodeMetrics.lastExecutionTime = executionTime;
        nodeMetrics.totalExecutionTime += executionTime;
        nodeMetrics.averageExecutionTime = nodeMetrics.totalExecutionTime / nodeMetrics.executionCount;

        metrics.nodeMetrics.set(nodeId, nodeMetrics);

        if (this.isRecording) {
            this.executionTrace.push({
                timestamp: Date.now(),
                blueprintId,
                nodeId,
                action: 'execute',
                data: { executionTime, result }
            });
        }
    }

    private recordNodeError(blueprintId: string, nodeId: string, error: Error): void {
        const metrics = this.metrics.get(blueprintId);
        if (!metrics) return;

        const nodeMetrics = metrics.nodeMetrics.get(nodeId) || {
            executionCount: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0,
            lastExecutionTime: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errorCount: 0
        };

        nodeMetrics.errorCount++;
        nodeMetrics.lastError = error;

        metrics.nodeMetrics.set(nodeId, nodeMetrics);

        if (this.isRecording) {
            this.executionTrace.push({
                timestamp: Date.now(),
                blueprintId,
                nodeId,
                action: 'error',
                data: { error: error.message }
            });
        }
    }

    public startRecording(): void {
        this.isRecording = true;
        this.executionTrace = [];
    }

    public stopRecording(): Array<any> {
        this.isRecording = false;
        return this.executionTrace;
    }

    public getNodeMetrics(blueprintId: string, nodeId: string): NodeExecutionMetrics | null {
        return this.metrics.get(blueprintId)?.nodeMetrics.get(nodeId) || null;
    }

    public getBlueprintMetrics(blueprintId: string): BlueprintMetrics | null {
        return this.metrics.get(blueprintId) || null;
    }

    public getHotNodes(blueprintId: string, threshold: number = 5): Array<{nodeId: string; metrics: NodeExecutionMetrics}> {
        const metrics = this.metrics.get(blueprintId);
        if (!metrics) return [];

        const hotNodes: Array<{nodeId: string; metrics: NodeExecutionMetrics}> = [];
        metrics.nodeMetrics.forEach((nodeMetrics, nodeId) => {
            if (nodeMetrics.averageExecutionTime > threshold) {
                hotNodes.push({ nodeId, metrics: nodeMetrics });
            }
        });

        return hotNodes.sort((a, b) => b.metrics.averageExecutionTime - a.metrics.averageExecutionTime);
    }

    public getErrorNodes(blueprintId: string): Array<{nodeId: string; metrics: NodeExecutionMetrics}> {
        const metrics = this.metrics.get(blueprintId);
        if (!metrics) return [];

        const errorNodes: Array<{nodeId: string; metrics: NodeExecutionMetrics}> = [];
        metrics.nodeMetrics.forEach((nodeMetrics, nodeId) => {
            if (nodeMetrics.errorCount > 0) {
                errorNodes.push({ nodeId, metrics: nodeMetrics });
            }
        });

        return errorNodes.sort((a, b) => b.metrics.errorCount - a.metrics.errorCount);
    }

    public generatePerformanceReport(blueprintId: string): string {
        const metrics = this.metrics.get(blueprintId);
        if (!metrics) return 'No metrics available for this blueprint';

        const hotNodes = this.getHotNodes(blueprintId);
        const errorNodes = this.getErrorNodes(blueprintId);

        let report = `Blueprint Performance Report\n`;
        report += `========================\n\n`;
        report += `Total Execution Time: ${metrics.totalExecutionTime.toFixed(2)}ms\n`;
        report += `Average Frame Time: ${metrics.averageFrameTime.toFixed(2)}ms\n`;
        report += `Peak Frame Time: ${metrics.peakFrameTime.toFixed(2)}ms\n`;
        report += `Event Queue Length: ${metrics.eventQueueLength}\n`;
        report += `Cache Size: ${metrics.cacheSize}\n\n`;

        report += `Hot Nodes (>5ms average execution time):\n`;
        report += `----------------------------------------\n`;
        hotNodes.forEach(({ nodeId, metrics }) => {
            report += `Node ${nodeId}:\n`;
            report += `  Average Execution Time: ${metrics.averageExecutionTime.toFixed(2)}ms\n`;
            report += `  Total Executions: ${metrics.executionCount}\n`;
            report += `  Cache Hits/Misses: ${metrics.cacheHits}/${metrics.cacheMisses}\n\n`;
        });

        report += `Error Nodes:\n`;
        report += `------------\n`;
        errorNodes.forEach(({ nodeId, metrics }) => {
            report += `Node ${nodeId}:\n`;
            report += `  Error Count: ${metrics.errorCount}\n`;
            report += `  Last Error: ${metrics.lastError?.message || 'N/A'}\n\n`;
        });

        return report;
    }

    public clearMetrics(blueprintId: string): void {
        this.metrics.delete(blueprintId);
        this.initializeMetrics(blueprintId);
    }

    public exportMetrics(blueprintId: string): string {
        const metrics = this.metrics.get(blueprintId);
        if (!metrics) return '';

        return JSON.stringify({
            metrics,
            executionTrace: this.executionTrace
        }, null, 2);
    }
}
