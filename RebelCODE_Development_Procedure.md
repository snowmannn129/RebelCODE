# RebelCODE Development Procedure

## Backup Standard

RebelCODE follows the RebelSUITE backup standard. Backups are created after major milestones:
- Phase completions
- Release types (Alpha, Beta, Full)
- Major development advancements
- Scheduled dates

Backups are stored as ZIP files in `C:\Users\snowm\Desktop\VSCode\Backup` with the naming format:
`RebelCODE_(mmddyyyy)_(current time).zip`

To create a backup, run:
```powershell
.\backup_project.ps1 -ProgramName "RebelCODE" -MilestoneType "<milestone type>"
```

Backup history is documented below in chronological order.

## 1. Development Environment & Execution
- RebelCODE is developed in VSCode on Windows 11 using PowerShell
- Built using TypeScript/JavaScript with Node.js
- All development follows a test-driven approach with rigorous validation
- All UI elements must be rigorously tested and functional before submission
- All modules must connect properly before requesting approval

## 2. Project Structure
RebelCODE follows a modular structure:

```
RebelCODE/
├── src/                 # Source code
│   ├── editor/          # Code editor components
│   │   ├── monaco/      # Monaco editor integration
│   │   ├── blueprint/   # Blueprint visual scripting
│   │   ├── timeline/    # Timeline editor
│   │   ├── scene/       # Scene editor
│   ├── language/        # Language support
│   │   ├── typescript/  # TypeScript language support
│   │   ├── javascript/  # JavaScript language support
│   │   ├── python/      # Python language support
│   │   ├── lua/         # Lua language support
│   ├── tools/           # Development tools
│   │   ├── debugger/    # Debugging tools
│   │   ├── profiler/    # Performance profiling
│   │   ├── testing/     # Testing framework
│   ├── plugins/         # Plugin system
│   │   ├── core/        # Core plugin functionality
│   │   ├── manager/     # Plugin management
│   ├── ui/              # User interface components
│   │   ├── panels/      # UI panels
│   │   ├── dialogs/     # Dialog components
│   │   ├── themes/      # Theme support
│   ├── index.ts         # Program entry point
├── tests/               # Test files
│   ├── editor/          # Editor tests
│   ├── language/        # Language support tests
│   ├── tools/           # Tools tests
│   ├── plugins/         # Plugin system tests
│   ├── ui/              # UI tests
├── docs/                # Documentation
│   ├── APIDocumentation.md       # API documentation
│   ├── AssetBrowser.md           # Asset browser documentation
│   ├── BlueprintSystem.md        # Blueprint system documentation
│   ├── CodeStyleGuidelines.md    # Code style guidelines
│   ├── DebuggingTools.md         # Debugging tools documentation
│   ├── SceneEditor.md            # Scene editor documentation
│   ├── TimelineEditor.md         # Timeline editor documentation
│   ├── VisualScripting.md        # Visual scripting documentation
├── package.json         # Project configuration
├── tsconfig.json        # TypeScript configuration
├── jest.config.js       # Jest test configuration
├── .eslintrc.js         # ESLint configuration
├── RebelCODE_Progress_Tracker.md  # Progress tracking
```

## 3. Functional Testing & UI Verification
RebelCODE follows a rigorous testing process:

### Unit Tests for Core Components
- Each function/class must have unit tests before submission
- Tests should cover edge cases, exceptions, and normal behavior
- Store all test scripts in tests/ directory
- Use Jest for JavaScript/TypeScript testing

### UI Component Testing
- Ensure all buttons, menus, and inputs work
- Verify UI elements correctly trigger backend functions
- Use automated UI testing frameworks (e.g., Testing Library, Cypress)
- Create visual regression tests for UI components

### Integration Testing
- After every UI implementation:
  - Test every event handler (button clicks, keyboard shortcuts)
  - Ensure UI updates reflect backend actions
  - Simulate user input to test flow
  - Test performance with large code files

### Functional Feature Testing
- Write test scenarios for every feature:
  - Editor: Test code editing, syntax highlighting, code completion
  - Blueprint: Test visual scripting node creation and connections
  - Scene Editor: Test scene composition and manipulation
  - Timeline Editor: Test timeline operations and animations
  - Debugging: Test breakpoints, variable inspection, stepping

### Regression Testing
- Do not break previous features when adding new code
- Before approving new code, re-run all tests
- Maintain a test suite that can be run automatically

## 4. TypeScript/JavaScript Coding Standards & Best Practices
- Follow modern TypeScript/JavaScript conventions
- Use consistent naming conventions:
  - PascalCase for class names
  - camelCase for function and variable names
  - UPPER_SNAKE_CASE for constants
- Each file should be ≤ 300-500 lines
- If a file exceeds this, split it into multiple modules
- Use JSDoc comments for all functions and classes

