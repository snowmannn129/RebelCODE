/**
 * Debug Interface Implementation
 * Provides a comprehensive set of debugging tools including performance monitoring,
 * memory analysis, visual debugging, and network monitoring capabilities.
 */

import { EventEmitter } from '../../Core/Events';
import { Vector2 } from '../../Core/Math';

// Define event types for type safety
interface DebugEvents {
    'performance:metric': { value: number; category: string };
    'memory:snapshot': void;
    'debug:visual:add': {
        id: string;
        position: Vector2;
        type: 'point' | 'line' | 'box' | 'circle';
        color?: string;
        data?: any;
    };
    'debug:visual:remove': string;
    'debug:visual:clear': void;
    'debug:visual:toggle': void;
    'network:packet': NetworkPacket;
    'network:clear': void;
}

// Create global event bus instance
const eventBus = new EventEmitter<DebugEvents>();

interface PerformanceMetric {
    timestamp: number;
    value: number;
    category: string;
}

interface MemorySnapshot {
    totalHeapSize: number;
    usedHeapSize: number;
    heapSizeLimit: number;
    allocation: { [key: string]: number };
}

interface NetworkPacket {
    id: string;
    timestamp: number;
    type: 'send' | 'receive';
    size: number;
    latency?: number;
}

/**
 * Manages performance monitoring and graphing capabilities
 */
class PerformanceGraphs {
    private metrics: PerformanceMetric[] = [];
    private readonly maxDataPoints: number = 100;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(containerId: string) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`Container ${containerId} not found`);
        container.appendChild(this.canvas);

        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Failed to get 2D context');
        this.ctx = context;
    }

    addMetric(value: number, category: string): void {
        const timestamp = Date.now();
        // Validate timestamp is recent (within last second)
        if (timestamp < Date.now() - 1000) {
            throw new Error('Invalid timestamp: too old');
        }

        this.metrics.push({
            timestamp,
            value,
            category
        });

        // Enforce data points limit
        if (this.metrics.length > this.maxDataPoints) {
            this.metrics.shift();
        }

        // Validate metric was added
        const lastMetric = this.metrics[this.metrics.length - 1];
        if (!lastMetric || lastMetric.value !== value || lastMetric.category !== category) {
            throw new Error('Failed to add metric');
        }

        this.render();
    }

    private render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Group metrics by category
        const categories = new Map<string, PerformanceMetric[]>();
        this.metrics.forEach(metric => {
            if (!categories.has(metric.category)) {
                categories.set(metric.category, []);
            }
            categories.get(metric.category)?.push(metric);
        });

        // Draw each category
        let colorIndex = 0;
        categories.forEach((metrics, category) => {
            this.drawGraph(metrics, this.getColor(colorIndex));
            this.drawLegend(category, this.getColor(colorIndex), colorIndex);
            colorIndex++;
        });
    }

    private drawGraph(metrics: PerformanceMetric[], color: string): void {
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;

        metrics.forEach((metric, index) => {
            const x = (index / this.maxDataPoints) * this.canvas.width;
            const y = this.canvas.height - (metric.value * this.canvas.height);
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();
    }

    private drawLegend(category: string, color: string, index: number): void {
        const padding = 10;
        const lineHeight = 20;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(padding, padding + (index * lineHeight), 15, 15);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(category, padding + 20, padding + 12 + (index * lineHeight));
    }

    private getColor(index: number): string {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        return colors[index % colors.length];
    }
}

/**
 * Provides memory analysis and visualization tools
 */
class MemoryViewer {
    private snapshots: MemorySnapshot[] = [];
    private container: HTMLElement;

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`Container ${containerId} not found`);
        this.container = container;
    }

    takeSnapshot(): void {
        // Mock memory data for demonstration
        // In a real implementation, this would use platform-specific APIs
        const heapSizeLimit = 2 * 1024 * 1024 * 1024; // 2GB limit
        const totalHeapSize = Math.random() * 1024 * 1024 * 1024; // Random value up to 1GB
        const usedHeapSize = Math.random() * Math.min(totalHeapSize, 512 * 1024 * 1024); // Ensure used is less than total

        // Calculate allocations ensuring they sum to usedHeapSize
        const systemAlloc = usedHeapSize * 0.4; // 40% for system
        const assetsAlloc = usedHeapSize * 0.35; // 35% for assets
        const sceneAlloc = usedHeapSize * 0.25; // 25% for scene

        const snapshot: MemorySnapshot = {
            totalHeapSize,
            usedHeapSize,
            heapSizeLimit,
            allocation: {
                'System': systemAlloc,
                'Assets': assetsAlloc,
                'Scene': sceneAlloc
            }
        };

        // Validate heap size calculations
        if (snapshot.usedHeapSize > snapshot.totalHeapSize) {
            throw new Error('Used heap size cannot exceed total heap size');
        }

        if (snapshot.totalHeapSize > snapshot.heapSizeLimit) {
            throw new Error('Total heap size cannot exceed heap size limit');
        }

        // Validate allocation percentages
        const totalAllocation = Object.values(snapshot.allocation).reduce((sum, size) => sum + size, 0);
        if (Math.abs(totalAllocation - snapshot.usedHeapSize) > 0.1) { // Allow 0.1 byte difference for floating-point precision
            throw new Error('Allocation sum must equal used heap size');
        }

        this.snapshots.push(snapshot);
        this.render();
    }

    private render(): void {
        this.container.innerHTML = '';
        
        const latest = this.snapshots[this.snapshots.length - 1];
        if (!latest) return;

        const template = `
            <div class="memory-stats">
                <h3>Memory Usage</h3>
                <div class="stat">
                    <label>Total Heap:</label>
                    <span>${this.formatBytes(latest.totalHeapSize)}</span>
                </div>
                <div class="stat">
                    <label>Used Heap:</label>
                    <span>${this.formatBytes(latest.usedHeapSize)}</span>
                </div>
                <div class="stat">
                    <label>Heap Limit:</label>
                    <span>${this.formatBytes(latest.heapSizeLimit)}</span>
                </div>
                <div class="usage-bar">
                    <div class="used" style="width: ${(latest.usedHeapSize / latest.heapSizeLimit) * 100}%"></div>
                </div>
            </div>
        `;

        this.container.innerHTML = template;
    }

    private formatBytes(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}

