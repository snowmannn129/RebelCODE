import { SceneObject } from './SceneEditor';

export class SceneHierarchy {
    private rootObjects: Set<string>;
    private objectMap: Map<string, SceneObject>;

    constructor() {
        this.rootObjects = new Set();
        this.objectMap = new Map();
    }

    public addObject(object: SceneObject): void {
        this.objectMap.set(object.id, object);
        
        if (!object.parentId) {
            this.rootObjects.add(object.id);
        }
    }

    public removeObject(id: string): void {
        const object = this.objectMap.get(id);
        if (!object) return;

        if (!object.parentId) {
            this.rootObjects.delete(id);
        }

        this.objectMap.delete(id);
    }

    public clear(): void {
        this.rootObjects.clear();
        this.objectMap.clear();
    }

    public updateHierarchy(): void {
        this.rootObjects.clear();

        for (const object of this.objectMap.values()) {
            if (!object.parentId) {
                this.rootObjects.add(object.id);
            }
        }
    }

    public rebuildFromObjects(objects: SceneObject[]): void {
        this.clear();
        
        for (const object of objects) {
            this.addObject(object);
        }
        
        this.updateHierarchy();
    }

    public getHierarchyView(): Array<{ id: string; name: string; level: number }> {
        const result: Array<{ id: string; name: string; level: number }> = [];
        
        const processObject = (id: string, level: number) => {
            const object = this.objectMap.get(id);
            if (!object) return;
            
            result.push({
                id: object.id,
                name: object.name,
                level
            });
            
            for (const childId of object.children) {
                processObject(childId, level + 1);
            }
        };
        
        for (const rootId of this.rootObjects) {
            processObject(rootId, 0);
        }
        
        return result;
    }

    public findObjectById(id: string): SceneObject | undefined {
        return this.objectMap.get(id);
    }

    public getRootObjects(): string[] {
        return Array.from(this.rootObjects);
    }

    public getChildren(id: string): string[] {
        const object = this.objectMap.get(id);
        return object ? object.children : [];
    }

    public getParent(id: string): string | undefined {
        const object = this.objectMap.get(id);
        return object?.parentId;
    }
}
