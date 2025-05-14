/**
 * EngineConfig.js - Motor yapılandırması
 * Oyun motorunun çeşitli ayarlarını yönetir
 */
class EngineConfig {
    constructor(config = {}) {
        // Temel motor yapılandırması
        this.config = Object.assign({
            // Genel ayarlar
            fps: 60,
            fixedTimeStep: 1/60,
            maxTimeStep: 0.25,
            
            // Render ayarları
            width: 640,
            height: 960,
            resolution: window.devicePixelRatio || 1,
            autoResize: true,
            resizeMode: 'scale-fit', // 'scale-fit', 'scale-fill', 'stretch'
            centerCanvas: true,
            clearColor: '#000000',
            
            // Fizik ayarları
            physics: {
                enabled: true,
                gravity: { x: 0, y: 9.8 },
                velocityIterations: 8,
                positionIterations: 3,
                debug: false
            },
            
            // Ses ayarları
            audio: {
                enabled: true,
                volume: 1.0,
                musicVolume: 0.5,
                effectsVolume: 1.0,
                muted: false
            },
            
            // Giriş ayarları
            input: {
                enabled: true,
                multitouch: true,
                preventDefaults: true,
                useAccelerometer: true
            },
            
            // Asset ayarları
            assets: {
                basePath: 'assets/',
                retryCount: 3,
                retryDelay: 1000,
                parallelLoads: 6
            },
            
            // Debug ayarları
            debug: {
                enabled: false,
                showFPS: false,
                showPhysics: false,
                showBounds: false,
                logLevel: 'warn' // 'debug', 'info', 'warn', 'error', 'none'
            },
            
            // Dil ayarları
            locale: {
                default: 'en',
                fallback: 'en',
                available: ['en']
            }
        }, config);
        
        // Singleton instance
        if (EngineConfig.instance) {
            return EngineConfig.instance;
        }
        EngineConfig.instance = this;
        
        // Tarayıcı ve cihaz bilgilerini tespit et
        this._detectEnvironment();
    }
    
    /**
     * Tarayıcı ve cihaz bilgilerini tespit eder
     */
    _detectEnvironment() {
        // Tarayıcı bilgileri
        const userAgent = window.navigator.userAgent;
        
        this.browser = {
            isChrome: /Chrome/.test(userAgent) && !/Edge/.test(userAgent),
            isFirefox: /Firefox/.test(userAgent),
            isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
            isEdge: /Edge/.test(userAgent),
            isIE: /MSIE/.test(userAgent) || /Trident/.test(userAgent),
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
        };
        
        // Cihaz bilgileri
        this.device = {
            isDesktop: !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)),
            isAndroid: /Android/i.test(userAgent),
            isIOS: /iPhone|iPad|iPod/i.test(userAgent),
            isTablet: /iPad/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent)),
            orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
            pixelRatio: window.devicePixelRatio || 1
        };
        
        // Özellik tespiti
        this.features = {
            hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            hasWebGL: this._detectWebGL(),
            hasWebAudio: !!window.AudioContext || !!window.webkitAudioContext,
            hasStorage: this._detectStorage(),
            hasOrientationAPI: !!window.DeviceOrientationEvent,
            hasMotionAPI: !!window.DeviceMotionEvent
        };
    }
    
    /**
     * WebGL desteğini kontrol eder
     * @return {Boolean} WebGL destekli mi
     */
    _detectWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                     (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Local Storage desteğini kontrol eder
     * @return {Boolean} Local Storage destekli mi
     */
    _detectStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Belirli bir yapılandırma ayarını alır
     * @param {String} key - Ayar anahtarı (nokta notasyonu ile iç içe alanlara erişilebilir, örn: 'physics.gravity.y')
     * @param {*} defaultValue - Ayar bulunamazsa dönecek varsayılan değer
     * @return {*} Ayar değeri
     */
    get(key, defaultValue = null) {
        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }
    
    /**
     * Belirli bir yapılandırma ayarını değiştirir
     * @param {String} key - Ayar anahtarı (nokta notasyonu ile iç içe alanlara erişilebilir, örn: 'physics.gravity.y')
     * @param {*} value - Yeni değer
     */
    set(key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        let target = this.config;
        
        for (const k of keys) {
            if (!(k in target)) {
                target[k] = {};
            }
            target = target[k];
        }
        
        target[lastKey] = value;
        
        // Bazı özel değişikliklere özel tepkiler
        if (key === 'debug.enabled') {
            this._updateDebugMode();
        } else if (key === 'audio.muted') {
            this._updateAudioSettings();
        }
    }
    
    /**
     * Birden çok ayarı toplu olarak günceller
     * @param {Object} updatedConfig - Güncellenecek ayarlar
     */
    update(updatedConfig) {
        this._deepMerge(this.config, updatedConfig);
        
        // Özel güncellemeler
        if ('debug' in updatedConfig) {
            this._updateDebugMode();
        }
        if ('audio' in updatedConfig) {
            this._updateAudioSettings();
        }
    }
    
    /**
     * İki nesneyi derin birleştirir
     * @param {Object} target - Hedef nesne
     * @param {Object} source - Kaynak nesne
     * @return {Object} Birleştirilmiş nesne
     */
    _deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this._deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }
    
    /**
     * Debug modunu günceller
     */
    _updateDebugMode() {
        const isDebug = this.config.debug.enabled;
        
        // Debug ayarlarını güncelle
        if (isDebug) {
            console.log('Debug mode enabled');
            // Debug ile ilgili çeşitli sistemleri aktifleştir
        } else {
            console.log('Debug mode disabled');
            // Debug ile ilgili çeşitli sistemleri deaktifleştir
        }
    }
    
    /**
     * Ses ayarlarını günceller
     */
    _updateAudioSettings() {
        const audioConfig = this.config.audio;
        
        // Ses sistemini güncelle (Audio sınıfına bildir)
        if (window.Audio && Audio.getInstance) {
            const audio = Audio.getInstance();
            if (audio) {
                audio.setMuted(audioConfig.muted);
                audio.setMusicVolume(audioConfig.musicVolume);
                audio.setSoundVolume(audioConfig.effectsVolume);
            }
        }
    }
    
    /**
     * Mevcut yapılandırmayı dışa aktarır
     * @return {Object} Yapılandırma nesnesi
     */
    export() {
        return JSON.parse(JSON.stringify(this.config));
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!EngineConfig.instance) {
            new EngineConfig();
        }
        return EngineConfig.instance;
    }
}

// Singleton instance
EngineConfig.instance = null;