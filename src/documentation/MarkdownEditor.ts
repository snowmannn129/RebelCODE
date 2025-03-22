import { ScriptEditor } from '../language/ScriptEditor';

// Simple EventEmitter implementation
class SimpleEventEmitter {
    private events: Map<string, Array<(...args: any[]) => void>> = new Map();

    public on(event: string, listener: (...args: any[]) => void): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(listener);
    }

    public emit(event: string, ...args: any[]): void {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.forEach(listener => listener(...args));
        }
    }

    public removeAllListeners(): void {
        this.events.clear();
    }
}

interface MarkdownEditorSettings {
    previewEnabled: boolean;
    autoPreview: boolean;
    syncScrolling: boolean;
    spellCheck: boolean;
    wordCount: boolean;
    lineWrapping: boolean;
    toolbarEnabled: boolean;
}

export class MarkdownEditor extends ScriptEditor {
    private markdownSettings: MarkdownEditorSettings;
    private previewUpdateCallback: ((markdown: string) => void) | null = null;
    private eventEmitter: SimpleEventEmitter;

    constructor() {
        super();
        this.eventEmitter = new SimpleEventEmitter();
        this.markdownSettings = this.getDefaultMarkdownSettings();
        this.initializeMarkdownEditor();
    }

    private getDefaultMarkdownSettings(): MarkdownEditorSettings {
        return {
            previewEnabled: true,
            autoPreview: true,
            syncScrolling: true,
            spellCheck: true,
            wordCount: true,
            lineWrapping: true,
            toolbarEnabled: true
        };
    }

    private initializeMarkdownEditor(): void {
        // Add markdown-specific event listeners
        this.eventEmitter.on('content:changed', this.handleContentChanged.bind(this));
        
        // Emit initialization event
        this.eventEmitter.emit('markdownEditor:initialized', {
            settings: this.markdownSettings
        });
    }

    /**
     * Subscribe to an event
     * @param event Event name
     * @param listener Event listener function
     */
    public on(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    /**
     * Emit an event
     * @param event Event name
     * @param args Event arguments
     */
    public emit(event: string, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    /**
     * Set the callback function for preview updates
     * @param callback Function to call when content changes and preview should update
     */
    public setPreviewUpdateCallback(callback: (markdown: string) => void): void {
        this.previewUpdateCallback = callback;
    }

    /**
     * Handle content changes and update preview if needed
     */
    private handleContentChanged(event: any): void {
        if (this.markdownSettings.autoPreview && this.previewUpdateCallback) {
            this.previewUpdateCallback(event.content);
        }
    }

    /**
     * Update markdown editor settings
     * @param newSettings New settings to apply
     */
    public updateMarkdownSettings(newSettings: Partial<MarkdownEditorSettings>): void {
        this.markdownSettings = { ...this.markdownSettings, ...newSettings };
        this.eventEmitter.emit('markdownSettings:updated', { settings: this.markdownSettings });
    }

    /**
     * Insert a markdown formatting element at the current cursor position
     * @param format The markdown format to insert (e.g., 'bold', 'italic', 'heading1')
     */
    public insertFormat(format: string): void {
        let textToInsert = '';
        let selectionOffset = 0;
        
        switch (format) {
            case 'bold':
                textToInsert = '**bold text**';
                selectionOffset = 2;
                break;
            case 'italic':
                textToInsert = '*italic text*';
                selectionOffset = 1;
                break;
            case 'heading1':
                textToInsert = '# Heading 1';
                selectionOffset = 2;
                break;
            case 'heading2':
                textToInsert = '## Heading 2';
                selectionOffset = 3;
                break;
            case 'heading3':
                textToInsert = '### Heading 3';
                selectionOffset = 4;
                break;
            case 'link':
                textToInsert = '[link text](https://example.com)';
                selectionOffset = 1;
                break;
            case 'image':
                textToInsert = '![alt text](image.jpg)';
                selectionOffset = 2;
                break;
            case 'code':
                textToInsert = '`code`';
                selectionOffset = 1;
                break;
            case 'codeblock':
                textToInsert = '```\ncode block\n```';
                selectionOffset = 4;
                break;
            case 'quote':
                textToInsert = '> blockquote';
                selectionOffset = 2;
                break;
            case 'list':
                textToInsert = '- list item\n- another item';
                selectionOffset = 2;
                break;
            case 'orderedlist':
                textToInsert = '1. first item\n2. second item';
                selectionOffset = 3;
                break;
            case 'horizontalrule':
                textToInsert = '\n---\n';
                selectionOffset = 0;
                break;
            case 'table':
                textToInsert = '| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |';
                selectionOffset = 0;
                break;
            default:
                return;
        }
        
        this.insertText(textToInsert);
        
        // Emit event for preview update
        if (this.markdownSettings.autoPreview && this.previewUpdateCallback) {
            this.previewUpdateCallback(this.getContent());
        }
    }

    /**
     * Get the current content of the editor
     */
    public getContent(): string {
        // Since we can't access the private content property directly,
        // we'll implement our own content tracking
        // In a real implementation, this would use the appropriate API
        // from the ScriptEditor class
        return this._content || '';
    }

    // Track content separately since we can't access the private property
    private _content: string = '';

    // Override insertText to track content
    public override insertText(text: string): void {
        super.insertText(text);
        // Update our tracked content
        this._content += text;
    }
    
    /**
     * Set the content of the editor
     * @param content The new content
     * @param createVersion Whether to create a new version
     */
    public setContent(content: string, createVersion: boolean = true): void {
        // Update our tracked content
        this._content = content;
        
        // In a real implementation, this would update the editor content
        // For now, we'll just emit an event
        this.emit('content:changed', { content });
    }

    /**
     * Force update of the preview
     */
    public updatePreview(): void {
        if (this.previewUpdateCallback) {
            this.previewUpdateCallback(this.getContent());
        }
    }

    /**
     * Load documentation from RebelSCRIBE
     * @param documentId The ID of the document to load
     */
    public async loadFromRebelSCRIBE(documentId: string): Promise<boolean> {
        try {
            // This would be implemented to load content from RebelSCRIBE
            // For now, we'll emit an event
            this.eventEmitter.emit('rebelscribe:documentLoaded', { documentId });
            return true;
        } catch (error: any) {
            this.eventEmitter.emit('error', { message: `Failed to load document from RebelSCRIBE: ${error.message || 'Unknown error'}` });
            return false;
        }
    }

    /**
     * Save documentation to RebelSCRIBE
     * @param documentId The ID of the document to save
     */
    public async saveToRebelSCRIBE(documentId: string): Promise<boolean> {
        try {
            // This would be implemented to save content to RebelSCRIBE
            // For now, we'll emit an event
            this.eventEmitter.emit('rebelscribe:documentSaved', { documentId });
            return true;
        } catch (error: any) {
            this.eventEmitter.emit('error', { message: `Failed to save document to RebelSCRIBE: ${error.message || 'Unknown error'}` });
            return false;
        }
    }

    /**
     * Clean up resources when the editor is disposed
     */
    public dispose(): void {
        // Call parent dispose method
        super.dispose();
        
        // Clean up markdown-specific resources
        this.previewUpdateCallback = null;
        
        // Emit disposal event
        this.eventEmitter.emit('markdownEditor:disposed');
        
        // Remove all event listeners
        this.eventEmitter.removeAllListeners();
    }
}
