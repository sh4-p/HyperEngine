/**
 * Engine.js - Ana motor sınıfı
 * Diğer tüm sistemleri başlatır ve yönetir
 */
class Engine {
    constructor(config = {}) {
        this.config = Object.assign({
            canvasId: 'game-canvas',
            width: 640,
            height: 960,
            fps: 60
        }, config);
        
        this.isRunning = false;
        this.systems = {};
        
        // Singleton instance
        if (Engine.instance) {
            return Engine.instance;
        }
        Engine.instance = this;
        
        // Canvas oluştur
        this.canvas = document.getElementById(this.config.canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = this.config.canvasId;
            this.canvas.width = this.config.width;
            this.canvas.height = this.config.height;
            document.body.appendChild(this.canvas);
        }
        
        this.context = this.canvas.getContext('2d');
        
        // Temel sistemleri oluştur
        this.time = new Time();
        this.input = new Input(this.canvas);
        this.renderer = new Renderer(this.canvas, this.context);
        this.physics = new Physics();
        this.assetManager = new AssetManager();
        this.sceneManager = new SceneManager();
        
        // Sistemleri kaydet
        this.systems.time = this.time;
        this.systems.input = this.input;
        this.systems.renderer = this.renderer;
        this.systems.physics = this.physics;
        this.systems.assetManager = this.assetManager;
        this.systems.sceneManager = this.sceneManager;
        
        console.log("HyperEngine initialized!");
    }
    
    /**
     * Motor döngüsünü başlatır
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        // Zaman yöneticisini başlat
        this.time.start();
        
        // Aktif sahneyi yükle
        if (this.sceneManager.activeScene) {
            this.sceneManager.activeScene.load();
        }
        
        // Oyun döngüsünü başlat
        this.gameLoop();
        
        console.log("Engine started!");
    }
    
    /**
     * Motor döngüsünü durdurur
     */
    stop() {
        this.isRunning = false;
        console.log("Engine stopped!");
    }
    
    /**
     * Ana oyun döngüsü
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        // Delta time hesapla
        this.time.update();
        const deltaTime = this.time.deltaTime;
        
        // Girişleri güncelle
        this.input.update();
        
        // Aktif sahneyi güncelle
        if (this.sceneManager.activeScene) {
            this.sceneManager.activeScene.update(deltaTime);
        }
        
        // Fizik simülasyonu
        this.physics.update(deltaTime);
        
        // Render işlemleri
        this.renderer.clear();
        
        if (this.sceneManager.activeScene) {
            this.sceneManager.activeScene.render(this.renderer);
        }
        
        // Bir sonraki kareyi planla
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Sistemi kaydeder
     */
    registerSystem(name, system) {
        this.systems[name] = system;
    }
    
    /**
     * Kaydedilen sistemi döndürür
     */
    getSystem(name) {
        return this.systems[name];
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!Engine.instance) {
            new Engine();
        }
        return Engine.instance;
    }
}

// Singleton instance
Engine.instance = null;