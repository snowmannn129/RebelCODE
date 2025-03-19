import { AssetMetadata, AssetType, AssetFilter, AssetSearchResult } from './AssetMetadata';
import { FileSystemInterface, FileSystemChange } from './FileSystemInterface';
import { SearchEngine, EnhancedAssetFilter } from './SearchEngine';

/**
 * Manages asset loading, caching, and metadata
 */
export class AssetManager {
    private fileSystem: FileSystemInterface;
    private assetCache: Map<string, AssetMetadata> = new Map();
    private thumbnailCache: Map<string, string> = new Map();
    private maxCacheSize: number;
    private searchEngine: SearchEngine;

    constructor(rootDirectory: string, maxCacheSize: number = 1000) {
        this.fileSystem = new FileSystemInterface(rootDirectory);
        this.maxCacheSize = maxCacheSize;
        this.searchEngine = new SearchEngine();
        this.initializeFileWatcher();
    }

    /**
     * Initializes the file system watcher
     */
    private initializeFileWatcher(): void {
        this.fileSystem.startWatching((changes: FileSystemChange[]) => {
            changes.forEach(change => {
                switch (change.type) {
                    case 'added':
                    case 'modified':
                        if (change.metadata) {
                            this.assetCache.set(change.path, change.metadata);
                            this.searchEngine.indexAsset(change.metadata);
                        }
                        break;
                    case 'deleted':
                        const metadata = this.assetCache.get(change.path);
                        if (metadata) {
                            this.searchEngine.removeFromIndex(metadata.id);
                        }
                        this.assetCache.delete(change.path);
                        this.thumbnailCache.delete(change.path);
                        break;
                }
            });
        });
    }

    /**
     * Loads assets from a directory
     */
    public async loadDirectory(path: string): Promise<AssetMetadata[]> {
        const assets = await this.fileSystem.scanDirectory(path);
        assets.forEach(asset => {
            this.assetCache.set(asset.path, asset);
            this.searchEngine.indexAsset(asset);
        });
        return assets;
    }

    /**
     * Searches for assets based on filter criteria
     */
    public async searchAssets(filter: AssetFilter | EnhancedAssetFilter, page: number = 1, pageSize: number = 50): Promise<AssetSearchResult> {
        const assets = Array.from(this.assetCache.values());
        return this.searchEngine.searchAssets(assets, filter as EnhancedAssetFilter, page, pageSize);
    }

    /**
     * Gets search suggestions based on input
     */
    public getSuggestions(input: string, limit: number = 5): import('./SearchEngine').SearchSuggestion[] {
        return this.searchEngine.getSuggestions(input, limit);
    }

    /**
     * Saves a filter preset
     */
    public saveFilterPreset(name: string, filter: EnhancedAssetFilter): string {
        return this.searchEngine.saveFilterPreset(name, filter);
    }

    /**
     * Gets all saved filter presets
     */
    public getFilterPresets(): import('./SearchEngine').FilterPreset[] {
        return this.searchEngine.getFilterPresets();
    }

    /**
     * Gets recent search history
     */
    public getSearchHistory(limit: number = 10): import('./SearchEngine').SearchHistoryEntry[] {
        return this.searchEngine.getSearchHistory(limit);
    }

    /**
     * Clears search history
     */
    public clearSearchHistory(): void {
        this.searchEngine.clearSearchHistory();
    }

    /**
     * Gets an asset's thumbnail
     */
    public async getThumbnail(path: string): Promise<string | null> {
        if (this.thumbnailCache.has(path)) {
            return this.thumbnailCache.get(path)!;
        }

        const thumbnail = await this.fileSystem.generateThumbnail(path);
        if (thumbnail) {
            this.thumbnailCache.set(path, thumbnail);
            this.enforceCacheLimit();
        }

        return thumbnail;
    }

    /**
     * Enforces the cache size limit
     */
    private enforceCacheLimit(): void {
        if (this.thumbnailCache.size > this.maxCacheSize) {
            const entriesToRemove = Array.from(this.thumbnailCache.keys())
                .slice(0, this.thumbnailCache.size - this.maxCacheSize);
            
            entriesToRemove.forEach(key => {
                this.thumbnailCache.delete(key);
            });
        }
    }

    /**
     * Gets metadata for a specific asset
     */
    public async getAssetMetadata(path: string): Promise<AssetMetadata | null> {
        if (this.assetCache.has(path)) {
            return this.assetCache.get(path)!;
        }

        const metadata = await this.fileSystem.getAssetMetadata(path);
        if (metadata) {
            this.assetCache.set(path, metadata);
            this.searchEngine.indexAsset(metadata);
        }

        return metadata;
    }

    /**
     * Cleans up resources
     */
    public dispose(): void {
        this.fileSystem.stopWatching();
        this.assetCache.clear();
        this.thumbnailCache.clear();
    }
}
