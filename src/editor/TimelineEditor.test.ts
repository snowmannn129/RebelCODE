import { TimelineEditor } from './TimelineEditor';
import { TimelineTrack, TimelineMarker, TimelineEvent } from './TimelineTypes';

describe('TimelineEditor', () => {
    let editor: TimelineEditor;

    beforeEach(() => {
        editor = new TimelineEditor();
    });

    afterEach(() => {
        editor.dispose();
    });

    describe('Track Management', () => {
        it('should add a new track', () => {
            const track: Omit<TimelineTrack, 'id'> = {
                name: 'Test Track',
                type: 'animation',
                enabled: true,
                locked: false,
                keyframes: []
            };

            const events: TimelineEvent[] = [];
            editor.subscribe(event => events.push(event));

            const trackId = editor.addTrack(track);
            expect(trackId).toBeDefined();
            expect(typeof trackId).toBe('string');

            const sequence = editor.getSequence();
            expect(sequence.tracks.length).toBe(1);
            expect(sequence.tracks[0].id).toBe(trackId);
            expect(sequence.tracks[0].name).toBe(track.name);

            expect(events.length).toBe(1);
            expect(events[0].type).toBe('track_added');
            expect(events[0].data.track.id).toBe(trackId);
        });

        it('should remove a track', () => {
            const track: Omit<TimelineTrack, 'id'> = {
                name: 'Test Track',
                type: 'animation',
                enabled: true,
                locked: false,
                keyframes: []
            };

            const trackId = editor.addTrack(track);
            const events: TimelineEvent[] = [];
            editor.subscribe(event => events.push(event));

            const removed = editor.removeTrack(trackId);
            expect(removed).toBe(true);

            const sequence = editor.getSequence();
            expect(sequence.tracks.length).toBe(0);

            expect(events.length).toBe(1);
            expect(events[0].type).toBe('track_removed');
            expect(events[0].data.track.id).toBe(trackId);
        });
    });

    describe('Marker Management', () => {
        it('should add a new marker', () => {
            const marker: Omit<TimelineMarker, 'id'> = {
                time: 5,
                label: 'Test Marker',
                type: 'bookmark'
            };

            const events: TimelineEvent[] = [];
            editor.subscribe(event => events.push(event));

            const markerId = editor.addMarker(marker);
            expect(markerId).toBeDefined();
            expect(typeof markerId).toBe('string');

            const sequence = editor.getSequence();
            expect(sequence.markers.length).toBe(1);
            expect(sequence.markers[0].id).toBe(markerId);
            expect(sequence.markers[0].label).toBe(marker.label);

            expect(events.length).toBe(1);
            expect(events[0].type).toBe('marker_added');
            expect(events[0].data.marker.id).toBe(markerId);
        });

        it('should remove a marker', () => {
            const marker: Omit<TimelineMarker, 'id'> = {
                time: 5,
                label: 'Test Marker',
                type: 'bookmark'
            };

            const markerId = editor.addMarker(marker);
            const events: TimelineEvent[] = [];
            editor.subscribe(event => events.push(event));

            const removed = editor.removeMarker(markerId);
            expect(removed).toBe(true);

            const sequence = editor.getSequence();
            expect(sequence.markers.length).toBe(0);

            expect(events.length).toBe(1);
            expect(events[0].type).toBe('marker_removed');
            expect(events[0].data.marker.id).toBe(markerId);
        });
    });

    describe('Playback Control', () => {
        it('should start and stop playback', () => {
            const events: TimelineEvent[] = [];
            editor.subscribe(event => events.push(event));

            editor.play();
            expect(editor.getState().isPlaying).toBe(true);
            expect(events.some(e => e.type === 'playback_started')).toBe(true);

            editor.stop();
            expect(editor.getState().isPlaying).toBe(false);
            expect(events.some(e => e.type === 'playback_stopped')).toBe(true);
        });

        it('should update time correctly', () => {
            const events: TimelineEvent[] = [];
            editor.subscribe(event => events.push(event));

            editor.setTime(10);
            expect(editor.getState().currentTime).toBe(10);
            expect(events.some(e => e.type === 'time_updated')).toBe(true);

            // Time should be clamped to sequence duration
            editor.setTime(1000);
            expect(editor.getState().currentTime).toBe(editor.getSequence().duration);
        });

        it('should handle sequence properties updates', () => {
            const events: TimelineEvent[] = [];
            editor.subscribe(event => events.push(event));

            editor.updateProperties({
                loop: true,
                playbackSpeed: 2.0
            });

            const state = editor.getState();
            expect(state.isLooping).toBe(true);
            expect(state.playbackSpeed).toBe(2.0);

            expect(events.some(e => e.type === 'sequence_modified')).toBe(true);
        });
    });

    describe('Serialization', () => {
        it('should save and load sequence data', () => {
            // Add some test data
            const trackId = editor.addTrack({
                name: 'Test Track',
                type: 'animation',
                enabled: true,
                locked: false,
                keyframes: []
            });

            const markerId = editor.addMarker({
                time: 5,
                label: 'Test Marker',
                type: 'bookmark'
            });

            // Save the sequence
            const savedData = editor.save();
            expect(savedData).toBeInstanceOf(Uint8Array);

            // Create a new editor and load the data
            const newEditor = new TimelineEditor();
            const events: TimelineEvent[] = [];
            newEditor.subscribe(event => events.push(event));

            newEditor.load(savedData);

            // Verify the loaded sequence matches the original
            const loadedSequence = newEditor.getSequence();
            expect(loadedSequence.tracks.length).toBe(1);
            expect(loadedSequence.tracks[0].id).toBe(trackId);
            expect(loadedSequence.markers.length).toBe(1);
            expect(loadedSequence.markers[0].id).toBe(markerId);

            expect(events.some(e => e.type === 'sequence_loaded')).toBe(true);

            newEditor.dispose();
        });
    });
});
