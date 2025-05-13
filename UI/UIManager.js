/**
 * UIManager.js - Kullanıcı arayüzü yönetimi
 * UI bileşenlerini yönetir
 */
class UIManager {
    constructor(scene) {
        this.scene = scene;
        
        // UI bileşenleri
        this.components = [];
        this.componentsById = {};
        
        // UI katmanları
        this.layers = {};
        this.layerOrder = [];
        
        // Varsayılan katmanı oluştur
        this.getLayer(0, "default");
        
        // Dokunma işleyicisi
        this.touchTarget = null;
    }
    
    /**
     * UI katmanı oluşturur veya alır
     * @param {Number} zIndex - Katman z-index değeri
     * @param {String} name - Katman adı
     * @return {Object} Katman nesnesi
     */
    getLayer(zIndex, name = `layer_${zIndex}`) {
        if (!this.layers[name]) {
            this.layers[name] = {
                name: name,
                zIndex: zIndex,
                components: []
            };
            
            // Katmanları zIndex'e göre sırala
            this.layerOrder = Object.values(this.layers).sort((a, b) => a.zIndex - b.zIndex);
        }
        
        return this.layers[name];
    }
    
    /**
     * UI bileşeni ekler
     * @param {UIComponent} component - Eklenecek UI bileşeni
     * @param {String} layerName - Katman adı (varsayılan: "default")
     * @return {UIComponent} Eklenen bileşen
     */
    addComponent(component, layerName = "default") {
        if (!component) return null;
        
        // Eğer katman yoksa, varsayılan katmanı kullan
        const layer = this.layers[layerName] || this.getLayer(0, "default");
        
        // Bileşeni diziye ekle
        this.components.push(component);
        this.componentsById[component.id] = component;
        layer.components.push(component);
        
        // Bileşene sahneyi ve UI Manager'ı bildir
        component.ui = this;
        component.scene = this.scene;
        
        // Bileşeni başlat
        if (component.onAdd) {
            component.onAdd();
        }
        
        return component;
    }
    
    /**
     * UI bileşeni kaldırır
     * @param {UIComponent} component - Kaldırılacak UI bileşeni
     */
    removeComponent(component) {
        if (!component) return;
        
        // Bileşeni diziden kaldır
        const index = this.components.indexOf(component);
        if (index !== -1) {
            this.components.splice(index, 1);
        }
        
        // ID'ye göre kaldır
        if (this.componentsById[component.id]) {
            delete this.componentsById[component.id];
        }
        
        // Katmandan kaldır
        for (const layer of this.layerOrder) {
            const layerIndex = layer.components.indexOf(component);
            if (layerIndex !== -1) {
                layer.components.splice(layerIndex, 1);
                break;
            }
        }
        
        // Bileşeni kaldır
        if (component.onRemove) {
            component.onRemove();
        }
    }
    
    /**
     * ID'ye göre UI bileşeni bulur
     * @param {String} id - Bileşen ID'si
     * @return {UIComponent} Bulunan bileşen veya null
     */
    getComponentById(id) {
        return this.componentsById[id] || null;
    }
    
    /**
     * Tüm bileşenleri kaldırır
     */
    clearComponents() {
        // Tüm bileşenleri kaldır
        for (const component of this.components) {
            if (component.onRemove) {
                component.onRemove();
            }
        }
        
        // Koleksiyonları temizle
        this.components = [];
        this.componentsById = {};
        
        for (const layer of this.layerOrder) {
            layer.components = [];
        }
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        // UI bileşenlerini güncelle
        for (const component of this.components) {
            if (component.active && component.update) {
                component.update(deltaTime);
            }
        }
        
        // Dokunma olaylarını işle
        this._handleTouchEvents();
    }
    
    /**
     * Dokunma olaylarını işler
     */
    _handleTouchEvents() {
        const input = Input.getInstance();
        
        // Dokunma başlangıcı
        if (input.isTouchStarted()) {
            const pos = input.getTouchPosition();
            this.touchTarget = this._hitTest(pos.x, pos.y);
            
            if (this.touchTarget && this.touchTarget.onTouchStart) {
                this.touchTarget.onTouchStart(pos.x, pos.y);
            }
        }
        
        // Dokunma hareketi
        if (input.isTouchMoving() && this.touchTarget) {
            const pos = input.getTouchPosition();
            
            if (this.touchTarget.onTouchMove) {
                this.touchTarget.onTouchMove(pos.x, pos.y);
            }
        }
        
        // Dokunma bitişi
        if (input.isTouchEnded() && this.touchTarget) {
            const pos = input.getTouchPosition();
            
            if (this.touchTarget.onTouchEnd) {
                this.touchTarget.onTouchEnd(pos.x, pos.y);
            }
            
            this.touchTarget = null;
        }
    }
    
    /**
     * UI bileşenlerini render eder
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        // Katmanları z-index sırasına göre render et
        for (const layer of this.layerOrder) {
            for (const component of layer.components) {
                if (component.active && component.render) {
                    component.render(renderer);
                }
            }
        }
    }
    
    /**
     * Verilen konumdaki UI bileşenini bulur
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @return {UIComponent} Bulunan bileşen veya null
     */
    _hitTest(x, y) {
        // Katmanları ters sırada kontrol et (üstteki katmanlar önce)
        for (let i = this.layerOrder.length - 1; i >= 0; i--) {
            const layer = this.layerOrder[i];
            
            // Katmandaki bileşenleri ters sırada kontrol et
            for (let j = layer.components.length - 1; j >= 0; j--) {
                const component = layer.components[j];
                
                // Bileşen aktif ve etkileşimli mi
                if (component.active && component.interactive && component.hitTest) {
                    if (component.hitTest(x, y)) {
                        return component;
                    }
                }
            }
        }
        
        return null;
    }
}