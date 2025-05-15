/**
 * Transform.js - Dönüşüm bileşeni
 * Oyun nesnesinin pozisyon, rotasyon ve ölçek bilgilerini yönetir
 */
class Transform extends Component {
    constructor() {
        super();
        
        // Yerel dönüşüm özellikleri
        this.position = { x: 0, y: 0 };
        this.rotation = 0; // Radyan cinsinden
        this.scale = { x: 1, y: 1 };
        
        // Üst Transform referansı
        this.parent = null;
        
        // Alt Transform'lar
        this.children = [];
    }
    
    /**
     * Üst transform ayarlar
     * @param {Transform} parent - Üst transform
     */
    setParent(parent) {
        // Mevcut üst transform'dan kaldır
        if (this.parent) {
            const index = this.parent.children.indexOf(this);
            if (index !== -1) {
                this.parent.children.splice(index, 1);
            }
        }
        
        // Yeni üst transform'a ekle
        this.parent = parent;
        
        if (parent) {
            parent.children.push(this);
            
            // Dünya koordinatlarını koru (üst değiştiğinde yerel koordinatları ayarla)
            this._updateLocalFromWorld();
        }
    }
    
    /**
     * Yerel pozisyonu ayarlar
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     */
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
    }
    
    /**
     * Yerel rotasyonu ayarlar
     * @param {Number} rotation - Rotasyon (radyan)
     */
    setRotation(rotation) {
        this.rotation = rotation;
    }
    
    /**
     * Yerel ölçeği ayarlar
     * @param {Number} x - X ölçeği
     * @param {Number} y - Y ölçeği
     */
    setScale(x, y) {
        this.scale.x = x;
        this.scale.y = y || x; // Tek parametre verilirse kare ölçek
    }
    
    /**
     * Dünya pozisyonunu ayarlar
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     */
    setWorldPosition(x, y) {
        if (!this.parent) {
            // Üst yoksa dünya pozisyonu yerel pozisyona eşittir
            this.position.x = x;
            this.position.y = y;
        } else {
            // Dünya koordinatlarını yerel koordinatlara çevir
            const worldPos = { x, y };
            const parentWorldPos = this.parent.getWorldPosition();
            const parentWorldRot = this.parent.getWorldRotation();
            const parentWorldScale = this.parent.getWorldScale();
            
            // Üst transformu tersine çevir
            
            // Üst pozisyonu çıkar
            const relX = worldPos.x - parentWorldPos.x;
            const relY = worldPos.y - parentWorldPos.y;
            
            // Üst rotasyonu tersine çevir
            const cosRot = Math.cos(-parentWorldRot);
            const sinRot = Math.sin(-parentWorldRot);
            
            const rotatedX = relX * cosRot - relY * sinRot;
            const rotatedY = relX * sinRot + relY * cosRot;
            
            // Üst ölçeği tersine çevir
            this.position.x = rotatedX / parentWorldScale.x;
            this.position.y = rotatedY / parentWorldScale.y;
        }
    }
    
    /**
     * Dünya rotasyonunu ayarlar
     * @param {Number} rotation - Rotasyon (radyan)
     */
    setWorldRotation(rotation) {
        if (!this.parent) {
            // Üst yoksa dünya rotasyonu yerel rotasyona eşittir
            this.rotation = rotation;
        } else {
            // Dünya rotasyonunu yerel rotasyona çevir
            const parentWorldRot = this.parent.getWorldRotation();
            this.rotation = rotation - parentWorldRot;
        }
    }
    
    /**
     * Dünya ölçeğini ayarlar
     * @param {Number} x - X ölçeği
     * @param {Number} y - Y ölçeği
     */
    setWorldScale(x, y) {
        if (!this.parent) {
            // Üst yoksa dünya ölçeği yerel ölçeğe eşittir
            this.scale.x = x;
            this.scale.y = y || x;
        } else {
            // Dünya ölçeğini yerel ölçeğe çevir
            const parentWorldScale = this.parent.getWorldScale();
            this.scale.x = x / parentWorldScale.x;
            this.scale.y = (y || x) / parentWorldScale.y;
        }
    }
    
    /**
     * Dünya pozisyonunu hesaplar
     * @return {Object} Dünya pozisyonu {x, y}
     */
    getWorldPosition() {
        if (!this.parent) {
            // Üst yoksa dünya pozisyonu yerel pozisyona eşittir
            return { x: this.position.x, y: this.position.y };
        }
        
        // Üst transform'un dünya pozisyonu, rotasyonu ve ölçeği
        const parentPos = this.parent.getWorldPosition();
        const parentRot = this.parent.getWorldRotation();
        const parentScale = this.parent.getWorldScale();
        
        // Yerel koordinatları
        const localX = this.position.x;
        const localY = this.position.y;
        
        // Ölçekle
        const scaledX = localX * parentScale.x;
        const scaledY = localY * parentScale.y;
        
        // Döndür
        const cosRot = Math.cos(parentRot);
        const sinRot = Math.sin(parentRot);
        
        const rotatedX = scaledX * cosRot - scaledY * sinRot;
        const rotatedY = scaledX * sinRot + scaledY * cosRot;
        
        // Üst pozisyonu ekle
        return {
            x: parentPos.x + rotatedX,
            y: parentPos.y + rotatedY
        };
    }
    
    /**
     * Dünya rotasyonunu hesaplar
     * @return {Number} Dünya rotasyonu (radyan)
     */
    getWorldRotation() {
        if (!this.parent) {
            // Üst yoksa dünya rotasyonu yerel rotasyona eşittir
            return this.rotation;
        }
        
        // Üst transform'un dünya rotasyonu
        const parentRot = this.parent.getWorldRotation();
        
        // Rotasyonları topla
        return this.rotation + parentRot;
    }
    
    /**
     * Dünya ölçeğini hesaplar
     * @return {Object} Dünya ölçeği {x, y}
     */
    getWorldScale() {
        if (!this.parent) {
            // Üst yoksa dünya ölçeği yerel ölçeğe eşittir
            return { x: this.scale.x, y: this.scale.y };
        }
        
        // Üst transform'un dünya ölçeği
        const parentScale = this.parent.getWorldScale();
        
        // Ölçekleri çarp
        return {
            x: this.scale.x * parentScale.x,
            y: this.scale.y * parentScale.y
        };
    }
    
    /**
     * Sağa doğru birim vektörü hesaplar
     * @return {Object} Sağ vektör {x, y}
     */
    right() {
        const worldRot = this.getWorldRotation();
        return {
            x: Math.cos(worldRot),
            y: Math.sin(worldRot)
        };
    }
    
    /**
     * Yukarıya doğru birim vektörü hesaplar
     * @return {Object} Yukarı vektör {x, y}
     */
    up() {
        const worldRot = this.getWorldRotation();
        return {
            x: -Math.sin(worldRot),
            y: Math.cos(worldRot)
        };
    }
    
    /**
     * Yerel koordinatları dünya koordinatlarına dönüştürür
     * @param {Number} x - Yerel X koordinatı
     * @param {Number} y - Yerel Y koordinatı
     * @return {Object} Dünya koordinatları {x, y}
     */
    localToWorld(x, y) {
        // Transform özellikleri
        const position = this.getWorldPosition();
        const rotation = this.getWorldRotation();
        const scale = this.getWorldScale();
        
        // Ölçekle
        const scaledX = x * scale.x;
        const scaledY = y * scale.y;
        
        // Döndür
        const cosRot = Math.cos(rotation);
        const sinRot = Math.sin(rotation);
        
        const rotatedX = scaledX * cosRot - scaledY * sinRot;
        const rotatedY = scaledX * sinRot + scaledY * cosRot;
        
        // Pozisyonu ekle
        return {
            x: position.x + rotatedX,
            y: position.y + rotatedY
        };
    }
    
    /**
     * Dünya koordinatlarını yerel koordinatlara dönüştürür
     * @param {Number} x - Dünya X koordinatı
     * @param {Number} y - Dünya Y koordinatı
     * @return {Object} Yerel koordinatlar {x, y}
     */
    worldToLocal(x, y) {
        // Transform özellikleri
        const position = this.getWorldPosition();
        const rotation = this.getWorldRotation();
        const scale = this.getWorldScale();
        
        // Pozisyonu çıkar
        const translatedX = x - position.x;
        const translatedY = y - position.y;
        
        // Döndürmeyi tersine çevir
        const cosRot = Math.cos(-rotation);
        const sinRot = Math.sin(-rotation);
        
        const unrotatedX = translatedX * cosRot - translatedY * sinRot;
        const unrotatedY = translatedX * sinRot + translatedY * cosRot;
        
        // Ölçeği tersine çevir
        return {
            x: unrotatedX / scale.x,
            y: unrotatedY / scale.y
        };
    }
    
    /**
     * Belirtilen yöne doğru hareket eder
     * @param {Number} x - X yönü
     * @param {Number} y - Y yönü
     * @param {Number} distance - Mesafe
     */
    translate(x, y, distance = 1) {
        const normalized = this._normalize(x, y);
        this.position.x += normalized.x * distance;
        this.position.y += normalized.y * distance;
    }
    
    /**
     * İleri yönde hareket eder
     * @param {Number} distance - Mesafe
     */
    moveForward(distance) {
        const up = this.up();
        this.translate(up.x, up.y, distance);
    }
    
    /**
     * Sağa doğru hareket eder
     * @param {Number} distance - Mesafe
     */
    moveRight(distance) {
        const right = this.right();
        this.translate(right.x, right.y, distance);
    }
    
    /**
     * Rotasyonu belirtilen açı kadar değiştirir
     * @param {Number} angle - Açı (radyan)
     */
    rotate(angle) {
        this.rotation += angle;
    }
    
    /**
     * Hedefe doğru döner
     * @param {Number} x - Hedef X koordinatı
     * @param {Number} y - Hedef Y koordinatı
     * @param {Boolean} worldSpace - Dünya koordinatları mı
     */
    lookAt(x, y, worldSpace = true) {
        let targetX, targetY;
        
        if (worldSpace) {
            // Dünya koordinatlarına bakış
            const worldPos = this.getWorldPosition();
            targetX = x - worldPos.x;
            targetY = y - worldPos.y;
            
            // Yeni rotasyonu hesapla
            const angle = Math.atan2(targetY, targetX);
            
            // Dünya rotasyonunu ayarla
            this.setWorldRotation(angle);
        } else {
            // Yerel koordinatlarına bakış
            targetX = x - this.position.x;
            targetY = y - this.position.y;
            
            // Yeni rotasyonu hesapla
            const angle = Math.atan2(targetY, targetX);
            
            // Yerel rotasyonu ayarla
            this.rotation = angle;
        }
    }
    
    /**
     * İki nokta arasındaki mesafeyi hesaplar
     * @param {Transform} other - Diğer transform
     * @param {Boolean} worldSpace - Dünya koordinatları mı
     * @return {Number} Mesafe
     */
    distance(other, worldSpace = true) {
        if (worldSpace) {
            const posA = this.getWorldPosition();
            const posB = other.getWorldPosition();
            
            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            
            return Math.sqrt(dx * dx + dy * dy);
        } else {
            const dx = other.position.x - this.position.x;
            const dy = other.position.y - this.position.y;
            
            return Math.sqrt(dx * dx + dy * dy);
        }
    }
    
    /**
     * Dünya koordinatlarına göre yerel koordinatları günceller
     * @private
     */
    _updateLocalFromWorld() {
        if (!this.parent) return;
        
        // Dünya koordinatlarını hesapla
        const worldPos = this.getWorldPosition();
        const worldRot = this.getWorldRotation();
        const worldScale = this.getWorldScale();
        
        // Yeni dünya koordinatlarını ayarla (yerel koordinatlar otomatik hesaplanacak)
        this.setWorldPosition(worldPos.x, worldPos.y);
        this.setWorldRotation(worldRot);
        this.setWorldScale(worldScale.x, worldScale.y);
    }
    
    /**
     * Vektörü normalleştirir
     * @param {Number} x - X bileşeni
     * @param {Number} y - Y bileşeni
     * @return {Object} Normalleştirilmiş vektör {x, y}
     * @private
     */
    _normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        
        if (length === 0) {
            return { x: 0, y: 0 };
        }
        
        return {
            x: x / length,
            y: y / length
        };
    }
    
    /**
     * Bileşeni klonlar
     * @return {Transform} Klonlanan transform
     */
    clone() {
        const clone = new Transform();
        clone.position.x = this.position.x;
        clone.position.y = this.position.y;
        clone.rotation = this.rotation;
        clone.scale.x = this.scale.x;
        clone.scale.y = this.scale.y;
        
        return clone;
    }
}