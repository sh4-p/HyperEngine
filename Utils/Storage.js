/**
 * Storage.js - Veri depolama yöneticisi
 * LocalStorage, SessionStorage ve İndexedDB üzerinde veri depolama işlemlerini yönetir
 */
class Storage {
    constructor(config = {}) {
        // Yapılandırma
        this.config = Object.assign({
            prefix: 'hyper_',              // Anahtar öneki
            defaultStorage: 'local',       // Varsayılan depolama tipi ('local', 'session', 'indexed')
            useCompression: false,         // Veri sıkıştırma
            useEncryption: false,          // Veri şifreleme (basit)
            encryptionKey: 'hg_default',   // Şifreleme anahtarı
            expiresTag: '_expires_at',     // Son kullanma etiketi
            jsonParse: true,               // JSON çözümlemeyi otomatik yap
            indexedDBName: 'HyperGameDB',  // IndexedDB adı
            indexedDBVersion: 1,           // IndexedDB sürümü
            indexedDBStore: 'gameData',    // IndexedDB store adı
            quota: {                       // Maksimum depolama kotaları (KB)
                local: 5120,               // ~5MB
                session: 5120,             // ~5MB
                indexed: 51200             // ~50MB
            },
            autoCleanup: true,             // Süresi dolmuş verileri otomatik temizleme
            debug: false                   // Hata ayıklama modu
        }, config);
        
        // İndexedDB referansı
        this.indexedDB = null;
        
        // Singleton instance
        if (Storage.instance) {
            return Storage.instance;
        }
        Storage.instance = this;
        
        // Başlatma
        this._init();
    }
    
    /**
     * Storage sistemini başlatır
     * @private
     */
    _init() {
        // Tarayıcı desteğini kontrol et
        this._checkSupport();
        
        // IndexedDB'yi başlat
        if (this.hasIndexedDB) {
            this._initIndexedDB();
        }
        
        // Süresi dolmuş verileri temizle
        if (this.config.autoCleanup) {
            this._cleanupExpiredItems();
        }
        
        this._log('Storage initialized');
    }
    
    /**
     * Tarayıcı desteğini kontrol eder
     * @private
     */
    _checkSupport() {
        try {
            this.hasLocalStorage = typeof window !== 'undefined' && window.localStorage !== null;
            localStorage.setItem('__test', 1);
            localStorage.removeItem('__test');
        } catch (e) {
            this.hasLocalStorage = false;
        }
        
        try {
            this.hasSessionStorage = typeof window !== 'undefined' && window.sessionStorage !== null;
            sessionStorage.setItem('__test', 1);
            sessionStorage.removeItem('__test');
        } catch (e) {
            this.hasSessionStorage = false;
        }
        
        this.hasIndexedDB = typeof window !== 'undefined' && 
                         (window.indexedDB || window.mozIndexedDB || 
                          window.webkitIndexedDB || window.msIndexedDB);
    }
    
    /**
     * IndexedDB'yi başlatır
     * @private
     */
    _initIndexedDB() {
        if (!this.hasIndexedDB) return;
        
        const request = indexedDB.open(this.config.indexedDBName, this.config.indexedDBVersion);
        
        request.onerror = (event) => {
            this._log('IndexedDB error: ' + event.target.errorCode, 'error');
            this.hasIndexedDB = false;
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Store oluştur
            if (!db.objectStoreNames.contains(this.config.indexedDBStore)) {
                const objectStore = db.createObjectStore(this.config.indexedDBStore, { keyPath: 'key' });
                objectStore.createIndex('key', 'key', { unique: true });
                objectStore.createIndex('expires', 'expires', { unique: false });
                
                this._log('IndexedDB store created');
            }
        };
        
        request.onsuccess = (event) => {
            this.indexedDB = event.target.result;
            this._log('IndexedDB connection successful');
        };
    }
    
    /**
     * Anahtar adını formatlar (önek ekler)
     * @private
     * @param {String} key - Anahtar
     * @return {String} Formatlanmış anahtar
     */
    _formatKey(key) {
        return this.config.prefix + key;
    }
    
    /**
     * Veriyi JSON'a dönüştürür
     * @private
     * @param {*} data - Dönüştürülecek veri
     * @return {String} JSON dizgisi
     */
    _stringify(data) {
        try {
            return JSON.stringify(data);
        } catch (e) {
            this._log('Failed to stringify data: ' + e.message, 'error');
            return '';
        }
    }
    
