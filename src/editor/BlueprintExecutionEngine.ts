import { Blueprint, BlueprintNode, BlueprintConnection, BlueprintVariable } from './BlueprintTypes';
import { BlueprintNodeLibrary, NodeTemplate } from './BlueprintNodeLibrary';
import { EventEmitter } from '../../Core/Events';

/**
 * Events that can be emitted by the BlueprintExecutionEngine
 */
interface BlueprintEngineEvents {
    blueprintStarted: string;
    blueprintStopped: string;
    variableChanged: { blueprintId: string; name: string; value: any };
    nodeExecuted: { blueprintId: string; nodeId: string; result: any };
    nodeError: { blueprintId: string; nodeId: string; error: any };
}

/**
 * Represents the execution context for a blueprint
 */
interface ExecutionContext {
    variables: Map<string, any>;
    nodeStates: Map<string, any>;
    nodeDirtyFlags: Map<string, boolean>;
    nodeCache: Map<string, { result: any; inputs: any }>;
    eventQueue: Array<{ nodeId: string; eventName: string; data?: any }>;
    lastUpdateTime: number;
    updateInterval: number;
}

/**
 * Manages the execution of blueprints
 */
export class BlueprintExecutionEngine extends EventEmitter<BlueprintEngineEvents> {
    private static instance: BlueprintExecutionEngine;
    private contexts: Map<string, ExecutionContext> = new Map();
    private nodeLibrary: BlueprintNodeLibrary;
    private running: Set<string> = new Set();
    private frameTime: number = 0;
    private lastFrameTime: number = 0;
    private readonly BATCH_SIZE = 10; // Process up to 10 events per frame
    private readonly MIN_UPDATE_INTERVAL = 16; // Minimum 16ms between updates (approx. 60fps)

    private constructor() {
        super();
        this.nodeLibrary = BlueprintNodeLibrary.getInstance();
        this.setupUpdateLoop();
    }

    public static getInstance(): BlueprintExecutionEngine {
        if (!BlueprintExecutionEngine.instance) {
            BlueprintExecutionEngine.instance = new BlueprintExecutionEngine();
        }
        return BlueprintExecutionEngine.instance;
    }

    /**
     * Starts executing a blueprint
     */
    public startExecution(blueprint: Blueprint): void {
        if (this.running.has(blueprint.id)) {
            return;
        }

        const context: ExecutionContext = {
            variables: new Map(blueprint.variables.map(v => [v.name, v.defaultValue])),
            nodeStates: new Map(),
            nodeDirtyFlags: new Map(),
            nodeCache: new Map(),
            eventQueue: [],
            lastUpdateTime: 0,
            updateInterval: this.MIN_UPDATE_INTERVAL
        };

        this.contexts.set(blueprint.id, context);
        this.running.add(blueprint.id);

        // Trigger OnStart events
        const startNodes = blueprint.nodes.filter(node => 
            node.type === 'Event' && 
            node.title === 'On Start'
        );

        for (const node of startNodes) {
            context.eventQueue.push({ nodeId: node.id, eventName: 'start' });
        }

        this.emit('blueprintStarted', blueprint.id);
    }

    /**
     * Stops executing a blueprint
     */
    public stopExecution(blueprintId: string): void {
        if (!this.running.has(blueprintId)) {
            return;
        }

        this.running.delete(blueprintId);
        this.contexts.delete(blueprintId);
        this.emit('blueprintStopped', blueprintId);
    }

    /**
     * Gets a variable value from a blueprint's context
     */
    public getVariable(blueprintId: string, name: string): any {
        const context = this.contexts.get(blueprintId);
        return context?.variables.get(name);
    }

    /**
     * Sets a variable value in a blueprint's context
     */
    public setVariable(blueprintId: string, name: string, value: any): void {
        const context = this.contexts.get(blueprintId);
        if (context) {
            const oldValue = context.variables.get(name);
            if (oldValue !== value) {
                context.variables.set(name, value);
                this.markDependentNodesDirty(blueprintId, name);
                this.emit('variableChanged', { blueprintId, name, value });
            }
        }
    }

