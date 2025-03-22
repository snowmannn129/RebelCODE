/**
 * DocumentationEditorDemo.ts
 * 
 * This file demonstrates how to use the DocumentationEditorUI component
 * to create a documentation editor with markdown preview.
 */

import { DocumentationEditorUI } from '../DocumentationEditorUI';

/**
 * Initialize the documentation editor demo
 */
function initializeDemo(): void {
    // Get the container element
    const container = document.getElementById('documentation-editor-container');
    if (!container) {
        console.error('Container element not found');
        return;
    }
    
    // Create the documentation editor UI
    const editorUI = new DocumentationEditorUI();
    
    // Initialize the UI
    editorUI.initialize(container);
    
    // Subscribe to events
    editorUI.on('ui:initialized', () => {
        console.log('Documentation editor UI initialized');
    });
    
    editorUI.on('ui:error', (event) => {
        console.error('Documentation editor error:', event.message);
    });
    
    editorUI.on('ui:documentLoaded', (event) => {
        console.log('Document loaded:', event.documentId);
    });
    
    editorUI.on('ui:documentSaved', (event) => {
        console.log('Document saved:', event.documentId);
    });
    
    editorUI.on('ui:documentCreated', (event) => {
        console.log('Document created:', event.documentId);
    });
    
    // Update settings if needed
    editorUI.updateSettings({
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
    });
    
    // Expose the editor UI to the window for debugging
    (window as any).editorUI = editorUI;
    
    console.log('Documentation editor demo initialized');
}

/**
 * Create a simple HTML page for the demo
 */
function createDemoPage(): void {
    // Create container
    const container = document.createElement('div');
    container.id = 'documentation-editor-container';
    container.style.width = '100%';
    container.style.height = '100vh';
    document.body.appendChild(container);
    
    // Add some basic styles
    const style = document.createElement('style');
    style.textContent = `
        body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        .documentation-editor-toolbar {
            display: flex;
            background-color: #f5f5f5;
            border-bottom: 1px solid #ddd;
            padding: 5px;
        }
        
        .toolbar-group {
            display: flex;
            margin-right: 10px;
            border-right: 1px solid #ddd;
            padding-right: 10px;
        }
        
        .toolbar-button {
            background: none;
            border: none;
            padding: 5px;
            margin: 0 2px;
            cursor: pointer;
            border-radius: 3px;
        }
        
        .toolbar-button:hover {
            background-color: #e0e0e0;
        }
        
        .documentation-editor-content {
            height: calc(100% - 80px);
        }
        
        .documentation-editor-editor {
            border-right: 1px solid #ddd;
            overflow: auto;
        }
        
        .documentation-editor-preview {
            overflow: auto;
            padding: 10px;
        }
        
        .documentation-editor-status-bar {
            display: flex;
            background-color: #f5f5f5;
            border-top: 1px solid #ddd;
            padding: 5px;
            font-size: 12px;
        }
        
        .status-item {
            margin-right: 15px;
        }
        
        /* Markdown preview styles */
        .markdown-preview h1 {
            border-bottom: 1px solid #eaecef;
            padding-bottom: 0.3em;
        }
        
        .markdown-preview h2 {
            border-bottom: 1px solid #eaecef;
            padding-bottom: 0.3em;
        }
        
        .markdown-preview code {
            background-color: rgba(27, 31, 35, 0.05);
            border-radius: 3px;
            padding: 0.2em 0.4em;
            font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
        }
        
        .markdown-preview pre {
            background-color: #f6f8fa;
            border-radius: 3px;
            padding: 16px;
            overflow: auto;
        }
        
        .markdown-preview blockquote {
            border-left: 0.25em solid #dfe2e5;
            color: #6a737d;
            padding: 0 1em;
            margin: 0 0 16px 0;
        }
        
        .markdown-preview table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 16px;
        }
        
        .markdown-preview table th,
        .markdown-preview table td {
            border: 1px solid #dfe2e5;
            padding: 6px 13px;
        }
        
        .markdown-preview table tr {
            background-color: #fff;
            border-top: 1px solid #c6cbd1;
        }
        
        .markdown-preview table tr:nth-child(2n) {
            background-color: #f6f8fa;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize the demo
    initializeDemo();
}

// Run the demo when the page loads
window.addEventListener('DOMContentLoaded', createDemoPage);

// Export for module usage
export {
    initializeDemo,
    createDemoPage
};
