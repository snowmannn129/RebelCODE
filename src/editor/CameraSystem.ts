import { Vector3, Quaternion } from '../../Core/Math';

export enum CameraType {
    Perspective,
    Orthographic
}

export interface CameraSettings {
    fov: number;
    nearPlane: number;
    farPlane: number;
    orthographicSize: number;
}

export class CameraSystem {
    private position: Vector3;
    private rotation: Quaternion;
    private target: Vector3;
    private type: CameraType;
    private settings: CameraSettings;
    private isDragging: boolean;
    private lastMousePosition: { x: number; y: number };

    constructor() {
        this.position = new Vector3(0, 5, 10);
        this.rotation = new Quaternion();
        this.target = new Vector3(0, 0, 0);
        this.type = CameraType.Perspective;
        this.settings = {
            fov: 60,
            nearPlane: 0.1,
            farPlane: 1000,
            orthographicSize: 5
        };
        this.isDragging = false;
        this.lastMousePosition = { x: 0, y: 0 };
    }

    public getPosition(): Vector3 {
        return this.position.clone();
    }

    public getRotation(): Quaternion {
        return this.rotation.clone();
    }

    public getTarget(): Vector3 {
        return this.target.clone();
    }

    public getType(): CameraType {
        return this.type;
    }

    public getSettings(): CameraSettings {
        return { ...this.settings };
    }

    public setPosition(position: Vector3): void {
        this.position = position.clone();
        this.updateRotation();
    }

    public setTarget(target: Vector3): void {
        this.target = target.clone();
        this.updateRotation();
    }

    public setCameraType(type: CameraType): void {
        this.type = type;
    }

    public updateSettings(settings: Partial<CameraSettings>): void {
        this.settings = { ...this.settings, ...settings };
    }

    public startOrbit(mouseX: number, mouseY: number): void {
        this.isDragging = true;
        this.lastMousePosition = { x: mouseX, y: mouseY };
    }

    public orbit(mouseX: number, mouseY: number): void {
        if (!this.isDragging) return;

        const deltaX = mouseX - this.lastMousePosition.x;
        const deltaY = mouseY - this.lastMousePosition.y;

        // Convert to radians and scale
        const rotationSpeed = 0.005;
        const horizontalRotation = deltaX * rotationSpeed;
        const verticalRotation = deltaY * rotationSpeed;

        // Calculate the direction vector from target to camera
        let direction = this.position.subtract(this.target);
        const distance = direction.length();

        // Rotate around Y axis for horizontal movement
        const horizontalRotationQuat = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), horizontalRotation);
        direction = horizontalRotationQuat.rotateVector(direction);

        // Rotate around right vector for vertical movement
        const right = new Vector3(0, 1, 0).cross(direction.normalize());
        const verticalRotationQuat = new Quaternion().setFromAxisAngle(right, verticalRotation);
        direction = verticalRotationQuat.rotateVector(direction);

        // Update camera position while maintaining distance
        this.position = this.target.add(direction.normalize().multiply(new Vector3(distance, distance, distance)));
        this.updateRotation();

        this.lastMousePosition = { x: mouseX, y: mouseY };
    }

    public stopOrbit(): void {
        this.isDragging = false;
    }

    public zoom(delta: number): void {
        const zoomSpeed = 0.1;
        const direction = this.position.subtract(this.target).normalize();
        const distance = this.position.subtract(this.target).length();
        
        // Calculate new distance with limits
        const newDistance = Math.max(0.1, Math.min(100, distance - delta * zoomSpeed));
        
        // Update position while maintaining direction
        this.position = this.target.add(direction.multiply(new Vector3(newDistance, newDistance, newDistance)));
    }

    public pan(deltaX: number, deltaY: number): void {
        const panSpeed = 0.01;
        const right = new Vector3(0, 1, 0).cross(this.position.subtract(this.target).normalize());
        const up = right.cross(this.position.subtract(this.target).normalize());

        const panDelta = right.multiply(new Vector3(deltaX * panSpeed))
            .add(up.multiply(new Vector3(deltaY * panSpeed)));

        this.position = this.position.add(panDelta);
        this.target = this.target.add(panDelta);
    }

    public focusOnPoint(point: Vector3): void {
        this.target = point.clone();
        const direction = this.position.subtract(this.target).normalize();
        const distance = 5; // Default focus distance
        this.position = this.target.add(direction.multiply(new Vector3(distance, distance, distance)));
        this.updateRotation();
    }

    private updateRotation(): void {
        // Calculate the rotation to look at the target
        const direction = this.target.subtract(this.position).normalize();
        const up = new Vector3(0, 1, 0);
        
        // Calculate right vector
        const right = up.cross(direction).normalize();
        
        // Recalculate up vector to ensure orthogonality
        const newUp = direction.cross(right);

        // Create rotation to align with the calculated basis vectors
        const forward = direction.multiply(-1).normalize();
        
        // Store current rotation components
        const m00 = right.x;
        const m01 = newUp.x;
        const m02 = forward.x;
        const m10 = right.y;
        const m11 = newUp.y;
        const m12 = forward.y;
        const m20 = right.z;
        const m21 = newUp.z;
        const m22 = forward.z;

        // Convert rotation matrix to quaternion
        const trace = m00 + m11 + m22;
        
        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            this.rotation.w = 0.25 / s;
            this.rotation.x = (m21 - m12) * s;
            this.rotation.y = (m02 - m20) * s;
            this.rotation.z = (m10 - m01) * s;
        } else if (m00 > m11 && m00 > m22) {
            const s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22);
            this.rotation.w = (m21 - m12) / s;
            this.rotation.x = 0.25 * s;
            this.rotation.y = (m01 + m10) / s;
            this.rotation.z = (m02 + m20) / s;
        } else if (m11 > m22) {
            const s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22);
            this.rotation.w = (m02 - m20) / s;
            this.rotation.x = (m01 + m10) / s;
            this.rotation.y = 0.25 * s;
            this.rotation.z = (m12 + m21) / s;
        } else {
            const s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11);
            this.rotation.w = (m10 - m01) / s;
            this.rotation.x = (m02 + m20) / s;
            this.rotation.y = (m12 + m21) / s;
            this.rotation.z = 0.25 * s;
        }

        this.rotation = this.rotation.normalize();
    }

    public getViewMatrix(): Float32Array {
        // This would return the view matrix for rendering
        // Implementation would depend on your rendering system
        // For now, returning identity matrix
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    public getProjectionMatrix(): Float32Array {
        // This would return the projection matrix for rendering
        // Implementation would depend on your rendering system and camera type
        // For now, returning identity matrix
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }
}
