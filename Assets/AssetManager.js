/**
 * AssetManager.js - Varlık yönetimi
 * Oyun varlıklarını (resimler, sesler, vb.) yönetir
 */
class AssetManager {
    constructor() {
        // Varlık koleksiyonları
        this.images = {};
        this.audio = {};
        this.data = {};
        
        // Yükleme durumu
        this.queue = [];
        this.loading = false;
        this.loaded = 0;
        this.total = 0;
        
        // Olaylar
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
        
        // Singleton instance
        if (AssetManager.instance) {
            return AssetManager.instance;
        }
        AssetManager.instance = this;
    }
    
    /**
     * Resim ekler
     * @param {String} key - Resim anahtarı
     * @param {Image} image - Resim nesnesi
     */
    addImage(key, image) {
        this.images[key] = image;
    }
    
    /**
     * Ses ekler
     * @param {String} key - Ses anahtarı
     * @param {Audio} audio - Ses nesnesi
     */
    addAudio(key, audio) {
        this.audio[key] = audio;
    }
    
    /**
     * Veri ekler
     * @param {String} key - Veri anahtarı
     * @param {Object} data - Veri nesnesi
     */
    addData(key, data) {
        this.data[key] = data;
    }
    
    /**
     * Resim alır
     * @param {String} key - Resim anahtarı
     * @return {Image} Resim nesnesi
     */
    getImage(key) {
        return this.images[key];
    }
    
    /**
     * Ses alır
     * @param {String} key - Ses anahtarı
     * @return {Audio} Ses nesnesi
     */
    getAudio(key) {
        return this.audio[key];
    }
    
    /**
     * Veri alır
     * @param {String} key - Veri anahtarı
     * @return {Object} Veri nesnesi
     */
    getData(key) {
        return this.data[key];
    }
    
    /**
     * Resim yükleme kuyruğuna ekler
     * @param {String} key - Resim anahtarı
     * @param {String} url - Resim URL'si
     */
    queueImage(key, url) {
        this.queue.push({
            type: 'image',
            key: key,
            url: url
        });
        
        this.total++;
    }
    
    /**
     * Ses yükleme kuyruğuna ekler
     * @param {String} key - Ses anahtarı
     * @param {String} url - Ses URL'si
     */
    queueAudio(key, url) {
        this.queue.push({
            type: 'audio',
            key: key,
            url: url
        });
        
        this.total++;
    }
    
    /**
     * JSON veri yükleme kuyruğuna ekler
     * @param {String} key - Veri anahtarı
     * @param {String} url - JSON URL'si
     */
    queueJSON(key, url) {
        this.queue.push({
            type: 'json',
            key: key,
            url: url
        });
        
        this.total++;
    }
    
    /**
     * Yükleme işlemini başlatır
     */
    startLoading() {
        if (this.loading) return;
        
        this.loading = true;
        this.loaded = 0;
        
        // Kuyruk boşsa hemen tamamlandı say
        if (this.queue.length === 0) {
            this._onComplete();
            return;
        }
        
        // Kuyruktaki tüm varlıkları yükle
        for (const item of this.queue) {
            if (item.type === 'image') {
                this._loadImage(item.key, item.url);
            } else if (item.type === 'audio') {
                this._loadAudio(item.key, item.url);
            } else if (item.type === 'json') {
                this._loadJSON(item.key, item.url);
            }
        }
    }
    
    /**
     * Resim yükler
     * @param {String} key - Resim anahtarı
     * @param {String} url - Resim URL'si
     */
    _loadImage(key, url) {
        const image = new Image();
        
        image.onload = () => {
            this.images[key] = image;
            this._onItemLoaded();
        };
        
        image.onerror = () => {
            this._onItemError(key, url, 'Image load error');
        };
        
        image.src = url;
    }
    
    /**
     * Ses yükler
     * @param {String} key - Ses anahtarı
     * @param {String} url - Ses URL'si
     */
    _loadAudio(key, url) {
        const audio = new Audio();
        
        audio.oncanplaythrough = () => {
            this.audio[key] = audio;
            this._onItemLoaded();
        };
        
        audio.onerror = () => {
            this._onItemError(key, url, 'Audio load error');
        };
        
        audio.src = url;
    }
    
    /**
     * JSON veri yükler
     * @param {String} key - Veri anahtarı
     * @param {String} url - JSON URL'si
     */
    _loadJSON(key, url) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(json => {
                this.data[key] = json;
                this._onItemLoaded();
            })
            .catch(error => {
                this._onItemError(key, url, 'JSON load error: ' + error.message);
            });
    }
    
    /**
     * Öğe yüklendiğinde çağrılır
     */
    _onItemLoaded() {
        this.loaded++;
        
        const progress = this.loaded / this.total;
        
        // İlerleme olayını çağır
        if (this.onProgress) {
            this.onProgress(progress, this.loaded, this.total);
        }
        
        // Tüm öğeler yüklendiğinde
        if (this.loaded === this.total) {
            this._onComplete();
        }
    }
    
    /**
     * Öğe yüklenemediğinde çağrılır
     * @param {String} key - Yüklenemeyen öğe anahtarı
     * @param {String} url - Yüklenemeyen öğe URL'si
     * @param {String} message - Hata mesajı
     */
    _onItemError(key, url, message) {
        // Hata olayını çağır
        if (this.onError) {
            this.onError(key, url, message);
        }
        
        // Yine de yüklenen sayısını artır
        this._onItemLoaded();
    }
    
    /**
     * Tüm öğeler yüklendiğinde çağrılır
     */
    _onComplete() {
        this.loading = false;
        this.queue = [];
        
        // Tamamlanma olayını çağır
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!AssetManager.instance) {
            new AssetManager();
        }
        return AssetManager.instance;
    }
}

// Singleton instance
AssetManager.instance = null;