/**
 * Collider.js - Çarpışma alanı bileşeni
 * Fizik motorunda çarpışma algılama için kullanılır
 */
class Collider extends Component {
    constructor() {
        super();
        
        // Çarpışma özellikleri
        this.type = 'box'; // 'box', 'circle'
        this.width = 100;
        this.height = 100;
        this.radius = 50;
        this.offset = { x: 0, y: 0 };
        this.isTrigger = false;
        this.layer = 0;
        this.friction = 0.3;
        this.restitution = 0.1; // yay etkisi (zıplama)
        
        // Debug görüntüleme
        Collider.debugDraw = false;
        this.debugColor = '#00FF00';
    }
    
    /**
     * Bileşen ilk eklendiğinde bir kere çağrılır
     */
    start() {
        // Physics sistemine kaydol
        const physics = Physics.getInstance();
        physics.addCollider(this);
    }
    
    /**
     * Bileşen yok edildiğinde çağrılır
     */
    onDestroy() {
        // Physics sisteminden kaldır
        const physics = Physics.getInstance();
        physics.removeCollider(this);
    }
    
    /**
     * Render işlemi sırasında çağrılır
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        // Debug modunda çarpışma şeklini çiz
        if (Collider.debugDraw) {
            const pos = this.getWorldPosition();
            const scale = this.transform.getWorldScale();
            
            renderer.context.strokeStyle = this.debugColor;
            renderer.context.lineWidth = 2;
            
            if (this.type === 'box') {
                // Kutucuk çarpışma alanı
                const scaledWidth = this.width * scale.x;
                const scaledHeight = this.height * scale.y;
                
                renderer.context.strokeRect(
                    pos.x - scaledWidth / 2,
                    pos.y - scaledHeight / 2,
                    scaledWidth,
                    scaledHeight
                );
            } else if (this.type === 'circle') {
                // Daire çarpışma alanı
                const scaledRadius = this.radius * Math.max(scale.x, scale.y);
                
                renderer.context.beginPath();
                renderer.context.arc(pos.x, pos.y, scaledRadius, 0, Math.PI * 2);
                renderer.context.stroke();
            }
        }
    }
    
    /**
     * Dünya pozisyonunu hesaplar
     * @return {Object} Dünya pozisyonu {x, y}
     */
    getWorldPosition() {
        const position = this.transform.getWorldPosition();
        const rotation = this.transform.getWorldRotation();
        const scale = this.transform.getWorldScale();
        
        // Offset'i dönüşüme uygula
        const offsetX = this.offset.x * scale.x;
        const offsetY = this.offset.y * scale.y;
        
        // Offset'i rotasyona göre döndür
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        const rotatedOffsetX = offsetX * cos - offsetY * sin;
        const rotatedOffsetY = offsetX * sin + offsetY * cos;
        
        return {
            x: position.x + rotatedOffsetX,
            y: position.y + rotatedOffsetY
        };
    }
    
    /**
     * Kutucuk çarpışma alanı olarak ayarlar
     * @param {Number} width - Genişlik
     * @param {Number} height - Yükseklik
     * @param {Number} offsetX - X ofset
     * @param {Number} offsetY - Y ofset
     */
    setBox(width, height, offsetX = 0, offsetY = 0) {
        this.type = 'box';
        this.width = width;
        this.height = height;
        this.offset.x = offsetX;
        this.offset.y = offsetY;
    }
    
    /**
     * Daire çarpışma alanı olarak ayarlar
     * @param {Number} radius - Yarıçap
     * @param {Number} offsetX - X ofset
     * @param {Number} offsetY - Y ofset
     */
    setCircle(radius, offsetX = 0, offsetY = 0) {
        this.type = 'circle';
        this.radius = radius;
        this.offset.x = offsetX;
        this.offset.y = offsetY;
    }
    
