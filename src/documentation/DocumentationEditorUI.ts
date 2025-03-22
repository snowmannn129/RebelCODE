/**
 * DocumentationEditorUI.ts
 * 
 * This class provides a UI for editing and previewing markdown documentation.
 * It combines the MarkdownEditor and DocumentationPreview components.
 */

import { MarkdownEditor } from './MarkdownEditor';
import { DocumentationPreview } from './DocumentationPreview';
import { RebelSCRIBEIntegration } from './RebelSCRIBEIntegration';

// Simple EventEmitter implementation (same as in other files)
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

interface DocumentationEditorUISettings {
    showToolbar: boolean;
    showStatusBar: boolean;
    showLineNumbers: boolean;
    showMinimap: boolean;
    syncScrolling: boolean;
    autoSave: boolean;
    autoPreview: boolean;
    splitDirection: 'horizontal' | 'vertical';
    editorWidth: number;
    previewWidth: number;
}

export class DocumentationEditorUI {
    private editor: MarkdownEditor;
    private preview: DocumentationPreview;
    private integration: RebelSCRIBEIntegration;
    private settings: DocumentationEditorUISettings;
    private eventEmitter: SimpleEventEmitter;
    private currentDocumentId: string | null = null;
    private isModified: boolean = false;
    private container: HTMLElement | null = null;
    private toolbarContainer: HTMLElement | null = null;
    private editorContainer: HTMLElement | null = null;
    private previewContainer: HTMLElement | null = null;
    private statusBarContainer: HTMLElement | null = null;

    constructor() {
        this.editor = new MarkdownEditor();
        this.preview = new DocumentationPreview();
        this.integration = new RebelSCRIBEIntegration();
        this.eventEmitter = new SimpleEventEmitter();
        this.settings = this.getDefaultSettings();
        
        // Connect editor and preview
        this.editor.setPreviewUpdateCallback(this.handleEditorContentChanged.bind(this));
        
        // Set up event listeners
        this.setupEventListeners();
    }

    private getDefaultSettings(): DocumentationEditorUISettings {
        return {
            showToolbar: true,
            showStatusBar: true,
            showLineNumbers: true,
            showMinimap: true,
            syncScrolling: true,
            autoSave: true,
            autoPreview: true,
            splitDirection: 'horizontal',
            editorWidth: 50,
            previewWidth: 50
        };
    }

    private setupEventListeners(): void {
        // Editor events
        this.editor.on('content:changed', this.handleEditorContentChanged.bind(this));
        
        // Preview events
        this.preview.on('preview:updated', () => {
            this.eventEmitter.emit('ui:previewUpdated');
        });
        
        // Integration events
        this.integration.on('document:loaded', this.handleDocumentLoaded.bind(this));
        this.integration.on('document:saved', this.handleDocumentSaved.bind(this));
        this.integration.on('error', this.handleError.bind(this));
    }

    /**
     * Initialize the UI
     * @param container The container element for the UI
     */
    public initialize(container: HTMLElement): void {
        this.container = container;
        
        // Create UI elements
        this.createUI();
        
        // Initialize RebelSCRIBE integration
        this.initializeIntegration();
        
        this.eventEmitter.emit('ui:initialized');
    }

    /**
     * Create the UI elements
     */
    private createUI(): void {
        if (!this.container) {
            return;
        }
        
        // Clear container
        this.container.innerHTML = '';
        
        // Create toolbar
        if (this.settings.showToolbar) {
            this.toolbarContainer = document.createElement('div');
            this.toolbarContainer.className = 'documentation-editor-toolbar';
            this.container.appendChild(this.toolbarContainer);
            
            this.createToolbar(this.toolbarContainer);
        }
        
        // Create main content area
        const contentContainer = document.createElement('div');
        contentContainer.className = 'documentation-editor-content';
        contentContainer.style.display = 'flex';
        contentContainer.style.flexDirection = this.settings.splitDirection === 'horizontal' ? 'row' : 'column';
        this.container.appendChild(contentContainer);
        
        // Create editor container
        this.editorContainer = document.createElement('div');
        this.editorContainer.className = 'documentation-editor-editor';
        this.editorContainer.style.flex = `${this.settings.editorWidth}%`;
        contentContainer.appendChild(this.editorContainer);
        
        // Create preview container
        this.previewContainer = document.createElement('div');
        this.previewContainer.className = 'documentation-editor-preview';
        this.previewContainer.style.flex = `${this.settings.previewWidth}%`;
        contentContainer.appendChild(this.previewContainer);
        
        // Create status bar
        if (this.settings.showStatusBar) {
            this.statusBarContainer = document.createElement('div');
            this.statusBarContainer.className = 'documentation-editor-status-bar';
            this.container.appendChild(this.statusBarContainer);
            
            this.createStatusBar(this.statusBarContainer);
        }
    }

