/**
 * AudioCache.js - Ses önbelleği
 * Oyun içindeki ses dosyalarını önbelleğe alarak performansı artırır
 */
class AudioCache {
    constructor() {
        // Ses koleksiyonu
        this.cache = {};
        
        // Ayarlar
        this.maxSize = 50; // Maksimum önbellekte tutulacak ses sayısı
        this.currentSize = 0;
        
        // LRU (En az kullanılan) takibi için
        this.usageCounter = {};
        this.usageList = [];
        
        // Singleton instance
        if (AudioCache.instance) {
            return AudioCache.instance;
        }
        AudioCache.instance = this;
    }
    
    /**
     * Sesi önbelleğe ekler
     * @param {String} key - Ses anahtarı
     * @param {Audio} audio - Ses nesnesi
     */
    add(key, audio) {
        // Önbellek doluysa ve bu anahtar zaten yok ise
        if (this.currentSize >= this.maxSize && !this.cache[key]) {
            // En az kullanılanı bul ve kaldır
            this._removeLeastUsed();
        }
        
        // Anahtara sahip değilse yeni ekle
        if (!this.cache[key]) {
            this.cache[key] = audio;
            this.usageCounter[key] = 0;
            this.currentSize++;
        }
        
        // Kullanım sayısını güncelle
        this._updateUsage(key);
    }
    
    /**
     * Sesi önbellekten alır
     * @param {String} key - Ses anahtarı
     * @return {Audio} Ses nesnesi
     */
    get(key) {
        if (this.cache[key]) {
            // Kullanım sayısını güncelle
            this._updateUsage(key);
            return this.cache[key];
        }
        
        return null;
    }
    
    /**
     * Sesi önbellekten siler
     * @param {String} key - Ses anahtarı
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
     * @param {String} key - Ses anahtarı
     * @return {Boolean} Anahtarın önbellekte olup olmadığı
     */
    has(key) {
        return !!this.cache[key];
    }
    
    /**
     * En az kullanılan sesi kaldırır
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
     * @param {String} key - Ses anahtarı
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
            usageCount: this.usageCounter,
            memoryUsage: this._estimateMemoryUsage()
        };
    }
    
    /**
     * Tahmini bellek kullanımını hesaplar
     * @return {Number} Tahmini bellek kullanımı (KB)
     */
    _estimateMemoryUsage() {
        // Basit bir tahmin - gerçek değer olmayabilir
        return Object.keys(this.cache).length * 150; // Ortalama 150KB/ses
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!AudioCache.instance) {
            new AudioCache();
        }
        return AudioCache.instance;
    }
}

// Singleton instance
AudioCache.instance = null;