    /**
     * JSON dizgisini çözümler
     * @private
     * @param {String} data - JSON dizgisi
     * @return {*} Çözümlenmiş veri
     */
    _parse(data) {
        if (!this.config.jsonParse) {
            return data;
        }
        
        try {
            return JSON.parse(data);
        } catch (e) {
            this._log('Failed to parse JSON: ' + e.message, 'warn');
            return data;
        }
    }
    
    /**
     * Veriyi şifreler (basit XOR şifreleme)
     * @private
     * @param {String} data - Şifrelenecek veri
     * @return {String} Şifrelenmiş veri
     */
    _encrypt(data) {
        if (!this.config.useEncryption) {
            return data;
        }
        
        let result = '';
        const key = this.config.encryptionKey;
        
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        
        return btoa(result);
    }
    
    /**
     * Şifrelenmiş veriyi çözer
     * @private
     * @param {String} data - Çözülecek veri
     * @return {String} Çözülmüş veri
     */
    _decrypt(data) {
        if (!this.config.useEncryption) {
            return data;
        }
        
        try {
            const decoded = atob(data);
            let result = '';
            const key = this.config.encryptionKey;
            
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            
            return result;
        } catch (e) {
            this._log('Failed to decrypt data: ' + e.message, 'error');
            return data;
        }
    }
    
    /**
     * Veriyi sıkıştırır (basit LZW algoritması)
     * @private
     * @param {String} data - Sıkıştırılacak veri
     * @return {String} Sıkıştırılmış veri
     */
    _compress(data) {
        if (!this.config.useCompression) {
            return data;
        }
        
        try {
            // Basit LZW sıkıştırma algoritması
            let dict = {};
            let out = [];
            let phrase = data.charAt(0);
            let code = 256;
            
            for (let i = 1; i < data.length; i++) {
                let currChar = data.charAt(i);
                if (dict[phrase + currChar] !== undefined) {
                    phrase += currChar;
                } else {
                    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                    dict[phrase + currChar] = code++;
                    phrase = currChar;
                }
            }
            
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            
            // Diziyi bir dizgeye dönüştür
            return out.map(code => String.fromCharCode(code)).join('');
        } catch (e) {
            this._log('Failed to compress data: ' + e.message, 'error');
            return data;
        }
    }
    
    /**
     * Sıkıştırılmış veriyi açar
     * @private
     * @param {String} data - Açılacak veri
     * @return {String} Açılmış veri
     */
    _decompress(data) {
        if (!this.config.useCompression) {
            return data;
        }
        
        try {
            // LZW açma algoritması
            let dict = {};
            let currChar = data.charAt(0);
            let oldPhrase = currChar;
            let out = [currChar];
            let code = 256;
            let phrase;
            
            for (let i = 1; i < data.length; i++) {
                let currCode = data.charCodeAt(i);
                
                if (currCode < 256) {
                    phrase = data.charAt(i);
                } else {
                    phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
                }
                
                out.push(phrase);
                currChar = phrase.charAt(0);
                dict[code++] = oldPhrase + currChar;
                oldPhrase = phrase;
            }
            
            return out.join('');
        } catch (e) {
            this._log('Failed to decompress data: ' + e.message, 'error');
            return data;
        }
    }
    
    /**
     * Veri işleme (dönüştürme, şifreleme, sıkıştırma)
     * @private
     * @param {*} data - İşlenecek veri
     * @param {Boolean} isStore - Depolama işlemi mi
     * @return {String} İşlenmiş veri
     */
    _processData(data, isStore = true) {
        if (isStore) {
            // Depolama işlemi
            let processed = this._stringify(data);
            processed = this._compress(processed);
            processed = this._encrypt(processed);
            return processed;
        } else {
            // Çıkarma işlemi
            let processed = this._decrypt(data);
            processed = this._decompress(processed);
            processed = this._parse(processed);
            return processed;
        }
    }
    
    /**
     * LocalStorage veya SessionStorage'a veri yazar
     * @private
     * @param {String} key - Anahtar
     * @param {*} value - Değer
     * @param {Object} options - Seçenekler
     * @param {String} storageType - Depolama tipi ('local' veya 'session')
     * @return {Boolean} İşlem başarılı mı
     */
    _setWebStorage(key, value, options, storageType) {
        try {
            const storage = storageType === 'local' ? localStorage : sessionStorage;
            const formattedKey = this._formatKey(key);
            
            // Veriyi işle
            let data = {
                value: value,
                created: new Date().getTime()
            };
            
            // Son kullanma tarihi
            if (options.expires) {
                data.expires = this._getExpiryTime(options.expires);
            }
            
            // Veriyi işle ve depola
            const processed = this._processData(data, true);
            storage.setItem(formattedKey, processed);
            
            return true;
        } catch (e) {
            this._log(`Failed to set ${storageType} storage: ${e.message}`, 'error');
            return false;
        }
    }
    
