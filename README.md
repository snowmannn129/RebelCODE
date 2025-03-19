# RebelCODE

## Overview

RebelCODE is a powerful coding and scripting environment component of the RebelSUITE ecosystem. It provides a comprehensive platform for code development, debugging, and visual scripting with advanced AI-assisted features.

## Features

- **Code Editor**: Advanced code editing with syntax highlighting and intelligent code completion
- **Visual Scripting**: Node-based visual programming interface
- **Debugging Tools**: Comprehensive debugging capabilities with breakpoints, watches, and variable inspection
- **AI Code Assistance**: AI-powered code suggestions and refactoring
- **Language Support**: Multi-language support including JavaScript, TypeScript, Python, and more
- **Plugin System**: Extensible architecture for custom plugins and integrations

## Technology Stack

- **Core**: TypeScript/JavaScript with Node.js
- **UI**: React with modern component architecture
- **Editor**: Monaco Editor (VS Code's editor component)
- **Visual Scripting**: Custom node-based graph editor
- **AI Integration**: Machine learning models for code intelligence

## Directory Structure

```
RebelCODE/
├── src/                 # Source code
│   ├── editor/          # Code editor components
│   ├── language/        # Language services
│   ├── plugins/         # Plugin system
│   ├── tools/           # Development tools
│   ├── ui/              # User interface components
├── tests/               # Unit and integration tests
├── docs/                # Documentation
├── package.json         # Node.js package configuration
├── tsconfig.json        # TypeScript configuration
├── .github/             # GitHub workflows and templates
├── .gitignore           # Git ignore file
└── README.md            # This file
```

## Integration with RebelSUITE

RebelCODE is designed to work seamlessly with other RebelSUITE components:

- **RebelDESK**: Provides code intelligence and editing capabilities
- **RebelENGINE**: Scripting and programming for game development
- **RebelCAD**: Automation and parametric modeling through code
- **RebelFLOW**: Code generation from visual workflows

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm 8.x or later
- Modern web browser (Chrome, Firefox, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/snowmannn129/RebelCODE.git
cd RebelCODE

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=editor

# Run with coverage
npm test -- --coverage
```

### Building Documentation

```bash
# Generate API documentation
npm run docs
```

## Contributing

Contributions to RebelCODE are welcome! Please see our [Contributing Guide](.github/CONTRIBUTING.md) for more information.

## License

RebelCODE is licensed under the [MIT License](LICENSE).

## Contact

For questions or support, please contact the RebelSUITE team at [support@rebelsuite.com](mailto:support@rebelsuite.com).