    private markDependentNodesDirty(blueprintId: string, variableName: string): void {
        const context = this.contexts.get(blueprintId);
        const blueprint = this.findBlueprint(blueprintId);
        if (!context || !blueprint) return;

        // Find all nodes that use this variable and mark them dirty
        blueprint.nodes.forEach(node => {
            const usesVariable = node.inputs?.some(input => 
                !input.connected && input.value === variableName
            );
            if (usesVariable) {
                this.markNodeAndDependentsDirty(blueprintId, node.id);
            }
        });
    }

    private markNodeAndDependentsDirty(blueprintId: string, nodeId: string): void {
        const context = this.contexts.get(blueprintId);
        const blueprint = this.findBlueprint(blueprintId);
        if (!context || !blueprint) return;

        // Mark this node dirty
        context.nodeDirtyFlags.set(nodeId, true);
        context.nodeCache.delete(nodeId);

        // Find and mark all dependent nodes dirty
        const dependentNodes = this.findDependentNodes(blueprint, nodeId);
        dependentNodes.forEach(depNodeId => {
            context.nodeDirtyFlags.set(depNodeId, true);
            context.nodeCache.delete(depNodeId);
        });
    }

    private findDependentNodes(blueprint: Blueprint, nodeId: string): string[] {
        const dependentNodes: string[] = [];
        const connections = blueprint.connections.filter(conn => conn.sourceNodeId === nodeId);
        
        connections.forEach(conn => {
            dependentNodes.push(conn.targetNodeId);
            // Recursively find dependent nodes
            dependentNodes.push(...this.findDependentNodes(blueprint, conn.targetNodeId));
        });

        return [...new Set(dependentNodes)]; // Remove duplicates
    }

    /**
     * Triggers an event in a blueprint
     */
    public triggerEvent(blueprintId: string, eventName: string, data?: any): void {
        const context = this.contexts.get(blueprintId);
        if (!context) return;

        const eventNodes = this.findEventNodes(blueprintId, eventName);
        for (const node of eventNodes) {
            context.eventQueue.push({ nodeId: node.id, eventName, data });
        }
    }

    /**
     * Sets up the update loop for continuous execution
     */
    private setupUpdateLoop(): void {
        const updateFrame = (timestamp: number) => {
            this.frameTime = timestamp - this.lastFrameTime;
            this.lastFrameTime = timestamp;

            for (const blueprintId of this.running) {
                this.updateBlueprint(blueprintId);
            }

            requestAnimationFrame(updateFrame);
        };

        requestAnimationFrame(updateFrame);
    }

    /**
     * Updates a single blueprint for one frame
     */
    private updateBlueprint(blueprintId: string): void {
        const context = this.contexts.get(blueprintId);
        if (!context) return;

        // Process event queue in batches
        let processedEvents = 0;
        while (context.eventQueue.length > 0 && processedEvents < this.BATCH_SIZE) {
            const event = context.eventQueue.shift()!;
            this.executeNode(blueprintId, event.nodeId, event.data);
            processedEvents++;
        }

        // Check if enough time has passed for an update
        const currentTime = performance.now();
        if (currentTime - context.lastUpdateTime >= context.updateInterval) {
            // Trigger OnUpdate events
            const updateNodes = this.findEventNodes(blueprintId, 'update');
            for (const node of updateNodes) {
                this.executeNode(blueprintId, node.id, { deltaTime: this.frameTime / 1000 });
            }
            context.lastUpdateTime = currentTime;

            // Dynamically adjust update interval based on execution time
            const executionTime = performance.now() - currentTime;
            context.updateInterval = Math.max(
                this.MIN_UPDATE_INTERVAL,
                Math.min(executionTime * 2, 100) // Cap at 100ms
            );
        }
    }

