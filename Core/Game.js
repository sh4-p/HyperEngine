/**
 * Game.js - Oyun yönetim sınıfı
 * Oyun döngüsü ve oyun akışını yönetir
 */
class Game {
    constructor(config = {}) {
        // Varsayılan yapılandırma
        this.config = Object.assign({
            canvasId: 'game-canvas',
            width: 640,
            height: 960,
            orientation: 'portrait', // 'portrait' veya 'landscape'
            fps: 60,
            clearColor: '#000000',
            debug: false,
            scenes: {},
            firstScene: null,
            showFps: false,
            pauseOnBlur: true,
            responsive: true,
            resizeMode: 'scale-to-fit', // 'stretch', 'scale-to-fit', 'scale-to-fill'
            pixelRatio: 1,
            physics: {
                enabled: true,
                gravity: { x: 0, y: 9.8 },
                debug: false
            },
            audio: {
                enabled: true,
                volume: 1.0,
                musicVolume: 0.5,
                soundVolume: 1.0
            },
            input: {
                multitouch: true
            },
            ads: {
                enabled: false,
                platform: 'admob',
                testMode: true,
                autoLoadAds: true
            },
            analytics: {
                enabled: false,
                platform: 'firebase'
            }
        }, config);
        
        // Motor örnekleri
        this.engine = null;
        this.sceneManager = null;
        this.assetManager = null;
        this.physics = null;
        this.input = null;
        this.renderer = null;
        this.audio = null;
        this.time = null;
        this.adManager = null;
        this.analytics = null;
        
        // Oyun durumu
        this.isRunning = false;
        this.isPaused = false;
        this.isLoading = false;
        this.loadingProgress = 0;
        
        // Olay işleyicileri
        this.onReady = null;
        this.onUpdate = null;
        this.onRender = null;
        this.onPause = null;
        this.onResume = null;
        this.onResize = null;
        this.onLoadProgress = null;
        this.onLoadComplete = null;
        
        // Bootstrap
        this._initialize();
    }
    
    /**
     * Oyun motorunu başlatır
     */
    _initialize() {
        // Ana motoru oluştur
        this.engine = new Engine({
            canvasId: this.config.canvasId,
            width: this.config.width,
            height: this.config.height
        });
        
        // Motor sistemlerine referansları kaydet
        this.sceneManager = SceneManager.getInstance();
        this.assetManager = AssetManager.getInstance();
        this.physics = Physics.getInstance();
        this.input = Input.getInstance();
        this.renderer = Renderer.getInstance();
        this.audio = Audio.getInstance();
        this.time = Time.getInstance();
        
        // Fizik ayarları
        this.physics.gravity = this.config.physics.gravity;
        
        // Ses ayarları
        this.audio.setMusicVolume(this.config.audio.musicVolume);
        this.audio.setSoundVolume(this.config.audio.soundVolume);
        
        // Debug modu
        if (this.config.debug) {
            Physics.debugDraw = this.config.physics.debug;
            Collider.debugDraw = this.config.physics.debug;
        }
        
        // Reklam yönetimi
        if (this.config.ads.enabled) {
            this.adManager = new AdManager(this.config.ads);
            
            // Reklam olaylarını dinle
            this.adManager.onInitializeSuccess = () => {
                console.log("Ads initialized successfully");
            };
            
            this.adManager.onInitializeFail = () => {
                console.warn("Ads initialization failed");
            };
        }
        
        // Pencere olaylarını dinle
        this._setupWindowEvents();
        
        // Uygulama hacmini ayarla
        this._adjustCanvasSize();
    }
    
    /**
     * Pencere olaylarını ayarlar
     */
    _setupWindowEvents() {
        // Pencere yeniden boyutlandırma
        window.addEventListener('resize', () => {
            this._adjustCanvasSize();
            
            if (this.onResize) {
                this.onResize();
            }
        });
        
        // Sekme değişimi (oyunu duraklat/devam et)
        if (this.config.pauseOnBlur) {
            window.addEventListener('blur', () => {
                this.pause();
            });
            
            window.addEventListener('focus', () => {
                this.resume();
            });
        }
        
        // Tam ekran değişikliği
        document.addEventListener('fullscreenchange', () => {
            this._adjustCanvasSize();
        });
    }
    
    /**
     * Canvas boyutunu ayarlar
     */
    _adjustCanvasSize() {
        if (!this.config.responsive) return;
        
        const canvas = this.engine.canvas;
        const container = canvas.parentElement || document.body;
        
        // Konteyner boyutlarını al
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Oyun orijinal boyutları
        const gameWidth = this.config.width;
        const gameHeight = this.config.height;
        
        // Oyun oranı
        const gameRatio = gameWidth / gameHeight;
        const containerRatio = containerWidth / containerHeight;
        
        let newWidth, newHeight;
        
        switch (this.config.resizeMode) {
            case 'stretch':
                // Konteyner boyutlarına uzat
                newWidth = containerWidth;
                newHeight = containerHeight;
                break;
                
            case 'scale-to-fill':
                // Tüm konteynerı dolduracak şekilde ölçekle (taşma olabilir)
                if (containerRatio > gameRatio) {
                    newWidth = containerWidth;
                    newHeight = containerWidth / gameRatio;
                } else {
                    newWidth = containerHeight * gameRatio;
                    newHeight = containerHeight;
                }
                break;
                
            case 'scale-to-fit':
            default:
                // Konteyner içine sığacak şekilde ölçekle (boşluk olabilir)
                if (containerRatio > gameRatio) {
                    newWidth = containerHeight * gameRatio;
                    newHeight = containerHeight;
                } else {
                    newWidth = containerWidth;
                    newHeight = containerWidth / gameRatio;
                }
                break;
        }
        
        // CSS ile canvas stil ayarları
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;
        
        // Piksel oranını ayarla
        const pixelRatio = this.config.pixelRatio * window.devicePixelRatio;
        
        // Yüksek DPI ekranlar için canvas çözünürlüğünü ayarla
        canvas.width = Math.floor(newWidth * pixelRatio);
        canvas.height = Math.floor(newHeight * pixelRatio);
        
        // Canvas context ölçeğini ayarla
        const ctx = canvas.getContext('2d');
        ctx.scale(pixelRatio, pixelRatio);
    }
    
