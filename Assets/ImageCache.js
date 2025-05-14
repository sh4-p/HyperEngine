/**
 * ImageCache.js - Resim önbelleği
 * Oyun içindeki resim dosyalarını önbelleğe alarak performansı artırır
 */
class ImageCache {
    constructor() {
        // Resim koleksiyonu
        this.cache = {};
        
        // Ayarlar
        this.maxSize = 100; // Maksimum önbellekte tutulacak resim sayısı
        this.currentSize = 0;
        
        // LRU (En az kullanılan) takibi için
        this.usageCounter = {};
        this.usageList = [];
        
        // İstatistikler
        this.totalLoaded = 0;
        this.totalHits = 0;
        this.totalMisses = 0;
        
        // Singleton instance
        if (ImageCache.instance) {
            return ImageCache.instance;
        }
        ImageCache.instance = this;
    }
    
    /**
     * Resmi önbelleğe ekler
     * @param {String} key - Resim anahtarı
     * @param {Image} image - Resim nesnesi
     */
    add(key, image) {
        // Önbellek doluysa ve bu anahtar zaten yok ise
        if (this.currentSize >= this.maxSize && !this.cache[key]) {
            // En az kullanılanı bul ve kaldır
            this._removeLeastUsed();
        }
        
        // Anahtara sahip değilse yeni ekle
        if (!this.cache[key]) {
            this.cache[key] = image;
            this.usageCounter[key] = 0;
            this.currentSize++;
            this.totalLoaded++;
        }
        
        // Kullanım sayısını güncelle
        this._updateUsage(key);
    }
    
    /**
     * Resmi önbellekten alır
     * @param {String} key - Resim anahtarı
     * @return {Image} Resim nesnesi
     */
    get(key) {
        if (this.cache[key]) {
            // Kullanım sayısını güncelle
            this._updateUsage(key);
            this.totalHits++;
            return this.cache[key];
        }
        
        this.totalMisses++;
        return null;
    }
    
    /**
     * Resmi önbellekten siler
     * @param {String} key - Resim anahtarı
     */
    remove(key) {
        if (this.cache[key]) {
            delete this.cache[key];
            delete this.usageCounter[key];
            
            // Kullanım listesinden kaldır
            const index = this.usageList.indexOf(key);
            if (index !== -1) {
                this.usageList.splice(index, 1);
            }
            
            this.currentSize--;
        }
    }
    
    /**
     * Önbelleği temizler
     */
    clear() {
        this.cache = {};
        this.usageCounter = {};
        this.usageList = [];
        this.currentSize = 0;
    }
    
    /**
     * Anahtarın önbellekte olup olmadığını kontrol eder
     * @param {String} key - Resim anahtarı
     * @return {Boolean} Anahtarın önbellekte olup olmadığı
     */
    has(key) {
        return !!this.cache[key];
    }
    
    /**
     * URL'den resmi yükler ve önbelleğe ekler
     * @param {String} key - Resim anahtarı
     * @param {String} url - Resim URL'si
     * @param {Function} callback - Yükleme tamamlandığında çağrılacak fonksiyon
     */
    load(key, url, callback) {
        // Zaten önbellekte ise doğrudan döndür
        if (this.has(key)) {
            if (callback) callback(this.get(key));
            return;
        }
        
        // Yeni resim yükle
        const image = new Image();
        
        image.onload = () => {
            this.add(key, image);
            if (callback) callback(image);
        };
        
        image.onerror = () => {
            console.error(`Failed to load image: ${url}`);
            if (callback) callback(null);
        };
        
        image.src = url;
    }
    
    /**
     * En az kullanılan resmi kaldırır
     */
    _removeLeastUsed() {
        if (this.usageList.length === 0) return;
        
        // En az kullanılan anahtarı bul
        const leastUsedKey = this.usageList[0];
        
        // Önbellekten kaldır
        delete this.cache[leastUsedKey];
        delete this.usageCounter[leastUsedKey];
        
        // Kullanım listesinden kaldır
        this.usageList.shift();
        
        this.currentSize--;
    }
    
    /**
     * Anahtarın kullanım sayısını günceller
     * @param {String} key - Resim anahtarı
     */
    _updateUsage(key) {
        // Kullanım sayısını artır
        this.usageCounter[key]++;
        
        // Kullanım listesindeki konumunu güncelle
        const index = this.usageList.indexOf(key);
        if (index !== -1) {
            this.usageList.splice(index, 1);
        }
        
        // Listeye son kullanılan olarak ekle
        this.usageList.push(key);
    }
    
    /**
     * Önbellek kullanım istatistiklerini alır
     */
    getStats() {
        return {
            maxSize: this.maxSize,
            currentSize: this.currentSize,
            totalLoaded: this.totalLoaded,
            cacheHitRate: this.totalHits / (this.totalHits + this.totalMisses),
            memoryUsage: this._estimateMemoryUsage()
        };
    }
    
    /**
     * Tahmini bellek kullanımını hesaplar
     * @return {Number} Tahmini bellek kullanımı (KB)
     */
    _estimateMemoryUsage() {
        let total = 0;
        
        for (const key in this.cache) {
            const img = this.cache[key];
            // Tahmini boyut hesabı: genişlik * yükseklik * 4 (RGBA) bayt
            total += (img.width * img.height * 4) / 1024;
        }
        
        return Math.round(total);
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!ImageCache.instance) {
            new ImageCache();
        }
        return ImageCache.instance;
    }
}

// Singleton instance
ImageCache.instance = null;