/**
 * AssetManager.js - Varlık yönetimi
 * Oyun varlıklarını (resimler, sesler, veriler) yükler ve yönetir
 */
class AssetManager {
    constructor() {
        // Varlık koleksiyonları
        this.images = {};
        this.sounds = {};
        this.jsonData = {};
        this.animations = {};
        this.fonts = {};
        this.atlases = {};
        
        // Yükleme durumu
        this.isLoading = false;
        this.loadQueue = [];
        this.loadedItems = 0;
        this.totalItems = 0;
        
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
     * Resim ekler/alır
     * @param {String} key - Resim anahtarı
     * @param {String|Image} source - Kaynak URL veya resim nesnesi
     * @return {Image} Resim nesnesi
     */
    getImage(key) {
        return this.images[key] || null;
    }
    
    /**
     * Resim ekler
     * @param {String} key - Resim anahtarı
     * @param {String|Image} source - Kaynak URL veya resim nesnesi
     */
    addImage(key, source) {
        if (source instanceof Image || source instanceof HTMLImageElement) {
            this.images[key] = source;
        } else {
            const img = new Image();
            img.src = source;
            this.images[key] = img;
        }
    }
    
    /**
     * Ses dosyası ekler/alır
     * @param {String} key - Ses anahtarı
     * @return {HTMLAudioElement} Ses nesnesi
     */
    getSound(key) {
        return this.sounds[key] || null;
    }
    
    /**
     * JSON verisi ekler/alır
     * @param {String} key - JSON anahtarı
     * @return {Object} JSON nesnesi
     */
    getJSON(key) {
        return this.jsonData[key] || null;
    }
    
    /**
     * Atlas ekler/alır
     * @param {String} key - Atlas anahtarı
     * @return {Object} Atlas bilgisi
     */
    getAtlas(key) {
        return this.atlases[key] || null;
    }
    
    /**
     * Font ekler/alır
     * @param {String} key - Font anahtarı
     * @return {Object} Font bilgisi
     */
    getFont(key) {
        return this.fonts[key] || null;
    }
    
    /**
     * Animasyon alır
     * @param {String} key - Animasyon anahtarı
     * @return {Object} Animasyon bilgisi
     */
    getAnimation(key) {
        return this.animations[key] || null;
    }
    
    /**
     * Resim yükleme kuyruğuna ekler
     * @param {String} key - Resim anahtarı
     * @param {String} url - Resim URL'si
     */
    queueImage(key, url) {
        this.loadQueue.push({
            type: 'image',
            key: key,
            url: url
        });
        this.totalItems++;
    }
    
    /**
     * Ses yükleme kuyruğuna ekler
     * @param {String} key - Ses anahtarı
     * @param {String} url - Ses URL'si
     */
    queueAudio(key, url) {
        this.loadQueue.push({
            type: 'audio',
            key: key,
            url: url
        });
        this.totalItems++;
    }
    
    /**
     * JSON yükleme kuyruğuna ekler
     * @param {String} key - JSON anahtarı
     * @param {String} url - JSON URL'si
     */
    queueJSON(key, url) {
        this.loadQueue.push({
            type: 'json',
            key: key,
            url: url
        });
        this.totalItems++;
    }
    
    /**
     * Atlas yükleme kuyruğuna ekler
     * @param {String} key - Atlas anahtarı
     * @param {String} imageUrl - Atlas resim URL'si
     * @param {String} dataUrl - Atlas veri URL'si
     */
    queueAtlas(key, imageUrl, dataUrl) {
        this.loadQueue.push({
            type: 'atlas',
            key: key,
            imageUrl: imageUrl,
            dataUrl: dataUrl
        });
        this.totalItems += 2; // Resim ve veri dosyası
    }
    
    /**
     * Font yükleme kuyruğuna ekler
     * @param {String} key - Font anahtarı
     * @param {String} url - Font URL'si
     * @param {String} family - Font ailesi adı
     */
    queueFont(key, url, family) {
        this.loadQueue.push({
            type: 'font',
            key: key,
            url: url,
            family: family
        });
        this.totalItems++;
    }
    
    /**
     * Tüm kuyruktaki kaynakları yüklemeye başlar
     */
    startLoading() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.loadedItems = 0;
        
        if (this.loadQueue.length === 0) {
            this._onLoadComplete();
            return;
        }
        
        // Öğeleri yükle
        this.loadQueue.forEach(item => {
            this._loadItem(item);
        });
    }
    