Example:
```typescript
/**
 * Saves content to a specified file path
 * @param filepath - The path where the file will be saved
 * @param content - The content to save
 * @returns A promise that resolves when the save is complete
 */
async function saveFile(filepath: string, content: string): Promise<void> {
    try {
        await fs.promises.writeFile(filepath, content, 'utf8');
        logger.debug(`File saved successfully: ${filepath}`);
    } catch (error) {
        logger.error(`Failed to save file: ${error.message}`);
        throw error;
    }
}
```

- Use proper error handling:
```typescript
try {
    const data = await fs.promises.readFile('settings.json', 'utf8');
    return JSON.parse(data);
} catch (error) {
    logger.error(`Settings file error: ${error.message}`);
    return defaultSettings;
}
```

- Use logging instead of console statements:
```typescript
import { Logger } from '../utils/logger';
const logger = new Logger('EditorComponent');
// ...
logger.debug('Editor initialized');
logger.error(`Failed to load file: ${error.message}`);
```

## 5. Managing Development Complexity
- Only implement one feature/component per development session
- Keep functions short and modular
- Use TypeScript interfaces and types for better code organization
- Implement proper error handling and logging
- Track dependencies in package.json
- Use module bundlers (webpack, rollup) for optimized builds

## 6. Core Features & Modules
RebelCODE has the following core modules:

### Editor Module (src/editor/)
- Monaco editor integration
- Code editing capabilities
- Syntax highlighting
- Code completion
- Blueprint visual scripting
- Scene editor
- Timeline editor

### Language Support Module (src/language/)
- Language server protocol integration
- Multi-language support (TypeScript, JavaScript, Python, Lua)
- Syntax highlighting
- Code completion
- Error checking
- Refactoring tools

### Tools Module (src/tools/)
- Debugging tools
  - Breakpoint management
  - Variable inspection
  - Step-through debugging
- Performance profiler
  - CPU usage monitoring
  - Memory usage tracking
  - Bottleneck identification
- Testing framework
  - Unit test runner
  - Integration test tools
  - Coverage reporting

### Plugin System Module (src/plugins/)
- Plugin management
- Plugin API
- Plugin discovery and loading
- Plugin settings

### UI Module (src/ui/)
- Panel system
- Dialog components
- Theme support
- Responsive layout
- Customizable workspaces

## 7. Automation for Testing
- Run All Tests Automatically:
```powershell
npm test
```

- Run Tests with Coverage:
```powershell
npm run test:coverage
```

- Run UI Tests:
```powershell
npm run test:ui
```

- Run Linting:
```powershell
npm run lint
```

- Run Type Checking:
```powershell
npm run type-check
```

## 8. Development Workflow
- Task Breakdown:
  1. Break large tasks into smaller steps
  2. Create detailed implementation plan
  3. Write tests first (Test-Driven Development)
  4. Implement the feature
  5. Verify with tests
  6. Document the implementation

- Approval Workflow:
  1. Generate code and tests
  2. Test thoroughly before requesting approval
  3. Ensure UI elements properly connect to the backend
  4. Once approved, update progress tracker
  5. Move to the next task

## 9. Best Practices for Development
- Use Git for version control:
```powershell
git add .
git commit -m "Implemented blueprint node connection system"
```

- Create GitHub issues for tracking:
```powershell
.\scripts\create_github_issue.ps1 -title "Fix memory leak in Monaco editor" -body "Memory leak detected when opening multiple large files" -labels "bug,high-priority"
```

- Keep modules focused:
  - No single file should exceed 500 lines
  - Split complex functionality into multiple files
  - Use proper abstraction and encapsulation

- Ensure proper resource management:
  - Clean up event listeners
  - Dispose of resources when components unmount
  - Monitor memory usage

- Optimize performance:
  - Use efficient data structures
  - Implement lazy loading for heavy components
  - Use web workers for CPU-intensive tasks
  - Implement proper caching mechanisms

## 10. Progress Tracking
- Update RebelCODE_Progress_Tracker.md after completing each task
- Run progress update script:
```powershell
.\scripts\update_progress.ps1
```

- Generate GitHub issues from progress tracker:
```powershell
.\scripts\generate_github_issues.ps1
```

- Update GitHub issues status:
```powershell
.\scripts\update_github_issues.ps1
```

## 11. Integration with RebelSUITE
- Define clear integration points with other RebelSUITE components:
  - RebelCAD: Provide scripting capabilities for CAD models
  - RebelENGINE: Support game scripting and logic programming
  - RebelFLOW: Enable code generation from visual workflows
  - RebelDESK: Share common editor components and UI elements

- Implement shared data formats and APIs
- Create plugin interfaces for cross-application functionality
- Establish unified asset management across the suite

## Final Notes
- Your goal is to develop a comprehensive coding and scripting environment
- Every UI element must be tested for functionality before requesting approval
- All features must be verified using unit, UI, and integration tests
- Do NOT generate untested or disconnected UI components
- DO ensure all modules connect properly before moving to the next task

## Backup: Development - 03/19/2025 03:13:18

* Backup created: RebelCODE_03192025_031318.zip
* Location: C:\Users\snowm\Desktop\VSCode\Backup\RebelCODE_03192025_031318.zip

