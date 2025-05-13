/**
 * Analytics.js - Analitik izleme
 * Oyun olaylarını ve kullanıcı davranışlarını izler
 */
class Analytics {
    constructor(config = {}) {
        // Analitik yapılandırması
        this.config = Object.assign({
            platform: 'firebase',      // firebase, gameanalytics, facebook
            appId: '',                 // Uygulama ID
            appVersion: '1.0.0',       // Uygulama versiyonu
            userId: '',                // Kullanıcı ID (otomatik oluşturulur)
            sessionId: '',             // Oturum ID (otomatik oluşturulur)
            testMode: false,           // Test modu
            logLevel: 'info',          // debug, info, warn, error
            autoSessionTracking: true, // Otomatik oturum takibi
            consent: true,             // Veri toplama onayı (GDPR)
            customFields: {}           // Özel alanlar
        }, config);
        
        // Analitik durumu
        this.isInitialized = false;
        this.isPaused = false;
        
        // Kullanıcı verileri
        this.userData = {
            level: 1,
            score: 0,
            coins: 0,
            items: {},
            playTime: 0,
            sessions: 0,
            firstPlay: new Date(),
            lastPlay: new Date()
        };
        
        // Olay sayaçları
        this.eventCounts = {};
        
        // Zamanlayıcılar
        this.sessionStartTime = 0;
        this.playTimer = null;
        
        // Singleton instance
        if (Analytics.instance) {
            return Analytics.instance;
        }
        Analytics.instance = this;
        
        // Analitik platformunu başlat
        this._initialize();
    }
    
    /**
     * Analitik platformunu başlatır
     */
    _initialize() {
        // Kullanıcı ve oturum ID'lerini oluştur
        if (!this.config.userId) {
            this.config.userId = this._generateUserId();
            this._saveUserId(this.config.userId);
        }
        
        this.config.sessionId = this._generateSessionId();
        
        // Yerel veriyi yükle
        this._loadUserData();
        
        // Platforma göre başlat
        switch (this.config.platform) {
            case 'firebase':
                this._initializeFirebase();
                break;
            case 'gameanalytics':
                this._initializeGameAnalytics();
                break;
            case 'facebook':
                this._initializeFacebook();
                break;
            default:
                console.warn(`Unsupported analytics platform: ${this.config.platform}`);
                // Yerel analitik kullan
                this.isInitialized = true;
                break;
        }
        
        // Oturum takibi
        if (this.config.autoSessionTracking) {
            this._startSessionTracking();
        }
    }
    
    /**
     * Firebase Analitik başlatır
     */
    _initializeFirebase() {
        console.log("Firebase Analytics initialized (mock)");
        
        // Mock implementation
        window.firebaseAnalytics = {
            logEvent: (eventName, params) => {
                if (this.config.logLevel === 'debug') {
                    console.log(`Firebase Analytics: ${eventName}`, params);
                }
            },
            setUserId: (userId) => {
                if (this.config.logLevel === 'debug') {
                    console.log(`Firebase Analytics: setUserId(${userId})`);
                }
            },
            setUserProperty: (name, value) => {
                if (this.config.logLevel === 'debug') {
                    console.log(`Firebase Analytics: setUserProperty(${name}, ${value})`);
                }
            }
        };
        
        this.isInitialized = true;
        
        // Kullanıcı ID ayarla
        if (window.firebaseAnalytics.setUserId) {
            window.firebaseAnalytics.setUserId(this.config.userId);
        }
        
        // Uygulama versiyonu ayarla
        if (window.firebaseAnalytics.setUserProperty) {
            window.firebaseAnalytics.setUserProperty('app_version', this.config.appVersion);
        }
    }
    
