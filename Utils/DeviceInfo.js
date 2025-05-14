/**
 * DeviceInfo.js - Cihaz bilgileri
 * Kullanıcı cihazı hakkında detaylı bilgiler sağlar
 */
class DeviceInfo {
    constructor() {
        // Cihaz ve tarayıcı verileri
        this.browser = {};
        this.device = {};
        this.os = {};
        this.screen = {};
        this.hardware = {};
        this.network = {};
        this.capabilities = {};
        
        // Değişiklikleri izlemek için olay dinleyicileri
        this._listeners = {
            orientationChange: [],
            networkChange: [],
            batteryChange: [],
            memoryChange: []
        };
        
        // Singleton instance
        if (DeviceInfo.instance) {
            return DeviceInfo.instance;
        }
        DeviceInfo.instance = this;
        
        // Bilgileri topla
        this._collectDeviceInfo();
        
        // Olay dinleyicilerini ekle
        this._setupEventListeners();
    }
    
    /**
     * Cihaz bilgilerini toplar
     */
    _collectDeviceInfo() {
        this._detectBrowser();
        this._detectOperatingSystem();
        this._detectDevice();
        this._detectScreen();
        this._detectHardware();
        this._detectNetwork();
        this._detectCapabilities();
    }
    
    /**
     * Tarayıcı bilgilerini tespit eder
     */
    _detectBrowser() {
        const ua = navigator.userAgent;
        
        this.browser = {
            userAgent: ua,
            name: this._getBrowserName(ua),
            version: this._getBrowserVersion(ua),
            engine: this._getEngineInfo(ua),
            language: navigator.language || navigator.userLanguage || 'en-US',
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes',
            isOnline: navigator.onLine,
            isIncognito: this._detectIncognito()
        };
    }
    
    /**
     * İşletim sistemi bilgilerini tespit eder
     */
    _detectOperatingSystem() {
        const ua = navigator.userAgent;
        
        this.os = {
            name: this._getOSName(ua),
            version: this._getOSVersion(ua),
            platform: navigator.platform,
            architecture: this._getArchitecture(ua),
            isWindows: /Windows/.test(ua),
            isMacOS: /Macintosh|Mac OS X/.test(ua),
            isLinux: /Linux/.test(ua) && !/Android/.test(ua),
            isIOS: /iPhone|iPad|iPod/.test(ua),
            isAndroid: /Android/.test(ua)
        };
    }
    
    /**
     * Cihaz tipini tespit eder
     */
    _detectDevice() {
        const ua = navigator.userAgent;
        
        this.device = {
            type: this._getDeviceType(ua),
            model: this._getDeviceModel(ua),
            vendor: this._getDeviceVendor(ua),
            isMobile: this._isMobile(ua),
            isTablet: this._isTablet(ua),
            isDesktop: !this._isMobile(ua) && !this._isTablet(ua),
            isTV: /smart-tv|SmartTV|SMART-TV|googletv|Google TV|Android TV/.test(ua),
            isBot: /bot|crawler|spider|slurp|Mediapartners/i.test(ua)
        };
    }
    
    /**
     * Ekran bilgilerini tespit eder
     */
    _detectScreen() {
        const win = window;
        const doc = document;
        const screen = win.screen;
        
        this.screen = {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            orientation: this._getOrientation(),
            pixelRatio: win.devicePixelRatio || 1,
            touchPoints: this._getMaxTouchPoints(),
            viewportWidth: win.innerWidth || doc.documentElement.clientWidth || doc.body.clientWidth,
            viewportHeight: win.innerHeight || doc.documentElement.clientHeight || doc.body.clientHeight,
            isRetina: (win.devicePixelRatio || 1) >= 2
        };
    }
    
    /**
     * Donanım bilgilerini tespit eder
     */
    _detectHardware() {
        this.hardware = {
            cpuCores: navigator.hardwareConcurrency || 0,
            memory: this._getMemoryInfo(),
            battery: null,
            deviceMemory: navigator.deviceMemory || 0,
            hasMouse: this._detectMouse(),
            hasTouch: this._hasTouch(),
            hasKeyboard: this._detectKeyboard()
        };
        
        // Batarya bilgilerini tespit et
        this._detectBattery();
    }
    