    /**
     * LocalStorage veya SessionStorage'dan veri okur
     * @private
     * @param {String} key - Anahtar
     * @param {String} storageType - Depolama tipi ('local' veya 'session')
     * @return {*} Okunan veri
     */
    _getWebStorage(key, storageType) {
        try {
            const storage = storageType === 'local' ? localStorage : sessionStorage;
            const formattedKey = this._formatKey(key);
            
            // Veriyi oku
            const raw = storage.getItem(formattedKey);
            
            if (raw === null) {
                return null;
            }
            
            // Veriyi işle
            const data = this._processData(raw, false);
            
            // Son kullanma tarihini kontrol et
            if (data.expires && data.expires < new Date().getTime()) {
                this._log(`Item ${key} has expired`, 'info');
                storage.removeItem(formattedKey);
                return null;
            }
            
            return data.value;
        } catch (e) {
            this._log(`Failed to get ${storageType} storage: ${e.message}`, 'error');
            return null;
        }
    }
    
    /**
     * IndexedDB'ye veri yazar
     * @private
     * @param {String} key - Anahtar
     * @param {*} value - Değer
     * @param {Object} options - Seçenekler
     * @return {Promise} İşlem sonucu
     */
    _setIndexedDB(key, value, options) {
        return new Promise((resolve, reject) => {
            if (!this.hasIndexedDB || !this.indexedDB) {
                reject(new Error('IndexedDB is not available'));
                return;
            }
            
            try {
                const formattedKey = this._formatKey(key);
                const transaction = this.indexedDB.transaction([this.config.indexedDBStore], 'readwrite');
                const store = transaction.objectStore(this.config.indexedDBStore);
                
                // Veri nesnesi oluştur
                const data = {
                    key: formattedKey,
                    value: value,
                    created: new Date().getTime(),
                    expires: options.expires ? this._getExpiryTime(options.expires) : null
                };
                
                // Veriyi sakla
                const request = store.put(data);
                
                request.onerror = (event) => {
                    this._log('IndexedDB put error: ' + event.target.error, 'error');
                    reject(event.target.error);
                };
                
                request.onsuccess = () => {
                    this._log(`Data saved to IndexedDB: ${key}`, 'info');
                    resolve(true);
                };
            } catch (e) {
                this._log('IndexedDB set error: ' + e.message, 'error');
                reject(e);
            }
        });
    }
    
    /**
     * IndexedDB'den veri okur
     * @private
     * @param {String} key - Anahtar
     * @return {Promise} Okunan veri
     */
    _getIndexedDB(key) {
        return new Promise((resolve, reject) => {
            if (!this.hasIndexedDB || !this.indexedDB) {
                reject(new Error('IndexedDB is not available'));
                return;
            }
            
            try {
                const formattedKey = this._formatKey(key);
                const transaction = this.indexedDB.transaction([this.config.indexedDBStore], 'readonly');
                const store = transaction.objectStore(this.config.indexedDBStore);
                const request = store.get(formattedKey);
                
                request.onerror = (event) => {
                    this._log('IndexedDB get error: ' + event.target.error, 'error');
                    reject(event.target.error);
                };
                
                request.onsuccess = (event) => {
                    const data = event.target.result;
                    
                    if (!data) {
                        resolve(null);
                        return;
                    }
                    
                    // Son kullanma tarihini kontrol et
                    if (data.expires && data.expires < new Date().getTime()) {
                        this._log(`Item ${key} has expired`, 'info');
                        this._removeIndexedDB(key);
                        resolve(null);
                        return;
                    }
                    
                    resolve(data.value);
                };
            } catch (e) {
                this._log('IndexedDB get error: ' + e.message, 'error');
                reject(e);
            }
        });
    }
    
