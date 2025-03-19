import { AssetBrowser } from './AssetBrowser';
import { AssetType, AssetBrowserConfig, AssetFilter } from './AssetMetadata';

describe('AssetBrowser', () => {
    let assetBrowser: AssetBrowser;
    const mockConfig: AssetBrowserConfig = {
        rootDirectory: '/mock/assets',
        supportedTypes: [
            AssetType.Texture,
            AssetType.Model,
            AssetType.Audio
        ],
        thumbnailSize: { width: 128, height: 128 },
        cacheSize: 100,
        autoRefresh: true
    };

    beforeEach(() => {
        assetBrowser = new AssetBrowser(mockConfig);
    });

    afterEach(() => {
        assetBrowser.dispose();
    });

    describe('Configuration', () => {
        it('should initialize with provided config', () => {
            expect(assetBrowser.getCurrentDirectory()).toBe(mockConfig.rootDirectory);
            expect(assetBrowser.getSupportedAssetTypes()).toEqual(mockConfig.supportedTypes);
            expect(assetBrowser.getThumbnailSize()).toEqual(mockConfig.thumbnailSize);
            expect(assetBrowser.isAutoRefreshEnabled()).toBe(mockConfig.autoRefresh);
        });
    });

    describe('Navigation', () => {
        it('should navigate to directory and clear selection', async () => {
            const newPath = '/mock/assets/textures';
            assetBrowser.selectAsset('some/asset/path');
            
            await assetBrowser.navigateToDirectory(newPath);
            
            expect(assetBrowser.getCurrentDirectory()).toBe(newPath);
            expect(assetBrowser.getSelectedAssets()).toHaveLength(0);
        });
    });

    describe('Asset Selection', () => {
        it('should handle single asset selection', () => {
            const assetPath = 'mock/asset1.png';
            assetBrowser.selectAsset(assetPath);
            
            expect(assetBrowser.isAssetSelected(assetPath)).toBe(true);
            expect(assetBrowser.getSelectedAssets()).toHaveLength(1);
            expect(assetBrowser.getSelectedAssets()[0]).toBe(assetPath);
        });

        it('should handle multi-select', () => {
            const asset1 = 'mock/asset1.png';
            const asset2 = 'mock/asset2.png';
            
            assetBrowser.selectAsset(asset1, true);
            assetBrowser.selectAsset(asset2, true);
            
            expect(assetBrowser.getSelectedAssets()).toHaveLength(2);
            expect(assetBrowser.isAssetSelected(asset1)).toBe(true);
            expect(assetBrowser.isAssetSelected(asset2)).toBe(true);
        });

        it('should clear previous selection when multi-select is false', () => {
            const asset1 = 'mock/asset1.png';
            const asset2 = 'mock/asset2.png';
            
            assetBrowser.selectAsset(asset1);
            assetBrowser.selectAsset(asset2); // multi-select defaults to false
            
            expect(assetBrowser.getSelectedAssets()).toHaveLength(1);
            expect(assetBrowser.isAssetSelected(asset1)).toBe(false);
            expect(assetBrowser.isAssetSelected(asset2)).toBe(true);
        });

        it('should deselect assets', () => {
            const assetPath = 'mock/asset1.png';
            assetBrowser.selectAsset(assetPath);
            assetBrowser.deselectAsset(assetPath);
            
            expect(assetBrowser.isAssetSelected(assetPath)).toBe(false);
            expect(assetBrowser.getSelectedAssets()).toHaveLength(0);
        });
    });

    describe('Asset Search', () => {
        it('should search assets with filters', async () => {
            const filter: AssetFilter = {
                types: [AssetType.Texture],
                tags: ['environment'],
                searchQuery: 'terrain',
                sortBy: 'name',
                sortDirection: 'asc'
            };

            const result = await assetBrowser.searchAssets(filter);
            
            expect(result).toBeDefined();
            expect(Array.isArray(result.assets)).toBe(true);
            expect(typeof result.totalCount).toBe('number');
            expect(typeof result.page).toBe('number');
            expect(typeof result.pageSize).toBe('number');
        });

        it('should handle pagination in search results', async () => {
            const page = 2;
            const pageSize = 10;
            const filter: AssetFilter = {
                types: [AssetType.Texture]
            };

            const result = await assetBrowser.searchAssets(filter, page, pageSize);
            
            expect(result.page).toBe(page);
            expect(result.pageSize).toBe(pageSize);
            expect(result.assets.length).toBeLessThanOrEqual(pageSize);
        });
    });

    describe('Asset Metadata', () => {
        it('should retrieve asset metadata', async () => {
            const assetPath = 'mock/asset1.png';
            const metadata = await assetBrowser.getAssetMetadata(assetPath);
            
            expect(metadata).toBeDefined();
            if (metadata) {
                expect(metadata.path).toBe(assetPath);
                expect(metadata.type).toBeDefined();
                expect(metadata.name).toBeDefined();
                expect(metadata.size).toBeDefined();
                expect(metadata.lastModified).toBeDefined();
                expect(Array.isArray(metadata.tags)).toBe(true);
            }
        });

        it('should retrieve asset thumbnails', async () => {
            const assetPath = 'mock/asset1.png';
            const thumbnail = await assetBrowser.getThumbnail(assetPath);
            
            expect(typeof thumbnail === 'string' || thumbnail === null).toBe(true);
        });
    });

    describe('Cleanup', () => {
        it('should properly dispose resources', () => {
            assetBrowser.selectAsset('mock/asset1.png');
            assetBrowser.dispose();
            
            expect(assetBrowser.getSelectedAssets()).toHaveLength(0);
        });
    });
});
