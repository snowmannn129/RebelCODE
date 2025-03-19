import { AssetMetadata, AssetType, AssetSearchResult } from './AssetMetadata';

/**
 * Enhanced filter options for advanced asset queries
 */
export interface EnhancedAssetFilter {
    // Basic filters
    types?: AssetType[];
    tags?: string[];
    searchQuery?: string;
    
    // Advanced filters
    sizeRange?: { min?: number; max?: number };
    dateRange?: { from?: Date; to?: Date };
    dependencies?: string[];
    hasPreview?: boolean;
    
    // Complex query support
    matchAll?: boolean; // true = AND, false = OR
    excludeTags?: string[];
    namePattern?: RegExp;
    
    // Sorting
    sortBy?: 'name' | 'type' | 'size' | 'lastModified' | 'relevance';
    sortDirection?: 'asc' | 'desc';
}

/**
 * Represents a saved filter preset
 */
export interface FilterPreset {
    id: string;
    name: string;
    filter: EnhancedAssetFilter;
    createdAt: Date;
    lastUsed: Date;
}

/**
 * Search history entry
 */
export interface SearchHistoryEntry {
    query: string;
    filter: EnhancedAssetFilter;
    timestamp: Date;
    resultCount: number;
}

/**
 * Search suggestion with metadata
 */
export interface SearchSuggestion {
    text: string;
    type: 'asset' | 'tag' | 'type' | 'history';
    frequency: number;
    lastUsed: Date;
}

/**
 * Handles advanced search functionality for the asset browser
 */
export class SearchEngine {
    private searchHistory: SearchHistoryEntry[] = [];
    private filterPresets: Map<string, FilterPreset> = new Map();
    private searchIndex: Map<string, Set<string>> = new Map(); // Term -> Asset IDs
    private suggestions: Map<string, SearchSuggestion> = new Map();
    
    constructor() {
        this.loadSearchHistory();
        this.loadFilterPresets();
    }

    /**
     * Indexes an asset for searching
     */
    public indexAsset(asset: AssetMetadata): void {
        // Index name terms
        this.indexTerms(asset.name.toLowerCase().split(/\W+/), asset.id);
        
        // Index tags
        asset.tags.forEach(tag => {
            this.indexTerms([tag.toLowerCase()], asset.id);
            this.updateSuggestion(tag, 'tag');
        });
        
        // Index asset type
        this.indexTerms([asset.type.toLowerCase()], asset.id);
        this.updateSuggestion(asset.type, 'type');
        
        // Update name-based suggestions
        this.updateSuggestion(asset.name, 'asset');
    }

    /**
     * Removes an asset from the search index
     */
    public removeFromIndex(assetId: string): void {
        for (const [term, assets] of this.searchIndex.entries()) {
            assets.delete(assetId);
            if (assets.size === 0) {
                this.searchIndex.delete(term);
            }
        }
    }

    /**
     * Searches assets using the enhanced filter
     */
    public searchAssets(
        assets: AssetMetadata[],
        filter: EnhancedAssetFilter,
        page: number = 1,
        pageSize: number = 50
    ): AssetSearchResult {
        let results = assets;

        if (filter.searchQuery) {
            const terms = filter.searchQuery.toLowerCase().split(/\W+/);
            const matchingIds = this.findMatchingAssetIds(terms, filter.matchAll ?? true);
            results = results.filter(asset => matchingIds.has(asset.id));
        }

        // Apply type filters
        if (filter.types?.length) {
            results = results.filter(asset => filter.types!.includes(asset.type));
        }

        // Apply tag filters
        if (filter.tags?.length) {
            results = results.filter(asset => 
                filter.matchAll
                    ? filter.tags!.every(tag => asset.tags.includes(tag))
                    : filter.tags!.some(tag => asset.tags.includes(tag))
            );
        }

        // Apply exclude tags
        if (filter.excludeTags?.length) {
            results = results.filter(asset => 
                !filter.excludeTags!.some(tag => asset.tags.includes(tag))
            );
        }

        // Apply size range filter
        if (filter.sizeRange) {
            results = results.filter(asset => {
                const { min, max } = filter.sizeRange!;
                return (!min || asset.size >= min) && (!max || asset.size <= max);
            });
        }

        // Apply date range filter
        if (filter.dateRange) {
            results = results.filter(asset => {
                const { from, to } = filter.dateRange!;
                return (!from || asset.lastModified >= from) && 
                       (!to || asset.lastModified <= to);
            });
        }

        // Apply name pattern filter
        if (filter.namePattern) {
            results = results.filter(asset => filter.namePattern!.test(asset.name));
        }

        // Apply dependencies filter
        if (filter.dependencies?.length) {
            results = results.filter(asset => 
                asset.dependencies?.some(dep => filter.dependencies!.includes(dep))
            );
        }

        // Apply preview filter
        if (filter.hasPreview !== undefined) {
            results = results.filter(asset => 
                filter.hasPreview === (asset.thumbnail !== undefined)
            );
        }

        // Apply sorting
        if (filter.sortBy) {
            results.sort((a, b) => {
                let comparison = 0;
                switch (filter.sortBy) {
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'type':
                        comparison = a.type.localeCompare(b.type);
                        break;
                    case 'size':
                        comparison = a.size - b.size;
                        break;
                    case 'lastModified':
                        comparison = a.lastModified.getTime() - b.lastModified.getTime();
                        break;
                    case 'relevance':
                        // Implement relevance scoring if needed
                        break;
                }
                return filter.sortDirection === 'desc' ? -comparison : comparison;
            });
        }

        // Record search history
        if (filter.searchQuery) {
            this.addToSearchHistory({
                query: filter.searchQuery,
                filter,
                timestamp: new Date(),
                resultCount: results.length
            });
        }

        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const paginatedResults = results.slice(startIndex, startIndex + pageSize);

        return {
            assets: paginatedResults,
            totalCount: results.length,
            page,
            pageSize
        };
    }

