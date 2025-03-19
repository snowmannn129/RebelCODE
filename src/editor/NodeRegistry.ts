/**
 * Manages the registration and creation of node types in the visual scripting system
 */

import { NodeCategory, NodeData, DataType, NodePort } from "./NodeTypes";

export interface NodeTemplate {
    category: NodeCategory;
    title: string;
    description: string;
    inputs: NodePort[];
    outputs: NodePort[];
    initialize?: (data: NodeData) => void;
    execute?: (inputs: Record<string, any>) => Record<string, any>;
}

export class NodeRegistry {
    private static instance: NodeRegistry;
    private nodeTemplates: Map<string, NodeTemplate> = new Map();

    private constructor() {
        this.registerDefaultNodes();
    }

    public static getInstance(): NodeRegistry {
        if (!NodeRegistry.instance) {
            NodeRegistry.instance = new NodeRegistry();
        }
        return NodeRegistry.instance;
    }

    public registerNode(type: string, template: NodeTemplate): void {
        if (this.nodeTemplates.has(type)) {
            throw new Error(`Node type '${type}' is already registered`);
        }
        this.nodeTemplates.set(type, template);
    }

    public createNode(type: string, id: string, position: { x: number; y: number }): NodeData {
        const template = this.nodeTemplates.get(type);
        if (!template) {
            throw new Error(`Node type '${type}' not found`);
        }

        const node: NodeData = {
            id,
            category: template.category,
            title: template.title,
            inputs: [...template.inputs],
            outputs: [...template.outputs],
            position,
            data: {}
        };

        if (template.initialize) {
            template.initialize(node);
        }

        return node;
    }

    public getNodeTemplate(type: string): NodeTemplate | undefined {
        return this.nodeTemplates.get(type);
    }

    public getAllNodeTypes(): string[] {
        return Array.from(this.nodeTemplates.keys());
    }

    private registerDefaultNodes(): void {
        // Flow control nodes
        this.registerNode("branch", {
            category: NodeCategory.Flow,
            title: "Branch",
            description: "Conditional branching node",
            inputs: [
                { id: "condition", name: "Condition", type: DataType.Boolean, isInput: true },
                { id: "value", name: "Value", type: DataType.Any, isInput: true }
            ],
            outputs: [
                { id: "true", name: "True", type: DataType.Any, isInput: false },
                { id: "false", name: "False", type: DataType.Any, isInput: false }
            ],
            execute: (inputs) => ({
                true: inputs.condition ? inputs.value : undefined,
                false: !inputs.condition ? inputs.value : undefined
            })
        });

        // Math nodes
        this.registerNode("add", {
            category: NodeCategory.Math,
            title: "Add",
            description: "Adds two numbers",
            inputs: [
                { id: "a", name: "A", type: DataType.Number, isInput: true },
                { id: "b", name: "B", type: DataType.Number, isInput: true }
            ],
            outputs: [
                { id: "result", name: "Result", type: DataType.Number, isInput: false }
            ],
            execute: (inputs) => ({
                result: (inputs.a || 0) + (inputs.b || 0)
            })
        });

        // Variable nodes
        this.registerNode("variable", {
            category: NodeCategory.Variables,
            title: "Variable",
            description: "Variable reference node",
            inputs: [
                { id: "set", name: "Set", type: DataType.Any, isInput: true }
            ],
            outputs: [
                { id: "value", name: "Value", type: DataType.Any, isInput: false }
            ],
            initialize: (node) => {
                node.data = { variableId: "", variableName: "" };
            }
        });

        // Event nodes
        this.registerNode("onStart", {
            category: NodeCategory.Events,
            title: "On Start",
            description: "Triggered when the script starts",
            inputs: [],
            outputs: [
                { id: "trigger", name: "Trigger", type: DataType.Any, isInput: false }
            ]
        });
    }
}
