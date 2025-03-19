import { Events } from '../../Core/Events';

interface PerformanceData {
    fps: number;
    frameTime: number;
    gpuMemory: number;
    cpuUsage: number;
    memoryUsage: number;
    drawCalls: number;
    triangleCount: number;
    activeThreads: number;
}

class ProfilingInterfaceGUI {
    private performanceData: PerformanceData;
    private eventSystem: Events;
    private graphCanvases: Map<string, HTMLCanvasElement>;
    private isVisible: boolean;

    constructor() {
        this.eventSystem = new Events();
        this.graphCanvases = new Map();
        this.isVisible = false;
        this.performanceData = {
            fps: 0,
            frameTime: 0,
            gpuMemory: 0,
            cpuUsage: 0,
            memoryUsage: 0,
            drawCalls: 0,
            triangleCount: 0,
            activeThreads: 0
        };

        this.initializeInterface();
        this.setupEventListeners();
    }

    private initializeInterface(): void {
        // Initialize performance monitor graphs
        this.createPerformanceGraph('FPS', 'fps-graph');
        this.createPerformanceGraph('Memory Usage', 'memory-graph');
        this.createPerformanceGraph('CPU/GPU Usage', 'processor-graph');
        this.createPerformanceGraph('Draw Calls', 'drawcalls-graph');
    }

    private createPerformanceGraph(title: string, id: string): void {
        const canvas = document.createElement('canvas');
        canvas.id = id;
        canvas.width = 300;
        canvas.height = 150;
        this.graphCanvases.set(id, canvas);
    }

    private setupEventListeners(): void {
        // Listen for performance data updates
        this.eventSystem.on('performanceUpdate', (data: PerformanceData) => {
            this.performanceData = data;
            this.updateGraphs();
        });

        // Listen for visibility toggle
        this.eventSystem.on('toggleProfilingInterface', () => {
            this.isVisible = !this.isVisible;
            this.updateVisibility();
        });
    }

    private updateGraphs(): void {
        this.updateFPSGraph();
        this.updateMemoryGraph();
        this.updateProcessorGraph();
        this.updateDrawCallsGraph();
    }

    private updateFPSGraph(): void {
        const canvas = this.graphCanvases.get('fps-graph');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw FPS graph
        ctx.beginPath();
        ctx.strokeStyle = this.performanceData.fps >= 60 ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 2;
        // Implementation of actual graph drawing would go here
    }

    private updateMemoryGraph(): void {
        const canvas = this.graphCanvases.get('memory-graph');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw memory usage graph
        ctx.beginPath();
        ctx.strokeStyle = '#0088ff';
        ctx.lineWidth = 2;
        // Implementation of actual graph drawing would go here
    }

    private updateProcessorGraph(): void {
        const canvas = this.graphCanvases.get('processor-graph');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw CPU/GPU usage graph
        ctx.beginPath();
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        // Implementation of actual graph drawing would go here
    }

    private updateDrawCallsGraph(): void {
        const canvas = this.graphCanvases.get('drawcalls-graph');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw draw calls graph
        ctx.beginPath();
        ctx.strokeStyle = '#8800ff';
        ctx.lineWidth = 2;
        // Implementation of actual graph drawing would go here
    }

    private updateVisibility(): void {
        this.graphCanvases.forEach((canvas) => {
            canvas.style.display = this.isVisible ? 'block' : 'none';
        });
    }

    // Public methods for external control
    public show(): void {
        this.isVisible = true;
        this.updateVisibility();
    }

    public hide(): void {
        this.isVisible = false;
        this.updateVisibility();
    }

    public startMonitoring(): void {
        // Start performance monitoring
        this.eventSystem.emit('startPerformanceMonitoring');
    }

    public stopMonitoring(): void {
        // Stop performance monitoring
        this.eventSystem.emit('stopPerformanceMonitoring');
    }

    public exportPerformanceData(): string {
        // Export current performance data as JSON
        return JSON.stringify(this.performanceData, null, 2);
    }
}

export { ProfilingInterfaceGUI, PerformanceData };
