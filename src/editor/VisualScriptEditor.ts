/**
 * Main visual scripting editor component that manages the graph editing interface
 */

import { GraphData, NodeData, Connection, NodePort, DataType } from "./NodeTypes";
import { NodeRegistry } from "./NodeRegistry";
import { GraphExecutor } from "./GraphExecutor";

export class VisualScriptEditor {
    private graph: GraphData;
    private nodeRegistry: NodeRegistry;
    private graphExecutor: GraphExecutor;
    private selectedNode: string | null = null;
    private isDragging: boolean = false;
    private dragOffset: { x: number; y: number } = { x: 0, y: 0 };

    constructor() {
        this.nodeRegistry = NodeRegistry.getInstance();
        this.graphExecutor = new GraphExecutor();
        this.graph = {
            nodes: [],
            connections: [],
            variables: []
        };
    }

    public createNode(type: string, position: { x: number; y: number }): string {
        const id = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const node = this.nodeRegistry.createNode(type, id, position);
        this.graph.nodes.push(node);
        return id;
    }

    public deleteNode(nodeId: string): void {
        // Remove all connections to/from this node
        this.graph.connections = this.graph.connections.filter(
            conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
        );

        // Remove the node
        this.graph.nodes = this.graph.nodes.filter(node => node.id !== nodeId);

        if (this.selectedNode === nodeId) {
            this.selectedNode = null;
        }
    }

    public createConnection(
        sourceNodeId: string,
        sourcePortId: string,
        targetNodeId: string,
        targetPortId: string
    ): boolean {
        // Validate connection
        const sourceNode = this.graph.nodes.find(n => n.id === sourceNodeId);
        const targetNode = this.graph.nodes.find(n => n.id === targetNodeId);

        if (!sourceNode || !targetNode) {
            return false;
        }

        const sourcePort = sourceNode.outputs.find(p => p.id === sourcePortId);
        const targetPort = targetNode.inputs.find(p => p.id === targetPortId);

        if (!sourcePort || !targetPort) {
            return false;
        }

        // Check for type compatibility
        if (!this.graphExecutor.validateConnection(sourcePort.type, targetPort.type)) {
            return false;
        }

        // Check for existing connections to the target port if it doesn't allow multiple
        if (!targetPort.allowMultipleConnections) {
            const existingConnection = this.graph.connections.find(
                conn => conn.targetNodeId === targetNodeId && conn.targetPortId === targetPortId
            );
            if (existingConnection) {
                return false;
            }
        }

        // Create the connection
        const connection: Connection = {
            id: `conn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            sourceNodeId,
            sourcePortId,
            targetNodeId,
            targetPortId
        };

        this.graph.connections.push(connection);
        return true;
    }

    public deleteConnection(connectionId: string): void {
        this.graph.connections = this.graph.connections.filter(conn => conn.id !== connectionId);
    }

    public moveNode(nodeId: string, newPosition: { x: number; y: number }): void {
        const node = this.graph.nodes.find(n => n.id === nodeId);
        if (node) {
            node.position = newPosition;
        }
    }

    public addVariable(name: string, type: DataType, defaultValue: any): string {
        const id = `var_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.graph.variables.push({
            id,
            name,
            type,
            defaultValue,
            description: ""
        });
        return id;
    }

    public removeVariable(id: string): void {
        this.graph.variables = this.graph.variables.filter(v => v.id !== id);
        
        // Remove any variable nodes referencing this variable
        const variableNodes = this.graph.nodes.filter(
            node => node.title === "variable" && node.data?.variableId === id
        );
        
        for (const node of variableNodes) {
            this.deleteNode(node.id);
        }
    }

    public validateGraph(): string[] {
        return this.graphExecutor.validateGraph(this.graph);
    }

    public executeGraph(): void {
        const errors = this.validateGraph();
        if (errors.length > 0) {
            throw new Error(`Graph validation failed:\n${errors.join("\n")}`);
        }
        this.graphExecutor.executeGraph(this.graph);
    }

    public saveGraph(): string {
        return JSON.stringify(this.graph, null, 2);
    }

    public loadGraph(serializedGraph: string): void {
        try {
            const parsed = JSON.parse(serializedGraph);
            if (this.isValidGraphData(parsed)) {
                this.graph = parsed;
            } else {
                throw new Error("Invalid graph data format");
            }
        } catch (error) {
            throw new Error(`Failed to load graph: ${error.message}`);
        }
    }

    private isValidGraphData(data: any): data is GraphData {
        return (
            data &&
            Array.isArray(data.nodes) &&
            Array.isArray(data.connections) &&
            Array.isArray(data.variables)
        );
    }

    public getNodeTypes(): string[] {
        return this.nodeRegistry.getAllNodeTypes();
    }

    public getGraph(): GraphData {
        return this.graph;
    }
}
