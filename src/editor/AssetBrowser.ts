import { AssetManager } from './AssetManager';
import { AssetMetadata, AssetType, AssetFilter, AssetBrowserConfig } from './AssetMetadata';
import { FileSystemInterface } from './FileSystemInterface';
import { EnhancedAssetFilter, FilterPreset, SearchSuggestion, SearchHistoryEntry } from './SearchEngine';

/**
 * Main asset browser component for the game engine editor
 */
export class AssetBrowser {
    private assetManager: AssetManager;
    private config: AssetBrowserConfig;
    private selectedAssets: Set<string> = new Set();
    private currentDirectory: string;

    constructor(config: AssetBrowserConfig) {
        this.config = config;
        this.currentDirectory = config.rootDirectory;
        this.assetManager = new AssetManager(config.rootDirectory, config.cacheSize);
        this.initialize();
    }

    /**
     * Initializes the asset browser
     */
    private async initialize(): Promise<void> {
        await this.refreshCurrentDirectory();
    }

    /**
     * Refreshes the current directory
     */
    public async refreshCurrentDirectory(): Promise<AssetMetadata[]> {
        return await this.assetManager.loadDirectory(this.currentDirectory);
    }

    /**
     * Navigates to a directory
     */
    public async navigateToDirectory(path: string): Promise<void> {
        this.currentDirectory = path;
        this.selectedAssets.clear();
        await this.refreshCurrentDirectory();
    }

    /**
     * Gets the current directory path
     */
    public getCurrentDirectory(): string {
        return this.currentDirectory;
    }

    /**
     * Searches for assets using the provided filter
     */
    public async searchAssets(filter: AssetFilter | EnhancedAssetFilter, page: number = 1, pageSize: number = 50) {
        return await this.assetManager.searchAssets(filter, page, pageSize);
    }

    /**
     * Gets search suggestions based on input
     */
    public getSuggestions(input: string, limit: number = 5): SearchSuggestion[] {
        return this.assetManager.getSuggestions(input, limit);
    }

    /**
     * Saves a filter preset
     */
    public saveFilterPreset(name: string, filter: EnhancedAssetFilter): string {
        return this.assetManager.saveFilterPreset(name, filter);
    }

    /**
     * Gets all saved filter presets
     */
    public getFilterPresets(): FilterPreset[] {
        return this.assetManager.getFilterPresets();
    }

    /**
     * Gets recent search history
     */
    public getSearchHistory(limit: number = 10): SearchHistoryEntry[] {
        return this.assetManager.getSearchHistory(limit);
    }

    /**
     * Clears search history
     */
    public clearSearchHistory(): void {
        this.assetManager.clearSearchHistory();
    }

    /**
     * Selects an asset
     */
    public selectAsset(assetPath: string, multiSelect: boolean = false): void {
        if (!multiSelect) {
            this.selectedAssets.clear();
        }
        this.selectedAssets.add(assetPath);
    }

    /**
     * Deselects an asset
     */
    public deselectAsset(assetPath: string): void {
        this.selectedAssets.delete(assetPath);
    }

    /**
     * Gets the currently selected assets
     */
    public getSelectedAssets(): string[] {
        return Array.from(this.selectedAssets);
    }

    /**
     * Checks if an asset is selected
     */
    public isAssetSelected(assetPath: string): boolean {
        return this.selectedAssets.has(assetPath);
    }

    /**
     * Gets an asset's thumbnail
     */
    public async getThumbnail(assetPath: string): Promise<string | null> {
        return await this.assetManager.getThumbnail(assetPath);
    }

    /**
     * Gets metadata for a specific asset
     */
    public async getAssetMetadata(assetPath: string): Promise<AssetMetadata | null> {
        return await this.assetManager.getAssetMetadata(assetPath);
    }

    /**
     * Gets the supported asset types
     */
    public getSupportedAssetTypes(): AssetType[] {
        return this.config.supportedTypes;
    }

    /**
     * Gets the thumbnail size configuration
     */
    public getThumbnailSize(): { width: number; height: number } {
        return this.config.thumbnailSize;
    }

    /**
     * Checks if auto-refresh is enabled
     */
    public isAutoRefreshEnabled(): boolean {
        return this.config.autoRefresh;
    }

    /**
     * Disposes of the asset browser resources
     */
    public dispose(): void {
        this.assetManager.dispose();
        this.selectedAssets.clear();
    }
}