    /**
     * Create the toolbar
     * @param container The toolbar container element
     */
    private createToolbar(container: HTMLElement): void {
        // Create toolbar buttons
        const buttonGroups = [
            // File operations
            [
                { id: 'new', title: 'New Document', icon: 'file-plus' },
                { id: 'open', title: 'Open Document', icon: 'folder-open' },
                { id: 'save', title: 'Save Document', icon: 'save' }
            ],
            // Formatting
            [
                { id: 'bold', title: 'Bold', icon: 'bold' },
                { id: 'italic', title: 'Italic', icon: 'italic' },
                { id: 'heading1', title: 'Heading 1', icon: 'h-1' },
                { id: 'heading2', title: 'Heading 2', icon: 'h-2' },
                { id: 'heading3', title: 'Heading 3', icon: 'h-3' }
            ],
            // Lists and blocks
            [
                { id: 'list', title: 'Bullet List', icon: 'list' },
                { id: 'orderedlist', title: 'Numbered List', icon: 'list-ordered' },
                { id: 'quote', title: 'Blockquote', icon: 'quote' },
                { id: 'code', title: 'Inline Code', icon: 'code' },
                { id: 'codeblock', title: 'Code Block', icon: 'code-square' }
            ],
            // Links and media
            [
                { id: 'link', title: 'Link', icon: 'link' },
                { id: 'image', title: 'Image', icon: 'image' },
                { id: 'table', title: 'Table', icon: 'table' },
                { id: 'horizontalrule', title: 'Horizontal Rule', icon: 'minus' }
            ],
            // View options
            [
                { id: 'preview', title: 'Toggle Preview', icon: 'eye' },
                { id: 'split', title: 'Toggle Split Direction', icon: 'columns' }
            ]
        ];
        
        // Create button groups
        buttonGroups.forEach(group => {
            const groupElement = document.createElement('div');
            groupElement.className = 'toolbar-group';
            container.appendChild(groupElement);
            
            // Create buttons in group
            group.forEach(button => {
                const buttonElement = document.createElement('button');
                buttonElement.className = 'toolbar-button';
                buttonElement.title = button.title;
                buttonElement.dataset.id = button.id;
                buttonElement.innerHTML = `<span class="icon icon-${button.icon}"></span>`;
                buttonElement.addEventListener('click', () => this.handleToolbarButtonClick(button.id));
                groupElement.appendChild(buttonElement);
            });
        });
    }