    /**
     * İki çarpışma alanı arasında çarpışma kontrolü yapar
     * @param {Collider} other - Diğer çarpışma alanı
     * @return {Boolean} Çarpışma var mı
     */
    checkCollision(other) {
        // Her iki çarpışma alanı türüne göre kontrol
        if (this.type === 'box' && other.type === 'box') {
            return this._checkBoxBoxCollision(other);
        } else if (this.type === 'circle' && other.type === 'circle') {
            return this._checkCircleCircleCollision(other);
        } else if (this.type === 'box' && other.type === 'circle') {
            return this._checkBoxCircleCollision(other);
        } else if (this.type === 'circle' && other.type === 'box') {
            return other._checkBoxCircleCollision(this);
        }
        
        return false;
    }
    
    /**
     * İki kutucuk arasında çarpışma kontrolü yapar
     * @param {Collider} other - Diğer kutucuk çarpışma alanı
     * @return {Boolean} Çarpışma var mı
     * @private
     */
    _checkBoxBoxCollision(other) {
        const posA = this.getWorldPosition();
        const posB = other.getWorldPosition();
        
        const scaleA = this.transform.getWorldScale();
        const scaleB = other.transform.getWorldScale();
        
        const halfWidthA = this.width * scaleA.x / 2;
        const halfHeightA = this.height * scaleA.y / 2;
        
        const halfWidthB = other.width * scaleB.x / 2;
        const halfHeightB = other.height * scaleB.y / 2;
        
        // İki kutucuk arasında çarpışma kontrolü
        return (
            posA.x - halfWidthA < posB.x + halfWidthB &&
            posA.x + halfWidthA > posB.x - halfWidthB &&
            posA.y - halfHeightA < posB.y + halfHeightB &&
            posA.y + halfHeightA > posB.y - halfHeightB
        );
    }
    
    /**
     * İki daire arasında çarpışma kontrolü yapar
     * @param {Collider} other - Diğer daire çarpışma alanı
     * @return {Boolean} Çarpışma var mı
     * @private
     */
    _checkCircleCircleCollision(other) {
        const posA = this.getWorldPosition();
        const posB = other.getWorldPosition();
        
        const scaleA = this.transform.getWorldScale();
        const scaleB = other.transform.getWorldScale();
        
        const radiusA = this.radius * Math.max(scaleA.x, scaleA.y);
        const radiusB = other.radius * Math.max(scaleB.x, scaleB.y);
        
        // İki daire arasındaki mesafeyi hesapla
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Çarpışma kontrolü
        return distance < radiusA + radiusB;
    }
    
    /**
     * Kutucuk ve daire arasında çarpışma kontrolü yapar
     * @param {Collider} circle - Daire çarpışma alanı
     * @return {Boolean} Çarpışma var mı
     * @private
     */
    _checkBoxCircleCollision(circle) {
        const boxPos = this.getWorldPosition();
        const circlePos = circle.getWorldPosition();
        
        const boxScale = this.transform.getWorldScale();
        const circleScale = circle.transform.getWorldScale();
        
        const halfWidth = this.width * boxScale.x / 2;
        const halfHeight = this.height * boxScale.y / 2;
        
        const radius = circle.radius * Math.max(circleScale.x, circleScale.y);
        
        // Daireye en yakın noktayı bul
        const closestX = Math.max(boxPos.x - halfWidth, Math.min(circlePos.x, boxPos.x + halfWidth));
        const closestY = Math.max(boxPos.y - halfHeight, Math.min(circlePos.y, boxPos.y + halfHeight));
        
        // En yakın nokta ile daire merkezi arasındaki mesafeyi hesapla
        const dx = closestX - circlePos.x;
        const dy = closestY - circlePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Çarpışma kontrolü
        return distance < radius;
    }
    
    /**
     * Bileşeni klonlar
     * @return {Collider} Klonlanan collider
     */
    clone() {
        const clone = new Collider();
        clone.type = this.type;
        clone.width = this.width;
        clone.height = this.height;
        clone.radius = this.radius;
        clone.offset.x = this.offset.x;
        clone.offset.y = this.offset.y;
        clone.isTrigger = this.isTrigger;
        clone.layer = this.layer;
        clone.friction = this.friction;
        clone.restitution = this.restitution;
        clone.debugColor = this.debugColor;
        
        return clone;
    }
}

// Static değişkenler
Collider.debugDraw = false;