    /**
     * Ağ bilgilerini tespit eder
     */
    _detectNetwork() {
        this.network = {
            type: this._getNetworkType(),
            downlinkSpeed: navigator.connection ? navigator.connection.downlink : undefined,
            rtt: navigator.connection ? navigator.connection.rtt : undefined,
            saveData: navigator.connection ? navigator.connection.saveData : false,
            effectiveType: navigator.connection ? navigator.connection.effectiveType : undefined,
            isOnline: navigator.onLine
        };
    }
    
    /**
     * Cihaz yeteneklerini tespit eder
     */
    _detectCapabilities() {
        this.capabilities = {
            webGL: this._hasWebGL(),
            webGL2: this._hasWebGL2(),
            webWorkers: !!window.Worker,
            serviceWorkers: 'serviceWorker' in navigator,
            webVR: 'getVRDisplays' in navigator,
            webXR: 'xr' in navigator,
            audio: !!window.AudioContext || !!window.webkitAudioContext,
            webP: this._hasWebP(),
            geolocation: 'geolocation' in navigator,
            notifications: 'Notification' in window,
            bluetooth: 'bluetooth' in navigator,
            usb: 'usb' in navigator,
            batteryAPI: 'getBattery' in navigator,
            speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
            sensors: 'Accelerometer' in window || 'Gyroscope' in window || 'LinearAccelerationSensor' in window,
            clipboard: navigator.clipboard && 'writeText' in navigator.clipboard,
            vibration: 'vibrate' in navigator,
            fullscreen: this._hasFullscreen(),
            gamepad: 'getGamepads' in navigator,
            performanceAPI: !!window.performance && !!window.performance.now,
            paymentRequest: 'PaymentRequest' in window,
            mediaSession: 'mediaSession' in navigator,
            bluetooth: 'bluetooth' in navigator,
            deviceLight: 'ondevicelight' in window,
            gyroscope: 'Gyroscope' in window,
            proximityEvents: 'ondeviceproximity' in window,
            canShare: navigator.canShare && typeof navigator.canShare === 'function'
        };
    }
    
