/**
 * SceneManager.js - Sahne yönetimi
 * Oyun sahneleri arasında geçişleri yönetir
 */
class SceneManager {
    constructor() {
        // Sahne koleksiyonu
        this.scenes = {};
        this.activeScene = null;
        
        // Geçiş durumu
        this.transitioning = false;
        this.transitionDuration = 0.5; // saniye
        this.transitionElapsed = 0;
        this.transitionType = 'fade'; // 'fade', 'slide', 'zoom'
        
        // Geçiş sahneleri
        this.currentScene = null;
        this.nextScene = null;
        
        // Olaylar
        this.onTransitionStart = null;
        this.onTransitionComplete = null;
        
        // Singleton instance
        if (SceneManager.instance) {
            return SceneManager.instance;
        }
        SceneManager.instance = this;
    }
    
    /**
     * Sahne ekler
     * @param {String} name - Sahne adı
     * @param {Scene} scene - Sahne nesnesi
     */
    addScene(name, scene) {
        if (!(scene instanceof Scene)) {
            console.error("Eklenecek nesne bir Scene olmalı");
            return;
        }
        
        scene.name = name;
        this.scenes[name] = scene;
    }
    
    /**
     * Sahne alır
     * @param {String} name - Sahne adı
     * @return {Scene} Bulunan sahne veya null
     */
    getScene(name) {
        return this.scenes[name] || null;
    }
    
    /**
     * Sahneyi etkinleştirir
     * @param {String} name - Sahne adı
     * @param {Object} transitionOptions - Geçiş seçenekleri (isteğe bağlı)
     */
    loadScene(name, transitionOptions = {}) {
        const scene = this.getScene(name);
        
        if (!scene) {
            console.error(`Scene "${name}" not found`);
            return;
        }
        
        // Aktif sahne yoksa, geçiş olmadan yükle
        if (!this.activeScene) {
            this._activateScene(scene);
            return;
        }
        
        // Geçiş seçenekleri
        const options = Object.assign({
            duration: this.transitionDuration,
            type: this.transitionType
        }, transitionOptions);
        
        // Geçiş başlat
        this._startTransition(this.activeScene, scene, options);
    }
    
    /**
     * Sahneyi doğrudan etkinleştirir (geçiş olmadan)
     * @param {Scene} scene - Etkinleştirilecek sahne
     */
    _activateScene(scene) {
        // Önceki aktif sahneyi devre dışı bırak
        if (this.activeScene) {
            this.activeScene.stop();
        }
        
        // Yeni sahneyi etkinleştir
        this.activeScene = scene;
        
        // Sahne yüklenmemişse yükle
        if (!scene.loaded) {
            scene.load();
        }
        
        // Sahneyi başlat
        scene.start();
    }
    
    /**
     * Sahneler arası geçiş başlatır
     * @param {Scene} currentScene - Mevcut sahne
     * @param {Scene} nextScene - Hedef sahne
     * @param {Object} options - Geçiş seçenekleri
     */
    _startTransition(currentScene, nextScene, options) {
        // Zaten geçiş yapılıyorsa iptal et
        if (this.transitioning) return;
        
        this.transitioning = true;
        this.transitionDuration = options.duration;
        this.transitionType = options.type;
        this.transitionElapsed = 0;
        
        this.currentScene = currentScene;
        this.nextScene = nextScene;
        
        // Hedef sahneyi yükle
        if (!this.nextScene.loaded) {
            this.nextScene.load();
        }
        
        // Geçiş başlangıç olayını çağır
        if (this.onTransitionStart) {
            this.onTransitionStart(this.currentScene, this.nextScene);
        }
    }
    
    /**
     * Geçişi günceller
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        // Aktif sahne yoksa atla
        if (!this.activeScene && !this.transitioning) return;
        
        // Geçiş durumu
        if (this.transitioning) {
            this.transitionElapsed += deltaTime;
            
            // Geçiş tamamlandı
            if (this.transitionElapsed >= this.transitionDuration) {
                this._completeTransition();
            }
        }
        
        // Aktif sahneyi güncelle
        if (this.activeScene) {
            this.activeScene.update(deltaTime);
        }
    }
    
    /**
     * Geçişi tamamlar
     */
    _completeTransition() {
        // Geçiş durumunu sıfırla
        this.transitioning = false;
        this.transitionElapsed = 0;
        
        // Aktif sahneyi değiştir
        this._activateScene(this.nextScene);
        
        // Geçişi temizle
        this.currentScene = null;
        this.nextScene = null;
        
        // Geçiş tamamlanma olayını çağır
        if (this.onTransitionComplete) {
            this.onTransitionComplete(this.activeScene);
        }
    }
    
    /**
     * Sahneyi render eder
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        // Geçiş yapılıyorsa, her iki sahneyi de render et
        if (this.transitioning) {
            const progress = this.transitionElapsed / this.transitionDuration;
            
            // Geçiş tipine göre render
            if (this.transitionType === 'fade') {
                // Mevcut sahne solarak kaybolur, yeni sahne belirir
                renderer.context.globalAlpha = 1 - progress;
                if (this.currentScene) this.currentScene.render(renderer);
                
                renderer.context.globalAlpha = progress;
                if (this.nextScene) this.nextScene.render(renderer);
                
                renderer.context.globalAlpha = 1;
            } else if (this.transitionType === 'slide') {
                // Sahneler yana doğru kayar
                const width = renderer.canvas.width;
                
                renderer.context.save();
                renderer.context.translate(-width * progress, 0);
                if (this.currentScene) this.currentScene.render(renderer);
                renderer.context.restore();
                
                renderer.context.save();
                renderer.context.translate(width * (1 - progress), 0);
                if (this.nextScene) this.nextScene.render(renderer);
                renderer.context.restore();
            } else if (this.transitionType === 'zoom') {
                // Mevcut sahne büyüyerek kaybolur, yeni sahne belirir
                const scale = 1 + progress;
                
                renderer.context.save();
                renderer.context.globalAlpha = 1 - progress;
                renderer.context.translate(renderer.canvas.width / 2, renderer.canvas.height / 2);
                renderer.context.scale(scale, scale);
                renderer.context.translate(-renderer.canvas.width / 2, -renderer.canvas.height / 2);
                if (this.currentScene) this.currentScene.render(renderer);
                renderer.context.restore();
                
                renderer.context.globalAlpha = progress;
                if (this.nextScene) this.nextScene.render(renderer);
                
                renderer.context.globalAlpha = 1;
            }
        } else {
            // Normal render
            if (this.activeScene) {
                this.activeScene.render(renderer);
            }
        }
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!SceneManager.instance) {
            new SceneManager();
        }
        return SceneManager.instance;
    }
}

// Singleton instance
SceneManager.instance = null;