    /**
     * Gets search suggestions based on input
     */
    public getSuggestions(input: string, limit: number = 5): SearchSuggestion[] {
        const normalizedInput = input.toLowerCase();
        return Array.from(this.suggestions.values())
            .filter(suggestion => suggestion.text.toLowerCase().includes(normalizedInput))
            .sort((a, b) => {
                // Sort by frequency first, then by last used date
                if (a.frequency !== b.frequency) {
                    return b.frequency - a.frequency;
                }
                return b.lastUsed.getTime() - a.lastUsed.getTime();
            })
            .slice(0, limit);
    }

    /**
     * Saves a filter preset
     */
    public saveFilterPreset(name: string, filter: EnhancedAssetFilter): string {
        const preset: FilterPreset = {
            id: crypto.randomUUID(),
            name,
            filter,
            createdAt: new Date(),
            lastUsed: new Date()
        };
        this.filterPresets.set(preset.id, preset);
        this.saveFilterPresetsToStorage();
        return preset.id;
    }

    /**
     * Gets all saved filter presets
     */
    public getFilterPresets(): FilterPreset[] {
        return Array.from(this.filterPresets.values())
            .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
    }

    /**
     * Gets recent search history
     */
    public getSearchHistory(limit: number = 10): SearchHistoryEntry[] {
        return this.searchHistory
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Clears search history
     */
    public clearSearchHistory(): void {
        this.searchHistory = [];
        this.saveSearchHistoryToStorage();
    }

    private indexTerms(terms: string[], assetId: string): void {
        terms.forEach(term => {
            if (!term) return;
            if (!this.searchIndex.has(term)) {
                this.searchIndex.set(term, new Set());
            }
            this.searchIndex.get(term)!.add(assetId);
        });
    }

    private updateSuggestion(text: string, type: 'asset' | 'tag' | 'type' | 'history'): void {
        const key = `${type}:${text.toLowerCase()}`;
        const existing = this.suggestions.get(key);
        if (existing) {
            existing.frequency++;
            existing.lastUsed = new Date();
        } else {
            this.suggestions.set(key, {
                text,
                type,
                frequency: 1,
                lastUsed: new Date()
            });
        }
    }

    private findMatchingAssetIds(terms: string[], matchAll: boolean): Set<string> {
        if (terms.length === 0) return new Set<string>();

        const termSets = terms.map(term => this.searchIndex.get(term) || new Set<string>());
        
        if (matchAll) {
            // AND operation
            const firstSet = termSets[0] || new Set<string>();
            return new Set(
                [...firstSet].filter(id =>
                    termSets.every(set => set.has(id))
                )
            );
        } else {
            // OR operation
            const allIds = new Set<string>();
            termSets.forEach(set => {
                set.forEach(id => allIds.add(id));
            });
            return allIds;
        }
    }

    private addToSearchHistory(entry: SearchHistoryEntry): void {
        this.searchHistory.push(entry);
        if (this.searchHistory.length > 100) {
            this.searchHistory = this.searchHistory.slice(-100);
        }
        this.saveSearchHistoryToStorage();
        this.updateSuggestion(entry.query, 'history');
    }

    private loadSearchHistory(): void {
        try {
            const stored = localStorage.getItem('assetBrowserSearchHistory');
            if (stored) {
                this.searchHistory = JSON.parse(stored).map((entry: any) => ({
                    ...entry,
                    timestamp: new Date(entry.timestamp)
                }));
            }
        } catch (error) {
            console.error('Failed to load search history:', error);
        }
    }

    private saveSearchHistoryToStorage(): void {
        try {
            localStorage.setItem('assetBrowserSearchHistory', 
                JSON.stringify(this.searchHistory)
            );
        } catch (error) {
            console.error('Failed to save search history:', error);
        }
    }

    private loadFilterPresets(): void {
        try {
            const stored = localStorage.getItem('assetBrowserFilterPresets');
            if (stored) {
                const presets = JSON.parse(stored);
                this.filterPresets = new Map(
                    Object.entries(presets).map(([id, preset]: [string, any]) => [
                        id,
                        {
                            ...preset,
                            createdAt: new Date(preset.createdAt),
                            lastUsed: new Date(preset.lastUsed)
                        }
                    ])
                );
            }
        } catch (error) {
            console.error('Failed to load filter presets:', error);
        }
    }

    private saveFilterPresetsToStorage(): void {
        try {
            localStorage.setItem('assetBrowserFilterPresets',
                JSON.stringify(Object.fromEntries(this.filterPresets))
            );
        } catch (error) {
            console.error('Failed to save filter presets:', error);
        }
    }
}
