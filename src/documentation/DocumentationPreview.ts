/**
 * DocumentationPreview.ts
 * 
 * This class provides a preview of markdown documentation.
 * It renders markdown content as HTML for display in the UI.
 */

// Simple EventEmitter implementation (same as in MarkdownEditor.ts)
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

interface PreviewSettings {
    autoScroll: boolean;
    highlightSyntax: boolean;
    renderMathFormulas: boolean;
    renderDiagrams: boolean;
    renderTables: boolean;
    theme: 'light' | 'dark' | 'auto';
    fontSize: number;
    lineHeight: number;
    fontFamily: string;
}

export class DocumentationPreview {
    private content: string = '';
    private renderedHtml: string = '';
    private settings: PreviewSettings;
    private eventEmitter: SimpleEventEmitter;
    private scrollPosition: number = 0;

    constructor() {
        this.eventEmitter = new SimpleEventEmitter();
        this.settings = this.getDefaultSettings();
        this.initializePreview();
    }

    private getDefaultSettings(): PreviewSettings {
        return {
            autoScroll: true,
            highlightSyntax: true,
            renderMathFormulas: true,
            renderDiagrams: true,
            renderTables: true,
            theme: 'auto',
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        };
    }

    private initializePreview(): void {
        this.eventEmitter.emit('preview:initialized', {
            settings: this.settings
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
     * Update the preview content
     * @param markdown The markdown content to preview
     */
    public updateContent(markdown: string): void {
        this.content = markdown;
        this.renderedHtml = this.renderMarkdown(markdown);
        this.eventEmitter.emit('preview:updated', {
            html: this.renderedHtml
        });
    }

    /**
     * Get the rendered HTML
     */
    public getRenderedHtml(): string {
        return this.renderedHtml;
    }

    /**
     * Update preview settings
     * @param newSettings New settings to apply
     */
    public updateSettings(newSettings: Partial<PreviewSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
        
        // Re-render with new settings
        this.renderedHtml = this.renderMarkdown(this.content);
        
        this.eventEmitter.emit('preview:settingsUpdated', {
            settings: this.settings,
            html: this.renderedHtml
        });
    }

    /**
     * Set the scroll position
     * @param position Scroll position (0-100)
     */
    public setScrollPosition(position: number): void {
        this.scrollPosition = Math.max(0, Math.min(100, position));
        this.eventEmitter.emit('preview:scrolled', {
            position: this.scrollPosition
        });
    }

    /**
     * Render markdown to HTML
     * @param markdown Markdown content to render
     */
    private renderMarkdown(markdown: string): string {
        // In a real implementation, this would use a markdown library
        // For now, we'll do a simple conversion
        
        if (!markdown) {
            return '';
        }
        
        let html = '<div class="markdown-preview">';
        
        // Split into lines for processing
        const lines = markdown.split('\n');
        let inCodeBlock = false;
        let inList = false;
        let inTable = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Code blocks
            if (line.startsWith('```')) {
                if (inCodeBlock) {
                    html += '</code></pre>';
                    inCodeBlock = false;
                } else {
                    const language = line.substring(3).trim();
                    html += `<pre><code class="language-${language}">`;
                    inCodeBlock = true;
                }
                continue;
            }
            
            if (inCodeBlock) {
                html += this.escapeHtml(line) + '\n';
                continue;
            }
            
            // Headings
            if (line.startsWith('# ')) {
                html += `<h1>${this.processInlineMarkdown(line.substring(2))}</h1>`;
            } else if (line.startsWith('## ')) {
                html += `<h2>${this.processInlineMarkdown(line.substring(3))}</h2>`;
            } else if (line.startsWith('### ')) {
                html += `<h3>${this.processInlineMarkdown(line.substring(4))}</h3>`;
            } else if (line.startsWith('#### ')) {
                html += `<h4>${this.processInlineMarkdown(line.substring(5))}</h4>`;
            } else if (line.startsWith('##### ')) {
                html += `<h5>${this.processInlineMarkdown(line.substring(6))}</h5>`;
            } else if (line.startsWith('###### ')) {
                html += `<h6>${this.processInlineMarkdown(line.substring(7))}</h6>`;
            }
            // Horizontal rule
            else if (line.match(/^[\-*_]{3,}$/)) {
                html += '<hr>';
            }
            // Blockquote
            else if (line.startsWith('> ')) {
                html += `<blockquote>${this.processInlineMarkdown(line.substring(2))}</blockquote>`;
            }
            // Unordered list
            else if (line.match(/^\s*[\-*+]\s/)) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                html += `<li>${this.processInlineMarkdown(line.replace(/^\s*[\-*+]\s/, ''))}</li>`;
            }
            // Ordered list
            else if (line.match(/^\s*\d+\.\s/)) {
                if (!inList) {
                    html += '<ol>';
                    inList = true;
                }
                html += `<li>${this.processInlineMarkdown(line.replace(/^\s*\d+\.\s/, ''))}</li>`;
            }
            // End of list
            else if (inList && line.trim() === '') {
                html += inList ? '</ul>' : '</ol>';
                inList = false;
                html += '<p></p>';
            }
            // Table
            else if (line.includes('|') && this.settings.renderTables) {
                if (!inTable) {
                    html += '<table>';
                    inTable = true;
                    
                    // Check if next line is a table separator
                    if (i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].includes('-')) {
                        // This is a header row
                        html += '<thead><tr>';
                        const cells = line.split('|').filter(cell => cell.trim() !== '');
                        for (const cell of cells) {
                            html += `<th>${this.processInlineMarkdown(cell.trim())}</th>`;
                        }
                        html += '</tr></thead><tbody>';
                        i++; // Skip the separator line
                    } else {
                        // No header, just a regular row
                        html += '<tbody><tr>';
                        const cells = line.split('|').filter(cell => cell.trim() !== '');
                        for (const cell of cells) {
                            html += `<td>${this.processInlineMarkdown(cell.trim())}</td>`;
                        }
                        html += '</tr>';
                    }
                } else {
                    // Regular table row
                    html += '<tr>';
                    const cells = line.split('|').filter(cell => cell.trim() !== '');
                    for (const cell of cells) {
                        html += `<td>${this.processInlineMarkdown(cell.trim())}</td>`;
                    }
                    html += '</tr>';
                }
            }
            // End of table
            else if (inTable && line.trim() === '') {
                html += '</tbody></table>';
                inTable = false;
            }
            // Paragraph
            else if (line.trim() !== '') {
                html += `<p>${this.processInlineMarkdown(line)}</p>`;
            }
            // Empty line
            else {
                html += '<p></p>';
            }
        }
        
        // Close any open tags
        if (inCodeBlock) {
            html += '</code></pre>';
        }
        if (inList) {
            html += inList ? '</ul>' : '</ol>';
        }
        if (inTable) {
            html += '</tbody></table>';
        }
        
        html += '</div>';
        
        return html;
    }

    /**
     * Process inline markdown elements
     * @param text Text to process
     */
    private processInlineMarkdown(text: string): string {
        // Bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
        
        // Italic
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Code
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Links
        text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
        
        // Images
        text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
        
        return text;
    }

    /**
     * Escape HTML special characters
     * @param text Text to escape
     */
    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.eventEmitter.removeAllListeners();
    }
}
