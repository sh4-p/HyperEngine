/**
 * ResourceLoader.js - Kaynak yükleyici
 * Oyun için tüm kaynakları (resim, ses, veri) yükleyen bir sınıf
 */
class ResourceLoader {
    constructor() {
        // Yükleme kuyruğu
        this.loadQueue = [];
        this.loadedResources = {};
        
        // Durum
        this.isLoading = false;
        this.totalResources = 0;
        this.loadedCount = 0;
        this.errorCount = 0;
        
        // Olaylar
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
        
        // Önbellekler
        this.imageCache = ImageCache.getInstance();
        this.audioCache = AudioCache.getInstance();
        
        // Veri yükleyiciler
        this.dataLoaders = {
            'json': this._loadJson,
            'text': this._loadText,
            'xml': this._loadXml,
            'binary': this._loadBinary
        };
        
        // Singleton instance
        if (ResourceLoader.instance) {
            return ResourceLoader.instance;
        }
        ResourceLoader.instance = this;
    }
    
    /**
     * Kaynak ekler
     * @param {String} type - Kaynak tipi (image, audio, json, text, vb.)
     * @param {String} key - Kaynak anahtarı
     * @param {String} url - Kaynak URL'si
     * @param {Object} options - Ek seçenekler
     */
    add(type, key, url, options = {}) {
        this.loadQueue.push({
            type: type,
            key: key,
            url: url,
            options: options
        });
        
        this.totalResources++;
    }
    
    /**
     * Resim ekler
     * @param {String} key - Resim anahtarı
     * @param {String} url - Resim URL'si
     * @param {Object} options - Ek seçenekler
     */
    addImage(key, url, options = {}) {
        this.add('image', key, url, options);
    }
    
    /**
     * Ses ekler
     * @param {String} key - Ses anahtarı
     * @param {String} url - Ses URL'si
     * @param {Object} options - Ek seçenekler
     */
    addAudio(key, url, options = {}) {
        this.add('audio', key, url, options);
    }
    
    /**
     * JSON veri ekler
     * @param {String} key - Veri anahtarı
     * @param {String} url - Veri URL'si
     * @param {Object} options - Ek seçenekler
     */
    addJson(key, url, options = {}) {
        this.add('json', key, url, options);
    }
    
    /**
     * Metin dosyası ekler
     * @param {String} key - Metin anahtarı
     * @param {String} url - Metin URL'si
     * @param {Object} options - Ek seçenekler
     */
    addText(key, url, options = {}) {
        this.add('text', key, url, options);
    }
    
    /**
     * Sprite sheet ekler
     * @param {String} key - Sprite sheet anahtarı
     * @param {String} url - Sprite sheet URL'si
     * @param {Object} options - Ek seçenekler (kareler, satır/sütun sayısı, vb.)
     */
    addSpriteSheet(key, url, options = {}) {
        this.add('spritesheet', key, url, options);
    }
    
    /**
     * Kaynak ekler (grup halinde)
     * @param {Array} resourcesArray - Kaynaklar dizisi
     * @param {String} baseUrl - Temel URL (opsiyonel)
     */
    addResources(resourcesArray, baseUrl = '') {
        for (const resource of resourcesArray) {
            const url = baseUrl + resource.url;
            this.add(resource.type, resource.key, url, resource.options || {});
        }
    }
    
    /**
     * Yüklemeyi başlatır
     * @param {Function} onComplete - Yükleme tamamlandığında çağrılacak fonksiyon
     * @param {Function} onProgress - Yükleme ilerledikçe çağrılacak fonksiyon
     * @param {Function} onError - Hata durumunda çağrılacak fonksiyon
     */
    start(onComplete = null, onProgress = null, onError = null) {
        if (this.isLoading) {
            console.warn("Resource loader is already running");
            return;
        }
        
        // Olayları ayarla
        this.onComplete = onComplete;
        this.onProgress = onProgress;
        this.onError = onError;
        
        // Durum değişkenlerini ayarla
        this.isLoading = true;
        this.loadedCount = 0;
        this.errorCount = 0;
        
        // Kuyruk boşsa hemen tamamlandı
        if (this.loadQueue.length === 0) {
            this._onLoadComplete();
            return;
        }
        
        // Kaynakları yükle
        for (const resource of this.loadQueue) {
            this._loadResource(resource);
        }
    }
    
