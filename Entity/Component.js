/**
 * Component.js - Temel bileşen sınıfı
 * Oyun nesnelerine işlevsellik eklemek için
 */
class Component {
    constructor() {
        this.id = Component._generateId();
        this.active = true;
        this.gameObject = null; // Bağlı olduğu game object
    }
    
    /**
     * Bileşen oluşturulduğunda çağrılır
     */
    start() {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Her karede render işleminden sonra çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    lateUpdate(deltaTime) {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Render işlemi sırasında çağrılır
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Çarpışma başladığında çağrılır
     * @param {Collider} other - Çarpışan diğer collider
     */
    onCollisionEnter(other) {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Çarpışma devam ettiğinde çağrılır
     * @param {Collider} other - Çarpışan diğer collider
     */
    onCollisionStay(other) {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Çarpışma bittiğinde çağrılır
     * @param {Collider} other - Çarpışan diğer collider
     */
    onCollisionExit(other) {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Bileşen etkinleştirildiğinde çağrılır
     */
    onEnable() {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Bileşen devre dışı bırakıldığında çağrılır
     */
    onDisable() {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Bileşen yok edildiğinde çağrılır
     */
    onDestroy() {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Bileşeni etkinleştirir/devre dışı bırakır
     * @param {Boolean} value - Etkin olup olmadığı
     */
    setActive(value) {
        if (this.active !== value) {
            this.active = value;
            
            if (this.active) {
                this.onEnable();
            } else {
                this.onDisable();
            }
        }
    }
    
    /**
     * Dönüşüm bileşenine kolay erişim
     */
    get transform() {
        return this.gameObject ? this.gameObject.transform : null;
    }
    
    /**
     * Benzersiz ID üretir
     * @return {String} Benzersiz ID
     */
    static _generateId() {
        return 'comp_' + Math.random().toString(36).substr(2, 9);
    }
}