    /**
     * Executes a single node and its connected nodes
     */
    private executeNode(blueprintId: string, nodeId: string, inputData?: any): void {
        const context = this.contexts.get(blueprintId);
        if (!context) return;

        const blueprint = this.findBlueprint(blueprintId);
        if (!blueprint) return;

        const node = blueprint.nodes.find(n => n.id === nodeId);
        if (!node) return;

        const template = this.nodeLibrary.getNode(node.title.toLowerCase().replace(/\s+/g, '_'));
        if (!template || !template.execute) return;

        // Check cache if node is not dirty and inputs haven't changed
        if (!context.nodeDirtyFlags.get(nodeId)) {
            const cache = context.nodeCache.get(nodeId);
            if (cache && this.areInputsEqual(cache.inputs, inputData)) {
                return cache.result;
            }
        }

        // Prepare input values
        const inputs: any = { ...inputData };
        for (const input of node.inputs) {
            if (input.connected) {
                const connection = this.findInputConnection(blueprint, node.id, input.id);
                if (connection) {
                    const sourceNode = blueprint.nodes.find(n => n.id === connection.sourceNodeId);
                    if (sourceNode) {
                        const sourceTemplate = this.nodeLibrary.getNode(sourceNode.title.toLowerCase().replace(/\s+/g, '_'));
                        if (sourceTemplate?.execute) {
                            const sourceResult = sourceTemplate.execute(this.getNodeInputs(blueprint, sourceNode.id));
                            inputs[input.name.toLowerCase()] = sourceResult[connection.sourcePinId];
                        }
                    }
                }
            }
        }

        // Execute the node
        try {
            const result = template.execute(inputs);

            // Update cache and clear dirty flag
            context.nodeStates.set(nodeId, result);
            context.nodeCache.set(nodeId, { result, inputs: { ...inputs } });
            context.nodeDirtyFlags.set(nodeId, false);

            // Follow execution flow
            if (result && node.outputs) {
                for (const output of node.outputs) {
                    if (output.type === 'execution' && output.connected) {
                        const connections = this.findOutputConnections(blueprint, node.id, output.id);
                        for (const connection of connections) {
                            this.executeNode(blueprintId, connection.targetNodeId, result);
                        }
                    }
                }
            }

            this.emit('nodeExecuted', { blueprintId, nodeId, result });
        } catch (error) {
            this.emit('nodeError', { blueprintId, nodeId, error });
            console.error(`Error executing node ${node.title}:`, error);
        }
    }

    /**
     * Helper methods for finding blueprint elements
     */
    private findBlueprint(id: string): Blueprint | null {
        // This would need to be implemented to actually find the blueprint
        // For now, return null as we don't have access to the blueprint storage
        return null;
    }

    private findEventNodes(blueprintId: string, eventName: string): BlueprintNode[] {
        const blueprint = this.findBlueprint(blueprintId);
        if (!blueprint) return [];

        return blueprint.nodes.filter(node => 
            node.type === 'Event' && 
            node.title.toLowerCase() === `on_${eventName.toLowerCase()}`
        );
    }

    private findInputConnection(blueprint: Blueprint, nodeId: string, pinId: string): BlueprintConnection | null {
        return blueprint.connections.find(conn => 
            conn.targetNodeId === nodeId && 
            conn.targetPinId === pinId
        ) || null;
    }

    private findOutputConnections(blueprint: Blueprint, nodeId: string, pinId: string): BlueprintConnection[] {
        return blueprint.connections.filter(conn => 
            conn.sourceNodeId === nodeId && 
            conn.sourcePinId === pinId
        );
    }

    private areInputsEqual(a: any, b: any): boolean {
        if (a === b) return true;
        if (!a || !b) return false;
        if (typeof a !== typeof b) return false;
        
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        
        return keysA.every(key => {
            const valA = a[key];
            const valB = b[key];
            
            if (typeof valA === 'object' && typeof valB === 'object') {
                return this.areInputsEqual(valA, valB);
            }
            return valA === valB;
        });
    }

    private getNodeInputs(blueprint: Blueprint, nodeId: string): any {
        const node = blueprint.nodes.find(n => n.id === nodeId);
        if (!node) return {};

        const inputs: any = {};
        for (const input of node.inputs) {
            if (input.connected) {
                const connection = this.findInputConnection(blueprint, nodeId, input.id);
                if (connection) {
                    const sourceNode = blueprint.nodes.find(n => n.id === connection.sourceNodeId);
                    if (sourceNode) {
                        const context = this.contexts.get(blueprint.id);
                        const sourceState = context?.nodeStates.get(sourceNode.id);
                        if (sourceState) {
                            inputs[input.name.toLowerCase()] = sourceState[connection.sourcePinId];
                        }
                    }
                }
            } else if (input.value !== undefined) {
                inputs[input.name.toLowerCase()] = input.value;
            }
        }
        return inputs;
    }

    /**
     * Gets the execution state of a blueprint
     */
    public getExecutionState(blueprintId: string) {
        return {
            isRunning: this.running.has(blueprintId),
            context: this.contexts.get(blueprintId),
            frameTime: this.frameTime
        };
    }
}