    /**
     * GameAnalytics başlatır
     */
    _initializeGameAnalytics() {
        console.log("GameAnalytics initialized (mock)");
        
        // Mock implementation
        window.gameanalytics = {
            GameAnalytics: {
                initialize: (appId, version) => {
                    if (this.config.logLevel === 'debug') {
                        console.log(`GameAnalytics: initialize(${appId}, ${version})`);
                    }
                },
                addProgressionEvent: (status, progression1, progression2, progression3, score) => {
                    if (this.config.logLevel === 'debug') {
                        console.log(`GameAnalytics: addProgressionEvent(${status}, ${progression1}, ${progression2}, ${progression3}, ${score})`);
                    }
                },
                addResourceEvent: (flowType, currency, amount, itemType, itemId) => {
                    if (this.config.logLevel === 'debug') {
                        console.log(`GameAnalytics: addResourceEvent(${flowType}, ${currency}, ${amount}, ${itemType}, ${itemId})`);
                    }
                },
                addDesignEvent: (eventId, value) => {
                    if (this.config.logLevel === 'debug') {
                        console.log(`GameAnalytics: addDesignEvent(${eventId}, ${value})`);
                    }
                }
            }
        };
        
        if (window.gameanalytics.GameAnalytics.initialize) {
            window.gameanalytics.GameAnalytics.initialize(this.config.appId, this.config.appVersion);
        }
        
        this.isInitialized = true;
    }
    
    /**
     * Facebook Analitik başlatır
     */
    _initializeFacebook() {
        console.log("Facebook Analytics initialized (mock)");
        
        // Mock implementation
        window.fbq = (eventType, eventName, params) => {
            if (this.config.logLevel === 'debug') {
                console.log(`Facebook Analytics: ${eventType}(${eventName})`, params);
            }
        };
        
        this.isInitialized = true;
    }
    
