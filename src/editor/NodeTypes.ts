/**
 * Defines the types and interfaces for the visual scripting system nodes
 */

export enum NodeCategory {
    Flow = 'Flow',
    Variables = 'Variables',
    Math = 'Math',
    Logic = 'Logic',
    Events = 'Events',
    Functions = 'Functions',
    Custom = 'Custom'
}

export enum DataType {
    Boolean = 'Boolean',
    Number = 'Number',
    String = 'String',
    Vector = 'Vector',
    Object = 'Object',
    Any = 'Any'
}

export interface NodePort {
    id: string;
    name: string;
    type: DataType;
    isInput: boolean;
    allowMultipleConnections?: boolean;
}

export interface NodeData {
    id: string;
    category: NodeCategory;
    title: string;
    inputs: NodePort[];
    outputs: NodePort[];
    position: { x: number; y: number };
    data?: Record<string, any>;
}

export interface Connection {
    id: string;
    sourceNodeId: string;
    sourcePortId: string;
    targetNodeId: string;
    targetPortId: string;
}

export interface GraphData {
    nodes: NodeData[];
    connections: Connection[];
    variables: VariableDefinition[];
}

export interface VariableDefinition {
    id: string;
    name: string;
    type: DataType;
    defaultValue: any;
    description?: string;
}
