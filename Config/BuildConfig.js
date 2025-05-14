/**
 * BuildConfig.js - Derleme yapılandırması
 * Farklı platformlara derleme yapılandırmalarını yönetir
 */
class BuildConfig {
    constructor(config = {}) {
        // Temel derleme yapılandırması
        this.config = Object.assign({
            name: 'HyperGame',
            version: '1.0.0',
            buildNumber: 1,
            outputDir: 'build',
            assetsDir: 'assets',
            sourcesDir: 'src',
            debug: true,
            platforms: ['web', 'android', 'ios'],
            defaultPlatform: 'web',
            plugins: []
        }, config);
        
        // Platform yapılandırmaları
        this.platformConfigs = {
            web: {
                outputDir: `${this.config.outputDir}/web`,
                minify: true,
                bundleJs: true,
                bundleCss: true,
                serviceWorker: false,
                pwa: {
                    enabled: false
                }
            },
            android: {
                outputDir: `${this.config.outputDir}/android`,
                packageName: 'com.hypergame.app',
                versionCode: this.config.buildNumber,
                versionName: this.config.version,
                minSdkVersion: 21,
                targetSdkVersion: 31,
                buildType: 'debug'
            },
            ios: {
                outputDir: `${this.config.outputDir}/ios`,
                bundleIdentifier: 'com.hypergame.app',
                buildVersion: this.config.version,
                buildNumber: String(this.config.buildNumber),
                deploymentTarget: '13.0',
                buildType: 'debug'
            }
        };
        
        // Platform builder'ları
        this.builders = {
            web: null,
            android: null,
            ios: null
        };
        
        // Singleton instance
        if (BuildConfig.instance) {
            return BuildConfig.instance;
        }
        BuildConfig.instance = this;
    }
    
    /**
     * Platform yapılandırmasını alır
     * @param {String} platform - Platform adı
     * @return {Object} Platform yapılandırması
     */
    getPlatformConfig(platform) {
        if (!this.platformConfigs[platform]) {
            throw new Error(`Platform configuration not found: ${platform}`);
        }
        
        return this.platformConfigs[platform];
    }
    
    /**
     * Platform yapılandırmasını günceller
     * @param {String} platform - Platform adı
     * @param {Object} config - Yapılandırma değişiklikleri
     */
    updatePlatformConfig(platform, config) {
        if (!this.platformConfigs[platform]) {
            throw new Error(`Platform configuration not found: ${platform}`);
        }
        
        this.platformConfigs[platform] = Object.assign(
            this.platformConfigs[platform],
            config
        );
    }
    
    /**
     * Derleme yapılandırmasını alır
     * @return {Object} Derleme yapılandırması
     */
    getBuildConfig() {
        return this.config;
    }
    
    /**
     * Derleme yapılandırmasını günceller
     * @param {Object} config - Yapılandırma değişiklikleri
     */
    updateBuildConfig(config) {
        this.config = Object.assign(this.config, config);
        
        // Sürüm ve derleme numarası değişikliklerini platform yapılandırmalarına yansıt
        if (config.version) {
            this.platformConfigs.android.versionName = config.version;
            this.platformConfigs.ios.buildVersion = config.version;
        }
        
        if (config.buildNumber) {
            this.platformConfigs.android.versionCode = config.buildNumber;
            this.platformConfigs.ios.buildNumber = String(config.buildNumber);
        }
    }
    
    /**
     * Builder'ı alır
     * @param {String} platform - Platform adı
     * @return {Object} Platform builder'ı
     */
    getBuilder(platform) {
        if (!this.builders[platform]) {
            switch (platform) {
                case 'web':
                    this.builders[platform] = WebBuilder.getInstance();
                    break;
                case 'android':
                    this.builders[platform] = AndroidBuilder.getInstance();
                    break;
                case 'ios':
                    this.builders[platform] = IOSBuilder.getInstance();
                    break;
                default:
                    throw new Error(`Builder not found for platform: ${platform}`);
            }
        }
        
        return this.builders[platform];
    }
    
    /**
     * Belirtilen platform için derleme yapar
     * @param {String} platform - Platform adı
     * @param {Object} options - Ek derleme seçenekleri
     * @return {Promise} Derleme işleminin tamamlanma sözü
     */
    build(platform, options = {}) {
        const builder = this.getBuilder(platform);
        const platformConfig = this.getPlatformConfig(platform);
        
        // Derleme seçeneklerini birleştir
        const buildOptions = Object.assign({}, platformConfig, options);
        
        return builder.build(buildOptions);
    }
    
    /**
     * Tüm platformlar için derleme yapar
     * @param {Object} options - Ek derleme seçenekleri
     * @return {Promise} Tüm derleme işlemlerinin tamamlanma sözü
     */
    buildAll(options = {}) {
        const buildPromises = this.config.platforms.map(platform => {
            return this.build(platform, options[platform] || {});
        });
        
        return Promise.all(buildPromises);
    }
    
    /**
     * Yapılandırma dosyasını dışa aktarır
     * @param {String} filename - Dosya adı
     * @return {Boolean} İşlem başarılı mı
     */
    exportConfig(filename = 'build-config.json') {
        const configData = {
            buildConfig: this.config,
            platformConfigs: this.platformConfigs
        };
        
        try {
            // JSON'a dönüştür
            const configJson = JSON.stringify(configData, null, 2);
            
            // Dosyaya yazma işlemi burada gerçekleştirilecek
            console.log(`Build configuration exported to ${filename}`);
            
            return true;
        } catch (error) {
            console.error(`Failed to export build configuration: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Yapılandırma dosyasını içe aktarır
     * @param {String} filename - Dosya adı
     * @return {Boolean} İşlem başarılı mı
     */
    importConfig(filename = 'build-config.json') {
        try {
            // Dosyadan okuma işlemi burada gerçekleştirilecek
            // Örnek: const configJson = fs.readFileSync(filename, 'utf8');
            
            const configJson = '{}'; // Dosya okuması simüle ediliyor
            const configData = JSON.parse(configJson);
            
            if (configData.buildConfig) {
                this.config = configData.buildConfig;
            }
            
            if (configData.platformConfigs) {
                this.platformConfigs = configData.platformConfigs;
            }
            
            console.log(`Build configuration imported from ${filename}`);
            
            return true;
        } catch (error) {
            console.error(`Failed to import build configuration: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!BuildConfig.instance) {