import { EventEmitter } from '../../Core/Events';
import { ScriptEditor } from './ScriptEditor';

interface ScriptContext {
    variables: Map<string, any>;
    functions: Map<string, Function>;
    events: Map<string, Function[]>;
}

interface ExecutionResult {
    success: boolean;
    output: string;
    error?: Error;
    returnValue?: any;
}

interface DebugInfo {
    variableStates: Map<string, any>;
    callStack: string[];
    executionTime: number;
}

export class ScriptExecutionEngine extends EventEmitter {
    private editor: ScriptEditor;
    private context: ScriptContext;
    private worker: Worker | null = null;
    private debugInfo: DebugInfo = {
        variableStates: new Map(),
        callStack: [],
        executionTime: 0
    };

    constructor(editor: ScriptEditor) {
        super();
        this.editor = editor;
        this.context = {
            variables: new Map(),
            functions: new Map(),
            events: new Map()
        };
        this.initializeEngine();
    }

    private initializeEngine(): void {
        // Initialize Web Worker for script execution
        this.worker = new Worker(
            URL.createObjectURL(
                new Blob([this.getWorkerScript()], { type: 'application/javascript' })
            )
        );

        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.setupEventHandlers();
    }

    private getWorkerScript(): string {
        return `
            let instrumentedCode = '';
            
            self.onmessage = function(e) {
                const { code, context, debugMode } = e.data;
                try {
                    // Create execution context
                    const contextVars = {};
                    context.variables.forEach((value, key) => {
                        contextVars[key] = value;
                    });

                    // Add debug instrumentation if in debug mode
                    instrumentedCode = code;
                    if (debugMode) {
                        instrumentedCode = addDebugInstrumentation(code);
                    }

                    // Execute the code
                    const result = new Function('context', \`
                        with (context) {
                            return (function() {
                                \${instrumentedCode}
                            })();
                        }
                    \`)(contextVars);

                    self.postMessage({ success: true, output: '', returnValue: result });
                } catch (error) {
                    self.postMessage({ 
                        success: false, 
                        output: error.toString(),
                        error: { 
                            message: error.message,
                            stack: error.stack
                        }
                    });
                }
            };

            function addDebugInstrumentation(sourceCode: string) {
                // Add line by line execution tracking
                return sourceCode.split('\\n').map((currentLine: string, lineIndex: number) => {
                    return \`
                        self.postMessage({ type: 'debugInfo', line: \${lineIndex + 1} });
                        \${currentLine}
                    \`;
                }).join('\\n');
            }
        `;
    }

    private handleWorkerMessage(event: MessageEvent): void {
        const data = event.data;
        
        if (data.type === 'debugInfo') {
            this.updateDebugInfo(data);
            return;
        }

        this.emit('execution:complete', data);
    }

    private setupEventHandlers(): void {
        this.editor.on('debugger:started', () => {
            this.startDebugging();
        });

        this.editor.on('debugger:stopped', () => {
            this.stopDebugging();
        });

        this.editor.on('debugger:breakpointsChanged', (data: { breakpoints: any[] }) => {
            this.updateBreakpoints(data.breakpoints);
        });
    }

    public async executeScript(code: string, debugMode: boolean = false): Promise<ExecutionResult> {
        const startTime = performance.now();

        return new Promise((resolve) => {
            const handleExecution = (result: any) => {
                this.debugInfo.executionTime = performance.now() - startTime;
                
                if (result.success) {
                    this.updateContext(result);
                }

                resolve({
                    success: result.success,
                    output: result.output,
                    error: result.error,
                    returnValue: result.returnValue
                });

                this.emit('execution:stats', {
                    executionTime: this.debugInfo.executionTime,
                    memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
                });
            };

            this.worker?.postMessage({
                code,
                context: {
                    variables: Object.fromEntries(this.context.variables),
                    functions: Object.fromEntries(this.context.functions)
                },
                debugMode
            });

            const wrappedHandler = (result: any) => {
                this.removeEventListener('execution:complete', wrappedHandler);
                handleExecution(result);
            };
            this.addEventListener('execution:complete', wrappedHandler);
        });
    }

    public registerFunction(name: string, func: Function): void {
        this.context.functions.set(name, func);
    }

    public addEventListener(eventName: string, handler: Function): void {
        if (!this.context.events.has(eventName)) {
            this.context.events.set(eventName, []);
        }
        this.context.events.get(eventName)?.push(handler);
    }

    public removeEventListener(eventName: string, handler: Function): void {
        const handlers = this.context.events.get(eventName);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    private startDebugging(): void {
        this.debugInfo = {
            variableStates: new Map(),
            callStack: [],
            executionTime: 0
        };
    }

    private stopDebugging(): void {
        this.worker?.terminate();
        this.worker = null;
        this.initializeEngine();
    }

    private updateBreakpoints(breakpoints: any[]): void {
        // Implementation would update breakpoints in the worker
    }

    private updateDebugInfo(info: any): void {
        this.debugInfo.variableStates = new Map(Object.entries(info.variables || {}));
        this.debugInfo.callStack = info.callStack || [];
        
        this.emit('debug:info', this.debugInfo);
    }

    private updateContext(result: any): void {
        if (result.contextUpdates) {
            for (const [key, value] of Object.entries(result.contextUpdates)) {
                this.context.variables.set(key, value);
            }
        }
    }

    public getDebugInfo(): DebugInfo {
        return this.debugInfo;
    }

    public dispose(): void {
        this.worker?.terminate();
        this.worker = null;
        this.context.variables.clear();
        this.context.functions.clear();
        this.context.events.clear();
        this.emit('engine:disposed');
    }
}
