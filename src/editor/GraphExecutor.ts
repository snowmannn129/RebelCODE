/**
 * Handles the execution of visual script graphs
 */

import { GraphData, NodeData, Connection, DataType } from "./NodeTypes";
import { NodeRegistry, NodeTemplate } from "./NodeRegistry";
import { DebugManager } from "./DebugSystem/DebugManager";

export class GraphExecutor {
    private nodeRegistry: NodeRegistry;
    private variables: Map<string, any>;
    private debugManager: DebugManager;

    constructor() {
        this.nodeRegistry = NodeRegistry.getInstance();
        this.variables = new Map();
        this.debugManager = DebugManager.getInstance();
    }

    public async executeGraph(graph: GraphData): Promise<void> {
        // Reset variables to their default values
        this.initializeVariables(graph);

        // Find all event nodes (entry points)
        const eventNodes = graph.nodes.filter(node => 
            this.nodeRegistry.getNodeTemplate(node.title)?.category === "Events"
        );

        // Execute from each event node
        for (const eventNode of eventNodes) {
            await this.executeNode(eventNode, graph);
        }
    }

    private async executeNode(node: NodeData, graph: GraphData): Promise<Record<string, any>> {
        try {
            // Notify debug manager before execution
            await this.debugManager.beforeNodeExecution(node, graph);

            const template = this.nodeRegistry.getNodeTemplate(node.title);
            if (!template || !template.execute) {
                return {};
            }

            // Gather input values
            const inputs: Record<string, any> = {};
            for (const input of node.inputs) {
                const incomingConnections = graph.connections.filter(conn => 
                    conn.targetNodeId === node.id && conn.targetPortId === input.id
                );

                if (incomingConnections.length > 0) {
                    const sourceConn = incomingConnections[0];
                    const sourceNode = graph.nodes.find(n => n.id === sourceConn.sourceNodeId);
                    if (sourceNode) {
                        const sourceOutputs = await this.executeNode(sourceNode, graph);
                        inputs[input.id] = sourceOutputs[sourceConn.sourcePortId];
                    }
                }
            }

            // Special handling for variable nodes
            if (node.title === "variable") {
                if (inputs.set !== undefined) {
                    this.variables.set(node.data?.variableId, inputs.set);
                    this.debugManager.onVariableChange(node.data?.variableId, inputs.set);
                }
                const value = this.variables.get(node.data?.variableId);
                const outputs = { value };
                this.debugManager.afterNodeExecution(node, outputs);
                return outputs;
            }

            // Execute the node
            const outputs = template.execute(inputs);
            this.debugManager.afterNodeExecution(node, outputs);
            return outputs;
        } catch (error) {
            console.error(`Error executing node ${node.title}:`, error);
            throw error;
        }
    }

    private initializeVariables(graph: GraphData): void {
        this.variables.clear();
        for (const variable of graph.variables) {
            this.variables.set(variable.id, variable.defaultValue);
        }
    }

    public getVariable(id: string): any {
        return this.variables.get(id);
    }

    public setVariable(id: string, value: any): void {
        this.variables.set(id, value);
    }

    public validateGraph(graph: GraphData): string[] {
        const errors: string[] = [];

        // Check for cycles
        if (this.hasCycles(graph)) {
            errors.push("Graph contains cycles");
        }

        // Check for type mismatches in connections
        for (const connection of graph.connections) {
            const sourceNode = graph.nodes.find(n => n.id === connection.sourceNodeId);
            const targetNode = graph.nodes.find(n => n.id === connection.targetNodeId);

            if (sourceNode && targetNode) {
                const sourcePort = sourceNode.outputs.find(p => p.id === connection.sourcePortId);
                const targetPort = targetNode.inputs.find(p => p.id === connection.targetPortId);

                if (sourcePort && targetPort && !this.validateConnection(sourcePort.type, targetPort.type)) {
                    errors.push(
                        `Type mismatch in connection from ${sourceNode.title}.${sourcePort.name} to ${targetNode.title}.${targetPort.name}`
                    );
                }
            }
        }

        return errors;
    }

    private hasCycles(graph: GraphData): boolean {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (nodeId: string): boolean => {
            if (recursionStack.has(nodeId)) {
                return true;
            }
            if (visited.has(nodeId)) {
                return false;
            }

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const outgoingConnections = graph.connections.filter(conn => conn.sourceNodeId === nodeId);
            for (const conn of outgoingConnections) {
                if (dfs(conn.targetNodeId)) {
                    return true;
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const node of graph.nodes) {
            if (!visited.has(node.id) && dfs(node.id)) {
                return true;
            }
        }

        return false;
    }

    public validateConnection(sourceType: DataType, targetType: DataType): boolean {
        if (sourceType === targetType) return true;
        if (targetType === DataType.Any) return true;
        if (sourceType === DataType.Number && targetType === DataType.Boolean) return true;
        return false;
    }
}
