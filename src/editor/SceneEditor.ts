import { Vector3, Quaternion } from '../../Core/Math';
import { SceneHierarchy } from './SceneHierarchy';
import { TransformControls } from './TransformControls';
import { SceneSerializer } from './SceneSerializer';
import { CameraSystem } from './CameraSystem';

export interface SceneObject {
    id: string;
    name: string;
    position: Vector3;
    rotation: Quaternion;
    scale: Vector3;
    parentId?: string;
    children: string[];
    components: Map<string, any>;
}

export class SceneEditor {
    private objects: Map<string, SceneObject>;
    private selectedObjectId: string | null;
    private hierarchy: SceneHierarchy;
    private transformControls: TransformControls;
    private serializer: SceneSerializer;
    private camera: CameraSystem;

    constructor() {
        this.objects = new Map();
        this.selectedObjectId = null;
        this.hierarchy = new SceneHierarchy();
        this.transformControls = new TransformControls();
        this.serializer = new SceneSerializer();
        this.camera = new CameraSystem();
    }

    public getObjects(): Map<string, SceneObject> {
        return this.objects;
    }

    public getSelectedObjectId(): string | null {
        return this.selectedObjectId;
    }

    public getCamera(): CameraSystem {
        return this.camera;
    }

    public createObject(name: string, position: Vector3 = new Vector3(0, 0, 0)): string {
        const id = crypto.randomUUID();
        const object: SceneObject = {
            id,
            name,
            position,
            rotation: new Quaternion(),
            scale: new Vector3(1, 1, 1),
            children: [],
            components: new Map()
        };

        this.objects.set(id, object);
        this.hierarchy.addObject(object);
        return id;
    }

    public deleteObject(id: string): void {
        const object = this.objects.get(id);
        if (!object) return;

        // Delete children recursively
        for (const childId of object.children) {
            this.deleteObject(childId);
        }

        // Remove from parent's children list
        if (object.parentId) {
            const parent = this.objects.get(object.parentId);
            if (parent) {
                parent.children = parent.children.filter(childId => childId !== id);
            }
        }

        this.hierarchy.removeObject(id);
        this.objects.delete(id);

        if (this.selectedObjectId === id) {
            this.selectedObjectId = null;
            this.transformControls.detach();
        }
    }

    public selectObject(id: string | null): void {
        this.selectedObjectId = id;
        if (id) {
            const object = this.objects.get(id);
            if (object) {
                this.transformControls.attach(object);
                this.camera.focusOnPoint(object.position);
            }
        } else {
            this.transformControls.detach();
        }
    }

    public setParent(childId: string, parentId: string | null): void {
        const child = this.objects.get(childId);
        if (!child) return;

        // Remove from old parent
        if (child.parentId) {
            const oldParent = this.objects.get(child.parentId);
            if (oldParent) {
                oldParent.children = oldParent.children.filter(id => id !== childId);
            }
        }

        // Add to new parent
        if (parentId) {
            const newParent = this.objects.get(parentId);
            if (newParent) {
                newParent.children.push(childId);
                child.parentId = parentId;
            }
        } else {
            child.parentId = undefined;
        }

        this.hierarchy.updateHierarchy();
    }

    public addComponent(objectId: string, componentType: string, data: any): void {
        const object = this.objects.get(objectId);
        if (!object) return;

        object.components.set(componentType, data);
    }

    public removeComponent(objectId: string, componentType: string): void {
        const object = this.objects.get(objectId);
        if (!object) return;

        object.components.delete(componentType);
    }

    public getObjectWorldTransform(id: string): { position: Vector3; rotation: Quaternion; scale: Vector3 } {
        const object = this.objects.get(id);
        if (!object) {
            return {
                position: new Vector3(),
                rotation: new Quaternion(),
                scale: new Vector3(1, 1, 1)
            };
        }

        let worldPosition = object.position.clone();
        let worldRotation = object.rotation.clone();
        let worldScale = object.scale.clone();

        let currentParentId = object.parentId;
        while (currentParentId) {
            const parent = this.objects.get(currentParentId);
            if (!parent) break;

            // Accumulate transforms
            worldPosition = parent.rotation.rotateVector(worldPosition.multiply(parent.scale)).add(parent.position);
            worldRotation = parent.rotation.multiply(worldRotation);
            worldScale = worldScale.multiply(parent.scale);

            currentParentId = parent.parentId;
        }

        return {
            position: worldPosition,
            rotation: worldRotation,
            scale: worldScale
        };
    }

    public saveScene(filename: string): void {
        this.serializer.saveScene(filename, Array.from(this.objects.values()));
    }

    public loadScene(filename: string): void {
        const sceneData = this.serializer.loadScene(filename);
        
        // Clear current scene
        this.objects.clear();
        this.selectedObjectId = null;
        this.hierarchy.clear();
        this.transformControls.detach();

        // Reset camera to default position
        this.camera.setPosition(new Vector3(0, 5, 10));
        this.camera.setTarget(new Vector3(0, 0, 0));

        // Load objects
        for (const objectData of sceneData) {
            this.objects.set(objectData.id, objectData);
        }

        // Rebuild hierarchy
        this.hierarchy.rebuildFromObjects(Array.from(this.objects.values()));
    }

    public update(): void {
        this.transformControls.update();
        // Camera updates are handled through its own methods
        // based on user input in the SceneEditorGUI
    }
}
