import { Vector3, Quaternion } from '../../Core/Math';
import { SceneObject } from './SceneEditor';

export enum TransformMode {
    Translate = 'translate',
    Rotate = 'rotate',
    Scale = 'scale'
}

export class TransformControls {
    private attachedObject: SceneObject | null;
    private mode: TransformMode;
    private isDragging: boolean;
    private startDragPosition: Vector3;
    private startObjectTransform: {
        position: Vector3;
        rotation: Quaternion;
        scale: Vector3;
    } | null;

    constructor() {
        this.attachedObject = null;
        this.mode = TransformMode.Translate;
        this.isDragging = false;
        this.startDragPosition = new Vector3();
        this.startObjectTransform = null;
    }

    public attach(object: SceneObject): void {
        this.attachedObject = object;
    }

    public detach(): void {
        this.attachedObject = null;
        this.isDragging = false;
        this.startObjectTransform = null;
    }

    public setMode(mode: TransformMode): void {
        this.mode = mode;
    }

    public startDrag(mousePosition: Vector3): void {
        if (!this.attachedObject) return;

        this.isDragging = true;
        this.startDragPosition = mousePosition;
        this.startObjectTransform = {
            position: this.attachedObject.position.clone(),
            rotation: this.attachedObject.rotation.clone(),
            scale: this.attachedObject.scale.clone()
        };
    }

    public updateDrag(mousePosition: Vector3): void {
        if (!this.isDragging || !this.attachedObject || !this.startObjectTransform) return;

        const delta = mousePosition.subtract(this.startDragPosition);

        switch (this.mode) {
            case TransformMode.Translate:
                this.attachedObject.position = this.startObjectTransform.position.add(delta);
                break;

            case TransformMode.Rotate:
                // Convert mouse movement to rotation angles
                const rotationX = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), delta.y * 0.01);
                const rotationY = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), delta.x * 0.01);
                this.attachedObject.rotation = rotationY.multiply(rotationX.multiply(this.startObjectTransform.rotation));
                break;

            case TransformMode.Scale:
                // Use distance from start position to scale uniformly
                const scaleFactor = 1 + (delta.x + delta.y) * 0.01;
                this.attachedObject.scale = this.startObjectTransform.scale.multiply(scaleFactor);
                break;
        }
    }

    public endDrag(): void {
        this.isDragging = false;
        this.startObjectTransform = null;
    }

    public update(): void {
        // Handle any per-frame updates like gizmo rendering
        if (this.attachedObject) {
            this.updateGizmoTransform();
        }
    }

    private updateGizmoTransform(): void {
        // Update the visual transform gizmos based on the current mode and attached object
        if (!this.attachedObject) return;

        // In a real implementation, this would update the visual representation
        // of the transform controls (arrows, rotation rings, scale boxes, etc.)
        // based on the current transform mode and object's transform
    }

    public isAttached(): boolean {
        return this.attachedObject !== null;
    }

    public getMode(): TransformMode {
        return this.mode;
    }

    public getAttachedObject(): SceneObject | null {
        return this.attachedObject;
    }
}
