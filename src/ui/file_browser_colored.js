/**
 * Colored File Browser for RebelCODE.
 * 
 * This module implements a file browser with color coding using the shared RebelSUITE file color manager.
 * It communicates with the Python-based file color manager through a bridge.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Tree, 
  Menu, 
  Dropdown, 
  Input, 
  Button, 
  Tooltip, 
  message, 
  Modal, 
  Form, 
  Space 
} from 'antd';
import { 
  FolderOutlined, 
  FileOutlined, 
  ReloadOutlined, 
  PlusOutlined, 
  FolderAddOutlined, 
  UpOutlined, 
  HomeOutlined, 
  SearchOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { ipcRenderer } from 'electron';

const { DirectoryTree } = Tree;
const { Search } = Input;
const { confirm } = Modal;

// Styled components for the file browser
const FileBrowserContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#f5f5f5'};
  color: ${props => props.theme === 'dark' ? '#f0f0f0' : '#000000'};
`;

const ToolbarContainer = styled.div`
  display: flex;
  padding: 8px;
  background-color: ${props => props.theme === 'dark' ? '#2d2d2d' : '#e0e0e0'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3c3c3c' : '#cccccc'};
`;

const StatusBarContainer = styled.div`
  padding: 4px 8px;
  background-color: ${props => props.theme === 'dark' ? '#2d2d2d' : '#e0e0e0'};
  border-top: 1px solid ${props => props.theme === 'dark' ? '#3c3c3c' : '#cccccc'};
  font-size: 12px;
`;

const TreeContainer = styled.div`
  flex: 1;
  overflow: auto;
  padding: 8px;
`;

// Custom TreeNode title component with color coding
const ColoredTreeNodeTitle = ({ title, path, isLeaf, theme, fileStatus }) => {
  // Get color based on file status
  const getColor = () => {
    if (isLeaf) {
      // File colors based on status
      switch (fileStatus) {
        case 'error':
          return theme === 'dark' ? '#ff5555' : '#e50000'; // Red
        case 'warning':
          return theme === 'dark' ? '#e6db74' : '#996f00'; // Yellow
        case 'success':
          return theme === 'dark' ? '#a6e22e' : '#107c10'; // Green
        default:
          return theme === 'dark' ? '#f8f8f2' : '#000000'; // Normal (white/black)
      }
    } else {
      // Folder colors
      const folderName = path.split('/').pop();
      const specialFolders = [
        '.git', '.github', '.vscode', '.idea', 'node_modules', 
        'dist', 'build', 'coverage', 'public', 'src'
      ];
      
      if (specialFolders.includes(folderName)) {
        return theme === 'dark' ? '#a6e22e' : '#107c10'; // Special folder (green)
      }
      return theme === 'dark' ? '#66d9ef' : '#0078d7'; // Regular folder (blue)
    }
  };

  return (
    <span style={{ color: getColor() }}>
      {isLeaf ? <FileOutlined style={{ marginRight: 8 }} /> : <FolderOutlined style={{ marginRight: 8 }} />}
      {title}
    </span>
  );
};

/**
 * File Browser component with color coding.
 */
