import { TimelineTrack, TimelineKeyframe, TimelineEvent } from './TimelineTypes';
import { Events } from '../../Core/Events';

/**
 * Manages a single track in the timeline, handling keyframe operations and track state
 */
export class TrackManager {
    private track: TimelineTrack;
    private events: Events;

    constructor(track: TimelineTrack) {
        this.track = track;
        this.events = new Events();
    }

    /**
     * Add a keyframe to the track
     */
    public addKeyframe(keyframe: Omit<TimelineKeyframe, 'id'>): string {
        const id = crypto.randomUUID();
        const newKeyframe: TimelineKeyframe = {
            ...keyframe,
            id
        };

        // Insert keyframe in time-sorted order
        const insertIndex = this.track.keyframes.findIndex(k => k.time > keyframe.time);
        if (insertIndex === -1) {
            this.track.keyframes.push(newKeyframe);
        } else {
            this.track.keyframes.splice(insertIndex, 0, newKeyframe);
        }

        this.emitEvent('keyframe_added', { trackId: this.track.id, keyframe: newKeyframe });
        return id;
    }

    /**
     * Remove a keyframe from the track
     */
    public removeKeyframe(keyframeId: string): boolean {
        const index = this.track.keyframes.findIndex(k => k.id === keyframeId);
        if (index === -1) return false;

        const removed = this.track.keyframes.splice(index, 1)[0];
        this.emitEvent('keyframe_removed', { trackId: this.track.id, keyframe: removed });
        return true;
    }

    /**
     * Update a keyframe's properties
     */
    public updateKeyframe(keyframeId: string, updates: Partial<TimelineKeyframe>): boolean {
        const keyframe = this.track.keyframes.find(k => k.id === keyframeId);
        if (!keyframe) return false;

        // If time is being updated, we need to maintain sorted order
        if (updates.time !== undefined && updates.time !== keyframe.time) {
            this.removeKeyframe(keyframeId);
            this.addKeyframe({ ...keyframe, ...updates });
            return true;
        }

        Object.assign(keyframe, updates);
        this.emitEvent('keyframe_modified', { trackId: this.track.id, keyframe });
        return true;
    }

    /**
     * Get the interpolated value at a specific time
     */
    public getValueAtTime(time: number): any {
        const keyframes = this.track.keyframes;
        if (keyframes.length === 0) return null;
        if (keyframes.length === 1) return keyframes[0].value;

        // Find surrounding keyframes
        const nextIndex = keyframes.findIndex(k => k.time > time);
        if (nextIndex === 0) return keyframes[0].value;
        if (nextIndex === -1) return keyframes[keyframes.length - 1].value;

        const prevKeyframe = keyframes[nextIndex - 1];
        const nextKeyframe = keyframes[nextIndex];

        // Handle different interpolation types
        switch (prevKeyframe.interpolation) {
            case 'step':
                return prevKeyframe.value;
            case 'linear':
                return this.linearInterpolate(prevKeyframe, nextKeyframe, time);
            case 'bezier':
                return this.bezierInterpolate(prevKeyframe, nextKeyframe, time);
            default:
                return prevKeyframe.value;
        }
    }

    /**
     * Update track properties
     */
    public updateTrack(updates: Partial<TimelineTrack>): void {
        Object.assign(this.track, updates);
        this.emitEvent('track_modified', { track: this.track });
    }

    /**
     * Get track data
     */
    public getTrack(): TimelineTrack {
        return { ...this.track };
    }

    /**
     * Subscribe to track events
     */
    public subscribe(callback: (event: TimelineEvent) => void): () => void {
        return this.events.subscribe(callback);
    }

    private linearInterpolate(start: TimelineKeyframe, end: TimelineKeyframe, time: number): any {
        const t = (time - start.time) / (end.time - start.time);
        
        if (typeof start.value === 'number' && typeof end.value === 'number') {
            return start.value + (end.value - start.value) * t;
        }
        
        // Handle vector interpolation
        if (Array.isArray(start.value) && Array.isArray(end.value)) {
            return start.value.map((v, i) => v + (end.value[i] - v) * t);
        }
        
        return start.value;
    }

    private bezierInterpolate(start: TimelineKeyframe, end: TimelineKeyframe, time: number): any {
        if (!start.bezierHandles || !end.bezierHandles) {
            return this.linearInterpolate(start, end, time);
        }

        const t = (time - start.time) / (end.time - start.time);
        const p0 = { x: start.time, y: typeof start.value === 'number' ? start.value : 0 };
        const p1 = { x: start.bezierHandles.out.x, y: start.bezierHandles.out.y };
        const p2 = { x: end.bezierHandles.in.x, y: end.bezierHandles.in.y };
        const p3 = { x: end.time, y: typeof end.value === 'number' ? end.value : 0 };

        const value = this.cubicBezier(t, p0, p1, p2, p3);
        return value.y;
    }

    private cubicBezier(t: number, p0: any, p1: any, p2: any, p3: any): { x: number; y: number } {
        const cx = 3 * (p1.x - p0.x);
        const bx = 3 * (p2.x - p1.x) - cx;
        const ax = p3.x - p0.x - cx - bx;

        const cy = 3 * (p1.y - p0.y);
        const by = 3 * (p2.y - p1.y) - cy;
        const ay = p3.y - p0.y - cy - by;

        const x = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
        const y = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;

        return { x, y };
    }

    private emitEvent(type: TimelineEvent['type'], data: any): void {
        this.events.emit({
            type,
            data,
            timestamp: Date.now()
        });
    }
}