/**
 * Handles visual debugging tools and overlays
 */
class VisualDebugTools {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private enabled: boolean = false;
    private debugObjects: Map<string, {
        position: Vector2;
        color: string;
        type: 'point' | 'line' | 'box' | 'circle';
        data?: any;
    }> = new Map();

    constructor(containerId: string) {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`Container ${containerId} not found`);
        container.appendChild(this.canvas);

        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Failed to get 2D context');
        this.ctx = context;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    private resizeCanvas(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.render();
    }

    toggle(): void {
        this.enabled = !this.enabled;
        this.canvas.style.display = this.enabled ? 'block' : 'none';
    }

    addDebugObject(
        id: string,
        position: Vector2,
        type: 'point' | 'line' | 'box' | 'circle',
        color: string = '#ff0000',
        data?: any
    ): void {
        // Validate input parameters
        if (!id || typeof id !== 'string') {
            throw new Error('Invalid id parameter');
        }
        if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
            throw new Error('Invalid position parameter');
        }
        if (!['point', 'line', 'box', 'circle'].includes(type)) {
            throw new Error('Invalid debug object type');
        }

        // Validate data based on type
        if (type === 'line' && (!data?.end || !data.end.x || !data.end.y)) {
            throw new Error('Line type requires end position in data');
        }
        if (type === 'box' && (!data?.size || !data.size.x || !data.size.y)) {
            throw new Error('Box type requires size in data');
        }
        if (type === 'circle' && (!data?.radius || typeof data.radius !== 'number')) {
            throw new Error('Circle type requires radius in data');
        }

        this.debugObjects.set(id, { position, type, color, data });
        
        // Validate object was added
        const added = this.debugObjects.get(id);
        if (!added) {
            throw new Error('Failed to add debug object');
        }

