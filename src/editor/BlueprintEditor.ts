import { Blueprint, BlueprintNode, BlueprintConnection, BlueprintNodeType } from './BlueprintTypes';
import { BlueprintManager } from './BlueprintManager';
import { EventEmitter } from '../../Core/Events';

/**
 * Handles the visual editing interface for blueprints
 */
export class BlueprintEditor extends EventEmitter {
    private manager: BlueprintManager;
    private activeBlueprint: Blueprint | null = null;
    private selectedNodes: Set<string> = new Set();
    private draggedNode: string | null = null;
    private isConnecting: boolean = false;
    private connectionStart: { nodeId: string; pinId: string } | null = null;
    private gridSize: number = 20;
    private zoom: number = 1;
    private pan: { x: number; y: number } = { x: 0, y: 0 };

    constructor(manager: BlueprintManager) {
        super();
        this.manager = manager;
        this.setupEventListeners();
    }

    /**
     * Sets up event listeners for blueprint operations
     */
    private setupEventListeners(): void {
        this.manager.on('blueprintCreated', this.onBlueprintCreated.bind(this));
        this.manager.on('nodeAdded', this.onNodeAdded.bind(this));
        this.manager.on('connectionCreated', this.onConnectionCreated.bind(this));
    }

    /**
     * Opens a blueprint for editing
     */
    openBlueprint(blueprint: Blueprint): void {
        this.activeBlueprint = blueprint;
        this.selectedNodes.clear();
        this.resetView();
        this.emit('blueprintOpened', blueprint);
    }

    /**
     * Handles node selection
     */
    selectNode(nodeId: string, multiSelect: boolean = false): void {
        if (!multiSelect) {
            this.selectedNodes.clear();
        }
        this.selectedNodes.add(nodeId);
        this.emit('nodeSelected', Array.from(this.selectedNodes));
    }

    /**
     * Starts dragging a node
     */
    startNodeDrag(nodeId: string): void {
        this.draggedNode = nodeId;
        this.emit('nodeDragStarted', nodeId);
    }

    /**
     * Updates node position during drag
     */
    updateNodePosition(position: { x: number; y: number }): void {
        if (!this.draggedNode || !this.activeBlueprint) return;

        const node = this.activeBlueprint.nodes.find(n => n.id === this.draggedNode);
        if (!node) return;

        // Snap to grid
        const snappedPosition = {
            x: Math.round(position.x / this.gridSize) * this.gridSize,
            y: Math.round(position.y / this.gridSize) * this.gridSize
        };

        node.position = snappedPosition;
        this.emit('nodePositionUpdated', { nodeId: this.draggedNode, position: snappedPosition });
    }

    /**
     * Ends node dragging
     */
    endNodeDrag(): void {
        if (this.draggedNode) {
            this.emit('nodeDragEnded', this.draggedNode);
            this.draggedNode = null;
        }
    }

    /**
     * Starts creating a connection
     */
    startConnection(nodeId: string, pinId: string): void {
        this.isConnecting = true;
        this.connectionStart = { nodeId, pinId };
        this.emit('connectionStarted', { nodeId, pinId });
    }

    /**
     * Completes a connection between nodes
     */
    completeConnection(targetNodeId: string, targetPinId: string): void {
        if (!this.isConnecting || !this.connectionStart || !this.activeBlueprint) return;

        const connection = this.manager.connect(
            this.activeBlueprint.id,
            this.connectionStart.nodeId,
            this.connectionStart.pinId,
            targetNodeId,
            targetPinId
        );

        if (connection) {
            this.emit('connectionCompleted', connection);
        }

        this.isConnecting = false;
        this.connectionStart = null;
    }

    /**
     * Cancels the current connection
     */
    cancelConnection(): void {
        if (this.isConnecting) {
            this.isConnecting = false;
            this.connectionStart = null;
            this.emit('connectionCancelled');
        }
    }

    /**
     * Deletes selected nodes and their connections
     */
    deleteSelected(): void {
        if (!this.activeBlueprint) return;

        const nodesToDelete = Array.from(this.selectedNodes);
        const updatedNodes = this.activeBlueprint.nodes.filter(
            node => !nodesToDelete.includes(node.id)
        );

        const updatedConnections = this.activeBlueprint.connections.filter(
            conn => !nodesToDelete.includes(conn.sourceNodeId) && 
                   !nodesToDelete.includes(conn.targetNodeId)
        );

        this.activeBlueprint.nodes = updatedNodes;
        this.activeBlueprint.connections = updatedConnections;
        this.selectedNodes.clear();

        this.emit('nodesDeleted', nodesToDelete);
    }

    /**
     * Adds a new node to the active blueprint
     */
    addNode(type: BlueprintNodeType, position: { x: number; y: number }): void {
        if (!this.activeBlueprint) return;

        const node = this.manager.addNode(
            this.activeBlueprint.id,
            type.toString(),
            this.screenToWorldPosition(position)
        );

        if (node) {
            this.selectNode(node.id);
        }
    }

    /**
     * Converts screen coordinates to world coordinates
     */
    private screenToWorldPosition(screen: { x: number; y: number }): { x: number; y: number } {
        return {
            x: (screen.x - this.pan.x) / this.zoom,
            y: (screen.y - this.pan.y) / this.zoom
        };
    }

    /**
     * Converts world coordinates to screen coordinates
     */
    private worldToScreenPosition(world: { x: number; y: number }): { x: number; y: number } {
        return {
            x: world.x * this.zoom + this.pan.x,
            y: world.y * this.zoom + this.pan.y
        };
    }

    /**
     * Updates the view zoom level
     */
    setZoom(zoom: number): void {
        this.zoom = Math.max(0.1, Math.min(2, zoom));
        this.emit('zoomChanged', this.zoom);
    }

    /**
     * Updates the view pan position
     */
    setPan(pan: { x: number; y: number }): void {
        this.pan = pan;
        this.emit('panChanged', this.pan);
    }

    /**
     * Resets the view to default settings
     */
    resetView(): void {
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.emit('viewReset');
    }

    /**
     * Event handlers
     */
    private onBlueprintCreated(blueprint: Blueprint): void {
        this.openBlueprint(blueprint);
    }

    private onNodeAdded(event: { blueprintId: string; node: BlueprintNode }): void {
        if (this.activeBlueprint?.id === event.blueprintId) {
            this.emit('nodeAdded', event.node);
        }
    }

    private onConnectionCreated(event: { blueprintId: string; connection: BlueprintConnection }): void {
        if (this.activeBlueprint?.id === event.blueprintId) {
            this.emit('connectionCreated', event.connection);
        }
    }

    /**
     * Gets the current editor state
     */
    getEditorState() {
        return {
            activeBlueprint: this.activeBlueprint,
            selectedNodes: Array.from(this.selectedNodes),
            isConnecting: this.isConnecting,
            draggedNode: this.draggedNode,
            zoom: this.zoom,
            pan: this.pan,
            gridSize: this.gridSize
        };
    }
}