    /**
     * Tek bir öğeyi yükler
     * @param {Object} item - Yüklenecek öğe
     */
    _loadItem(item) {
        switch (item.type) {
            case 'image':
                this._loadImage(item);
                break;
            case 'audio':
                this._loadAudio(item);
                break;
            case 'json':
                this._loadJSON(item);
                break;
            case 'atlas':
                this._loadAtlas(item);
                break;
            case 'font':
                this._loadFont(item);
                break;
        }
    }
    
    /**
     * Resim yükler
     * @param {Object} item - Yüklenecek resim bilgisi
     */
    _loadImage(item) {
        const img = new Image();
        
        img.onload = () => {
            this.images[item.key] = img;
            this._onItemLoaded();
        };
        
        img.onerror = (error) => {
            this._onItemError(item, error);
        };
        
        img.src = item.url;
    }
    
    /**
     * Ses dosyası yükler
     * @param {Object} item - Yüklenecek ses bilgisi
     */
    _loadAudio(item) {
        const audio = new Audio();
        
        audio.oncanplaythrough = () => {
            this.sounds[item.key] = audio;
            this._onItemLoaded();
        };
        
        audio.onerror = (error) => {
            this._onItemError(item, error);
        };
        
        audio.src = item.url;
        audio.load();
    }
    
    /**
     * JSON verisi yükler
     * @param {Object} item - Yüklenecek JSON bilgisi
     */
    _loadJSON(item) {
        fetch(item.url)
            .then(response => response.json())
            .then(data => {
                this.jsonData[item.key] = data;
                this._onItemLoaded();
            })
            .catch(error => {
                this._onItemError(item, error);
            });
    }
    
    /**
     * Atlas yükler
     * @param {Object} item - Yüklenecek atlas bilgisi
     */
    _loadAtlas(item) {
        // Atlas resmi yükle
        const img = new Image();
        
        img.onload = () => {
            // Atlas verisini yükle
            fetch(item.dataUrl)
                .then(response => response.json())
                .then(data => {
                    this.atlases[item.key] = {
                        image: img,
                        data: data
                    };
                    
                    // İki öğe (resim ve veri) yüklendiği için iki kere çağrılmalı
                    this._onItemLoaded();
                    this._onItemLoaded();
                })
                .catch(error => {
                    this._onItemError(item, error);
                });
        };
        
        img.onerror = (error) => {
            this._onItemError(item, error);
        };
        
        img.src = item.imageUrl;
    }
    
    /**
     * Font yükler
     * @param {Object} item - Yüklenecek font bilgisi
     */
    _loadFont(item) {
        const fontFace = new FontFace(item.family, `url('${item.url}')`);
        
        fontFace.load()
            .then(font => {
                document.fonts.add(font);
                this.fonts[item.key] = {
                    family: item.family,
                    url: item.url,
                    font: font
                };
                this._onItemLoaded();
            })
            .catch(error => {
                this._onItemError(item, error);
            });
    }
    
    /**
     * Öğe yüklendiğinde çağrılır
     */
    _onItemLoaded() {
        this.loadedItems++;
        
        const progress = this.loadedItems / this.totalItems;
        
        // İlerleme olayını çağır
        if (this.onProgress) {
            this.onProgress(progress, this.loadedItems, this.totalItems);
        }
        
        // Tüm öğeler yüklendiyse, tamamlama olayını çağır
        if (this.loadedItems >= this.totalItems) {
            this._onLoadComplete();
        }
    }
    
    /**
     * Öğe yükleme hatasında çağrılır
     * @param {Object} item - Yükleme hatası oluşan öğe
     * @param {Error} error - Hata nesnesi
     */
    _onItemError(item, error) {
        console.error(`Error loading item: ${item.key}`, error);
        
        // Hata olayını çağır
        if (this.onError) {
            this.onError(item, error);
        }
        
        // Yine de öğeyi yüklenmiş say (kuyruğu bloke etmemek için)
        this._onItemLoaded();
    }
    
    /**
     * Tüm yükleme tamamlandığında çağrılır
     */
    _onLoadComplete() {
        // Yükleme durumunu sıfırla
        this.isLoading = false;
        this.loadQueue = [];
        
        // Tamamlama olayını çağır
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    /**
     * Tüm kaynakları temizler
     */
    clearAll() {
        this.images = {};
        this.sounds = {};
        this.jsonData = {};
        this.animations = {};
        this.fonts = {};
        this.atlases = {};
        
        this.loadQueue = [];
        this.loadedItems = 0;
        this.totalItems = 0;
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