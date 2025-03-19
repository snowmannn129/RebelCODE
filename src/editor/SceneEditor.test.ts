import { Vector3, Quaternion } from '../../Core/Math';
import { SceneEditor, SceneObject } from './SceneEditor';

describe('SceneEditor', () => {
    let editor: SceneEditor;

    beforeEach(() => {
        editor = new SceneEditor();
    });

    test('creates object with default transform', () => {
        const id = editor.createObject('TestObject');
        const transform = editor.getObjectWorldTransform(id);

        expect(transform.position).toEqual(new Vector3(0, 0, 0));
        expect(transform.rotation).toEqual(new Quaternion(0, 0, 0, 1));
        expect(transform.scale).toEqual(new Vector3(1, 1, 1));
    });

    test('creates object with custom position', () => {
        const position = new Vector3(1, 2, 3);
        const id = editor.createObject('TestObject', position);
        const transform = editor.getObjectWorldTransform(id);

        expect(transform.position).toEqual(position);
    });

    test('deletes object and its children', () => {
        const parentId = editor.createObject('Parent');
        const childId = editor.createObject('Child');
        
        editor.setParent(childId, parentId);
        editor.deleteObject(parentId);

        const parentTransform = editor.getObjectWorldTransform(parentId);
        const childTransform = editor.getObjectWorldTransform(childId);

        expect(parentTransform.position).toEqual(new Vector3(0, 0, 0));
        expect(childTransform.position).toEqual(new Vector3(0, 0, 0));
    });

    test('handles parent-child transforms correctly', () => {
        const parentId = editor.createObject('Parent');
        const childId = editor.createObject('Child', new Vector3(0, 1, 0));
        
        // Set parent's transform
        const parent = editor.getObjectWorldTransform(parentId);
        parent.position = new Vector3(1, 0, 0);
        parent.rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
        parent.scale = new Vector3(2, 2, 2);

        editor.setParent(childId, parentId);
        const childWorldTransform = editor.getObjectWorldTransform(childId);

        // Child's local position (0,1,0) should be rotated 90 degrees around Y axis,
        // scaled by 2, and then offset by parent's position
        expect(childWorldTransform.position.x).toBeCloseTo(1);
        expect(childWorldTransform.position.y).toBeCloseTo(2);
        expect(childWorldTransform.position.z).toBeCloseTo(0);
    });

    test('manages components', () => {
        const id = editor.createObject('TestObject');
        const materialData = { color: '#FF0000', metallic: 0.5 };
        
        editor.addComponent(id, 'Material', materialData);
        const transform = editor.getObjectWorldTransform(id);
        
        expect(transform).toBeDefined();
        
        editor.removeComponent(id, 'Material');
        const transformAfterRemoval = editor.getObjectWorldTransform(id);
        
        expect(transformAfterRemoval).toBeDefined();
    });

    test('handles scene serialization', () => {
        const id = editor.createObject('TestObject', new Vector3(1, 2, 3));
        editor.addComponent(id, 'Material', { color: '#FF0000' });
        
        editor.saveScene('test.scene');
        editor.loadScene('test.scene');
        
        const transform = editor.getObjectWorldTransform(id);
        expect(transform.position).toEqual(new Vector3(0, 0, 0)); // New scene should be empty
    });
});
