/**
 * Rigidbody.js - Fizik ile etkileşimli bileşen
 * Fizik motorunda hareket ve kuvvetler için kullanılır
 */
class Rigidbody extends Component {
    constructor() {
        super();
        
        // Fizik özellikleri
        this.velocity = { x: 0, y: 0 };
        this.angularVelocity = 0;
        this.mass = 1;
        this.drag = 0.1;
        this.angularDrag = 0.05;
        this.useGravity = true;
        this.isKinematic = false;
        this.freezeRotation = false;
        this.fixedRotation = false;
        this.maxSpeed = 0; // 0 = sınırsız
        this.bounciness = 0.3; // Sekmek için (0-1)
        
        // İç değişkenler
        this.forces = { x: 0, y: 0 };
        this.torque = 0;
    }
    
    /**
     * Bileşen ilk eklendiğinde bir kere çağrılır
     */
    start() {
        // Physics sistemine kaydol
        const physics = Physics.getInstance();
        physics.addRigidbody(this);
    }
    
    /**
     * Bileşen yok edildiğinde çağrılır
     */
    onDestroy() {
        // Physics sisteminden kaldır
        const physics = Physics.getInstance();
        physics.removeRigidbody(this);
    }
    
    /**
     * Kuvvet uygular
     * @param {Number} x - X yönündeki kuvvet
     * @param {Number} y - Y yönündeki kuvvet
     * @param {Boolean} impulse - Anlık kuvvet mi (true) yoksa sürekli kuvvet mi (false)
     */
    addForce(x, y, impulse = false) {
        // Nesne kinematik ise kuvvet uygulanmaz
        if (this.isKinematic) return;
        
        if (impulse) {
            // Anlık kuvvet (impuls) - Hıza doğrudan eklenir
            this.velocity.x += x / this.mass;
            this.velocity.y += y / this.mass;
        } else {
            // Sürekli kuvvet - Kuvvet birikimine eklenir
            this.forces.x += x;
            this.forces.y += y;
        }
    }
    
    /**
     * Belirli bir yöne kuvvet uygular
     * @param {Number} direction - Yön açısı (radyan)
     * @param {Number} force - Kuvvet miktarı
     * @param {Boolean} impulse - Anlık kuvvet mi (true) yoksa sürekli kuvvet mi (false)
     */
    addForceInDirection(direction, force, impulse = false) {
        const x = Math.cos(direction) * force;
        const y = Math.sin(direction) * force;
        this.addForce(x, y, impulse);
    }
    
    /**
     * Merkeze doğru kuvvet uygular
     * @param {Number} x - Merkez X koordinatı
     * @param {Number} y - Merkez Y koordinatı
     * @param {Number} force - Kuvvet miktarı
     */
    addForceTowards(x, y, force) {
        const position = this.transform.getWorldPosition();
        
        // Yönü hesapla
        const dx = x - position.x;
        const dy = y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            this.addForce(dirX * force, dirY * force);
        }
    }
    
    /**
     * Merkezden uzağa kuvvet uygular
     * @param {Number} x - Merkez X koordinatı
     * @param {Number} y - Merkez Y koordinatı
     * @param {Number} force - Kuvvet miktarı
     */
    addForceAway(x, y, force) {
        this.addForceTowards(x, y, -force);
    }
    
    /**
     * Tork uygular (rotasyon kuvveti)
     * @param {Number} torque - Tork miktarı
     * @param {Boolean} impulse - Anlık tork mu (true) yoksa sürekli tork mu (false)
     */
    addTorque(torque, impulse = false) {
        // Nesne kinematik ise veya rotasyon dondurulmuşsa tork uygulanmaz
        if (this.isKinematic || this.freezeRotation || this.fixedRotation) return;
        
        if (impulse) {
            // Anlık tork - Açısal hıza doğrudan eklenir
            this.angularVelocity += torque / this.mass;
        } else {
            // Sürekli tork - Tork birikimine eklenir
            this.torque += torque;
        }
    }
    
    /**
     * Hızı ayarlar
     * @param {Number} x - X hızı
     * @param {Number} y - Y hızı
     */
    setVelocity(x, y) {
        this.velocity.x = x;
        this.velocity.y = y;
    }
    
    /**
     * Açısal hızı ayarlar
     * @param {Number} angularVelocity - Açısal hız
     */
    setAngularVelocity(angularVelocity) {
        if (this.freezeRotation || this.fixedRotation) return;
        this.angularVelocity = angularVelocity;
    }
    
    /**
     * Fizik güncellemesi öncesinde çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    fixedUpdate(deltaTime) {
        // Kinematik nesneler kullanıcı tarafından kontrol edilir
        if (this.isKinematic) return;
        
        // Kuvvetleri uygula
        this.velocity.x += (this.forces.x / this.mass) * deltaTime;
        this.velocity.y += (this.forces.y / this.mass) * deltaTime;
        
        // Tork uygula
        if (!this.freezeRotation && !this.fixedRotation) {
            this.angularVelocity += (this.torque / this.mass) * deltaTime;
        }
        
        // Sürüklenme (drag) uygula
        this.velocity.x *= (1 - this.drag * deltaTime);
        this.velocity.y *= (1 - this.drag * deltaTime);
        this.angularVelocity *= (1 - this.angularDrag * deltaTime);
        
        // Hız sınırlaması
        if (this.maxSpeed > 0) {
            const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            
            if (speed > this.maxSpeed) {
                const ratio = this.maxSpeed / speed;
                this.velocity.x *= ratio;
                this.velocity.y *= ratio;
            }
        }
        
        // Kuvvetleri sıfırla (her karede yeniden hesaplanır)
        this.forces.x = 0;
        this.forces.y = 0;
        this.torque = 0;
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        // Kinematik nesneler kullanıcı tarafından kontrol edilir
        if (this.isKinematic) return;
        
        // Pozisyonu güncelle
        this.transform.position.x += this.velocity.x * deltaTime;
        this.transform.position.y += this.velocity.y * deltaTime;
        
        // Rotasyonu güncelle
        if (!this.freezeRotation && !this.fixedRotation) {
            this.transform.rotation += this.angularVelocity * deltaTime;
        }
    }
    
    /**
     * Hızı sıfırlar
     */
    resetVelocity() {
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.angularVelocity = 0;
    }
    
    /**
     * Bileşeni klonlar
     * @return {Rigidbody} Klonlanan rigidbody
     */
    clone() {
        const clone = new Rigidbody();
        clone.mass = this.mass;
        clone.drag = this.drag;
        clone.angularDrag = this.angularDrag;
        clone.useGravity = this.useGravity;
        clone.isKinematic = this.isKinematic;
        clone.freezeRotation = this.freezeRotation;
        clone.fixedRotation = this.fixedRotation;
        clone.maxSpeed = this.maxSpeed;
        clone.bounciness = this.bounciness;
        
        return clone;
    }
}