        if (this.enabled) this.render();
    }

    removeDebugObject(id: string): void {
        this.debugObjects.delete(id);
        if (this.enabled) this.render();
    }

    clear(): void {
        this.debugObjects.clear();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.debugObjects.forEach((obj, id) => {
            this.ctx.fillStyle = obj.color;
            this.ctx.strokeStyle = obj.color;
            
            switch (obj.type) {
                case 'point':
                    this.drawPoint(obj.position);
                    break;
                case 'line':
                    if (obj.data?.end) {
                        this.drawLine(obj.position, obj.data.end);
                    }
                    break;
                case 'box':
                    if (obj.data?.size) {
                        this.drawBox(obj.position, obj.data.size);
                    }
                    break;
                case 'circle':
                    if (obj.data?.radius) {
                        this.drawCircle(obj.position, obj.data.radius);
                    }
                    break;
            }
        });
    }

    private drawPoint(position: Vector2): void {
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, 5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private drawLine(start: Vector2, end: Vector2): void {
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
    }

    private drawBox(position: Vector2, size: Vector2): void {
        this.ctx.strokeRect(position.x, position.y, size.x, size.y);
    }

    private drawCircle(position: Vector2, radius: number): void {
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
}

/**
 * Provides network monitoring and analysis capabilities
 */
class NetworkMonitor {
    private packets: NetworkPacket[] = [];
    private container: HTMLElement;
    private readonly maxPackets: number = 100;

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`Container ${containerId} not found`);
        this.container = container;
    }

    logPacket(packet: NetworkPacket): void {
        // Validate packet data
        if (!packet.id || typeof packet.id !== 'string') {
            throw new Error('Invalid packet id');
        }
        if (!packet.timestamp || packet.timestamp > Date.now()) {
            throw new Error('Invalid packet timestamp');
        }
        if (!['send', 'receive'].includes(packet.type)) {
            throw new Error('Invalid packet type');
        }
        if (typeof packet.size !== 'number' || packet.size <= 0) {
            throw new Error('Invalid packet size');
        }
        if (packet.latency !== undefined && (typeof packet.latency !== 'number' || packet.latency < 0)) {
            throw new Error('Invalid packet latency');
        }

        this.packets.push(packet);

        // Enforce packet limit
        if (this.packets.length > this.maxPackets) {
            this.packets.shift();
        }

        // Validate packet limit
        if (this.packets.length > this.maxPackets) {
            throw new Error('Packet limit exceeded');
        }

        this.render();
    }

    clear(): void {
        this.packets = [];
        this.render();
    }

    private render(): void {
        const stats = this.calculateStats();
        
        const template = `
            <div class="network-monitor">
                <h3>Network Statistics</h3>
                <div class="stats-grid">
                    <div class="stat">
                        <label>Total Packets:</label>
                        <span>${stats.totalPackets}</span>
                    </div>
                    <div class="stat">
                        <label>Average Latency:</label>
                        <span>${stats.avgLatency.toFixed(2)}ms</span>
                    </div>
                    <div class="stat">
                        <label>Data Sent:</label>
                        <span>${this.formatBytes(stats.totalSent)}</span>
                    </div>
                    <div class="stat">
                        <label>Data Received:</label>
                        <span>${this.formatBytes(stats.totalReceived)}</span>
                    </div>
                </div>
                <div class="packet-list">
                    ${this.renderPacketList()}
                </div>
            </div>
        `;

        this.container.innerHTML = template;
    }

    private calculateStats() {
        return {
            totalPackets: this.packets.length,
            avgLatency: this.packets.reduce((acc, p) => acc + (p.latency || 0), 0) / this.packets.length || 0,
            totalSent: this.packets.filter(p => p.type === 'send').reduce((acc, p) => acc + p.size, 0),
            totalReceived: this.packets.filter(p => p.type === 'receive').reduce((acc, p) => acc + p.size, 0)
        };
    }

    private renderPacketList(): string {
        return this.packets.map(packet => `
            <div class="packet ${packet.type}">
                <span class="timestamp">${new Date(packet.timestamp).toISOString()}</span>
                <span class="id">${packet.id}</span>
                <span class="type">${packet.type}</span>
                <span class="size">${this.formatBytes(packet.size)}</span>
                ${packet.latency ? `<span class="latency">${packet.latency.toFixed(2)}ms</span>` : ''}
            </div>
        `).join('');
    }

    private formatBytes(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}

/**
 * Main Debug Interface class that coordinates all debugging tools
 */
export class DebugInterface {
    private performanceGraphs: PerformanceGraphs;
    private memoryViewer: MemoryViewer;
    private visualDebugTools: VisualDebugTools;
    private networkMonitor: NetworkMonitor;

    constructor() {
        // Initialize all debug tools
        this.performanceGraphs = new PerformanceGraphs('performance-container');
        this.memoryViewer = new MemoryViewer('memory-container');
        this.visualDebugTools = new VisualDebugTools('visual-debug-container');
        this.networkMonitor = new NetworkMonitor('network-container');

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Performance monitoring
        eventBus.on('performance:metric', (data: { value: number, category: string }) => {
            this.performanceGraphs.addMetric(data.value, data.category);
        });

        // Memory snapshots
        eventBus.on('memory:snapshot', () => {
            this.memoryViewer.takeSnapshot();
        });

        // Visual debugging
        eventBus.on('debug:visual:add', (data: {
            id: string,
            position: Vector2,
            type: 'point' | 'line' | 'box' | 'circle',
            color?: string,
            data?: any
        }) => {
            this.visualDebugTools.addDebugObject(
                data.id,
                data.position,
                data.type,
                data.color,
                data.data
            );
        });

        eventBus.on('debug:visual:remove', (id: string) => {
            this.visualDebugTools.removeDebugObject(id);
        });

        eventBus.on('debug:visual:clear', () => {
            this.visualDebugTools.clear();
        });

        eventBus.on('debug:visual:toggle', () => {
            this.visualDebugTools.toggle();
        });

        // Network monitoring
        eventBus.on('network:packet', (packet: NetworkPacket) => {
            this.networkMonitor.logPacket(packet);
        });

        eventBus.on('network:clear', () => {
            this.networkMonitor.clear();
        });
    }
}