    /**
     * Kaynağı yükler
     * @param {Object} resource - Kaynak
     */
    _loadResource(resource) {
        switch (resource.type) {
            case 'image':
                this._loadImage(resource);
                break;
            case 'audio':
                this._loadAudio(resource);
                break;
            case 'spritesheet':
                this._loadSpriteSheet(resource);
                break;
            default:
                // Diğer veri tiplerini yükle
                if (this.dataLoaders[resource.type]) {
                    this.dataLoaders[resource.type].call(this, resource);
                } else {
                    console.error(`Unknown resource type: ${resource.type}`);
                    this._onResourceError(resource);
                }
                break;
        }
    }
    
    /**
     * Resim yükler
     * @param {Object} resource - Resim kaynağı
     */
    _loadImage(resource) {
        // Önbellekte kontrol et
        if (this.imageCache.has(resource.key)) {
            this.loadedResources[resource.key] = this.imageCache.get(resource.key);
            this._onResourceLoaded(resource);
            return;
        }
        
        // Yeni resim yükle
        const image = new Image();
        
        // Resim ayarları
        if (resource.options.crossOrigin) {
            image.crossOrigin = resource.options.crossOrigin;
        }
        
        // Yükleme olayları
        image.onload = () => {
            this.imageCache.add(resource.key, image);
            this.loadedResources[resource.key] = image;
            this._onResourceLoaded(resource);
        };
        
        image.onerror = () => {
            this._onResourceError(resource);
        };
        
        // Yüklemeyi başlat
        image.src = resource.url;
    }
    
    /**
     * Ses yükler
     * @param {Object} resource - Ses kaynağı
     */
    _loadAudio(resource) {
        // Önbellekte kontrol et
        if (this.audioCache.has(resource.key)) {
            this.loadedResources[resource.key] = this.audioCache.get(resource.key);
            this._onResourceLoaded(resource);
            return;
        }
        
        // Yeni ses yükle
        const audio = new Audio();
        
        // Ses seçenekleri
        if (resource.options.preload) {
            audio.preload = resource.options.preload;
        }
        
        // Yükleme olayları
        audio.oncanplaythrough = () => {
            this.audioCache.add(resource.key, audio);
            this.loadedResources[resource.key] = audio;
            this._onResourceLoaded(resource);
        };
        
        audio.onerror = () => {
            this._onResourceError(resource);
        };
        
        // Yüklemeyi başlat
        audio.src = resource.url;
        audio.load();
    }
    
    /**
     * Sprite sheet yükler
     * @param {Object} resource - Sprite sheet kaynağı
     */
    _loadSpriteSheet(resource) {
        // Sprite sheet için önce resmi yükle
        const image = new Image();
        
        // Resim ayarları
        if (resource.options.crossOrigin) {
            image.crossOrigin = resource.options.crossOrigin;
        }
        
        // Yükleme olayları
        image.onload = () => {
            // Sprite sheet veri yapısı oluştur
            const spriteSheet = {
                image: image,
                frameWidth: resource.options.frameWidth || image.width,
                frameHeight: resource.options.frameHeight || image.height,
                frames: resource.options.frames || [],
                animations: resource.options.animations || {}
            };
            
            // Eğer frame_width ve frame_height belirtilmişse otomatik frame doldur
            if (resource.options.frameWidth && resource.options.frameHeight && spriteSheet.frames.length === 0) {
                const cols = Math.floor(image.width / resource.options.frameWidth);
                const rows = Math.floor(image.height / resource.options.frameHeight);
                
                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        spriteSheet.frames.push({
                            x: x * resource.options.frameWidth,
                            y: y * resource.options.frameHeight,
                            width: resource.options.frameWidth,
                            height: resource.options.frameHeight
                        });
                    }
                }
            }
            
