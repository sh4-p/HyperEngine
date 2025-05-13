/**
 * Scene.js - Sahne sınıfı
 * Oyun sahnelerini temsil eder
 */
class Scene {
    constructor(name = "Scene") {
        this.name = name;
        this.active = false;
        this.loaded = false;
        
        // Game object koleksiyonu
        this.gameObjects = [];
        this.gameObjectsById = {};
        this.gameObjectsByTag = {};
        
        // UI Manager
        this.ui = new UIManager(this);
    }
    
    /**
     * Sahne yüklendiğinde çağrılır
     */
    load() {
        // Alt sınıflarda override edilebilir
        this.loaded = true;
    }
    
    /**
     * Sahne etkinleştirildiğinde çağrılır
     */
    start() {
        // Alt sınıflarda override edilebilir
        this.active = true;
    }
    
    /**
     * Sahne devre dışı bırakıldığında çağrılır
     */
    stop() {
        // Alt sınıflarda override edilebilir
        this.active = false;
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        if (!this.active) return;
        
        // Tüm game object'leri güncelle
        for (const gameObject of this.gameObjects) {
            if (gameObject.active) {
                gameObject.update(deltaTime);
            }
        }
        
        // UI'ı güncelle
        this.ui.update(deltaTime);
    }
    
    /**
     * Render işlemi sırasında çağrılır
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        if (!this.active) return;
        
        // UI'ı render et
        this.ui.render(renderer);
    }
    
    /**
     * Game object ekler
     * @param {GameObject} gameObject - Eklenecek game object
     * @return {GameObject} Eklenen game object
     */
    addGameObject(gameObject) {
        if (!(gameObject instanceof GameObject)) {
            console.error("Eklenecek nesne bir GameObject olmalı");
            return null;
        }
        
        this.gameObjects.push(gameObject);
        this.gameObjectsById[gameObject.id] = gameObject;
        
        // Tag'e göre kaydet
        if (gameObject.tag) {
            if (!this.gameObjectsByTag[gameObject.tag]) {
                this.gameObjectsByTag[gameObject.tag] = [];
            }
            this.gameObjectsByTag[gameObject.tag].push(gameObject);
        }
        
        // Sahneyi game object'e bildir
        gameObject.setScene(this);
        
        return gameObject;
    }
    
    /**
     * Game object kaldırır
     * @param {GameObject} gameObject - Kaldırılacak game object
     */
    removeGameObject(gameObject) {
        const index = this.gameObjects.indexOf(gameObject);
        
        if (index !== -1) {
            // Diziden kaldır
            this.gameObjects.splice(index, 1);
            
            // ID'ye göre diziden kaldır
            delete this.gameObjectsById[gameObject.id];
            
            // Tag'e göre diziden kaldır
            if (gameObject.tag && this.gameObjectsByTag[gameObject.tag]) {
                const tagIndex = this.gameObjectsByTag[gameObject.tag].indexOf(gameObject);
                
                if (tagIndex !== -1) {
                    this.gameObjectsByTag[gameObject.tag].splice(tagIndex, 1);
                }
            }
            
            // Sahne referansını kaldır
            gameObject.setScene(null);
        }
    }
    
    /**
     * ID'ye göre game object bulur
     * @param {String} id - Game object ID'si
     * @return {GameObject} Bulunan game object veya null
     */
    findGameObjectById(id) {
        return this.gameObjectsById[id] || null;
    }
    
    /**
     * Tag'e göre game object'leri bulur
     * @param {String} tag - Game object tag'i
     * @return {Array} Game object dizisi
     */
    findGameObjectsByTag(tag) {
        return this.gameObjectsByTag[tag] || [];
    }
    
    /**
     * Tüm game object'leri kaldırır
     */
    clearGameObjects() {
        // Tüm game object'lerin sahne referansını kaldır
        for (const gameObject of this.gameObjects) {
            gameObject.setScene(null);
        }
        
        // Koleksiyonları temizle
        this.gameObjects = [];
        this.gameObjectsById = {};
        this.gameObjectsByTag = {};
    }
}