    /**
     * Create the status bar
     * @param container The status bar container element
     */
    private createStatusBar(container: HTMLElement): void {
        // Create status items
        const statusItems = [
            { id: 'document', text: 'No document loaded' },
            { id: 'wordcount', text: '0 words' },
            { id: 'modified', text: '' }
        ];
        
        // Create status items
        statusItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'status-item';
            itemElement.dataset.id = item.id;
            itemElement.textContent = item.text;
            container.appendChild(itemElement);
        });
    }

    /**
     * Initialize the RebelSCRIBE integration
     */
    private initializeIntegration(): void {
        // Get the RebelSUITE path
        const rebelsuitePath = 'C:/Users/snowm/Desktop/VSCode/RebelSUITE';
        
        // Initialize the integration
        this.integration.initialize(rebelsuitePath)
            .then(success => {
                if (success) {
                    this.eventEmitter.emit('ui:integrationInitialized');
                } else {
                    this.handleError({ message: 'Failed to initialize RebelSCRIBE integration' });
                }
            })
            .catch(error => {
                this.handleError({ message: `Error initializing RebelSCRIBE integration: ${error.message || 'Unknown error'}` });
            });
    }

    /**
     * Handle editor content changes
     * @param content The new content
     */
    private handleEditorContentChanged(content: string): void {
        // Update preview
        this.preview.updateContent(content);
        
        // Update modified state
        this.isModified = true;
        this.updateStatusBar();
        
        // Auto-save if enabled
        if (this.settings.autoSave && this.currentDocumentId) {
            this.saveDocument();
        }
    }

    /**
     * Handle document loaded event
     * @param event The document loaded event
     */
    private handleDocumentLoaded(event: any): void {
        const { documentId, metadata, content } = event;
        
        // Update editor content
        this.editor.setContent(content.content, false);
        
        // Update preview
        this.preview.updateContent(content.content);
        
        // Update current document ID
        this.currentDocumentId = documentId;
        
        // Reset modified state
        this.isModified = false;
        
        // Update status bar
        this.updateStatusBar();
        
        this.eventEmitter.emit('ui:documentLoaded', { documentId, metadata });
    }

    /**
     * Handle document saved event
     * @param event The document saved event
     */
    private handleDocumentSaved(event: any): void {
        // Reset modified state
        this.isModified = false;
        
        // Update status bar
        this.updateStatusBar();
        
        this.eventEmitter.emit('ui:documentSaved', event);
    }

    /**
     * Handle error event
     * @param event The error event
     */
    private handleError(event: any): void {
        console.error('DocumentationEditorUI Error:', event.message);
        this.eventEmitter.emit('ui:error', event);
    }

    /**
     * Handle toolbar button click
     * @param buttonId The ID of the clicked button
     */
    private handleToolbarButtonClick(buttonId: string): void {
        switch (buttonId) {
            // File operations
            case 'new':
                this.createNewDocument();
                break;
            case 'open':
                this.openDocumentDialog();
                break;
            case 'save':
                this.saveDocument();
                break;
            
            // View options
            case 'preview':
                this.togglePreview();
                break;
            case 'split':
                this.toggleSplitDirection();
                break;
            
            // Formatting
            default:
                // Pass to editor for formatting
                this.editor.insertFormat(buttonId);
                break;
        }
    }

    /**
     * Create a new document
     */
    private createNewDocument(): void {
        // Prompt for document details
        const title = prompt('Enter document title:', 'New Document');
        if (!title) return;
        
        const type = prompt('Enter document type (api, guide, tutorial, reference):', 'api');
        if (!type) return;
        
        const component = prompt('Enter component name (RebelCAD, RebelCODE, etc.):', 'RebelCODE');
        if (!component) return;
        
        const language = prompt('Enter language (typescript, python, cpp, etc.):', 'typescript');
        if (!language) return;
        
        // Create the document
        this.integration.createDocument(title, type, component, language)
            .then(document => {
                if (document) {
                    // Update editor content
                    this.editor.setContent('', false);
                    
                    // Update preview
                    this.preview.updateContent('');
                    
                    // Update current document ID
                    this.currentDocumentId = document.metadata.id;
                    
                    // Reset modified state
                    this.isModified = false;
                    
                    // Update status bar
                    this.updateStatusBar();
                    
                    this.eventEmitter.emit('ui:documentCreated', { documentId: document.metadata.id, metadata: document.metadata });
                } else {
                    this.handleError({ message: 'Failed to create document' });
                }
            })
            .catch(error => {
                this.handleError({ message: `Error creating document: ${error.message || 'Unknown error'}` });
            });
    }

    /**
     * Open the document dialog
     */
    private openDocumentDialog(): void {
        // In a real implementation, this would open a dialog to select a document
        // For now, we'll just prompt for a document ID
        const documentId = prompt('Enter document ID:', 'doc_1');
        if (!documentId) return;
        
        this.loadDocument(documentId);
    }

    /**
     * Load a document
     * @param documentId The ID of the document to load
     */
    private loadDocument(documentId: string): void {
        this.integration.loadDocument(documentId)
            .then(document => {
                if (document) {
                    // Update editor content
                    this.editor.setContent(document.content.content, false);
                    
                    // Update preview
                    this.preview.updateContent(document.content.content);
                    
                    // Update current document ID
                    this.currentDocumentId = documentId;
                    
                    // Reset modified state
                    this.isModified = false;
                    
                    // Update status bar
                    this.updateStatusBar();
                    
                    this.eventEmitter.emit('ui:documentLoaded', { documentId, metadata: document.metadata });
                } else {
                    this.handleError({ message: `Failed to load document: ${documentId}` });
                }
            })
            .catch(error => {
                this.handleError({ message: `Error loading document: ${error.message || 'Unknown error'}` });
            });
    }

    /**
     * Save the current document
     */
    private saveDocument(): void {
        if (!this.currentDocumentId) {
            this.handleError({ message: 'No document to save' });
            return;
        }
        
        const content = this.editor.getContent();
        
        this.integration.saveDocument(this.currentDocumentId, content)
            .then(success => {
                if (success) {
                    // Reset modified state
                    this.isModified = false;
                    
                    // Update status bar
                    this.updateStatusBar();
                    
                    this.eventEmitter.emit('ui:documentSaved', { documentId: this.currentDocumentId });
                } else {
                    this.handleError({ message: `Failed to save document: ${this.currentDocumentId}` });
                }
            })
            .catch(error => {
                this.handleError({ message: `Error saving document: ${error.message || 'Unknown error'}` });
            });
    }

    /**
     * Toggle preview visibility
     */
    private togglePreview(): void {
        if (!this.previewContainer) return;
        
        const isVisible = this.previewContainer.style.display !== 'none';
        
        if (isVisible) {
            // Hide preview
            this.previewContainer.style.display = 'none';
            this.editorContainer!.style.flex = '100%';
        } else {
            // Show preview
            this.previewContainer.style.display = 'block';
            this.editorContainer!.style.flex = `${this.settings.editorWidth}%`;
            this.previewContainer.style.flex = `${this.settings.previewWidth}%`;
        }
    }

    /**
     * Toggle split direction
     */
    private toggleSplitDirection(): void {
        if (!this.container) return;
        
        // Toggle split direction
        this.settings.splitDirection = this.settings.splitDirection === 'horizontal' ? 'vertical' : 'horizontal';
        
        // Recreate UI
        this.createUI();
    }

    /**
     * Update the status bar
     */
    private updateStatusBar(): void {
        if (!this.statusBarContainer) return;
        
        // Update document name
        const documentItem = this.statusBarContainer.querySelector('[data-id="document"]');
        if (documentItem) {
            documentItem.textContent = this.currentDocumentId ? `Document: ${this.currentDocumentId}` : 'No document loaded';
        }
        
        // Update word count
        const wordCountItem = this.statusBarContainer.querySelector('[data-id="wordcount"]');
        if (wordCountItem) {
            const content = this.editor.getContent();
            const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
            wordCountItem.textContent = `${wordCount} words`;
        }
        
        // Update modified state
        const modifiedItem = this.statusBarContainer.querySelector('[data-id="modified"]');
        if (modifiedItem) {
            modifiedItem.textContent = this.isModified ? 'Modified' : '';
        }
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
     * Update UI settings
     * @param newSettings New settings to apply
     */
    public updateSettings(newSettings: Partial<DocumentationEditorUISettings>): void {
        this.settings = { ...this.settings, ...newSettings };
        
        // Recreate UI
        this.createUI();
        
        this.eventEmitter.emit('ui:settingsUpdated', { settings: this.settings });
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.editor.dispose();
        this.preview.dispose();
        this.integration.dispose();
        this.eventEmitter.removeAllListeners();
    }
}
