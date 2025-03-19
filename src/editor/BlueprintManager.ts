import { Blueprint, BlueprintNode, BlueprintConnection, BlueprintValidationResult, BlueprintError, BlueprintWarning, BlueprintNodeType } from './BlueprintTypes';
import { EventEmitter } from '../../Core/Events';
import { BlueprintNodeLibrary } from './BlueprintNodeLibrary';
import { BlueprintExecutionEngine } from './BlueprintExecutionEngine';

/**
 * Events that can be emitted by the BlueprintManager
 */
interface BlueprintManagerEvents {
    blueprintCreated: Blueprint;
    blueprintLoaded: Blueprint;
    nodeAdded: { blueprintId: string; node: BlueprintNode };
    connectionCreated: { blueprintId: string; connection: BlueprintConnection };
    blueprintValidated: { blueprintId: string; result: BlueprintValidationResult };
    blueprintDeleted: string;
}

/**
 * Manages the creation, validation, and execution of blueprints
 */
export class BlueprintManager extends EventEmitter<BlueprintManagerEvents> {
    private blueprints: Map<string, Blueprint> = new Map();
    private nodeLibrary: BlueprintNodeLibrary;
    private executionEngine: BlueprintExecutionEngine;

    constructor() {
        super();
        this.nodeLibrary = BlueprintNodeLibrary.getInstance();
        this.executionEngine = BlueprintExecutionEngine.getInstance();
    }

    /**
     * Creates a new blueprint
     */
    createBlueprint(name: string, author: string): Blueprint {
        const blueprint: Blueprint = {
            id: this.generateUniqueId(),
            name,
            nodes: [],
            connections: [],
            variables: [],
            metadata: {
                author,
                created: new Date(),
                modified: new Date(),
                version: '1.0.0'
            }
        };

        this.blueprints.set(blueprint.id, blueprint);
        this.emit('blueprintCreated', blueprint);
        return blueprint;
    }


    /**
     * Adds a node to a blueprint
     */
    addNode(blueprintId: string, nodeType: string, position: { x: number; y: number }): BlueprintNode | null {
        const blueprint = this.blueprints.get(blueprintId);
        if (!blueprint) return null;

        const node = this.nodeLibrary.createNode(nodeType, position);
        if (!node) return null;

        blueprint.nodes.push(node);
        blueprint.metadata.modified = new Date();
        this.emit('nodeAdded', { blueprintId, node });
        return node;
    }

    /**
     * Creates a connection between two nodes
     */
    connect(blueprintId: string, sourceNodeId: string, sourcePinId: string, 
            targetNodeId: string, targetPinId: string): BlueprintConnection | null {
        const blueprint = this.blueprints.get(blueprintId);
        if (!blueprint) return null;

        const connection: BlueprintConnection = {
            id: this.generateUniqueId(),
            sourceNodeId,
            sourcePinId,
            targetNodeId,
            targetPinId
        };

        if (this.validateConnection(blueprint, connection)) {
            blueprint.connections.push(connection);
            blueprint.metadata.modified = new Date();
            this.emit('connectionCreated', { blueprintId, connection });
            return connection;
        }

        return null;
    }

    /**
     * Validates a blueprint
     */
    validateBlueprint(blueprintId: string): BlueprintValidationResult {
        const blueprint = this.blueprints.get(blueprintId);
        if (!blueprint) {
            return {
                isValid: false,
                errors: [{ type: 'NotFound', message: 'Blueprint not found' }],
                warnings: []
            };
        }

        const errors: BlueprintError[] = [];
        const warnings: BlueprintWarning[] = [];

        // Check for disconnected nodes
        blueprint.nodes.forEach(node => {
            if (node.inputs.some(input => !input.connected) || 
                node.outputs.some(output => !output.connected)) {
                warnings.push({
                    type: 'DisconnectedNode',
                    message: `Node "${node.title}" has disconnected pins`,
                    nodeId: node.id
                });
            }
        });

        // Check for circular dependencies
        if (this.hasCircularDependencies(blueprint)) {
            errors.push({
                type: 'CircularDependency',
                message: 'Blueprint contains circular dependencies'
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Checks if a blueprint has circular dependencies
     */
    private hasCircularDependencies(blueprint: Blueprint): boolean {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (nodeId: string): boolean => {
            if (recursionStack.has(nodeId)) return true;
            if (visited.has(nodeId)) return false;

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const connections = blueprint.connections.filter(conn => conn.sourceNodeId === nodeId);
            for (const connection of connections) {
                if (dfs(connection.targetNodeId)) return true;
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const node of blueprint.nodes) {
            if (dfs(node.id)) return true;
        }

        return false;
    }

    /**
     * Validates a connection between nodes
     */
    private validateConnection(blueprint: Blueprint, connection: BlueprintConnection): boolean {
        const sourceNode = blueprint.nodes.find(n => n.id === connection.sourceNodeId);
        const targetNode = blueprint.nodes.find(n => n.id === connection.targetNodeId);

        if (!sourceNode || !targetNode) return false;

        const sourcePin = sourceNode.outputs.find(p => p.id === connection.sourcePinId);
        const targetPin = targetNode.inputs.find(p => p.id === connection.targetPinId);

        if (!sourcePin || !targetPin) return false;

        // Check if types are compatible
        if (sourcePin.type !== targetPin.type) return false;

        // Check if target pin is already connected
        if (targetPin.connected) return false;

        return true;
    }

    /**
     * Generates a unique identifier
     */
    private generateUniqueId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Serializes a blueprint to JSON
     */
    serializeBlueprint(blueprintId: string): string {
        const blueprint = this.blueprints.get(blueprintId);
        if (!blueprint) throw new Error('Blueprint not found');
        return JSON.stringify(blueprint, null, 2);
    }

    /**
     * Deserializes a blueprint from JSON
     */
    deserializeBlueprint(json: string): Blueprint {
        const blueprint = JSON.parse(json) as Blueprint;
        this.blueprints.set(blueprint.id, blueprint);
        this.emit('blueprintLoaded', blueprint);
        return blueprint;
    }
}