    /**
     * IndexedDB'den veri siler
     * @private
     * @param {String} key - Anahtar
     * @return {Promise} İşlem sonucu
     */
    _removeIndexedDB(key) {
        return new Promise((resolve, reject) => {
            if (!this.hasIndexedDB || !this.indexedDB) {
                reject(new Error('IndexedDB is not available'));
                return;
            }
            
            try {
                const formattedKey = this._formatKey(key);
                const transaction = this.indexedDB.transaction([this.config.indexedDBStore], 'readwrite');
                const store = transaction.objectStore(this.config.indexedDBStore);
                const request = store.delete(formattedKey);
                
                request.onerror = (event) => {
                    this._log('IndexedDB delete error: ' + event.target.error, 'error');
                    reject(event.target.error);
                };
                
                request.onsuccess = () => {
                    this._log(`Data removed from IndexedDB: ${key}`, 'info');
                    resolve(true);
                };
            } catch (e) {
                this._log('IndexedDB remove error: ' + e.message, 'error');
                reject(e);
            }
        });
    }
    
    /**
     * Süresi dolmuş verileri temizler
     * @private
     */
    _cleanupExpiredItems() {
        // LocalStorage temizle
        if (this.hasLocalStorage) {
            this._cleanupWebStorage('local');
        }
        
        // SessionStorage temizle
        if (this.hasSessionStorage) {
            this._cleanupWebStorage('session');
        }
        
        // IndexedDB temizle
        if (this.hasIndexedDB && this.indexedDB) {
            this._cleanupIndexedDB();
        }
    }
    
