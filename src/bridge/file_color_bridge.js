/**
 * File Color Bridge for RebelCODE.
 * 
 * This module provides a bridge between the JavaScript frontend and the Python-based
 * file color manager in the RebelSUITE_Shared_Resources directory.
 */

const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const os = require('os');

// Path to the Python executable
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

// Path to the RebelSUITE_Shared_Resources directory
const SHARED_RESOURCES_PATH = path.resolve(__dirname, '../../../../RebelSUITE_Shared_Resources');

// Path to the bridge script
const BRIDGE_SCRIPT_PATH = path.join(__dirname, 'file_color_bridge.py');

// Create the bridge script if it doesn't exist
const createBridgeScript = () => {
  const bridgeScript = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
File Color Bridge Script for RebelCODE.

This script provides a bridge between the JavaScript frontend and the Python-based
file color manager in the RebelSUITE_Shared_Resources directory.
"""

import os
import sys
import json
import argparse

# Add the RebelSUITE_Shared_Resources directory to the Python path
shared_resources_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../RebelSUITE_Shared_Resources'))
if shared_resources_path not in sys.path:
    sys.path.append(shared_resources_path)

try:
    from file_color_manager import FileColorManager
except ImportError:
    print(json.dumps({
        'error': 'Failed to import FileColorManager. Make sure the RebelSUITE_Shared_Resources directory is in the Python path.'
    }))
    sys.exit(1)

def main():
    """Main entry point for the bridge script."""
    parser = argparse.ArgumentParser(description='File Color Bridge Script')
    parser.add_argument('--action', required=True, help='Action to perform')
    parser.add_argument('--theme', default='dark', help='Theme to use')
    parser.add_argument('--file-path', help='Path to the file')
    parser.add_argument('--status', help='Status to set')
    
    args = parser.parse_args()
    
    # Initialize the file color manager
    file_color_manager = FileColorManager(theme=args.theme)
    
    # Perform the requested action
    if args.action == 'get_color':
        if not args.file_path:
            print(json.dumps({
                'error': 'File path is required for get_color action'
            }))
            sys.exit(1)
            
        color = file_color_manager.get_color(args.file_path)
        print(json.dumps({
            'color': color.name()
        }))
        
    elif args.action == 'set_file_status':
        if not args.file_path or not args.status:
            print(json.dumps({
                'error': 'File path and status are required for set_file_status action'
            }))
            sys.exit(1)
            
        success = file_color_manager.set_file_status(args.file_path, args.status)
        print(json.dumps({
            'success': success
        }))
        
    elif args.action == 'get_file_status':
        if not args.file_path:
            print(json.dumps({
                'error': 'File path is required for get_file_status action'
            }))
            sys.exit(1)
            
        status = file_color_manager.get_file_status(args.file_path)
        print(json.dumps({
            'status': status
        }))
        
    elif args.action == 'clear_file_status':
        if args.file_path:
            success = file_color_manager.clear_file_status(args.file_path)
        else:
            success = file_color_manager.clear_file_status()
            
        print(json.dumps({
            'success': success
        }))
        
    else:
        print(json.dumps({
            'error': f'Unknown action: {args.action}'
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()
`;

  fs.writeFileSync(BRIDGE_SCRIPT_PATH, bridgeScript);
};

// Initialize the bridge
const initBridge = () => {
  // Create the bridge script if it doesn't exist
  if (!fs.existsSync(BRIDGE_SCRIPT_PATH)) {
    createBridgeScript();
  }

  // Register IPC handlers
  ipcMain.handle('file-browser:set-file-status', async (event, filePath, status) => {
    try {
      const result = await runBridgeCommand('set_file_status', {
        filePath,
        status
      });
      return result;
    } catch (error) {
      console.error('Error setting file status:', error);
      throw error;
    }
  });

  ipcMain.handle('file-browser:get-file-status', async (event, filePath) => {
    try {
      const result = await runBridgeCommand('get_file_status', {
        filePath
      });
      return result.status;
    } catch (error) {
      console.error('Error getting file status:', error);
      throw error;
    }
  });

  ipcMain.handle('file-browser:clear-file-status', async (event, filePath) => {
    try {
      const result = await runBridgeCommand('clear_file_status', {
        filePath
      });
      return result.success;
    } catch (error) {
      console.error('Error clearing file status:', error);
      throw error;
    }
  });

  ipcMain.handle('file-browser:get-color', async (event, filePath) => {
    try {
      const result = await runBridgeCommand('get_color', {
        filePath
      });
      return result.color;
    } catch (error) {
      console.error('Error getting color:', error);
      throw error;
    }
  });
};

// Run a bridge command
const runBridgeCommand = (action, options = {}) => {
  return new Promise((resolve, reject) => {
    const args = [
      BRIDGE_SCRIPT_PATH,
      '--action', action
    ];

    // Add theme if provided
    if (options.theme) {
      args.push('--theme', options.theme);
    }

    // Add file path if provided
    if (options.filePath) {
      args.push('--file-path', options.filePath);
    }

    // Add status if provided
    if (options.status) {
      args.push('--status', options.status);
    }

    // Spawn the Python process
    const pythonProcess = spawn(PYTHON_PATH, args);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Bridge script exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        if (result.error) {
          reject(new Error(result.error));
          return;
        }
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse bridge script output: ${error.message}`));
      }
    });
  });
};

module.exports = {
  initBridge
};