    /**
     * Olay dinleyicilerini ayarlar
     */
    _setupEventListeners() {
        // Ekran yönlendirme değişikliği
        window.addEventListener('orientationchange', () => {
            this.screen.orientation = this._getOrientation();
            this._triggerEvent('orientationChange', this.screen.orientation);
        });
        
        // Ağ durum değişikliği
        window.addEventListener('online', () => {
            this.network.isOnline = true;
            this._triggerEvent('networkChange', this.network);
        });
        
        window.addEventListener('offline', () => {
            this.network.isOnline = false;
            this._triggerEvent('networkChange', this.network);
        });
        
        // Ağ bağlantısı değişiklikleri
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this._detectNetwork();
                this._triggerEvent('networkChange', this.network);
            });
        }
        
        // Bellek değişiklikleri
        if (window.performance && window.performance.memory) {
            setInterval(() => {
                const prevMemory = this.hardware.memory;
                this.hardware.memory = this._getMemoryInfo();
                
                if (prevMemory && this.hardware.memory.usedJSHeapSize !== prevMemory.usedJSHeapSize) {
                    this._triggerEvent('memoryChange', this.hardware.memory);
                }
            }, 10000); // 10 saniye aralıkla kontrol et
        }
    }
    
    /**
     * Ekran yönlendirilmesini alır
     * @return {String} Yönlendirme ('portrait', 'landscape')
     */
    _getOrientation() {
        const screen = window.screen;
        let orientation = '';
        
        if (screen.orientation) {
            orientation = screen.orientation.type;
        } else if (screen.mozOrientation) {
            orientation = screen.mozOrientation;
        } else if (screen.msOrientation) {
            orientation = screen.msOrientation;
        } else if (window.orientation !== undefined) {
            // iOS için
            const angle = window.orientation;
            if (angle === 0 || angle === 180) {
                orientation = 'portrait-primary';
            } else {
                orientation = 'landscape-primary';
            }
        } else {
            // Ekran oranına göre tahmin et
            orientation = window.innerHeight > window.innerWidth ? 'portrait-primary' : 'landscape-primary';
        }
        
        // Basitleştir
        if (orientation.includes('portrait')) {
            return 'portrait';
        } else if (orientation.includes('landscape')) {
            return 'landscape';
        }
        
        return orientation;
    }
    
    /**
     * Tarayıcı ismini tespit eder
     * @param {String} ua - User Agent
     * @return {String} Tarayıcı adı
     */
    _getBrowserName(ua) {
        if (/Edge|Edg/.test(ua)) return 'Edge';
        if (/Chrome/.test(ua) && !/Chromium|OPR|Edg/.test(ua)) return 'Chrome';
        if (/Chromium/.test(ua)) return 'Chromium';
        if (/Firefox|FxiOS/.test(ua) && !/Seamonkey/.test(ua)) return 'Firefox';
        if (/Safari/.test(ua) && !/Chrome|Chromium|Android/.test(ua)) return 'Safari';
        if (/OPR|Opera/.test(ua)) return 'Opera';
        if (/MSIE|Trident/.test(ua)) return 'Internet Explorer';
        if (/UCBrowser/.test(ua)) return 'UC Browser';
        if (/SamsungBrowser/.test(ua)) return 'Samsung Browser';
        
        return 'Unknown';
    }
    
    /**
     * Tarayıcı versiyonunu tespit eder
     * @param {String} ua - User Agent
     * @return {String} Tarayıcı versiyonu
     */
    _getBrowserVersion(ua) {
        const browser = this._getBrowserName(ua);
        let regex;
        
        switch (browser) {
            case 'Chrome':
                regex = /Chrome\/([\d.]+)/;
                break;
            case 'Chromium':
                regex = /Chromium\/([\d.]+)/;
                break;
            case 'Firefox':
                regex = /Firefox\/([\d.]+)/;
                break;
            case 'Firefox iOS':
                regex = /FxiOS\/([\d.]+)/;
                break;
            case 'Safari':
                regex = /Version\/([\d.]+)/;
                break;
            case 'Opera':
                regex = /(?:OPR|Opera)\/([\d.]+)/;
                break;
            case 'Internet Explorer':
                regex = /(?:MSIE |rv:)([\d.]+)/;
                break;
            case 'Edge':
                regex = /(?:Edge|Edg)\/([\d.]+)/;
                break;
            default:
                return 'Unknown';
        }
        
        const match = ua.match(regex);
        return match ? match[1] : 'Unknown';
    }
    
    /**
     * Tarayıcı motorunu tespit eder
     * @param {String} ua - User Agent
     * @return {Object} Motor bilgileri
     */
    _getEngineInfo(ua) {
        if (/Trident/.test(ua)) {
            return { name: 'Trident', version: ua.match(/Trident\/([\d.]+)/) ? ua.match(/Trident\/([\d.]+)/)[1] : 'Unknown' };
        }
        
        if (/Gecko/.test(ua) && !/like Gecko/.test(ua)) {
            return { name: 'Gecko', version: ua.match(/rv:([\d.]+)/) ? ua.match(/rv:([\d.]+)/)[1] : 'Unknown' };
        }
        
        if (/WebKit/.test(ua)) {
            return { name: 'WebKit', version: ua.match(/WebKit\/([\d.]+)/) ? ua.match(/WebKit\/([\d.]+)/)[1] : 'Unknown' };
        }
        
        if (/KHTML/.test(ua)) {
            return { name: 'KHTML', version: ua.match(/KHTML\/([\d.]+)/) ? ua.match(/KHTML\/([\d.]+)/)[1] : 'Unknown' };
        }
        
        return { name: 'Unknown', version: 'Unknown' };
    }
    
    /**
     * Gizli modu tespit etmeye çalışır
     * @return {Boolean} Gizli mod kullanılıyor mu
     */
    _detectIncognito() {
        // Gizli mod tespiti zor ve güvenilmezdir
        // Bu basit bir kontroldür ve her tarayıcıda çalışmayabilir
        try {
            localStorage.setItem('__test', '1');
            localStorage.removeItem('__test');
            return false;
        } catch (e) {
            return true;
        }
    }
    
    /**
     * İşletim sistemi adını tespit eder
     * @param {String} ua - User Agent
     * @return {String} İşletim sistemi adı
     */
    _getOSName(ua) {
        if (/Windows/.test(ua)) {
            return 'Windows';
        }
        
        if (/Macintosh|Mac OS X/.test(ua)) {
            return 'macOS';
        }
        
        if (/iPhone|iPad|iPod/.test(ua)) {
            return 'iOS';
        }
        
        if (/Android/.test(ua)) {
            return 'Android';
        }
        
        if (/Linux/.test(ua)) {
            return 'Linux';
        }
        
        if (/CrOS/.test(ua)) {
            return 'Chrome OS';
        }
        
        if (/Windows Phone/.test(ua)) {
            return 'Windows Phone';
        }
        
        return 'Unknown';
    }
    
    /**
     * İşletim sistemi versiyonunu tespit eder
     * @param {String} ua - User Agent
     * @return {String} İşletim sistemi versiyonu
     */
    _getOSVersion(ua) {
        const os = this._getOSName(ua);
        let regex;
        
        switch (os) {
            case 'Windows':
                if (/Windows NT 10.0/.test(ua)) return '10';
                if (/Windows NT 6.3/.test(ua)) return '8.1';
                if (/Windows NT 6.2/.test(ua)) return '8';
                if (/Windows NT 6.1/.test(ua)) return '7';
                if (/Windows NT 6.0/.test(ua)) return 'Vista';
                if (/Windows NT 5.1/.test(ua)) return 'XP';
                break;
                
            case 'macOS':
                regex = /Mac OS X (10[._]\d+(?:[._]\d+)*)/;
                if (regex.test(ua)) {
                    return ua.match(regex)[1].replace(/_/g, '.');
                }
                break;
                
            case 'iOS':
                regex = /OS (\d+)_(\d+)(?:_(\d+))?/;
                if (regex.test(ua)) {
                    const matches = ua.match(regex);
                    return `${matches[1]}.${matches[2]}${matches[3] ? `.${matches[3]}` : ''}`;
                }
                break;
                
            case 'Android':
                regex = /Android (\d+(?:\.\d+)*)/;
                if (regex.test(ua)) {
                    return ua.match(regex)[1];
                }
                break;
                
            case 'Chrome OS':
                regex = /CrOS x86_64 (\d+(?:\.\d+)*)/;
                if (regex.test(ua)) {
                    return ua.match(regex)[1];
                }
                break;
                
            case 'Windows Phone':
                regex = /Windows Phone (?:OS )?([\d.]+)/;
                if (regex.test(ua)) {
                    return ua.match(regex)[1];
                }
                break;
        }
        
        return 'Unknown';
    }
    
    /**
     * İşlemci mimarisini tespit eder
     * @param {String} ua - User Agent
     * @return {String} İşlemci mimarisi
     */
    _getArchitecture(ua) {
        if (/x86_64|x86-64|x64|amd64|AMD64|WOW64|win64/.test(ua)) {
            return 'x64';
        }
        
        if (/i[3-6]86|x86|i86pc/.test(ua)) {
            return 'x86';
        }
        
        if (/arm64|aarch64|armv8|arm64e/.test(ua)) {
            return 'arm64';
        }
        
        if (/arm|armv/.test(ua)) {
            return 'arm';
        }
        
        return 'Unknown';
    }
    
    /**
     * Cihaz tipini tespit eder
     * @param {String} ua - User Agent
     * @return {String} Cihaz tipi
     */
    _getDeviceType(ua) {
        if (this._isTablet(ua)) {
            return 'tablet';
        }
        
        if (this._isMobile(ua)) {
            return 'mobile';
        }
        
        if (/smart-tv|SmartTV|SMART-TV|googletv|Google TV|Android TV/.test(ua)) {
            return 'tv';
        }
        
        if (/Xbox|PlayStation|Nintendo/.test(ua)) {
            return 'console';
        }
        
        return 'desktop';
    }
    
    /**
     * Cihaz üreticisini tespit eder
     * @param {String} ua - User Agent
     * @return {String} Cihaz üreticisi
     */
    _getDeviceVendor(ua) {
        if (/iPhone|iPad|iPod/.test(ua)) {
            return 'Apple';
        }
        
        if (/Samsung/.test(ua)) {
            return 'Samsung';
        }
        
        if (/LG/.test(ua)) {
            return 'LG';
        }
        
        if (/HTC/.test(ua)) {
            return 'HTC';
        }
        
        if (/Motorola/.test(ua)) {
            return 'Motorola';
        }
        
        if (/Huawei/.test(ua)) {
            return 'Huawei';
        }
        
        if (/Xiaomi|Mi|Redmi/.test(ua)) {
            return 'Xiaomi';
        }
        
        if (/Sony/.test(ua)) {
            return 'Sony';
        }
        
        if (/ASUS|asus/.test(ua)) {
            return 'Asus';
        }
        
        if (/Nokia/.test(ua)) {
            return 'Nokia';
        }
        
        if (/Lenovo/.test(ua)) {
            return 'Lenovo';
        }
        
        if (/Kindle/.test(ua)) {
            return 'Amazon';
        }
        
        if (/OnePlus/.test(ua)) {
            return 'OnePlus';
        }
        
        return 'Unknown';
    }
    
    /**
     * Cihaz modelini tespit eder
     * @param {String} ua - User Agent
     * @return {String} Cihaz modeli
     */
    _getDeviceModel(ua) {
        // iPhone modelini tespit et
        if (/iPhone/.test(ua)) {
            const match = ua.match(/iPhone(\d+),(\d+)/);
            if (match) {
                return `iPhone ${match[1]},${match[2]}`;
            }
            return 'iPhone';
        }
        
        // iPad modelini tespit et
        if (/iPad/.test(ua)) {
            const match = ua.match(/iPad(\d+),(\d+)/);
            if (match) {
                return `iPad ${match[1]},${match[2]}`;
            }
            return 'iPad';
        }
        
        // Android cihaz modelini tespit et
        if (/Android/.test(ua)) {
            // Bazı Samsung modelleri için
            if (/Samsung/.test(ua)) {
                const match = ua.match(/Samsung ([a-zA-Z0-9-]+)/);
                if (match) {
                    return match[1];
                }
            }
            
            // Genel Android modeli için
            const match = ua.match(/; ([A-Za-z0-9_\-\s]+) Build\//);
            if (match) {
                return match[1].trim();
            }
        }
        
        return 'Unknown';
    }
    
    /**
     * Cihazın mobil olup olmadığını tespit eder
     * @param {String} ua - User Agent
     * @return {Boolean} Mobil cihaz mı
     */
    _isMobile(ua) {
        return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|webOS/.test(ua);
    }
    
    /**
     * Cihazın tablet olup olmadığını tespit eder
     * @param {String} ua - User Agent
     * @return {Boolean} Tablet cihaz mı
     */
    _isTablet(ua) {
        return (/iPad/.test(ua) || 
                (/Android/.test(ua) && !/Mobile/.test(ua)) || 
                (/Tablet/.test(ua)) || 
                (/Kindle/.test(ua)) || 
                (/PlayBook/.test(ua)));
    }
    
    /**
     * Maksimum dokunma noktası sayısını alır
     * @return {Number} Maksimum dokunma noktası sayısı
     */
    _getMaxTouchPoints() {
        if (navigator.maxTouchPoints !== undefined) {
            return navigator.maxTouchPoints;
        }
        
        if (navigator.msMaxTouchPoints !== undefined) {
            return navigator.msMaxTouchPoints;
        }
        
        if (window.matchMedia && window.matchMedia('(any-pointer: coarse)').matches) {
            return 1;
        }
        
        return 0;
    }
    
    /**
     * Bellek bilgilerini alır
     * @return {Object} Bellek bilgileri
     */
    _getMemoryInfo() {
        const memory = {
            totalJSHeapSize: 0,
            usedJSHeapSize: 0,
            jsHeapSizeLimit: 0
        };
        
        if (window.performance && window.performance.memory) {
            // 1024 * 1024 ile bölerek MB cinsinden değerler elde ediyoruz
            memory.totalJSHeapSize = Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024));
            memory.usedJSHeapSize = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
            memory.jsHeapSizeLimit = Math.round(window.performance.memory.jsHeapSizeLimit / (1024 * 1024));
        }
        
        return memory;
    }
    
    /**
     * Fare varlığını tespit eder
     * @return {Boolean} Fare var mı
     */
    _detectMouse() {
        if (window.matchMedia) {
            return window.matchMedia('(pointer: fine)').matches;
        }
        
        return true; // Varsayılan olarak true kabul edilir
    }
    
    /**
     * Klavye varlığını tespit eder
     * @return {Boolean} Klavye var mı
     */
    _detectKeyboard() {
        if (navigator.keyboard) {
            return true;
        }
        
        // Masaüstü cihazlarda genellikle klavye vardır
        return this.device.isDesktop;
    }
    
    /**
     * Dokunmatik ekran varlığını tespit eder
     * @return {Boolean} Dokunmatik ekran var mı
     */
    _hasTouch() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0);
    }
    
    /**
     * Batarya bilgilerini tespit eder
     */
    _detectBattery() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.hardware.battery = {
                    level: battery.level * 100, // Yüzde cinsinden
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
                
                // Batarya değişikliklerini izle
                battery.addEventListener('levelchange', () => {
                    this.hardware.battery.level = battery.level * 100;
                    this._triggerEvent('batteryChange', this.hardware.battery);
                });
                
                battery.addEventListener('chargingchange', () => {
                    this.hardware.battery.charging = battery.charging;
                    this._triggerEvent('batteryChange', this.hardware.battery);
                });
            });
        } else {
            this.hardware.battery = null;
        }
    }
    
    /**
     * Ağ bağlantı tipini tespit eder
     * @return {String} Ağ bağlantı tipi
     */
    _getNetworkType() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection && connection.type) {
            return connection.type;
        }
        
        return 'unknown';
    }
    
    /**
     * WebGL desteğini tespit eder
     * @return {Boolean} WebGL destekli mi
     */
    _hasWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                     (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }
    
    /**
     * WebGL2 desteğini tespit eder
     * @return {Boolean} WebGL2 destekli mi
     */
    _hasWebGL2() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
        } catch (e) {
            return false;
        }
    }
    
    /**
     * WebP format desteğini tespit eder
     * @return {Boolean} WebP destekli mi
     */
    _hasWebP() {
        try {
            return document.createElement('canvas')
                .toDataURL('image/webp')
                .indexOf('data:image/webp') === 0;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Tam ekran desteğini tespit eder
     * @return {Boolean} Tam ekran destekli mi
     */
    _hasFullscreen() {
        return !!(document.documentElement.requestFullscreen || 
                 document.documentElement.mozRequestFullScreen || 
                 document.documentElement.webkitRequestFullscreen || 
                 document.documentElement.msRequestFullscreen);
    }
    
    /**
     * Belirli bir olayı dinleyen fonksiyonu ekler
     * @param {String} event - Olay adı
     * @param {Function} callback - Geri çağırım fonksiyonu
     */
    on(event, callback) {
        if (this._listeners[event]) {
            this._listeners[event].push(callback);
        }
    }
    
    /**
     * Belirli bir olayı dinleyen fonksiyonu kaldırır
     * @param {String} event - Olay adı
     * @param {Function} callback - Kaldırılacak fonksiyon
     */
    off(event, callback) {
        if (this._listeners[event]) {
            this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
        }
    }
    
    /**
     * Olayı tetikler
     * @param {String} event - Olay adı
     * @param {*} data - Olay verisi
     */
    _triggerEvent(event, data) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(callback => callback(data));
        }
    }
    
    /**
     * Cihaz yönlendirmesini alır
     * @return {String} Yönlendirme ('portrait', 'landscape')
     */
    getOrientation() {
        return this.screen.orientation;
    }
    
    /**
     * Tüm cihaz bilgilerini alır
     * @return {Object} Tüm cihaz bilgileri
     */
    getAllInfo() {
        return {
            browser: this.browser,
            device: this.device,
            os: this.os,
            screen: this.screen,
            hardware: this.hardware,
            network: this.network,
            capabilities: this.capabilities
        };
    }
    
    /**
     * Belirli bir bilgi kategorisini alır
     * @param {String} category - Kategori adı
     * @return {Object} Kategori bilgileri
     */
    getInfo(category) {
        switch (category) {
            case 'browser':
                return this.browser;
            case 'device':
                return this.device;
            case 'os':
                return this.os;
            case 'screen':
                return this.screen;
            case 'hardware':
                return this.hardware;
            case 'network':
                return this.network;
            case 'capabilities':
                return this.capabilities;
            default:
                return null;
        }
    }
    
    /**
     * Cihaz bilgilerini günceller
     */
    refreshInfo() {
        this._collectDeviceInfo();
    }
    
    /**
     * Cihaz bilgilerini özetler
     * @return {Object} Özet bilgiler
     */
    getSummary() {
        return {
            browserName: this.browser.name,
            browserVersion: this.browser.version,
            osName: this.os.name,
            osVersion: this.os.version,
            deviceType: this.device.type,
            screenSize: `${this.screen.width}x${this.screen.height}`,
            orientation: this.screen.orientation,
            isOnline: this.network.isOnline,
            connectionType: this.network.type,
            hasTouch: this.hardware.hasTouch,
            isMobile: this.device.isMobile
        };
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!DeviceInfo.instance) {
            new DeviceInfo();
        }
        return DeviceInfo.instance;
    }
}

// Singleton instance
DeviceInfo.instance = null;