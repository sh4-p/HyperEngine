/**
 * Component.js - Temel bileşen sınıfı
 * Tüm bileşenler için temel sınıf
 */
class Component {
    constructor() {
        this.active = true;
        this.gameObject = null;
        this.transform = null;
        this.scene = null;
        this.enabled = true;
    }
    
    /**
     * Bileşen ilk eklendiğinde bir kere çağrılır
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
     * Fizik güncellemesi öncesinde çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    fixedUpdate(deltaTime) {
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
     * Bileşen yok edildiğinde çağrılır
     */
    onDestroy() {
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
     * Çarpışma devam ederken çağrılır
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
     * Tetikleyici çarpışma başladığında çağrılır
     * @param {Collider} other - Çarpışan diğer collider
     */
    onTriggerEnter(other) {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Tetikleyici çarpışma devam ederken çağrılır
     * @param {Collider} other - Çarpışan diğer collider
     */
    onTriggerStay(other) {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Tetikleyici çarpışma bittiğinde çağrılır
     * @param {Collider} other - Çarpışan diğer collider
     */
    onTriggerExit(other) {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Aktiflik durumunu değiştirir
     * @param {Boolean} active - Aktif mi
     */
    setActive(active) {
        this.active = active;
    }
    
    /**
     * Etkinlik durumunu değiştirir
     * @param {Boolean} enabled - Etkin mi
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Transform referansını günceller
     */
    updateTransform() {
        if (this.gameObject) {
            this.transform = this.gameObject.transform;
        }
    }
    
    /**
     * Bileşeni klonlar
     * @return {Component} Klonlanan bileşen
     */
    clone() {
        // Varsayılan olarak aynı tipte yeni bir bileşen döndür
        const clone = new this.constructor();
        clone.active = this.active;
        clone.enabled = this.enabled;
        
        // Alt sınıflarda daha fazla özellik kopyalanmalıdır
        
        return clone;
    }
}