const FileBrowserColored = ({ theme = 'dark', onFileSelect, initialPath }) => {
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [currentPath, setCurrentPath] = useState(initialPath || '');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [fileStatuses, setFileStatuses] = useState({});
  const [statusBarText, setStatusBarText] = useState('');

  // Load directory contents
  const loadDirectory = async (path) => {
    try {
      const result = await ipcRenderer.invoke('file-browser:load-directory', path);
      setTreeData(result.treeData);
      setCurrentPath(result.path);
      updateStatusBar(result.stats);
    } catch (error) {
      message.error(`Failed to load directory: ${error.message}`);
    }
  };

  // Initial load
  useEffect(() => {
    if (initialPath) {
      loadDirectory(initialPath);
    }
  }, [initialPath]);

  // Update status bar
  const updateStatusBar = (stats) => {
    if (!stats) return;
    
    const { fileCount, folderCount } = stats;
    setStatusBarText(`${folderCount} folders, ${fileCount} files`);
  };

  // Handle file selection
  const handleSelect = (selectedKeys, info) => {
    const { node } = info;
    setSelectedKeys(selectedKeys);
    
    if (node.isLeaf) {
      onFileSelect && onFileSelect(node.path);
    }
  };

  // Handle tree expansion
  const handleExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
    setAutoExpandParent(false);
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchValue(value);
    if (value) {
      // Expand all when searching
      ipcRenderer.invoke('file-browser:search', currentPath, value)
        .then(result => {
          setExpandedKeys(result.expandedKeys);
          setAutoExpandParent(true);
        });
    } else {
      setAutoExpandParent(false);
    }
  };

  // Refresh the current directory
  const handleRefresh = () => {
    loadDirectory(currentPath);
  };

  // Go up one directory
  const handleGoUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    if (parentPath) {
      loadDirectory(parentPath);
    }
  };

  // Go to home directory
  const handleGoHome = () => {
    ipcRenderer.invoke('file-browser:get-home-path')
      .then(homePath => {
        loadDirectory(homePath);
      });
  };

  // Create a new file
  const handleNewFile = () => {
    Modal.confirm({
      title: 'Create New File',
      content: (
        <Form>
          <Form.Item label="File Name">
            <Input id="newFileName" />
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        const fileName = document.getElementById('newFileName').value;
        if (!fileName) {
          message.error('File name cannot be empty');
          return;
        }
        
        ipcRenderer.invoke('file-browser:create-file', currentPath, fileName)
          .then(() => {
            message.success(`File ${fileName} created successfully`);
            handleRefresh();
          })
          .catch(error => {
            message.error(`Failed to create file: ${error.message}`);
          });
      }
    });
  };

  // Create a new folder
  const handleNewFolder = () => {
    Modal.confirm({
      title: 'Create New Folder',
      content: (
        <Form>
          <Form.Item label="Folder Name">
            <Input id="newFolderName" />
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        const folderName = document.getElementById('newFolderName').value;
        if (!folderName) {
          message.error('Folder name cannot be empty');
          return;
        }
        
        ipcRenderer.invoke('file-browser:create-folder', currentPath, folderName)
          .then(() => {
            message.success(`Folder ${folderName} created successfully`);
            handleRefresh();
          })
          .catch(error => {
            message.error(`Failed to create folder: ${error.message}`);
          });
      }
    });
  };

  // Set file status (for testing color coding)
  const setFileStatus = (path, status) => {
    // Update local state
    setFileStatuses(prev => ({
      ...prev,
      [path]: status
    }));
    
    // Send to backend
    ipcRenderer.invoke('file-browser:set-file-status', path, status)
      .catch(error => {
        message.error(`Failed to set file status: ${error.message}`);
      });
  };

  // Context menu for files and folders
  const getContextMenu = (node) => {
    const { path, isLeaf } = node;
    
    if (isLeaf) {
      // File context menu
      return (
        <Menu>
          <Menu.Item key="open" onClick={() => onFileSelect && onFileSelect(path)}>
            Open
          </Menu.Item>
          <Menu.SubMenu key="status" title="Set Status">
            <Menu.Item key="normal" onClick={() => setFileStatus(path, 'normal')}>
              Normal
            </Menu.Item>
            <Menu.Item key="warning" onClick={() => setFileStatus(path, 'warning')}>
              Warning
            </Menu.Item>
            <Menu.Item key="error" onClick={() => setFileStatus(path, 'error')}>
              Error
            </Menu.Item>
            <Menu.Item key="success" onClick={() => setFileStatus(path, 'success')}>
              Success
            </Menu.Item>
          </Menu.SubMenu>
          <Menu.Divider />
          <Menu.Item key="rename" onClick={() => handleRename(path)}>
            Rename
          </Menu.Item>
          <Menu.Item key="delete" onClick={() => handleDelete(path)}>
            Delete
          </Menu.Item>
        </Menu>
      );
    } else {
      // Folder context menu
      return (
        <Menu>
          <Menu.Item key="open" onClick={() => loadDirectory(path)}>
            Open
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item key="newFile" onClick={() => handleNewFileInFolder(path)}>
            New File
          </Menu.Item>
          <Menu.Item key="newFolder" onClick={() => handleNewFolderInFolder(path)}>
            New Folder
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item key="rename" onClick={() => handleRename(path)}>
            Rename
          </Menu.Item>
          <Menu.Item key="delete" onClick={() => handleDelete(path)}>
            Delete
          </Menu.Item>
        </Menu>
      );
    }
  };

  // Handle rename
  const handleRename = (path) => {
    const name = path.split('/').pop();
    
    Modal.confirm({
      title: 'Rename',
      content: (
        <Form>
          <Form.Item label="New Name">
            <Input id="newName" defaultValue={name} />
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        const newName = document.getElementById('newName').value;
        if (!newName) {
          message.error('Name cannot be empty');
          return;
        }
        
        ipcRenderer.invoke('file-browser:rename', path, newName)
          .then(() => {
            message.success(`Renamed successfully`);
            handleRefresh();
          })
          .catch(error => {
            message.error(`Failed to rename: ${error.message}`);
          });
      }
    });
  };

  // Handle delete
  const handleDelete = (path) => {
    const isDirectory = !path.includes('.');
    const name = path.split('/').pop();
    
    confirm({
      title: `Delete ${isDirectory ? 'Folder' : 'File'}`,
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete ${name}?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        ipcRenderer.invoke('file-browser:delete', path)
          .then(() => {
            message.success(`Deleted successfully`);
            handleRefresh();
          })
          .catch(error => {
            message.error(`Failed to delete: ${error.message}`);
          });
      }
    });
  };

  // Create new file in specific folder
  const handleNewFileInFolder = (folderPath) => {
    Modal.confirm({
      title: 'Create New File',
      content: (
        <Form>
          <Form.Item label="File Name">
            <Input id="newFileName" />
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        const fileName = document.getElementById('newFileName').value;
        if (!fileName) {
          message.error('File name cannot be empty');
          return;
        }
        
        ipcRenderer.invoke('file-browser:create-file', folderPath, fileName)
          .then(() => {
            message.success(`File ${fileName} created successfully`);
            handleRefresh();
          })
          .catch(error => {
            message.error(`Failed to create file: ${error.message}`);
          });
      }
    });
  };

  // Create new folder in specific folder
  const handleNewFolderInFolder = (folderPath) => {
    Modal.confirm({
      title: 'Create New Folder',
      content: (
        <Form>
          <Form.Item label="Folder Name">
            <Input id="newFolderName" />
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        const folderName = document.getElementById('newFolderName').value;
        if (!folderName) {
          message.error('Folder name cannot be empty');
          return;
        }
        
        ipcRenderer.invoke('file-browser:create-folder', folderPath, folderName)
          .then(() => {
            message.success(`Folder ${folderName} created successfully`);
            handleRefresh();
          })
          .catch(error => {
            message.error(`Failed to create folder: ${error.message}`);
          });
      }
    });
  };

  // Custom tree node renderer with context menu and color coding
  const renderTreeNodes = (data) => {
    return data.map(item => {
      const key = item.key;
      const title = (
        <Dropdown overlay={getContextMenu(item)} trigger={['contextMenu']}>
          <span>
            <ColoredTreeNodeTitle 
              title={item.title} 
              path={item.path} 
              isLeaf={item.isLeaf} 
              theme={theme}
              fileStatus={fileStatuses[item.path] || 'normal'}
            />
          </span>
        </Dropdown>
      );
      
      if (item.children) {
        return {
          key,
          title,
          children: renderTreeNodes(item.children),
          ...item
        };
      }
      
      return {
        key,
        title,
        ...item
      };
    });
  };

  return (
    <FileBrowserContainer theme={theme}>
      <ToolbarContainer theme={theme}>
        <Space>
          <Tooltip title="Refresh">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              type="text"
              style={{ color: theme === 'dark' ? '#f0f0f0' : '#000000' }}
            />
          </Tooltip>
          <Tooltip title="New File">
            <Button 
              icon={<PlusOutlined />} 
              onClick={handleNewFile}
              type="text"
              style={{ color: theme === 'dark' ? '#f0f0f0' : '#000000' }}
            />
          </Tooltip>
          <Tooltip title="New Folder">
            <Button 
              icon={<FolderAddOutlined />} 
              onClick={handleNewFolder}
              type="text"
              style={{ color: theme === 'dark' ? '#f0f0f0' : '#000000' }}
            />
          </Tooltip>
          <Tooltip title="Go Up">
            <Button 
              icon={<UpOutlined />} 
              onClick={handleGoUp}
              type="text"
              style={{ color: theme === 'dark' ? '#f0f0f0' : '#000000' }}
            />
          </Tooltip>
          <Tooltip title="Home">
            <Button 
              icon={<HomeOutlined />} 
              onClick={handleGoHome}
              type="text"
              style={{ color: theme === 'dark' ? '#f0f0f0' : '#000000' }}
            />
          </Tooltip>
        </Space>
        <div style={{ flex: 1 }} />
        <Search
          placeholder="Search files"
          onChange={e => handleSearch(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
      </ToolbarContainer>
      
      <TreeContainer>
        <DirectoryTree
          treeData={renderTreeNodes(treeData)}
          onSelect={handleSelect}
          onExpand={handleExpand}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          selectedKeys={selectedKeys}
          style={{ 
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
            color: theme === 'dark' ? '#f0f0f0' : '#000000'
          }}
        />
      </TreeContainer>
      
      <StatusBarContainer theme={theme}>
        {statusBarText}
      </StatusBarContainer>
    </FileBrowserContainer>
  );
};

export default FileBrowserColored;
