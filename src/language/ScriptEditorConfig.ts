interface KeyboardShortcut {
    key: string;
    command: string;
    description: string;
}

interface SyntaxHighlightingRule {
    pattern: RegExp;
    style: string;
}

interface FileAssociation {
    extension: string;
    language: string;
}

export interface ScriptEditorConfig {
    // Editor appearance
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    cursorStyle: 'line' | 'block' | 'underline';
    cursorBlinkRate: number;
    scrollBeyondLastLine: boolean;
    miniMapEnabled: boolean;
    miniMapMaxColumn: number;
    
    // Editor behavior
    tabSize: number;
    insertSpaces: boolean;
    autoIndent: boolean;
    wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
    wordWrapColumn: number;
    autoClosingBrackets: boolean;
    autoClosingQuotes: boolean;
    autoSurround: boolean;
    formatOnPaste: boolean;
    formatOnSave: boolean;
    
    // File handling
    autoSave: boolean;
    autoSaveDelay: number;
    defaultEncoding: string;
    trimTrailingWhitespace: boolean;
    insertFinalNewline: boolean;
    
    // Search settings
    findMatchCase: boolean;
    findWholeWords: boolean;
    findUseRegex: boolean;
    findPreserveCase: boolean;
    
    // Performance
    maxTokenizationLineLength: number;
    maxFileSize: number;
    
    // Keyboard shortcuts
    keyboardShortcuts: KeyboardShortcut[];
    
    // Syntax highlighting
    syntaxHighlighting: {
        [language: string]: SyntaxHighlightingRule[];
    };
    
    // File associations
    fileAssociations: FileAssociation[];
    
    // Debugger settings
    debugger: {
        showInlineValues: boolean;
        enableAllHovers: boolean;
        showBreakpointMargin: boolean;
        showDebugConsole: boolean;
        pauseOnExceptions: boolean;
        pauseOnUncaughtExceptions: boolean;
    };
}

export const defaultConfig: ScriptEditorConfig = {
    fontFamily: 'Consolas, "Courier New", monospace',
    fontSize: 14,
    lineHeight: 1.5,
    cursorStyle: 'line',
    cursorBlinkRate: 530,
    scrollBeyondLastLine: true,
    miniMapEnabled: true,
    miniMapMaxColumn: 120,
    
    tabSize: 4,
    insertSpaces: true,
    autoIndent: true,
    wordWrap: 'on',
    wordWrapColumn: 80,
    autoClosingBrackets: true,
    autoClosingQuotes: true,
    autoSurround: true,
    formatOnPaste: true,
    formatOnSave: true,
    
    autoSave: true,
    autoSaveDelay: 1000,
    defaultEncoding: 'utf8',
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
    
    findMatchCase: false,
    findWholeWords: false,
    findUseRegex: false,
    findPreserveCase: true,
    
    maxTokenizationLineLength: 20000,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    
    keyboardShortcuts: [
        { key: 'Ctrl+S', command: 'save', description: 'Save current file' },
        { key: 'Ctrl+Z', command: 'undo', description: 'Undo last action' },
        { key: 'Ctrl+Y', command: 'redo', description: 'Redo last action' },
        { key: 'Ctrl+F', command: 'find', description: 'Find in file' },
        { key: 'Ctrl+H', command: 'replace', description: 'Replace in file' },
        { key: 'F5', command: 'debug.start', description: 'Start debugging' },
        { key: 'F9', command: 'debug.toggleBreakpoint', description: 'Toggle breakpoint' },
        { key: 'F10', command: 'debug.stepOver', description: 'Step over' },
        { key: 'F11', command: 'debug.stepInto', description: 'Step into' },
        { key: 'Shift+F11', command: 'debug.stepOut', description: 'Step out' }
    ],
    
    syntaxHighlighting: {
        typescript: [
            { pattern: /\b(const|let|var|function|class|interface|enum|import|export)\b/g, style: 'keyword' },
            { pattern: /'([^'\\]|\\.)*'|"([^"\\]|\\.)*"/g, style: 'string' },
            { pattern: /\/\/.*/g, style: 'comment' },
            { pattern: /\/\*[\s\S]*?\*\//g, style: 'comment' },
            { pattern: /\b\d+\b/g, style: 'number' }
        ]
    },
    
    fileAssociations: [
        { extension: '.ts', language: 'typescript' },
        { extension: '.js', language: 'javascript' },
        { extension: '.json', language: 'json' },
        { extension: '.html', language: 'html' },
        { extension: '.css', language: 'css' }
    ],
    
    debugger: {
        showInlineValues: true,
        enableAllHovers: true,
        showBreakpointMargin: true,
        showDebugConsole: true,
        pauseOnExceptions: true,
        pauseOnUncaughtExceptions: false
    }
};

export function mergeConfig(userConfig: Partial<ScriptEditorConfig>): ScriptEditorConfig {
    return {
        ...defaultConfig,
        ...userConfig,
        debugger: {
            ...defaultConfig.debugger,
            ...(userConfig.debugger || {})
        }
    };
}

export function validateConfig(config: ScriptEditorConfig): string[] {
    const errors: string[] = [];
    
    if (config.fontSize < 8 || config.fontSize > 72) {
        errors.push('Font size must be between 8 and 72');
    }
    
    if (config.tabSize < 1 || config.tabSize > 8) {
        errors.push('Tab size must be between 1 and 8');
    }
    
    if (config.autoSaveDelay < 100) {
        errors.push('Auto save delay must be at least 100ms');
    }
    
    if (config.maxFileSize < 1024 * 1024) { // 1MB
        errors.push('Max file size must be at least 1MB');
    }
    
    return errors;
}
