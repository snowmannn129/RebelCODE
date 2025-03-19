import { BlueprintNode, BlueprintNodeType, BlueprintPin } from './BlueprintTypes';

/**
 * Defines categories for organizing nodes
 */
export enum NodeCategory {
    Flow = 'Flow Control',
    Math = 'Mathematics',
    Logic = 'Logic',
    Variables = 'Variables',
    Functions = 'Functions',
    Events = 'Events',
    Utilities = 'Utilities',
    Animation = 'Animation',
    Physics = 'Physics',
    Audio = 'Audio',
    Input = 'Input',
    Debug = 'Debug'
}

/**
 * Interface for node template metadata
 */
export interface NodeTemplate {
    id: string;
    type: BlueprintNodeType;
    category: NodeCategory;
    title: string;
    description: string;
    inputs: BlueprintPin[];
    outputs: BlueprintPin[];
    execute?: (inputs: any) => any;
}

/**
 * Manages the library of available node types
 */
export class BlueprintNodeLibrary {
    private static instance: BlueprintNodeLibrary;
    private nodeTemplates: Map<string, NodeTemplate> = new Map();

    private constructor() {
        this.registerDefaultNodes();
    }

    public static getInstance(): BlueprintNodeLibrary {
        if (!BlueprintNodeLibrary.instance) {
            BlueprintNodeLibrary.instance = new BlueprintNodeLibrary();
        }
        return BlueprintNodeLibrary.instance;
    }

    /**
     * Registers a new node template
     */
    public registerNode(template: NodeTemplate): void {
        this.nodeTemplates.set(template.id, template);
    }

    /**
     * Gets a node template by ID
     */
    public getNode(id: string): NodeTemplate | undefined {
        return this.nodeTemplates.get(id);
    }

    /**
     * Gets all node templates in a category
     */
    public getNodesByCategory(category: NodeCategory): NodeTemplate[] {
        return Array.from(this.nodeTemplates.values())
            .filter(template => template.category === category);
    }

    /**
     * Gets all available categories that have nodes
     */
    public getCategories(): NodeCategory[] {
        const categories = new Set<NodeCategory>();
        this.nodeTemplates.forEach(template => categories.add(template.category));
        return Array.from(categories);
    }

    /**
     * Searches for nodes matching a query
     */
    public searchNodes(query: string): NodeTemplate[] {
        const lowercaseQuery = query.toLowerCase();
        return Array.from(this.nodeTemplates.values())
            .filter(template => 
                template.title.toLowerCase().includes(lowercaseQuery) ||
                template.description.toLowerCase().includes(lowercaseQuery)
            );
    }

    /**
     * Creates a new node instance from a template
     */
    public createNode(templateId: string, position: { x: number; y: number }): BlueprintNode | null {
        const template = this.nodeTemplates.get(templateId);
        if (!template) return null;

        return {
            id: this.generateUniqueId(),
            type: template.type,
            title: template.title,
            position,
            inputs: [...template.inputs],
            outputs: [...template.outputs],
            metadata: {
                description: template.description,
                category: template.category
            }
        };
    }

