import { AssetMetadata, AssetType } from './AssetMetadata';

/**
 * Represents a file system change event
 */
export interface FileSystemChange {
    type: 'added' | 'modified' | 'deleted';
    path: string;
    metadata?: AssetMetadata;
}

/**
 * Handles file system operations for the asset browser
 */
export class FileSystemInterface {
    private rootDirectory: string;
    private fileWatcher: any; // Platform-specific file watcher implementation
    private changeCallbacks: ((changes: FileSystemChange[]) => void)[] = [];

    constructor(rootDirectory: string) {
        this.rootDirectory = rootDirectory;
    }

    /**
     * Scans the directory for assets and returns their metadata
     */
    public async scanDirectory(path: string): Promise<AssetMetadata[]> {
        // Implementation would interact with actual file system
        // This is a mock implementation
        return [
            {
                id: 'mock-1',
                name: 'example-texture',
                type: AssetType.Texture,
                path: `${path}/example-texture.png`,
                size: 1024,
                lastModified: new Date(),
                tags: ['texture', 'environment']
            }
        ];
    }

    /**
     * Starts watching for file system changes
     */
    public startWatching(callback: (changes: FileSystemChange[]) => void): void {
        this.changeCallbacks.push(callback);
        
        if (!this.fileWatcher) {
            // Implementation would set up actual file system watching
            // This is a mock implementation
            this.fileWatcher = setInterval(() => {
                // Mock file system changes
            }, 1000);
        }
    }

    /**
     * Stops watching for file system changes
     */
    public stopWatching(): void {
        if (this.fileWatcher) {
            clearInterval(this.fileWatcher);
            this.fileWatcher = null;
        }
        this.changeCallbacks = [];
    }

    /**
     * Gets metadata for a specific asset
     */
    public async getAssetMetadata(path: string): Promise<AssetMetadata | null> {
        // Implementation would read actual file metadata
        // This is a mock implementation
        return {
            id: 'mock-1',
            name: 'example-texture',
            type: AssetType.Texture,
            path: path,
            size: 1024,
            lastModified: new Date(),
            tags: ['texture', 'environment']
        };
    }

    /**
     * Generates a thumbnail for an asset
     */
    public async generateThumbnail(path: string): Promise<string | null> {
        // Implementation would generate actual thumbnails
        // This is a mock implementation
        return 'data:image/png;base64,mock-thumbnail-data';
    }

    /**
     * Checks if a file is a supported asset type
     */
    public isSupportedAsset(path: string): boolean {
        const extension = path.split('.').pop()?.toLowerCase();
        const supportedExtensions = [
            'png', 'jpg', 'jpeg', 'gif', // Textures
            'fbx', 'obj', 'gltf', // Models
            'wav', 'mp3', 'ogg', // Audio
            'mat', // Materials
            'prefab', // Prefabs
            'ts', 'js', // Scripts
            'anim', // Animations
            'scene', // Scenes
            'shader', // Shaders
            'ttf', 'otf' // Fonts
        ];
        
        return extension ? supportedExtensions.includes(extension) : false;
    }

    /**
     * Gets the asset type based on file extension
     */
    public getAssetType(path: string): AssetType {
        const extension = path.split('.').pop()?.toLowerCase();
        
        switch (extension) {
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
                return AssetType.Texture;
            case 'fbx':
            case 'obj':
            case 'gltf':
                return AssetType.Model;
            case 'wav':
            case 'mp3':
            case 'ogg':
                return AssetType.Audio;
            case 'mat':
                return AssetType.Material;
            case 'prefab':
                return AssetType.Prefab;
            case 'ts':
            case 'js':
                return AssetType.Script;
            case 'anim':
                return AssetType.Animation;
            case 'scene':
                return AssetType.Scene;
            case 'shader':
                return AssetType.Shader;
            case 'ttf':
            case 'otf':
                return AssetType.Font;
            default:
                return AssetType.Other;
        }
    }
}
