/**
 * Rigidbody.js - Fizik bileşeni
 * Nesnelerin fiziksel özelliklerini yönetir
 */
class Rigidbody extends Component {
    constructor(params = {}) {
        super();
        
        // Fiziksel özellikler
        this.mass = params.mass || 1.0;
        this.drag = params.drag || 0.1;
        this.bounciness = params.bounciness || 0.3;
        this.useGravity = params.useGravity !== undefined ? params.useGravity : true;
        this.isKinematic = params.isKinematic || false;
        this.maxSpeed = params.maxSpeed || 0; // 0 = sınırsız
        
        // Hareket vektörleri
        this.velocity = { x: 0, y: 0 };
        this.force = { x: 0, y: 0 };
    }
    
    /**
     * Bileşen başlatıldığında
     */
    start() {
        // Fizik sistemine kaydet
        const physics = Physics.getInstance();
        physics.addRigidbody(this);
    }
    
    /**
     * Bileşen yok edildiğinde
     */
    onDestroy() {
        // Fizik sisteminden kaldır
        const physics = Physics.getInstance();
        physics.removeRigidbody(this);
    }
    
    /**
     * Kuvvet uygular (tek kare)
     * @param {Number} x - X ekseni kuvveti
     * @param {Number} y - Y ekseni kuvveti
     */
    addForce(x, y) {
        if (this.isKinematic) return;
        
        this.velocity.x += x / this.mass;
        this.velocity.y += y / this.mass;
    }
    
    /**
     * Sürekli kuvvet uygular
     * @param {Number} x - X ekseni kuvveti
     * @param {Number} y - Y ekseni kuvveti
     */
    addContinuousForce(x, y) {
        if (this.isKinematic) return;
        
        this.force.x += x;
        this.force.y += y;
    }
    
    /**
     * Belirli bir hıza ayarlar
     * @param {Number} x - X ekseni hızı
     * @param {Number} y - Y ekseni hızı
     */
    setVelocity(x, y) {
        if (this.isKinematic) return;
        
        this.velocity.x = x;
        this.velocity.y = y;
    }
    
    /**
     * Her karede güncellenir
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        if (this.isKinematic) return;
        
        // Sürekli kuvvetleri uygula
        this.velocity.x += (this.force.x / this.mass) * deltaTime;
        this.velocity.y += (this.force.y / this.mass) * deltaTime;
    }
}