    /**
     * Sahne ekler
     * @param {String} name - Sahne adı
     * @param {Scene} scene - Sahne nesnesi
     */
    addScene(name, scene) {
        this.sceneManager.addScene(name, scene);
        
        // Eğer ilk sahne belirtilmemişse, ilk eklenen sahneyi kullan
        if (!this.config.firstScene) {
            this.config.firstScene = name;
        }
    }
    
    /**
     * Kaynak yükler
     * @param {Array} resources - Yüklenecek kaynaklar
     * @param {Boolean} startOnLoad - Yükleme tamamlandığında oyunu başlat
     */
    loadResources(resources, startOnLoad = false) {
        this.isLoading = true;
        this.loadingProgress = 0;
        
        // Kaynakları yükleme kuyruğuna ekle
        for (const resource of resources) {
            if (resource.type === 'image') {
                this.assetManager.queueImage(resource.key, resource.url);
            } else if (resource.type === 'audio') {
                this.assetManager.queueAudio(resource.key, resource.url);
            } else if (resource.type === 'json') {
                this.assetManager.queueJSON(resource.key, resource.url);
            }
        }
        
        // Yükleme olaylarını dinle
        this.assetManager.onProgress = (progress, loaded, total) => {
            this.loadingProgress = progress;
            
            if (this.onLoadProgress) {
                this.onLoadProgress(progress, loaded, total);
            }
        };
        
        this.assetManager.onComplete = () => {
            this.isLoading = false;
            
            if (this.onLoadComplete) {
                this.onLoadComplete();
            }
            
            // Otomatik başlatma
            if (startOnLoad) {
                this.start();
            }
        };
        
        // Yüklemeyi başlat
        this.assetManager.startLoading();
    }
    
    /**
     * Oyunu başlatır
     */
    start() {
        if (this.isRunning) return;
        
        // Ana motoru başlat
        this.engine.start();
        
        // Ses sistemini aktive et (kullanıcı etkileşimi gerektirir)
        this.audio.resume();
        
        // İlk sahneyi yükle
        if (this.config.firstScene) {
            this.sceneManager.loadScene(this.config.firstScene);
        }
        
        this.isRunning = true;
        this.isPaused = false;
        
        // Hazır olayını çağır
        if (this.onReady) {
            this.onReady();
        }
    }
    
    /**
     * Oyunu duraklatır
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        
        // Duraklat olayını çağır
        if (this.onPause) {
            this.onPause();
        }
    }
    
    /**
     * Oyunu devam ettirir
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        
        // Ses sistemini aktive et
        this.audio.resume();
        
        // Devam et olayını çağır
        if (this.onResume) {
            this.onResume();
        }
    }
    
    /**
     * Oyunu durdurur
     */
    stop() {
        if (!this.isRunning) return;
        
        // Ana motoru durdur
        this.engine.stop();
        
        this.isRunning = false;
        this.isPaused = false;
    }
    
    /**
     * Sahneyi değiştirir
     * @param {String} name - Sahne adı
     * @param {Object} transitionOptions - Geçiş seçenekleri (isteğe bağlı)
     */
    loadScene(name, transitionOptions = {}) {
        this.sceneManager.loadScene(name, transitionOptions);
    }
    
    /**
     * Tam ekran moduna geçer
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            // Tam ekrana geç
            const canvas = this.engine.canvas;
            
            if (canvas.requestFullscreen) {
                canvas.requestFullscreen();
            } else if (canvas.mozRequestFullScreen) {
                canvas.mozRequestFullScreen();
            } else if (canvas.webkitRequestFullscreen) {
                canvas.webkitRequestFullscreen();
            } else if (canvas.msRequestFullscreen) {
                canvas.msRequestFullscreen();
            }
        } else {
            // Tam ekrandan çık
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    /**
     * Banner reklamı gösterir
     */
    showBanner() {
        if (this.adManager) {
            this.adManager.showBanner();
        }
    }
    
    /**
     * Banner reklamı gizler
     */
    hideBanner() {
        if (this.adManager) {
            this.adManager.hideBanner();
        }
    }
    
    /**
     * Geçiş reklamı gösterir
     * @return {Boolean} Gösterim başarılı mı
     */
    showInterstitial() {
        if (this.adManager) {
            return this.adManager.showInterstitial();
        }
        return false;
    }
    
    /**
     * Ödüllü reklam gösterir
     * @param {Function} callback - Ödül callback'i
     * @return {Boolean} Gösterim başarılı mı
     */
    showRewarded(callback) {
        if (this.adManager) {
            return this.adManager.showRewarded(callback);
        }
        return false;
    }
    
    /**
     * FPS değerini gösterir
     * @param {Boolean} show - Göster/Gizle
     */
    showFps(show) {
        this.config.showFps = show;
    }
    
    /**
     * Oyun için özel olay tetikler
     * @param {String} eventName - Olay adı
     * @param {Object} params - Olay parametreleri
     */
    dispatchEvent(eventName, params = {}) {
        const event = new CustomEvent(eventName, { detail: params });
        window.dispatchEvent(event);
    }
}