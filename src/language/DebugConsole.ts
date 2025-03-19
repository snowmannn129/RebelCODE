import { DebugCommand, DebugConsole } from "./types";

export class DebugConsoleImpl implements DebugConsole {
  public readonly history: string[] = [];
  public readonly commands: Map<string, DebugCommand> = new Map();
  private static readonly MAX_HISTORY = 1000;

  constructor() {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands(): void {
    this.addCommand({
      name: "help",
      description: "Lists all available commands",
      execute: () => {
        const commandList = Array.from(this.commands.values())
          .map(cmd => `${cmd.name}: ${cmd.description}`)
          .join("\n");
        console.log("Available commands:\n" + commandList);
      }
    });

    this.addCommand({
      name: "clear",
      description: "Clears the console history",
      execute: () => {
        this.history.length = 0;
        console.clear();
      }
    });
  }

  public executeCommand(commandStr: string, ...args: any[]): void {
    this.history.push(commandStr);
    if (this.history.length > DebugConsoleImpl.MAX_HISTORY) {
      this.history.shift();
    }

    const [commandName, ...commandArgs] = commandStr.split(" ");
    const command = this.commands.get(commandName);

    if (!command) {
      console.error(`Unknown command: ${commandName}`);
      return;
    }

    try {
      command.execute(...commandArgs, ...args);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
    }
  }

  public addCommand(command: DebugCommand): void {
    if (this.commands.has(command.name)) {
      console.warn(`Command ${command.name} already exists. Overwriting...`);
    }
    this.commands.set(command.name, command);
  }

  public getHistory(): string[] {
    return [...this.history];
  }

}
