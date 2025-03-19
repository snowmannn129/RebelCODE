/**
 * Types and interfaces for the Timeline Editor system
 */

export interface TimelineKeyframe {
    id: string;
    time: number;
    value: any;
    interpolation: 'linear' | 'step' | 'bezier';
    bezierHandles?: {
        in: { x: number; y: number };
        out: { x: number; y: number };
    };
}

export interface TimelineTrack {
    id: string;
    name: string;
    type: 'animation' | 'audio' | 'camera' | 'event' | 'property';
    enabled: boolean;
    locked: boolean;
    keyframes: TimelineKeyframe[];
    properties?: {
        targetObject?: string;
        targetProperty?: string;
        color?: string;
    };
}

export interface TimelineMarker {
    id: string;
    time: number;
    label: string;
    type: 'bookmark' | 'event' | 'section';
    color?: string;
}

export interface TimelineSequence {
    id: string;
    name: string;
    duration: number;
    frameRate: number;
    tracks: TimelineTrack[];
    markers: TimelineMarker[];
    properties: {
        loop?: boolean;
        autoPlay?: boolean;
        playbackSpeed?: number;
    };
}

export type TimelineEventType = 
    | 'keyframe_added'
    | 'keyframe_removed'
    | 'keyframe_modified'
    | 'track_added'
    | 'track_removed'
    | 'track_modified'
    | 'marker_added'
    | 'marker_removed'
    | 'marker_modified'
    | 'sequence_modified'
    | 'sequence_loaded'
    | 'time_updated'
    | 'playback_started'
    | 'playback_stopped';

export interface TimelineEvent {
    type: TimelineEventType;
    data: any;
    timestamp: number;
}

export interface TimelineState {
    currentTime: number;
    isPlaying: boolean;
    isLooping: boolean;
    playbackSpeed: number;
    selectedTrackIds: string[];
    selectedKeyframeIds: string[];
    selectedMarkerIds: string[];
    viewRange: {
        start: number;
        end: number;
    };
    zoom: number;
}
