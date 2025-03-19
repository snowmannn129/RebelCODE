import { BlueprintManager } from './BlueprintManager';
import { BlueprintNodeLibrary } from './BlueprintNodeLibrary';
import { BlueprintExecutionEngine } from './BlueprintExecutionEngine';
import { BlueprintNodeType } from './BlueprintTypes';

describe('Blueprint System', () => {
    let manager: BlueprintManager;
    let nodeLibrary: BlueprintNodeLibrary;
    let executionEngine: BlueprintExecutionEngine;

    beforeEach(() => {
        manager = new BlueprintManager();
        nodeLibrary = BlueprintNodeLibrary.getInstance();
        executionEngine = BlueprintExecutionEngine.getInstance();
    });

    describe('Blueprint Creation', () => {
        it('should create a new blueprint', () => {
            const blueprint = manager.createBlueprint('Test Blueprint', 'Test Author');
            expect(blueprint).toBeDefined();
            expect(blueprint.name).toBe('Test Blueprint');
            expect(blueprint.metadata.author).toBe('Test Author');
            expect(blueprint.nodes).toHaveLength(0);
            expect(blueprint.connections).toHaveLength(0);
        });
    });

    describe('Node Management', () => {
        it('should add a node to a blueprint', () => {
            const blueprint = manager.createBlueprint('Test Blueprint', 'Test Author');
            const node = manager.addNode(blueprint.id, 'add', { x: 100, y: 100 });
            
            expect(node).toBeDefined();
            expect(node?.type).toBe(BlueprintNodeType.Math);
            expect(node?.title).toBe('Add');
            expect(node?.position).toEqual({ x: 100, y: 100 });
        });

        it('should not add a node with invalid type', () => {
            const blueprint = manager.createBlueprint('Test Blueprint', 'Test Author');
            const node = manager.addNode(blueprint.id, 'invalid_type', { x: 100, y: 100 });
            
            expect(node).toBeNull();
        });
    });

    describe('Node Connections', () => {
        it('should create a valid connection between nodes', () => {
            const blueprint = manager.createBlueprint('Test Blueprint', 'Test Author');
            
            // Create two nodes
            const sourceNode = manager.addNode(blueprint.id, 'add', { x: 100, y: 100 });
            const targetNode = manager.addNode(blueprint.id, 'print', { x: 300, y: 100 });
            
            expect(sourceNode).toBeDefined();
            expect(targetNode).toBeDefined();

            if (sourceNode && targetNode) {
                // Connect output of add to input of print
                const connection = manager.connect(
                    blueprint.id,
                    sourceNode.id,
                    'result',
                    targetNode.id,
                    'value'
                );

                expect(connection).toBeDefined();
                expect(connection?.sourceNodeId).toBe(sourceNode.id);
                expect(connection?.targetNodeId).toBe(targetNode.id);
            }
        });

        it('should not create invalid connections', () => {
            const blueprint = manager.createBlueprint('Test Blueprint', 'Test Author');
            
            // Create two nodes
            const sourceNode = manager.addNode(blueprint.id, 'add', { x: 100, y: 100 });
            const targetNode = manager.addNode(blueprint.id, 'print', { x: 300, y: 100 });
            
            expect(sourceNode).toBeDefined();
            expect(targetNode).toBeDefined();

            if (sourceNode && targetNode) {
                // Try to connect incompatible pins
                const connection = manager.connect(
                    blueprint.id,
                    sourceNode.id,
                    'invalid_pin',
                    targetNode.id,
                    'value'
                );

                expect(connection).toBeNull();
            }
        });
    });

    describe('Blueprint Validation', () => {
        it('should validate a blueprint with no errors', () => {
            const blueprint = manager.createBlueprint('Test Blueprint', 'Test Author');
            
            // Create a simple math operation with print
            const addNode = manager.addNode(blueprint.id, 'add', { x: 100, y: 100 });
            const printNode = manager.addNode(blueprint.id, 'print', { x: 300, y: 100 });
            
            if (addNode && printNode) {
                manager.connect(
                    blueprint.id,
                    addNode.id,
                    'result',
                    printNode.id,
                    'value'
                );

                const result = manager.validateBlueprint(blueprint.id);
                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            }
        });

        it('should detect circular dependencies', () => {
            const blueprint = manager.createBlueprint('Test Blueprint', 'Test Author');
            
            // Create nodes that form a cycle
            const node1 = manager.addNode(blueprint.id, 'add', { x: 100, y: 100 });
            const node2 = manager.addNode(blueprint.id, 'add', { x: 300, y: 100 });
            
            if (node1 && node2) {
                // Create circular connection (this is just for testing, in practice this would be prevented)
                manager.connect(blueprint.id, node1.id, 'result', node2.id, 'a');
                manager.connect(blueprint.id, node2.id, 'result', node1.id, 'a');

                const result = manager.validateBlueprint(blueprint.id);
                expect(result.isValid).toBe(false);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0].type).toBe('CircularDependency');
            }
        });
    });

    describe('Blueprint Execution', () => {
        it('should execute a simple math operation', (done) => {
            const blueprint = manager.createBlueprint('Test Blueprint', 'Test Author');
            
            // Create a simple addition operation
            const addNode = manager.addNode(blueprint.id, 'add', { x: 100, y: 100 });
            const printNode = manager.addNode(blueprint.id, 'print', { x: 300, y: 100 });
            
            if (addNode && printNode) {
                // Set input values
                addNode.inputs[0].value = 5;
                addNode.inputs[1].value = 3;

                // Connect add to print
                manager.connect(
                    blueprint.id,
                    addNode.id,
                    'result',
                    printNode.id,
                    'value'
                );

                // Start execution
                executionEngine.startExecution(blueprint);

                // Listen for node execution
                executionEngine.on('nodeExecuted', (event) => {
                    if (event.nodeId === printNode.id) {
                        expect(event.result.value).toBe(8);
                        executionEngine.stopExecution(blueprint.id);
                        done();
                    }
                });
            } else {
                done.fail('Failed to create nodes');
            }
        });
    });

    describe('Serialization', () => {
        it('should serialize and deserialize a blueprint', () => {
            const blueprint = manager.createBlueprint('Test Blueprint', 'Test Author');
            
            // Add some nodes and connections
            const addNode = manager.addNode(blueprint.id, 'add', { x: 100, y: 100 });
            const printNode = manager.addNode(blueprint.id, 'print', { x: 300, y: 100 });
            
            if (addNode && printNode) {
                manager.connect(
                    blueprint.id,
                    addNode.id,
                    'result',
                    printNode.id,
                    'value'
                );

                // Serialize
                const serialized = manager.serializeBlueprint(blueprint.id);
                expect(serialized).toBeDefined();
                expect(typeof serialized).toBe('string');

                // Deserialize
                const deserialized = manager.deserializeBlueprint(serialized);
                expect(deserialized).toBeDefined();
                expect(deserialized.name).toBe(blueprint.name);
                expect(deserialized.nodes).toHaveLength(blueprint.nodes.length);
                expect(deserialized.connections).toHaveLength(blueprint.connections.length);
            }
        });
    });
});