            // Sprite sheet'i kaydet
            this.imageCache.add(resource.key, image);
            this.loadedResources[resource.key] = spriteSheet;
            this._onResourceLoaded(resource);
        };
        
        image.onerror = () => {
            this._onResourceError(resource);
        };
        
        // Yüklemeyi başlat
        image.src = resource.url;
    }
    
    /**
     * JSON veri yükler
     * @param {Object} resource - JSON kaynağı
     */
    _loadJson(resource) {
        fetch(resource.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                this.loadedResources[resource.key] = data;
                this._onResourceLoaded(resource);
            })
            .catch(error => {
                console.error(`Failed to load JSON: ${resource.url}`, error);
                this._onResourceError(resource);
            });
    }
    
    /**
     * Metin dosyası yükler
     * @param {Object} resource - Metin kaynağı
     */
    _loadText(resource) {
        fetch(resource.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                this.loadedResources[resource.key] = data;
                this._onResourceLoaded(resource);
            })
            .catch(error => {
                console.error(`Failed to load text: ${resource.url}`, error);
                this._onResourceError(resource);
            });
    }
    
    /**
     * XML dosyası yükler
     * @param {Object} resource - XML kaynağı
     */
    _loadXml(resource) {
        fetch(resource.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                const parser = new DOMParser();
                const xml = parser.parseFromString(data, "application/xml");
                this.loadedResources[resource.key] = xml;
                this._onResourceLoaded(resource);
            })
            .catch(error => {
                console.error(`Failed to load XML: ${resource.url}`, error);
                this._onResourceError(resource);
            });
    }
    
    /**
     * Binary dosya yükler
     * @param {Object} resource - Binary kaynağı
     */
    _loadBinary(resource) {
        fetch(resource.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then(data => {
                this.loadedResources[resource.key] = data;
                this._onResourceLoaded(resource);
            })
            .catch(error => {
                console.error(`Failed to load binary: ${resource.url}`, error);
                this._onResourceError(resource);
            });
    }
    
    /**
     * Kaynak yüklendiğinde çağrılır
     * @param {Object} resource - Yüklenen kaynak
     */
    _onResourceLoaded(resource) {
        this.loadedCount++;
        this._updateProgress();
        
        // Tüm kaynaklar yüklendiyse
        if (this.loadedCount + this.errorCount >= this.totalResources) {
            this._onLoadComplete();
        }
    }
    
    /**
     * Kaynak yüklenemediğinde çağrılır
     * @param {Object} resource - Yüklenemeyen kaynak
     */
    _onResourceError(resource) {
        this.errorCount++;
        
        if (this.onError) {
            this.onError(resource);
        }
        
        console.error(`Failed to load resource: ${resource.url}`);
        
        // Tüm kaynaklar yüklendiyse/yüklenemediyse
        if (this.loadedCount + this.errorCount >= this.totalResources) {
            this._onLoadComplete();
        }
    }
    
    /**
     * İlerleme durumunu günceller
     */
    _updateProgress() {
        const progress = this.loadedCount / this.totalResources;
        
        if (this.onProgress) {
            this.onProgress(progress, this.loadedCount, this.totalResources);
        }
    }
    
    /**
     * Yükleme işlemi tamamlandığında çağrılır
     */
    _onLoadComplete() {
        this.isLoading = false;
        this.loadQueue = [];
        
        if (this.onComplete) {
            this.onComplete(this.loadedResources, this.loadedCount, this.errorCount);
        }
    }
    
    /**
     * Kaynağı alır
     * @param {String} key - Kaynak anahtarı
     * @return {Object} Kaynak
     */
    get(key) {
        return this.loadedResources[key] || null;
    }
    
    /**
     * Yükleme durumunu kontrol eder
     * @return {Boolean} Yükleme devam ediyor mu
     */
    isLoadingInProgress() {
        return this.isLoading;
    }
    
    /**
     * Yükleme yüzdesini alır
     * @return {Number} Yükleme yüzdesi (0-1)
     */
    getLoadingProgress() {
        return this.totalResources > 0 ? this.loadedCount / this.totalResources : 1;
    }
    
    /**
     * Tüm yükleme istatistiklerini alır
     * @return {Object} Yükleme istatistikleri
     */
    getStats() {
        return {
            total: this.totalResources,
            loaded: this.loadedCount,
            errors: this.errorCount,
            progress: this.getLoadingProgress(),
            isLoading: this.isLoading
        };
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!ResourceLoader.instance) {
            new ResourceLoader();
        }
        return ResourceLoader.instance;
    }
}

// Singleton instance
ResourceLoader.instance = null;