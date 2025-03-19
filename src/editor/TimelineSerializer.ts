import { TimelineSequence, TimelineTrack, TimelineKeyframe, TimelineMarker } from './TimelineTypes';

/**
 * Handles serialization and deserialization of timeline data
 */
export class TimelineSerializer {
    /**
     * Serialize a timeline sequence to JSON
     */
    public static serialize(sequence: TimelineSequence): string {
        return JSON.stringify(sequence, null, 2);
    }

    /**
     * Deserialize a JSON string to a timeline sequence
     */
    public static deserialize(json: string): TimelineSequence {
        try {
            const data = JSON.parse(json);
            return this.validateSequence(data);
        } catch (error) {
            throw new Error(`Failed to deserialize timeline data: ${error}`);
        }
    }

    /**
     * Export timeline data to a file format
     */
    public static exportToFile(sequence: TimelineSequence): Uint8Array {
        const json = this.serialize(sequence);
        const encoder = new TextEncoder();
        return encoder.encode(json);
    }

    /**
     * Import timeline data from a file
     */
    public static importFromFile(data: Uint8Array): TimelineSequence {
        const decoder = new TextDecoder();
        const json = decoder.decode(data);
        return this.deserialize(json);
    }

    /**
     * Validate and sanitize a timeline sequence
     */
    private static validateSequence(data: any): TimelineSequence {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid timeline data format');
        }

        // Validate required fields
        const requiredFields = ['id', 'name', 'duration', 'frameRate', 'tracks', 'markers'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate and sanitize tracks
        const tracks = data.tracks.map((track: any) => this.validateTrack(track));

        // Validate and sanitize markers
        const markers = data.markers.map((marker: any) => this.validateMarker(marker));

        // Construct validated sequence
        return {
            id: String(data.id),
            name: String(data.name),
            duration: Number(data.duration),
            frameRate: Number(data.frameRate),
            tracks,
            markers,
            properties: {
                loop: Boolean(data.properties?.loop),
                autoPlay: Boolean(data.properties?.autoPlay),
                playbackSpeed: Number(data.properties?.playbackSpeed) || 1.0
            }
        };
    }

    /**
     * Validate and sanitize a timeline track
     */
    private static validateTrack(data: any): TimelineTrack {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid track data format');
        }

        // Validate required fields
        const requiredFields = ['id', 'name', 'type', 'keyframes'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new Error(`Missing required field in track: ${field}`);
            }
        }

        // Validate track type
        const validTypes = ['animation', 'audio', 'camera', 'event', 'property'];
        if (!validTypes.includes(data.type)) {
            throw new Error(`Invalid track type: ${data.type}`);
        }

        // Validate and sanitize keyframes
        const keyframes = data.keyframes.map((keyframe: any) => this.validateKeyframe(keyframe));

        // Construct validated track
        return {
            id: String(data.id),
            name: String(data.name),
            type: data.type,
            enabled: Boolean(data.enabled),
            locked: Boolean(data.locked),
            keyframes,
            properties: {
                targetObject: data.properties?.targetObject,
                targetProperty: data.properties?.targetProperty,
                color: data.properties?.color
            }
        };
    }

    /**
     * Validate and sanitize a timeline keyframe
     */
    private static validateKeyframe(data: any): TimelineKeyframe {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid keyframe data format');
        }

        // Validate required fields
        const requiredFields = ['id', 'time', 'value', 'interpolation'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new Error(`Missing required field in keyframe: ${field}`);
            }
        }

        // Validate interpolation type
        const validInterpolations = ['linear', 'step', 'bezier'];
        if (!validInterpolations.includes(data.interpolation)) {
            throw new Error(`Invalid interpolation type: ${data.interpolation}`);
        }

        // Construct validated keyframe
        const keyframe: TimelineKeyframe = {
            id: String(data.id),
            time: Number(data.time),
            value: data.value,
            interpolation: data.interpolation
        };

        // Add bezier handles if present and valid
        if (data.bezierHandles) {
            keyframe.bezierHandles = {
                in: {
                    x: Number(data.bezierHandles.in.x),
                    y: Number(data.bezierHandles.in.y)
                },
                out: {
                    x: Number(data.bezierHandles.out.x),
                    y: Number(data.bezierHandles.out.y)
                }
            };
        }

        return keyframe;
    }

    /**
     * Validate and sanitize a timeline marker
     */
    private static validateMarker(data: any): TimelineMarker {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid marker data format');
        }

        // Validate required fields
        const requiredFields = ['id', 'time', 'label', 'type'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new Error(`Missing required field in marker: ${field}`);
            }
        }

        // Validate marker type
        const validTypes = ['bookmark', 'event', 'section'];
        if (!validTypes.includes(data.type)) {
            throw new Error(`Invalid marker type: ${data.type}`);
        }

        // Construct validated marker
        return {
            id: String(data.id),
            time: Number(data.time),
            label: String(data.label),
            type: data.type,
            color: data.color
        };
    }
}