    /**
     * WebStorage'daki süresi dolmuş öğeleri temizler
     * @private
     * @param {String} storageType - Depolama tipi ('local' veya 'session')
     */
    _cleanupWebStorage(storageType) {
        try {
            const storage = storageType === 'local' ? localStorage : sessionStorage;
            const prefix = this.config.prefix;
            const now = new Date().getTime();
            
            // Tüm anahtarları tara
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                
                // Sadece bizim önekimizle başlayan anahtarları kontrol et
                if (key.indexOf(prefix) === 0) {
                    try {
                        const raw = storage.getItem(key);
                        const data = this._processData(raw, false);
                        
                        // Son kullanma tarihini kontrol et
                        if (data.expires && data.expires < now) {
                            storage.removeItem(key);
                            this._log(`Expired item removed from ${storageType} storage: ${key}`, 'info');
                            i--; // Indeksi düzelt
                        }
                    } catch (e) {
                        this._log(`Error processing item ${key}: ${e.message}`, 'warn');
                    }
                }
            }
        } catch (e) {
            this._log(`Error cleaning up ${storageType} storage: ${e.message}`, 'error');
        }
    }
    
    /**
     * IndexedDB'deki süresi dolmuş öğeleri temizler
     * @private
     */
    _cleanupIndexedDB() {
        try {
            const transaction = this.indexedDB.transaction([this.config.indexedDBStore], 'readwrite');
            const store = transaction.objectStore(this.config.indexedDBStore);
            const index = store.index('expires');
            const now = new Date().getTime();
            
            // Süresi dolmuş tüm öğeleri sorgula
            const range = IDBKeyRange.upperBound(now);
            const request = index.openCursor(range);
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                
                if (cursor) {
                    // Sadece süresi dolmuş öğeleri sil
                    if (cursor.value.expires !== null && cursor.value.expires < now) {
                        store.delete(cursor.value.key);
                        this._log(`Expired item removed from IndexedDB: ${cursor.value.key}`, 'info');
                    }
                    
                    cursor.continue();
                }
            };
        } catch (e) {
            this._log(`Error cleaning up IndexedDB: ${e.message}`, 'error');
        }
    }
    
    /**
     * Depolama boyutunu alır
     * @private
     * @param {String} storageType - Depolama tipi ('local', 'session', 'indexed')
     * @return {Number} Kullanılan boyut (KB)
     */
    _getStorageSize(storageType) {
        try {
            let size = 0;
            
            if (storageType === 'local' && this.hasLocalStorage) {
                size = this._getWebStorageSize(localStorage);
            } else if (storageType === 'session' && this.hasSessionStorage) {
                size = this._getWebStorageSize(sessionStorage);
            } else if (storageType === 'indexed' && this.hasIndexedDB) {
                // IndexedDB boyutunu hesaplamak karmaşık, şimdilik desteklenmiyor
                return 0;
            }
            
            return Math.round(size / 1024); // KB cinsinden
        } catch (e) {
            this._log(`Error calculating storage size: ${e.message}`, 'error');
            return 0;
        }
    }
    
    /**
     * WebStorage boyutunu hesaplar
     * @private
     * @param {Object} storage - Storage nesnesi
     * @return {Number} Kullanılan boyut (bayt)
     */
    _getWebStorageSize(storage) {
        let size = 0;
        const prefix = this.config.prefix;
        
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            
            // Sadece bizim önekimizle başlayan anahtarları hesapla
            if (key.indexOf(prefix) === 0) {
                const value = storage.getItem(key);
                size += key.length + value.length;
            }
        }
        
        return size;
    }
    
    /**
     * Son kullanma zamanını hesaplar
     * @private
     * @param {Number|Date|String} expires - Son kullanma değeri
     * @return {Number} Son kullanma zamanı (milisaniye cinsinden)
     */
    _getExpiryTime(expires) {
        const now = new Date().getTime();
        
        if (expires instanceof Date) {
            return expires.getTime();
        } else if (typeof expires === 'number') {
            return now + (expires * 1000); // Saniyeyi milisaniyeye çevir
        } else if (typeof expires === 'string') {
            // ISO 8601 tarih dizgisi
            return new Date(expires).getTime();
        }
        
        return null;
    }
    
    /**
     * Günlük kaydı oluşturur
     * @private
     * @param {String} message - Log mesajı
     * @param {String} level - Log seviyesi
     */
    _log(message, level = 'info') {
        if (!this.config.debug) return;
        
        const now = new Date().toISOString();
        const prefix = `[Storage] ${now}`;
        
        switch (level) {
            case 'error':
                console.error(`${prefix} ERROR: ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} WARN: ${message}`);
                break;
            default:
                console.log(`${prefix} INFO: ${message}`);
        }
    }
    
    /**
     * Veri saklar
     * @param {String} key - Anahtar
     * @param {*} value - Değer
     * @param {Object} options - Seçenekler
     * @return {Promise|Boolean} İşlem sonucu
     */
    set(key, value, options = {}) {
        if (!key) {
            this._log('Key is required', 'error');
            return false;
        }
        
        // Seçenekleri hazırla
        options = Object.assign({
            storage: this.config.defaultStorage,
            expires: null
        }, options);
        
        // Depolama tipine göre işlem yap
        switch (options.storage) {
            case 'local':
                if (!this.hasLocalStorage) {
                    this._log('LocalStorage is not available', 'error');
                    return false;
                }
                return this._setWebStorage(key, value, options, 'local');
                
            case 'session':
                if (!this.hasSessionStorage) {
                    this._log('SessionStorage is not available', 'error');
                    return false;
                }
                return this._setWebStorage(key, value, options, 'session');
                
            case 'indexed':
                if (!this.hasIndexedDB) {
                    this._log('IndexedDB is not available', 'error');
                    return false;
                }
                return this._setIndexedDB(key, value, options);
                
            default:
                this._log(`Unknown storage type: ${options.storage}`, 'error');
                return false;
        }
    }
    
    /**
     * Veri okur
     * @param {String} key - Anahtar
     * @param {Object} options - Seçenekler
     * @return {Promise|*} Okunan veri
     */
    get(key, options = {}) {
        if (!key) {
            this._log('Key is required', 'error');
            return null;
        }
        
        // Seçenekleri hazırla
        options = Object.assign({
            storage: this.config.defaultStorage,
            defaultValue: null
        }, options);
        
        // Depolama tipine göre işlem yap
        switch (options.storage) {
            case 'local':
                if (!this.hasLocalStorage) {
                    this._log('LocalStorage is not available', 'error');
                    return options.defaultValue;
                }
                return this._getWebStorage(key, 'local') || options.defaultValue;
                
            case 'session':
                if (!this.hasSessionStorage) {
                    this._log('SessionStorage is not available', 'error');
                    return options.defaultValue;
                }
                return this._getWebStorage(key, 'session') || options.defaultValue;
                
            case 'indexed':
                if (!this.hasIndexedDB) {
                    this._log('IndexedDB is not available', 'error');
                    return Promise.resolve(options.defaultValue);
                }
                return this._getIndexedDB(key).then(value => value || options.defaultValue);
                
            default:
                this._log(`Unknown storage type: ${options.storage}`, 'error');
                return options.defaultValue;
        }
    }
    
    /**
     * Veri siler
     * @param {String} key - Anahtar
     * @param {Object} options - Seçenekler
     * @return {Promise|Boolean} İşlem sonucu
     */
    remove(key, options = {}) {
        if (!key) {
            this._log('Key is required', 'error');
            return false;
        }
        
        // Seçenekleri hazırla
        options = Object.assign({
            storage: this.config.defaultStorage
        }, options);
        
        // Depolama tipine göre işlem yap
        switch (options.storage) {
            case 'local':
                if (!this.hasLocalStorage) {
                    this._log('LocalStorage is not available', 'error');
                    return false;
                }
                localStorage.removeItem(this._formatKey(key));
                return true;
                
            case 'session':
                if (!this.hasSessionStorage) {
                    this._log('SessionStorage is not available', 'error');
                    return false;
                }
                sessionStorage.removeItem(this._formatKey(key));
                return true;
                
            case 'indexed':
                if (!this.hasIndexedDB) {
                    this._log('IndexedDB is not available', 'error');
                    return Promise.resolve(false);
                }
                return this._removeIndexedDB(key);
                
            default:
                this._log(`Unknown storage type: ${options.storage}`, 'error');
                return false;
        }
    }
    
    /**
     * Depolama içeriğini tamamen temizler
     * @param {Object} options - Seçenekler
     * @return {Promise|Boolean} İşlem sonucu
     */
    clear(options = {}) {
        // Seçenekleri hazırla
        options = Object.assign({
            storage: this.config.defaultStorage,
            onlyWithPrefix: true
        }, options);
        
        // Depolama tipine göre işlem yap
        switch (options.storage) {
            case 'local':
                if (!this.hasLocalStorage) {
                    this._log('LocalStorage is not available', 'error');
                    return false;
                }
                return this._clearWebStorage('local', options.onlyWithPrefix);
                
            case 'session':
                if (!this.hasSessionStorage) {
                    this._log('SessionStorage is not available', 'error');
                    return false;
                }
                return this._clearWebStorage('session', options.onlyWithPrefix);
                
            case 'indexed':
                if (!this.hasIndexedDB) {
                    this._log('IndexedDB is not available', 'error');
                    return Promise.resolve(false);
                }
                return this._clearIndexedDB(options.onlyWithPrefix);
                
            case 'all':
                // Tüm depolamaları temizle
                let results = [];
                
                if (this.hasLocalStorage) {
                    results.push(this._clearWebStorage('local', options.onlyWithPrefix));
                }
                
                if (this.hasSessionStorage) {
                    results.push(this._clearWebStorage('session', options.onlyWithPrefix));
                }
                
                if (this.hasIndexedDB) {
                    results.push(this._clearIndexedDB(options.onlyWithPrefix));
                }
                
                return Promise.all(results);
                
            default:
                this._log(`Unknown storage type: ${options.storage}`, 'error');
                return false;
        }
    }
    
    /**
     * WebStorage içeriğini temizler
     * @private
     * @param {String} storageType - Depolama tipi ('local' veya 'session')
     * @param {Boolean} onlyWithPrefix - Sadece önekli olanları temizle
     * @return {Boolean} İşlem sonucu
     */
    _clearWebStorage(storageType, onlyWithPrefix) {
        try {
            const storage = storageType === 'local' ? localStorage : sessionStorage;
            const prefix = this.config.prefix;
            
            if (onlyWithPrefix) {
                // Sadece bizim önekimizle başlayan anahtarları temizle
                for (let i = storage.length - 1; i >= 0; i--) {
                    const key = storage.key(i);
                    
                    if (key.indexOf(prefix) === 0) {
                        storage.removeItem(key);
                    }
                }
            } else {
                // Tüm depolamayı temizle
                storage.clear();
            }
            
            return true;
        } catch (e) {
            this._log(`Error clearing ${storageType} storage: ${e.message}`, 'error');
            return false;
        }
    }
    
    /**
     * IndexedDB içeriğini temizler
     * @private
     * @param {Boolean} onlyWithPrefix - Sadece önekli olanları temizle
     * @return {Promise} İşlem sonucu
     */
    _clearIndexedDB(onlyWithPrefix) {
        return new Promise((resolve, reject) => {
            if (!this.hasIndexedDB || !this.indexedDB) {
                reject(new Error('IndexedDB is not available'));
                return;
            }
            
            try {
                const transaction = this.indexedDB.transaction([this.config.indexedDBStore], 'readwrite');
                const store = transaction.objectStore(this.config.indexedDBStore);
                const prefix = this.config.prefix;
                
                if (onlyWithPrefix) {
                    // Sadece bizim önekimizle başlayan anahtarları temizle
                    const request = store.openCursor();
                    
                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        
                        if (cursor) {
                            if (cursor.key.indexOf(prefix) === 0) {
                                store.delete(cursor.key);
                            }
                            
                            cursor.continue();
                        }
                    };
                } else {
                    // Tüm store'u temizle
                    store.clear();
                }
                
                transaction.oncomplete = () => {
                    this._log('IndexedDB cleared successfully', 'info');
                    resolve(true);
                };
                
                transaction.onerror = (event) => {
                    this._log('Error clearing IndexedDB: ' + event.target.error, 'error');
                    reject(event.target.error);
                };
            } catch (e) {
                this._log('Error clearing IndexedDB: ' + e.message, 'error');
                reject(e);
            }
        });
    }
    
    /**
     * Tüm anahtarları alır
     * @param {Object} options - Seçenekler
     * @return {Promise|Array} Anahtarlar
     */
    keys(options = {}) {
        // Seçenekleri hazırla
        options = Object.assign({
            storage: this.config.defaultStorage,
            removePrefix: true
        }, options);
        
        // Depolama tipine göre işlem yap
        switch (options.storage) {
            case 'local':
                if (!this.hasLocalStorage) {
                    this._log('LocalStorage is not available', 'error');
                    return [];
                }
                return this._getWebStorageKeys('local', options.removePrefix);
                
            case 'session':
                if (!this.hasSessionStorage) {
                    this._log('SessionStorage is not available', 'error');
                    return [];
                }
                return this._getWebStorageKeys('session', options.removePrefix);
                
            case 'indexed':
                if (!this.hasIndexedDB) {
                    this._log('IndexedDB is not available', 'error');
                    return Promise.resolve([]);
                }
                return this._getIndexedDBKeys(options.removePrefix);
                
            default:
                this._log(`Unknown storage type: ${options.storage}`, 'error');
                return [];
        }
    }
    
    /**
     * WebStorage anahtarlarını alır
     * @private
     * @param {String} storageType - Depolama tipi ('local' veya 'session')
     * @param {Boolean} removePrefix - Öneki kaldır
     * @return {Array} Anahtarlar
     */
    _getWebStorageKeys(storageType, removePrefix) {
        try {
            const storage = storageType === 'local' ? localStorage : sessionStorage;
            const prefix = this.config.prefix;
            const keys = [];
            
            // Tüm anahtarları tara
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                
                // Sadece bizim önekimizle başlayan anahtarları al
                if (key.indexOf(prefix) === 0) {
                    const actualKey = removePrefix ? key.substr(prefix.length) : key;
                    keys.push(actualKey);
                }
            }
            
            return keys;
        } catch (e) {
            this._log(`Error getting ${storageType} storage keys: ${e.message}`, 'error');
            return [];
        }
    }
    
    /**
     * IndexedDB anahtarlarını alır
     * @private
     * @param {Boolean} removePrefix - Öneki kaldır
     * @return {Promise} Anahtarlar
     */
    _getIndexedDBKeys(removePrefix) {
        return new Promise((resolve, reject) => {
            if (!this.hasIndexedDB || !this.indexedDB) {
                reject(new Error('IndexedDB is not available'));
                return;
            }
            
            try {
                const transaction = this.indexedDB.transaction([this.config.indexedDBStore], 'readonly');
                const store = transaction.objectStore(this.config.indexedDBStore);
                const request = store.getAllKeys();
                const prefix = this.config.prefix;
                
                request.onsuccess = (event) => {
                    const allKeys = event.target.result;
                    const keys = [];
                    
                    // Sadece bizim önekimizle başlayan anahtarları filtrele
                    for (const key of allKeys) {
                        if (key.indexOf(prefix) === 0) {
                            const actualKey = removePrefix ? key.substr(prefix.length) : key;
                            keys.push(actualKey);
                        }
                    }
                    
                    resolve(keys);
                };
                
                request.onerror = (event) => {
                    this._log('Error getting IndexedDB keys: ' + event.target.error, 'error');
                    reject(event.target.error);
                };
            } catch (e) {
                this._log('Error getting IndexedDB keys: ' + e.message, 'error');
                reject(e);
            }
        });
    }
    
    /**
     * Depolama bilgilerini alır
     * @return {Object} Depolama bilgileri
     */
    getInfo() {
        const info = {
            local: {
                available: this.hasLocalStorage,
                size: this._getStorageSize('local'),
                quota: this.config.quota.local
            },
            session: {
                available: this.hasSessionStorage,
                size: this._getStorageSize('session'),
                quota: this.config.quota.session
            },
            indexed: {
                available: this.hasIndexedDB,
                size: this._getStorageSize('indexed'),
                quota: this.config.quota.indexed
            },
            defaultStorage: this.config.defaultStorage,
            useCompression: this.config.useCompression,
            useEncryption: this.config.useEncryption
        };
        
        return info;
    }
    
    /**
     * Varlık kontrolü yapar
     * @param {String} key - Anahtar
     * @param {Object} options - Seçenekler
     * @return {Promise|Boolean} Varlık durumu
     */
    has(key, options = {}) {
        if (!key) {
            this._log('Key is required', 'error');
            return false;
        }
        
        // Seçenekleri hazırla
        options = Object.assign({
            storage: this.config.defaultStorage
        }, options);
        
        // Depolama tipine göre işlem yap
        switch (options.storage) {
            case 'local':
                if (!this.hasLocalStorage) {
                    return false;
                }
                return localStorage.getItem(this._formatKey(key)) !== null;
                
            case 'session':
                if (!this.hasSessionStorage) {
                    return false;
                }
                return sessionStorage.getItem(this._formatKey(key)) !== null;
                
            case 'indexed':
                if (!this.hasIndexedDB) {
                    return Promise.resolve(false);
                }
                return this._getIndexedDB(key).then(value => value !== null);
                
            default:
                this._log(`Unknown storage type: ${options.storage}`, 'error');
                return false;
        }
    }
    
    /**
     * Sayısal değeri artırır
     * @param {String} key - Anahtar
     * @param {Number} increment - Artış miktarı
     * @param {Object} options - Seçenekler
     * @return {Promise|Number} Yeni değer
     */
    increment(key, increment = 1, options = {}) {
        // Önce mevcut değeri al
        const currentValue = this.get(key, {
            ...options,
            defaultValue: 0
        });
        
        // Değer Promise ise
        if (currentValue instanceof Promise) {
            return currentValue.then(value => {
                const numValue = (typeof value === 'number') ? value : 0;
                const newValue = numValue + increment;
                
                return this.set(key, newValue, options).then(() => newValue);
            });
        }
        
        // Normal değer
        const numValue = (typeof currentValue === 'number') ? currentValue : 0;
        const newValue = numValue + increment;
        
        this.set(key, newValue, options);
        return newValue;
    }
    
    /**
     * Sayısal değeri azaltır
     * @param {String} key - Anahtar
     * @param {Number} decrement - Azalış miktarı
     * @param {Object} options - Seçenekler
     * @return {Promise|Number} Yeni değer
     */
    decrement(key, decrement = 1, options = {}) {
        return this.increment(key, -decrement, options);
    }
    
    /**
     * Oyun profilini kaydeder
     * @param {String} profileId - Profil ID
     * @param {Object} data - Profil verisi
     * @param {Object} options - Seçenekler
     * @return {Promise|Boolean} İşlem sonucu
     */
    saveGameProfile(profileId, data, options = {}) {
        return this.set(`profile_${profileId}`, data, {
            ...options,
            storage: options.storage || 'indexed'
        });
    }
    
    /**
     * Oyun profilini yükler
     * @param {String} profileId - Profil ID
     * @param {Object} options - Seçenekler
     * @return {Promise|Object} Profil verisi
     */
    loadGameProfile(profileId, options = {}) {
        return this.get(`profile_${profileId}`, {
            ...options,
            storage: options.storage || 'indexed',
            defaultValue: null
        });
    }
    
    /**
     * Oyun ayarlarını kaydeder
     * @param {Object} settings - Ayarlar
     * @param {Object} options - Seçenekler
     * @return {Promise|Boolean} İşlem sonucu
     */
    saveGameSettings(settings, options = {}) {
        return this.set('game_settings', settings, {
            ...options,
            storage: options.storage || 'local'
        });
    }
    
    /**
     * Oyun ayarlarını yükler
     * @param {Object} defaultSettings - Varsayılan ayarlar
     * @param {Object} options - Seçenekler
     * @return {Promise|Object} Ayarlar
     */
    loadGameSettings(defaultSettings = {}, options = {}) {
        return this.get('game_settings', {
            ...options,
            storage: options.storage || 'local',
            defaultValue: defaultSettings
        });
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance(config = {}) {
        if (!Storage.instance) {
            new Storage(config);
        }
        return Storage.instance;
    }
}

// Singleton instance
Storage.instance = null;

module.exports = Storage;