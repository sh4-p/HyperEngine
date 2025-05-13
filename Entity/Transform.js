/**
 * Transform.js - Dönüşüm bileşeni
 * Konum, döndürme ve ölçek bilgilerini yönetir
 */
class Transform extends Component {
    constructor() {
        super();
        
        // Yerel dönüşüm değerleri (parent'a göre)
        this.position = { x: 0, y: 0 };
        this.rotation = 0;  // Radyan cinsinden
        this.scale = { x: 1, y: 1 };
        
        // Dünya koordinatlarındaki değerler (önbellek)
        this._worldPosition = { x: 0, y: 0 };
        this._worldRotation = 0;
        this._worldScale = { x: 1, y: 1 };
        
        // Değişiklik bayrağı
        this._dirty = true;
    }
    
    /**
     * Dünya konumunu hesaplar
     * @return {Object} Dünya konumu {x, y}
     */
    getWorldPosition() {
        this._updateWorldTransform();
        return { ...this._worldPosition };
    }
    
    /**
     * Dünya döndürmesini hesaplar
     * @return {Number} Dünya döndürmesi (radyan)
     */
    getWorldRotation() {
        this._updateWorldTransform();
        return this._worldRotation;
    }
    
    /**
     * Dünya ölçeğini hesaplar
     * @return {Object} Dünya ölçeği {x, y}
     */
    getWorldScale() {
        this._updateWorldTransform();
        return { ...this._worldScale };
    }
    
    /**
     * Dünya dönüşüm değerlerini günceller
     */
    _updateWorldTransform() {
        if (!this._dirty && this.gameObject && !this.gameObject.parent) {
            return; // Değişiklik yoksa ve parent yoksa güncelleme yapma
        }
        
        this._dirty = false;
        
        if (!this.gameObject || !this.gameObject.parent) {
            // Parent yoksa, yerel değerler dünya değerleridir
            this._worldPosition = { ...this.position };
            this._worldRotation = this.rotation;
            this._worldScale = { ...this.scale };
            return;
        }
        
        // Parent'ın dönüşüm bileşenini al
        const parentTransform = this.gameObject.parent.transform;
        
        // Parent'ın dünya değerlerini al
        const parentWorldPosition = parentTransform.getWorldPosition();
        const parentWorldRotation = parentTransform.getWorldRotation();
        const parentWorldScale = parentTransform.getWorldScale();
        
        // Dünya rotasyonunu hesapla
        this._worldRotation = parentWorldRotation + this.rotation;
        
        // Dünya ölçeğini hesapla
        this._worldScale.x = parentWorldScale.x * this.scale.x;
        this._worldScale.y = parentWorldScale.y * this.scale.y;
        
        // Rotasyonu hesaba katarak dünya konumunu hesapla
        const cosRot = Math.cos(parentWorldRotation);
        const sinRot = Math.sin(parentWorldRotation);
        
        this._worldPosition.x = parentWorldPosition.x + 
                              (this.position.x * cosRot - this.position.y * sinRot) * 
                              parentWorldScale.x;
        
        this._worldPosition.y = parentWorldPosition.y + 
                              (this.position.x * sinRot + this.position.y * cosRot) * 
                              parentWorldScale.y;
    }
    
    /**
     * Nesneyi belirtilen konuma taşır
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     */
    translate(x, y) {
        this.position.x += x;
        this.position.y += y;
        this._dirty = true;
    }
    
    /**
     * Nesneyi belirtilen açıda döndürür
     * @param {Number} angle - Döndürme açısı (radyan)
     */
    rotate(angle) {
        this.rotation += angle;
        this._dirty = true;
    }
    
    /**
     * Nesneyi belirtilen faktörde ölçeklendirir
     * @param {Number} x - X ölçek faktörü
     * @param {Number} y - Y ölçek faktörü
     */
    setScale(x, y) {
        this.scale.x = x;
        this.scale.y = y;
        this._dirty = true;
    }
    
    /**
     * Yerel konumu ayarlar
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     */
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        this._dirty = true;
    }
    
    /**
     * Yerel döndürmeyi ayarlar
     * @param {Number} angle - Döndürme açısı (radyan)
     */
    setRotation(angle) {
        this.rotation = angle;
        this._dirty = true;
    }
    
    /**
     * İki nokta arasındaki yöne bakması için nesneyi döndürür
     * @param {Number} targetX - Hedef X koordinatı
     * @param {Number} targetY - Hedef Y koordinatı
     */
    lookAt(targetX, targetY) {
        const worldPos = this.getWorldPosition();
        const dx = targetX - worldPos.x;
        const dy = targetY - worldPos.y;
        
        // arctan ile açıyı hesapla
        let angle = Math.atan2(dy, dx);
        
        // Yerel rotasyonu hesapla
        if (this.gameObject && this.gameObject.parent) {
            const parentRotation = this.gameObject.parent.transform.getWorldRotation();
            angle -= parentRotation;
        }
        
        this.rotation = angle;
        this._dirty = true;
    }
    
    /**
     * Transform güncellendiğinde çağrılır
     */
    update() {
        // Transform değiştiğinde dünya koordinatlarını güncelle
        if (this._dirty) {
            this._updateWorldTransform();
        }
    }
}