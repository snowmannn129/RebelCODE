import { Events } from '../../Core/Events';
import { TrackManager } from './TimelineTrack';
import { TimelineSerializer } from './TimelineSerializer';
import {
    TimelineSequence,
    TimelineTrack,
    TimelineMarker,
    TimelineState,
    TimelineEvent
} from './TimelineTypes';

/**
 * Main Timeline Editor class that manages sequences, tracks, and playback
 */
export class TimelineEditor {
    private sequence: TimelineSequence;
    private state: TimelineState;
    private tracks: Map<string, TrackManager>;
    private events: Events;
    private playbackInterval: number | null;

    constructor(sequence?: TimelineSequence) {
        this.sequence = sequence || this.createEmptySequence();
        this.tracks = new Map();
        this.events = new Events();
        this.playbackInterval = null;
        
        this.state = {
            currentTime: 0,
            isPlaying: false,
            isLooping: this.sequence.properties.loop || false,
            playbackSpeed: this.sequence.properties.playbackSpeed || 1.0,
            selectedTrackIds: [],
            selectedKeyframeIds: [],
            selectedMarkerIds: [],
            viewRange: {
                start: 0,
                end: this.sequence.duration
            },
            zoom: 1
        };

        this.initializeTracks();
    }

    /**
     * Initialize track managers for all tracks in the sequence
     */
    private initializeTracks(): void {
        this.sequence.tracks.forEach(track => {
            const manager = new TrackManager(track);
            manager.subscribe(event => this.handleTrackEvent(event));
            this.tracks.set(track.id, manager);
        });
    }

    /**
     * Create a new empty sequence
     */
    private createEmptySequence(): TimelineSequence {
        return {
            id: crypto.randomUUID(),
            name: 'New Sequence',
            duration: 60,
            frameRate: 30,
            tracks: [],
            markers: [],
            properties: {
                loop: false,
                autoPlay: false,
                playbackSpeed: 1.0
            }
        };
    }

    /**
     * Add a new track to the sequence
     */
    public addTrack(track: Omit<TimelineTrack, 'id'>): string {
        const id = crypto.randomUUID();
        const newTrack: TimelineTrack = {
            ...track,
            id,
            keyframes: track.keyframes || []
        };

        this.sequence.tracks.push(newTrack);
        const manager = new TrackManager(newTrack);
        manager.subscribe(event => this.handleTrackEvent(event));
        this.tracks.set(id, manager);

        this.emitEvent('track_added', { track: newTrack });
        return id;
    }

    /**
     * Remove a track from the sequence
     */
    public removeTrack(trackId: string): boolean {
        const index = this.sequence.tracks.findIndex(t => t.id === trackId);
        if (index === -1) return false;

        const removed = this.sequence.tracks.splice(index, 1)[0];
        this.tracks.delete(trackId);
        this.emitEvent('track_removed', { track: removed });
        return true;
    }

    /**
     * Add a marker to the sequence
     */
    public addMarker(marker: Omit<TimelineMarker, 'id'>): string {
        const id = crypto.randomUUID();
        const newMarker: TimelineMarker = {
            ...marker,
            id
        };

        this.sequence.markers.push(newMarker);
        this.emitEvent('marker_added', { marker: newMarker });
        return id;
    }

    /**
     * Remove a marker from the sequence
     */
    public removeMarker(markerId: string): boolean {
        const index = this.sequence.markers.findIndex(m => m.id === markerId);
        if (index === -1) return false;

        const removed = this.sequence.markers.splice(index, 1)[0];
        this.emitEvent('marker_removed', { marker: removed });
        return true;
    }

    /**
     * Start playback of the sequence
     */
    public play(): void {
        if (this.state.isPlaying) return;

        this.state.isPlaying = true;
        const frameTime = 1000 / this.sequence.frameRate;

        this.playbackInterval = window.setInterval(() => {
            this.state.currentTime += frameTime * this.state.playbackSpeed;

            if (this.state.currentTime >= this.sequence.duration) {
                if (this.state.isLooping) {
                    this.state.currentTime = 0;
                } else {
                    this.stop();
                    return;
                }
            }

            this.emitEvent('time_updated', { time: this.state.currentTime });
        }, frameTime);

        this.emitEvent('playback_started', null);
    }

    /**
     * Stop playback of the sequence
     */
    public stop(): void {
        if (!this.state.isPlaying) return;

        if (this.playbackInterval !== null) {
            window.clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }

        this.state.isPlaying = false;
        this.emitEvent('playback_stopped', null);
    }

    /**
     * Set the current time of the sequence
     */
    public setTime(time: number): void {
        this.state.currentTime = Math.max(0, Math.min(time, this.sequence.duration));
        this.emitEvent('time_updated', { time: this.state.currentTime });
    }

    /**
     * Update sequence properties
     */
    public updateProperties(updates: Partial<TimelineSequence['properties']>): void {
        Object.assign(this.sequence.properties, updates);
        
        if ('loop' in updates) {
            this.state.isLooping = updates.loop || false;
        }
        
        if ('playbackSpeed' in updates) {
            this.state.playbackSpeed = updates.playbackSpeed || 1.0;
        }

        this.emitEvent('sequence_modified', { sequence: this.sequence });
    }

    /**
     * Get the current state of the timeline
     */
    public getState(): TimelineState {
        return { ...this.state };
    }

    /**
     * Get the current sequence data
     */
    public getSequence(): TimelineSequence {
        return { ...this.sequence };
    }

    /**
     * Save the sequence to a file
     */
    public save(): Uint8Array {
        return TimelineSerializer.exportToFile(this.sequence);
    }

    /**
     * Load a sequence from a file
     */
    public load(data: Uint8Array): void {
        const sequence = TimelineSerializer.importFromFile(data);
        this.sequence = sequence;
        this.tracks.clear();
        this.initializeTracks();
        this.emitEvent('sequence_loaded', { sequence });
    }

    /**
     * Subscribe to timeline events
     */
    public subscribe(callback: (event: TimelineEvent) => void): () => void {
        return this.events.subscribe(callback);
    }

    /**
     * Handle events from track managers
     */
    private handleTrackEvent(event: TimelineEvent): void {
        this.emitEvent(event.type, event.data);
    }

    /**
     * Emit a timeline event
     */
    private emitEvent(type: TimelineEvent['type'], data: any): void {
        this.events.emit({
            type,
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.stop();
        this.tracks.forEach(manager => manager.getTrack());
        this.tracks.clear();
        this.events.clear();
    }
}