    /**
     * Kullanıcı verisini yükler
     */
    _loadUserData() {
        try {
            const storedData = localStorage.getItem('hyper_analytics_userData');
            
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                this.userData = Object.assign(this.userData, parsedData);
                
                // Oturum sayısını artır
                this.userData.sessions++;
                
                // Son oynanış zamanını güncelle
                this.userData.lastPlay = new Date();
            } else {
                // İlk oturum için verileri kaydet
                this._saveUserData();
            }
        } catch (e) {
            console.error("Error loading analytics user data", e);
        }
    }
    
    /**
     * Kullanıcı verisini kaydeder
     */
    _saveUserData() {
        try {
            localStorage.setItem('hyper_analytics_userData', JSON.stringify(this.userData));
        } catch (e) {
            console.error("Error saving analytics user data", e);
        }
    }
    
    /**
     * Kullanıcı ID'sini kaydeder
     * @param {String} userId - Kullanıcı ID
     */
    _saveUserId(userId) {
        try {
            localStorage.setItem('hyper_analytics_userId', userId);
        } catch (e) {
            console.error("Error saving analytics user ID", e);
        }
    }
    
    /**
     * Kullanıcı ID'sini yükler
     * @return {String} Kullanıcı ID
     */
    _loadUserId() {
        try {
            return localStorage.getItem('hyper_analytics_userId');
        } catch (e) {
            console.error("Error loading analytics user ID", e);
            return null;
        }
    }
    
    /**
     * Benzersiz kullanıcı ID'si oluşturur
     * @return {String} Kullanıcı ID
     */
    _generateUserId() {
        const storedId = this._loadUserId();
        
        if (storedId) {
            return storedId;
        }
        
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Benzersiz oturum ID'si oluşturur
     * @return {String} Oturum ID
     */
    _generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + new Date().getTime();
    }
    
    /**
     * Oturum takibini başlatır
     */
    _startSessionTracking() {
        // Oturum başlangıç zamanı
        this.sessionStartTime = new Date().getTime();
        
        // Oturum başlangıç olayı
        this.logEvent('session_start', {
            session_id: this.config.sessionId,
            user_id: this.config.userId
        });
        
        // Oturum sonu olayları için dinleyiciler
        window.addEventListener('beforeunload', () => {
            this._endSession();
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this._pauseSession();
            } else {
                this._resumeSession();
            }
        });
        
        // Oyun süresi takibi
        this.playTimer = setInterval(() => {
            if (!this.isPaused) {
                this.userData.playTime += 1;
            }
        }, 1000);
    }
    
    /**
     * Oturumu sonlandırır
     */
    _endSession() {
        // Oyun süresini durdur
        if (this.playTimer) {
            clearInterval(this.playTimer);
            this.playTimer = null;
        }
        
        // Oturum sonu olayı
        const sessionDuration = Math.floor((new Date().getTime() - this.sessionStartTime) / 1000);
        
        this.logEvent('session_end', {
            session_id: this.config.sessionId,
            duration: sessionDuration,
            play_time: this.userData.playTime
        });
        
        // Kullanıcı verisini kaydet
        this._saveUserData();
    }
    
    /**
     * Oturumu duraklatır
     */
    _pauseSession() {
        if (this.isPaused) return;
        
        this.isPaused = true;
        
        // Oturum duraklatma olayı
        this.logEvent('session_pause', {
            session_id: this.config.sessionId
        });
    }
    
    /**
     * Oturumu devam ettirir
     */
    _resumeSession() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        
        // Oturum devam ettirme olayı
        this.logEvent('session_resume', {
            session_id: this.config.sessionId
        });
    }
    
    /**
     * Özel olay kaydeder
     * @param {String} eventName - Olay adı
     * @param {Object} params - Olay parametreleri
     */
    logEvent(eventName, params = {}) {
        if (!this.isInitialized) {
            console.warn("Analytics not initialized");
            return;
        }
        
        // Veri toplama onayı alınmamışsa
        if (!this.config.consent) {
            return;
        }
        
        // Olay sayacını artır
        this.eventCounts[eventName] = (this.eventCounts[eventName] || 0) + 1;
        
        // Ortak parametreler ekle
        const eventParams = Object.assign({
            app_version: this.config.appVersion,
            session_id: this.config.sessionId,
            user_level: this.userData.level,
            timestamp: new Date().toISOString()
        }, this.config.customFields, params);
        
        // Test modu
        if (this.config.testMode) {
            eventParams.test_mode = true;
        }
        
        // Platforma göre olayı gönder
        switch (this.config.platform) {
            case 'firebase':
                if (window.firebaseAnalytics && window.firebaseAnalytics.logEvent) {
                    window.firebaseAnalytics.logEvent(eventName, eventParams);
                }
                break;
                
            case 'gameanalytics':
                if (window.gameanalytics && window.gameanalytics.GameAnalytics) {
                    // Olay tipine göre format
                    if (eventName.startsWith('level_')) {
                        // Seviye olayları
                        const status = eventName === 'level_start' ? 'Start' : 
                                      eventName === 'level_complete' ? 'Complete' : 
                                      eventName === 'level_fail' ? 'Fail' : 'Undefined';
                        
                        window.gameanalytics.GameAnalytics.addProgressionEvent(
                            status,
                            params.level || this.userData.level.toString(),
                            params.stage || '0',
                            params.phase || '0',
                            params.score || 0
                        );
                    } else if (eventName.startsWith('resource_')) {
                        // Kaynak olayları
                        const flowType = eventName === 'resource_gain' ? 'Source' : 
                                        eventName === 'resource_use' ? 'Sink' : 'Undefined';
                        
                        window.gameanalytics.GameAnalytics.addResourceEvent(
                            flowType,
                            params.currency || 'coins',
                            params.amount || 0,
                            params.item_type || 'default',
                            params.item_id || '0'
                        );
                    } else {
                        // Diğer olaylar
                        window.gameanalytics.GameAnalytics.addDesignEvent(
                            eventName,
                            params.value || null
                        );
                    }
                }
                break;
                
            case 'facebook':
                if (window.fbq) {
                    window.fbq('trackCustom', eventName, eventParams);
                }
                break;
                
            default:
                // Yerel loglama
                if (this.config.logLevel === 'debug') {
                    console.log(`Analytics Event: ${eventName}`, eventParams);
                }
                break;
        }
    }
    
    /**
     * Seviye başlangıç olayı
     * @param {Number} level - Seviye numarası
     * @param {Object} params - Ek parametreler
     */
    logLevelStart(level, params = {}) {
        this.logEvent('level_start', Object.assign({
            level: level,
            level_name: `Level ${level}`
        }, params));
    }
    
    /**
     * Seviye tamamlama olayı
     * @param {Number} level - Seviye numarası
     * @param {Number} score - Skor
     * @param {Object} params - Ek parametreler
     */
    logLevelComplete(level, score = 0, params = {}) {
        this.logEvent('level_complete', Object.assign({
            level: level,
            level_name: `Level ${level}`,
            score: score
        }, params));
        
        // Kullanıcı seviyesini güncelle
        if (level > this.userData.level) {
            this.userData.level = level;
            this._saveUserData();
        }
    }
    
    /**
     * Seviye başarısızlık olayı
     * @param {Number} level - Seviye numarası
     * @param {String} reason - Başarısızlık nedeni
     * @param {Object} params - Ek parametreler
     */
    logLevelFail(level, reason = '', params = {}) {
        this.logEvent('level_fail', Object.assign({
            level: level,
            level_name: `Level ${level}`,
            reason: reason
        }, params));
    }
    
    /**
     * Para kazanma olayı
     * @param {String} currency - Para birimi (coins, gems, vb.)
     * @param {Number} amount - Miktar
     * @param {String} source - Kaynak (reward, level, purchase, vb.)
     * @param {Object} params - Ek parametreler
     */
    logCurrencyGain(currency, amount, source, params = {}) {
        this.logEvent('resource_gain', Object.assign({
            currency: currency,
            amount: amount,
            source: source
        }, params));
        
        // Kullanıcı parasını güncelle
        if (currency === 'coins') {
            this.userData.coins += amount;
            this._saveUserData();
        }
    }
    
    /**
     * Para harcama olayı
     * @param {String} currency - Para birimi (coins, gems, vb.)
     * @param {Number} amount - Miktar
     * @param {String} item - Satın alınan öğe
     * @param {Object} params - Ek parametreler
     */
    logCurrencySpent(currency, amount, item, params = {}) {
        this.logEvent('resource_use', Object.assign({
            currency: currency,
            amount: amount,
            item: item
        }, params));
        
        // Kullanıcı parasını güncelle
        if (currency === 'coins') {
            this.userData.coins -= amount;
            this._saveUserData();
        }
    }
    
    /**
     * Reklam izleme olayı
     * @param {String} adType - Reklam tipi (banner, interstitial, rewarded)
     * @param {String} placement - Reklam yerleşimi
     * @param {Object} params - Ek parametreler
     */
    logAdWatch(adType, placement, params = {}) {
        this.logEvent('ad_watch', Object.assign({
            ad_type: adType,
            placement: placement
        }, params));
    }
    
    /**
     * Oyun içi satın alma olayı
     * @param {String} productId - Ürün ID
     * @param {Number} price - Fiyat
     * @param {String} currency - Para birimi
     * @param {Object} params - Ek parametreler
     */
    logPurchase(productId, price, currency, params = {}) {
        this.logEvent('purchase', Object.assign({
            product_id: productId,
            price: price,
            currency: currency
        }, params));
    }
    
    /**
     * Sosyal paylaşım olayı
     * @param {String} method - Paylaşım yöntemi (facebook, twitter, vb.)
     * @param {String} content - Paylaşım içeriği
     * @param {Object} params - Ek parametreler
     */
    logShare(method, content, params = {}) {
        this.logEvent('share', Object.assign({
            method: method,
            content: content
        }, params));
    }
    
    /**
     * Hata olayı
     * @param {String} errorType - Hata tipi
     * @param {String} message - Hata mesajı
     * @param {Object} params - Ek parametreler
     */
    logError(errorType, message, params = {}) {
        this.logEvent('error', Object.assign({
            error_type: errorType,
            message: message
        }, params));
    }
    
    /**
     * Kullanıcı özelliği ayarlar
     * @param {String} property - Özellik adı
     * @param {*} value - Özellik değeri
     */
    setUserProperty(property, value) {
        if (!this.isInitialized) {
            console.warn("Analytics not initialized");
            return;
        }
        
        // Veri toplama onayı alınmamışsa
        if (!this.config.consent) {
            return;
        }
        
        switch (this.config.platform) {
            case 'firebase':
                if (window.firebaseAnalytics && window.firebaseAnalytics.setUserProperty) {
                    window.firebaseAnalytics.setUserProperty(property, value);
                }
                break;
                
            default:
                // Yerel loglama
                if (this.config.logLevel === 'debug') {
                    console.log(`Analytics User Property: ${property} = ${value}`);
                }
                break;
        }
    }
    
    /**
     * Veri toplama onayını ayarlar
     * @param {Boolean} consent - Onay verildi mi
     */
    setConsent(consent) {
        this.config.consent = consent;
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!Analytics.instance) {
            new Analytics();
        }
        return Analytics.instance;
    }
}

// Singleton instance
Analytics.instance = null;