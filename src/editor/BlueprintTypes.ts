/**
 * Defines the core types and interfaces for the Blueprint System
 */

export enum BlueprintNodeType {
    Event = 'Event',
    Function = 'Function',
    Variable = 'Variable',
    Flow = 'Flow',
    Math = 'Math',
    Logic = 'Logic',
    Custom = 'Custom'
}

export interface BlueprintPin {
    id: string;
    name: string;
    type: string;
    direction: 'input' | 'output';
    connected: boolean;
    value?: any;
}

export interface BlueprintNode {
    id: string;
    type: BlueprintNodeType;
    title: string;
    position: { x: number; y: number };
    inputs: BlueprintPin[];
    outputs: BlueprintPin[];
    metadata?: {
        description?: string;
        category?: string;
        tags?: string[];
    };
}

export interface BlueprintConnection {
    id: string;
    sourceNodeId: string;
    sourcePinId: string;
    targetNodeId: string;
    targetPinId: string;
}

export interface Blueprint {
    id: string;
    name: string;
    description?: string;
    nodes: BlueprintNode[];
    connections: BlueprintConnection[];
    variables: BlueprintVariable[];
    metadata: {
        author: string;
        created: Date;
        modified: Date;
        version: string;
        tags?: string[];
    };
}

export interface BlueprintVariable {
    id: string;
    name: string;
    type: string;
    defaultValue?: any;
    description?: string;
    category?: string;
    isExposed: boolean;
}

export interface BlueprintValidationResult {
    isValid: boolean;
    errors: BlueprintError[];
    warnings: BlueprintWarning[];
}

export interface BlueprintError {
    type: string;
    message: string;
    nodeId?: string;
    connectionId?: string;
}

export interface BlueprintWarning {
    type: string;
    message: string;
    nodeId?: string;
    connectionId?: string;
}
