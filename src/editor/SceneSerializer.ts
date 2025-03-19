import { Vector3, Quaternion } from '../../Core/Math';
import { SceneObject } from './SceneEditor';

interface SerializedVector3 {
    x: number;
    y: number;
    z: number;
}

interface SerializedQuaternion {
    x: number;
    y: number;
    z: number;
    w: number;
}

interface SerializedSceneObject {
    id: string;
    name: string;
    position: SerializedVector3;
    rotation: SerializedQuaternion;
    scale: SerializedVector3;
    parentId?: string;
    children: string[];
    components: Array<{
        type: string;
        data: any;
    }>;
}

export class SceneSerializer {
    public saveScene(filename: string, objects: SceneObject[]): void {
        const serializedObjects = objects.map(obj => this.serializeObject(obj));
        const sceneData = JSON.stringify(serializedObjects, null, 2);
        
        // In a real implementation, this would write to a file
        // For now, we'll just log it
        console.log(`Saving scene to ${filename}:`, sceneData);
    }

    public loadScene(filename: string): SceneObject[] {
        // In a real implementation, this would read from a file
        // For now, we'll return an empty scene
        return [];
    }

    private serializeObject(obj: SceneObject): SerializedSceneObject {
        const components: Array<{ type: string; data: any }> = [];
        obj.components.forEach((data, type) => {
            components.push({ type, data });
        });

        return {
            id: obj.id,
            name: obj.name,
            position: this.serializeVector3(obj.position),
            rotation: this.serializeQuaternion(obj.rotation),
            scale: this.serializeVector3(obj.scale),
            parentId: obj.parentId,
            children: obj.children,
            components
        };
    }

    private deserializeObject(data: SerializedSceneObject): SceneObject {
        const components = new Map<string, any>();
        data.components.forEach(comp => {
            components.set(comp.type, comp.data);
        });

        return {
            id: data.id,
            name: data.name,
            position: this.deserializeVector3(data.position),
            rotation: this.deserializeQuaternion(data.rotation),
            scale: this.deserializeVector3(data.scale),
            parentId: data.parentId,
            children: data.children,
            components
        };
    }

    private serializeVector3(vec: Vector3): SerializedVector3 {
        return {
            x: vec.x,
            y: vec.y,
            z: vec.z
        };
    }

    private deserializeVector3(data: SerializedVector3): Vector3 {
        return new Vector3(data.x, data.y, data.z);
    }

    private serializeQuaternion(quat: Quaternion): SerializedQuaternion {
        return {
            x: quat.x,
            y: quat.y,
            z: quat.z,
            w: quat.w
        };
    }

    private deserializeQuaternion(data: SerializedQuaternion): Quaternion {
        return new Quaternion(data.x, data.y, data.z, data.w);
    }
}
