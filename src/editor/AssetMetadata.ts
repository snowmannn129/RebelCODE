/**
 * Represents the metadata for an asset in the game engine
 */
export interface AssetMetadata {
    id: string;
    name: string;
    type: AssetType;
    path: string;
    size: number;
    lastModified: Date;
    tags: string[];
    thumbnail?: string;
    dependencies?: string[];
}

/**
 * Supported asset types in the engine
 */
export enum AssetType {
    Texture = 'texture',
    Model = 'model',
    Audio = 'audio',
    Material = 'material',
    Prefab = 'prefab',
    Script = 'script',
    Animation = 'animation',
    Scene = 'scene',
    Shader = 'shader',
    Font = 'font',
    Other = 'other'
}

/**
 * Configuration options for the asset browser
 */
export interface AssetBrowserConfig {
    rootDirectory: string;
    supportedTypes: AssetType[];
    thumbnailSize: { width: number; height: number };
    cacheSize: number;
    autoRefresh: boolean;
}

/**
 * Result of an asset search operation
 */
export interface AssetSearchResult {
    assets: AssetMetadata[];
    totalCount: number;
    page: number;
    pageSize: number;
}

/**
 * Filter options for asset queries
 */
export interface AssetFilter {
    types?: AssetType[];
    tags?: string[];
    searchQuery?: string;
    sortBy?: 'name' | 'type' | 'size' | 'lastModified';
    sortDirection?: 'asc' | 'desc';
}
