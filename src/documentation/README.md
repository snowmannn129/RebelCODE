# RebelCODE Documentation Module

This module provides functionality for editing and previewing markdown documentation, as well as integration with RebelSCRIBE for documentation management.

## Features

- **Markdown Editor**: A specialized editor for markdown content with formatting tools
- **Documentation Preview**: Real-time preview of markdown content as HTML
- **RebelSCRIBE Integration**: Load and save documentation from/to RebelSCRIBE
- **Documentation Editor UI**: A complete UI for editing and previewing documentation

## Components

### MarkdownEditor

The `MarkdownEditor` class extends the base `ScriptEditor` to provide specialized functionality for editing markdown content:

- Markdown-specific formatting tools (headings, lists, code blocks, etc.)
- Preview integration
- RebelSCRIBE integration for loading and saving documentation

```typescript
import { MarkdownEditor } from './documentation';

// Create a new markdown editor
const editor = new MarkdownEditor();

// Set up preview callback
editor.setPreviewUpdateCallback((markdown) => {
  console.log('Markdown content updated:', markdown);
  // Update preview with the markdown content
});

// Insert markdown formatting
editor.insertFormat('bold');      // Insert **bold text**
editor.insertFormat('heading1');  // Insert # Heading 1
editor.insertFormat('list');      // Insert bullet list
```

### DocumentationPreview

The `DocumentationPreview` class provides functionality for rendering markdown content as HTML:

- Markdown to HTML conversion
- Customizable rendering options
- Syntax highlighting for code blocks

```typescript
import { DocumentationPreview } from './documentation';

// Create a new documentation preview
const preview = new DocumentationPreview();

// Update the preview content
preview.updateContent('# Heading\n\nThis is a paragraph.');

// Get the rendered HTML
const html = preview.getRenderedHtml();
console.log('Rendered HTML:', html);
```

### RebelSCRIBEIntegration

The `RebelSCRIBEIntegration` class provides integration with RebelSCRIBE for documentation management:

- Load documentation from RebelSCRIBE
- Save documentation to RebelSCRIBE
- Search for documentation in RebelSCRIBE

```typescript
import { RebelSCRIBEIntegration } from './documentation';

// Create a new RebelSCRIBE integration
const integration = new RebelSCRIBEIntegration();

// Initialize the integration
await integration.initialize('C:/Users/snowm/Desktop/VSCode/RebelSUITE');

// Load a document
const document = await integration.loadDocument('doc_1');
if (document) {
  console.log('Document loaded:', document.metadata.title);
  console.log('Content:', document.content.content);
}

// Save a document
const success = await integration.saveDocument('doc_1', '# Updated Document\n\nThis is updated content.');
if (success) {
  console.log('Document saved successfully');
}
```

### DocumentationEditorUI

The `DocumentationEditorUI` class provides a complete UI for editing and previewing documentation:

- Toolbar with formatting tools
- Split view with editor and preview
- Status bar with document information
- RebelSCRIBE integration for loading and saving documentation

```typescript
import { DocumentationEditorUI } from './documentation';

// Create a new documentation editor UI
const editorUI = new DocumentationEditorUI();

// Initialize the UI with a container element
const container = document.getElementById('documentation-editor-container');
editorUI.initialize(container);

// Subscribe to events
editorUI.on('ui:documentLoaded', (event) => {
  console.log('Document loaded:', event.documentId);
});

editorUI.on('ui:documentSaved', (event) => {
  console.log('Document saved:', event.documentId);
});
```

## Usage

### Basic Usage

```typescript
import { DocumentationEditorUI } from './documentation';

// Create and initialize the documentation editor UI
const editorUI = new DocumentationEditorUI();
const container = document.getElementById('documentation-editor-container');
editorUI.initialize(container);
```

### Advanced Usage

See the example in `examples/DocumentationEditorDemo.ts` for a complete demonstration of how to use the documentation module.

## Integration with RebelSCRIBE

The documentation module integrates with RebelSCRIBE to provide documentation management capabilities:

1. **Loading Documentation**: Load documentation from RebelSCRIBE for editing
2. **Saving Documentation**: Save documentation to RebelSCRIBE for storage
3. **Searching Documentation**: Search for documentation in RebelSCRIBE

## Development

### Building the Module

To build the documentation module:

```bash
# Build the TypeScript files
tsc
```

### Running the Demo

To run the demo:

```bash
# Navigate to the examples directory
cd src/documentation/examples

# Install dependencies (if needed)
npm install

# Run the demo using Parcel
npx parcel index.html
```

## License

This module is part of the RebelSUITE ecosystem and is subject to the same license terms as the rest of the suite.