    private generateUniqueId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Registers the default node templates
     */
    private registerDefaultNodes(): void {
        // Flow Control Nodes
        this.registerNode({
            id: 'sequence',
            type: BlueprintNodeType.Flow,
            category: NodeCategory.Flow,
            title: 'Sequence',
            description: 'Executes a sequence of operations in order',
            inputs: [
                { id: 'exec', name: 'Execution', type: 'execution', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'then1', name: 'Then 1', type: 'execution', direction: 'output', connected: false },
                { id: 'then2', name: 'Then 2', type: 'execution', direction: 'output', connected: false },
                { id: 'then3', name: 'Then 3', type: 'execution', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                // Execution logic would be implemented in the execution engine
                return { sequence: true };
            }
        });

        this.registerNode({
            id: 'branch',
            type: BlueprintNodeType.Flow,
            category: NodeCategory.Flow,
            title: 'Branch',
            description: 'Executes one of two branches based on a condition',
            inputs: [
                { id: 'exec', name: 'Execution', type: 'execution', direction: 'input', connected: false },
                { id: 'condition', name: 'Condition', type: 'boolean', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'true', name: 'True', type: 'execution', direction: 'output', connected: false },
                { id: 'false', name: 'False', type: 'execution', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                return { branch: inputs.condition };
            }
        });

        // Math Nodes
        this.registerNode({
            id: 'add',
            type: BlueprintNodeType.Math,
            category: NodeCategory.Math,
            title: 'Add',
            description: 'Adds two numbers together',
            inputs: [
                { id: 'a', name: 'A', type: 'number', direction: 'input', connected: false },
                { id: 'b', name: 'B', type: 'number', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'result', name: 'Result', type: 'number', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                return { result: inputs.a + inputs.b };
            }
        });

        this.registerNode({
            id: 'vector3',
            type: BlueprintNodeType.Math,
            category: NodeCategory.Math,
            title: 'Make Vector3',
            description: 'Creates a 3D vector from X, Y, Z components',
            inputs: [
                { id: 'x', name: 'X', type: 'number', direction: 'input', connected: false },
                { id: 'y', name: 'Y', type: 'number', direction: 'input', connected: false },
                { id: 'z', name: 'Z', type: 'number', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'vector', name: 'Vector', type: 'vector3', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                return { vector: { x: inputs.x, y: inputs.y, z: inputs.z } };
            }
        });

        // Variable Nodes
        this.registerNode({
            id: 'get_variable',
            type: BlueprintNodeType.Variable,
            category: NodeCategory.Variables,
            title: 'Get Variable',
            description: 'Gets the value of a variable',
            inputs: [
                { id: 'name', name: 'Variable Name', type: 'string', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'value', name: 'Value', type: 'any', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                // Variable access would be handled by the execution engine
                return { value: null };
            }
        });

        this.registerNode({
            id: 'set_variable',
            type: BlueprintNodeType.Variable,
            category: NodeCategory.Variables,
            title: 'Set Variable',
            description: 'Sets the value of a variable',
            inputs: [
                { id: 'exec', name: 'Execution', type: 'execution', direction: 'input', connected: false },
                { id: 'name', name: 'Variable Name', type: 'string', direction: 'input', connected: false },
                { id: 'value', name: 'Value', type: 'any', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'then', name: 'Then', type: 'execution', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                // Variable setting would be handled by the execution engine
                return { success: true };
            }
        });

        // Event Nodes
        this.registerNode({
            id: 'on_start',
            type: BlueprintNodeType.Event,
            category: NodeCategory.Events,
            title: 'On Start',
            description: 'Triggered when the blueprint starts execution',
            inputs: [],
            outputs: [
                { id: 'exec', name: 'Execution', type: 'execution', direction: 'output', connected: false }
            ]
        });

        this.registerNode({
            id: 'on_update',
            type: BlueprintNodeType.Event,
            category: NodeCategory.Events,
            title: 'On Update',
            description: 'Triggered every frame',
            inputs: [],
            outputs: [
                { id: 'exec', name: 'Execution', type: 'execution', direction: 'output', connected: false },
                { id: 'delta_time', name: 'Delta Time', type: 'number', direction: 'output', connected: false }
            ]
        });

        // Debug Nodes
        this.registerNode({
            id: 'print',
            type: BlueprintNodeType.Function,
            category: NodeCategory.Debug,
            title: 'Print',
            description: 'Prints a value to the console',
            inputs: [
                { id: 'exec', name: 'Execution', type: 'execution', direction: 'input', connected: false },
                { id: 'value', name: 'Value', type: 'any', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'then', name: 'Then', type: 'execution', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                console.log(inputs.value);
                return { success: true };
            }
        });

        // Additional Math Nodes
        this.registerNode({
            id: 'sin',
            type: BlueprintNodeType.Math,
            category: NodeCategory.Math,
            title: 'Sine',
            description: 'Calculates the sine of an angle in radians',
            inputs: [
                { id: 'angle', name: 'Angle', type: 'number', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'result', name: 'Result', type: 'number', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                return { result: Math.sin(inputs.angle) };
            }
        });

        this.registerNode({
            id: 'vector_dot',
            type: BlueprintNodeType.Math,
            category: NodeCategory.Math,
            title: 'Vector Dot Product',
            description: 'Calculates the dot product of two vectors',
            inputs: [
                { id: 'vector1', name: 'Vector 1', type: 'vector3', direction: 'input', connected: false },
                { id: 'vector2', name: 'Vector 2', type: 'vector3', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'result', name: 'Result', type: 'number', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                return {
                    result: inputs.vector1.x * inputs.vector2.x +
                           inputs.vector1.y * inputs.vector2.y +
                           inputs.vector1.z * inputs.vector2.z
                };
            }
        });

        // Logic Nodes
        this.registerNode({
            id: 'compare',
            type: BlueprintNodeType.Logic,
            category: NodeCategory.Logic,
            title: 'Compare',
            description: 'Compares two values',
            inputs: [
                { id: 'a', name: 'A', type: 'number', direction: 'input', connected: false },
                { id: 'b', name: 'B', type: 'number', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'equal', name: 'Equal', type: 'boolean', direction: 'output', connected: false },
                { id: 'greater', name: 'Greater Than', type: 'boolean', direction: 'output', connected: false },
                { id: 'less', name: 'Less Than', type: 'boolean', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                return {
                    equal: inputs.a === inputs.b,
                    greater: inputs.a > inputs.b,
                    less: inputs.a < inputs.b
                };
            }
        });

        // Animation Nodes
        this.registerNode({
            id: 'play_animation',
            type: BlueprintNodeType.Function,
            category: NodeCategory.Animation,
            title: 'Play Animation',
            description: 'Plays an animation on a target',
            inputs: [
                { id: 'exec', name: 'Execution', type: 'execution', direction: 'input', connected: false },
                { id: 'target', name: 'Target', type: 'object', direction: 'input', connected: false },
                { id: 'animation', name: 'Animation', type: 'string', direction: 'input', connected: false },
                { id: 'speed', name: 'Speed', type: 'number', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'then', name: 'Then', type: 'execution', direction: 'output', connected: false },
                { id: 'finished', name: 'On Finished', type: 'execution', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                // Animation playback would be handled by the animation system
                return { success: true };
            }
        });

        // Physics Nodes
        this.registerNode({
            id: 'apply_force',
            type: BlueprintNodeType.Function,
            category: NodeCategory.Physics,
            title: 'Apply Force',
            description: 'Applies a force to a physics object',
            inputs: [
                { id: 'exec', name: 'Execution', type: 'execution', direction: 'input', connected: false },
                { id: 'target', name: 'Target', type: 'object', direction: 'input', connected: false },
                { id: 'force', name: 'Force', type: 'vector3', direction: 'input', connected: false },
                { id: 'mode', name: 'Mode', type: 'string', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'then', name: 'Then', type: 'execution', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                // Force application would be handled by the physics system
                return { success: true };
            }
        });

        // Audio Nodes
        this.registerNode({
            id: 'play_sound',
            type: BlueprintNodeType.Function,
            category: NodeCategory.Audio,
            title: 'Play Sound',
            description: 'Plays a sound effect',
            inputs: [
                { id: 'exec', name: 'Execution', type: 'execution', direction: 'input', connected: false },
                { id: 'sound', name: 'Sound', type: 'string', direction: 'input', connected: false },
                { id: 'volume', name: 'Volume', type: 'number', direction: 'input', connected: false },
                { id: 'position', name: 'Position', type: 'vector3', direction: 'input', connected: false }
            ],
            outputs: [
                { id: 'then', name: 'Then', type: 'execution', direction: 'output', connected: false },
                { id: 'finished', name: 'On Finished', type: 'execution', direction: 'output', connected: false }
            ],
            execute: (inputs) => {
                // Sound playback would be handled by the audio system
                return { success: true };
            }
        });
    }
}
