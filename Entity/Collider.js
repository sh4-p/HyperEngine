/**
 * Collider.js - Çarpışma algılama bileşeni
 * Oyun nesnelerinin çarpışma alanını tanımlar
 */
class Collider extends Component {
    constructor(type = 'box', params = {}) {
        super();
        
        // Collider tipi ('box' veya 'circle')
        this.type = type;
        
        // Kutu collider için boyutlar
        this.width = params.width || 1;
        this.height = params.height || 1;
        
        // Daire collider için yarıçap
        this.radius = params.radius || 0.5;
        
        // Offset (yerel koordinatlarda)
        this.offset = params.offset || { x: 0, y: 0 };
        
        // Collider için malzeme özellikleri
        this.material = params.material || {
            friction: 0.3,
            bounciness: 0.3
        };
        
        // Collider katmanı (hangi katmanlarla çarpışacağı)
        this.layer = params.layer || 0;
        
        // Trigger modu (çarpışma fiziği olmadan sadece algılama)
        this.isTrigger = params.isTrigger || false;
    }
    
    /**
     * Bileşen başlatıldığında
     */
    start() {
        // Fizik sistemine kaydet
        const physics = Physics.getInstance();
        physics.addCollider(this);
    }
    
    /**
     * Bileşen yok edildiğinde
     */
    onDestroy() {
        // Fizik sisteminden kaldır
        const physics = Physics.getInstance();
        physics.removeCollider(this);
    }
    
    /**
     * Dünya pozisyonunu döndürür
     * @return {Object} Dünya pozisyonu
     */
    getWorldPosition() {
        const position = this.transform.getWorldPosition();
        const rotation = this.transform.getWorldRotation();
        
        // Offset'i döndür ve ekle
        const cosRot = Math.cos(rotation);
        const sinRot = Math.sin(rotation);
        
        return {
            x: position.x + (this.offset.x * cosRot - this.offset.y * sinRot),
            y: position.y + (this.offset.x * sinRot + this.offset.y * cosRot)
        };
    }
    
    /**
     * Debug modunda çarpışma alanını çizer
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        // Debug modunda değilse çizme
        if (!Collider.debugDraw) return;
        
        const position = this.getWorldPosition();
        const scale = this.transform.getWorldScale();
        
        // Collider tipine göre çiz
        if (this.type === 'box') {
            renderer.drawRect(
                position.x - (this.width * scale.x) / 2,
                position.y - (this.height * scale.y) / 2,
                this.width * scale.x,
                this.height * scale.y,
                this.isTrigger ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 255, 0, 0.3)',
                true
            );
            
            renderer.drawRect(
                position.x - (this.width * scale.x) / 2,
                position.y - (this.height * scale.y) / 2,
                this.width * scale.x,
                this.height * scale.y,
                this.isTrigger ? 'cyan' : 'green',
                false
            );
        } else if (this.type === 'circle') {
            const radius = this.radius * Math.max(scale.x, scale.y);
            
            renderer.drawCircle(
                position.x,
                position.y,
                radius,
                this.isTrigger ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 255, 0, 0.3)',
                true
            );
            
            renderer.drawCircle(
                position.x,
                position.y,
                radius,
                this.isTrigger ? 'cyan' : 'green',
                false
            );
        }
    }
}

// Debug modu - collider'ların görüntülenmesi için
Collider.debugDraw = false;