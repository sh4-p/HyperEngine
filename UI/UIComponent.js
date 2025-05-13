/**
 * UIComponent.js - Temel UI bileşeni
 * Tüm UI bileşenleri için temel sınıf
 */
class UIComponent {
    constructor(params = {}) {
        this.id = UIComponent._generateId();
        this.active = true;
        this.visible = true;
        this.interactive = true;
        
        // Pozisyon ve boyut
        this.x = params.x || 0;
        this.y = params.y || 0;
        this.width = params.width || 100;
        this.height = params.height || 100;
        
        // Hizalama (0-1 arası: 0 = sol/üst, 0.5 = orta, 1 = sağ/alt)
        this.anchorX = params.anchorX !== undefined ? params.anchorX : 0.5;
        this.anchorY = params.anchorY !== undefined ? params.anchorY : 0.5;
        
        // Döndürme (radyan)
        this.rotation = params.rotation || 0;
        
        // Ölçek
        this.scaleX = params.scaleX !== undefined ? params.scaleX : 1;
        this.scaleY = params.scaleY !== undefined ? params.scaleY : 1;
        
        // Görünüm
        this.alpha = params.alpha !== undefined ? params.alpha : 1;
        this.backgroundColor = params.backgroundColor || null;
        this.borderColor = params.borderColor || null;
        this.borderWidth = params.borderWidth || 0;
        this.cornerRadius = params.cornerRadius || 0;
        this.shadow = params.shadow || null; // { x, y, blur, color }
        
        // Sınırlar
        this.clipChildren = params.clipChildren || false;
        
        // Üst bileşen
        this.parent = null;
        
        // Alt bileşenler
        this.children = [];
        
        // UI ve sahne referansları
        this.ui = null;
        this.scene = null;
        
        // Olay işleyicileri
        this.onTouchStartCallback = params.onTouchStart || null;
        this.onTouchMoveCallback = params.onTouchMove || null;
        this.onTouchEndCallback = params.onTouchEnd || null;
    }
    
    /**
     * Bileşen eklendiğinde çağrılır
     */
    onAdd() {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Bileşen kaldırıldığında çağrılır
     */
    onRemove() {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        // Alt sınıflarda override edilebilir
        
        // Alt bileşenleri güncelle
        for (const child of this.children) {
            if (child.active) {
                child.update(deltaTime);
            }
        }
    }
    
    /**
     * Render işlemi sırasında çağrılır
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        if (!this.visible) return;
        
        const ctx = renderer.context;
        
        // Render durumunu kaydet
        ctx.save();
        
        // Alfa değerini ayarla
        ctx.globalAlpha *= this.alpha;
        
        // Dünya konumunu hesapla
        const position = this.getWorldPosition();
        const scale = this.getWorldScale();
        const rotation = this.getWorldRotation();
        
        // Döndürme merkezi
        const pivotX = position.x;
        const pivotY = position.y;
        
        // Dönüşümleri uygula
        ctx.translate(pivotX, pivotY);
        ctx.rotate(rotation);
        ctx.scale(scale.x, scale.y);
        
        // Çizim merkezini ayarla
        const drawX = -this.width * this.anchorX;
        const drawY = -this.height * this.anchorY;
        
        // Gölge
        if (this.shadow) {
            ctx.shadowOffsetX = this.shadow.x;
            ctx.shadowOffsetY = this.shadow.y;
            ctx.shadowBlur = this.shadow.blur;
            ctx.shadowColor = this.shadow.color;
        }
        
        // Arkaplan çiz
        if (this.backgroundColor) {
            ctx.fillStyle = this.backgroundColor;
            
            if (this.cornerRadius > 0) {
                // Yuvarlak köşeli dikdörtgen
                this._drawRoundedRect(ctx, drawX, drawY, this.width, this.height, this.cornerRadius);
                ctx.fill();
            } else {
                // Normal dikdörtgen
                ctx.fillRect(drawX, drawY, this.width, this.height);
            }
        }
        
        // Kenarlık çiz
        if (this.borderColor && this.borderWidth > 0) {
            ctx.strokeStyle = this.borderColor;
            ctx.lineWidth = this.borderWidth;
            
            if (this.cornerRadius > 0) {
                // Yuvarlak köşeli dikdörtgen
                this._drawRoundedRect(ctx, drawX, drawY, this.width, this.height, this.cornerRadius);
                ctx.stroke();
            } else {
                // Normal dikdörtgen
                ctx.strokeRect(drawX, drawY, this.width, this.height);
            }
        }
        
        // Gölgeyi kapat
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        
        // İçeriği çiz
        this.drawContent(renderer, drawX, drawY);
        
        // Kırpma başlat
        if (this.clipChildren) {
            ctx.beginPath();
            if (this.cornerRadius > 0) {
                this._drawRoundedRect(ctx, drawX, drawY, this.width, this.height, this.cornerRadius);
            } else {
                ctx.rect(drawX, drawY, this.width, this.height);
            }
            ctx.clip();
        }
        
        // Alt bileşenleri render et
        for (const child of this.children) {
            if (child.visible) {
                child.render(renderer);
            }
        }
        
        // Render durumunu geri yükle
        ctx.restore();
    }
    
    /**
     * Bileşen içeriğini çizer
     * @param {Renderer} renderer - Renderer nesnesi
     * @param {Number} x - Çizim X koordinatı
     * @param {Number} y - Çizim Y koordinatı
     */
    drawContent(renderer, x, y) {
        // Alt sınıflarda override edilebilir
    }
    
    /**
     * Yuvarlak köşeli dikdörtgen çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @param {Number} width - Genişlik
     * @param {Number} height - Yükseklik
     * @param {Number} radius - Köşe yarıçapı
     */
    _drawRoundedRect(ctx, x, y, width, height, radius) {
        const maxRadius = Math.min(width, height) / 2;
        radius = Math.min(radius, maxRadius);
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
    }
    
    /**
     * Dokunma testi
     * @param {Number} touchX - Dokunma X koordinatı
     * @param {Number} touchY - Dokunma Y koordinatı
     * @return {Boolean} Dokunma gerçekleşti mi
     */
    hitTest(touchX, touchY) {
        if (!this.interactive || !this.visible) return false;
        
        // Dünya konumunu hesapla
        const position = this.getWorldPosition();
        const scale = this.getWorldScale();
        const rotation = this.getWorldRotation();
        
        // Bileşen merkezinin dünya koordinatları
        const centerX = position.x;
        const centerY = position.y;
        
        // Bileşen sınırlarının dünya koordinatları
        const left = centerX - this.width * this.anchorX * scale.x;
        const top = centerY - this.height * this.anchorY * scale.y;
        const right = left + this.width * scale.x;
        const bottom = top + this.height * scale.y;
        
        // Rotasyon yoksa basit sınır kontrolü
        if (rotation === 0) {
            return (touchX >= left && touchX <= right && touchY >= top && touchY <= bottom);
        }
        
        // Rotasyon varsa, dokunma noktasını döndürerek kontrol et
        const dx = touchX - centerX;
        const dy = touchY - centerY;
        
        // Dokunma noktasını ters döndür
        const cosRot = Math.cos(-rotation);
        const sinRot = Math.sin(-rotation);
        
        const rotatedX = centerX + (dx * cosRot - dy * sinRot);
        const rotatedY = centerY + (dx * sinRot + dy * cosRot);
        
        // Döndürülmüş noktayı kontrol et
        return (rotatedX >= left && rotatedX <= right && rotatedY >= top && rotatedY <= bottom);
    }
    
    /**
     * Dokunma başlangıç olayı
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    onTouchStart(x, y) {
        if (this.onTouchStartCallback) {
            this.onTouchStartCallback(x, y);
        }
    }
    
    /**
     * Dokunma hareket olayı
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    onTouchMove(x, y) {
        if (this.onTouchMoveCallback) {
            this.onTouchMoveCallback(x, y);
        }
    }
    
    /**
     * Dokunma bitiş olayı
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    onTouchEnd(x, y) {
        if (this.onTouchEndCallback) {
            this.onTouchEndCallback(x, y);
        }
    }
    
    /**
     * Alt bileşen ekler
     * @param {UIComponent} child - Eklenecek bileşen
     */
    addChild(child) {
        if (!(child instanceof UIComponent)) {
            console.error("Eklenecek nesne bir UIComponent olmalı");
            return;
        }
        
        // Önceki ebeveynden kaldır
        if (child.parent) {
            child.parent.removeChild(child);
        }
        
        // Ebeveyn-çocuk ilişkisini kur
        child.parent = this;
        this.children.push(child);
        
        // UI ve sahne referanslarını ayarla
        child.ui = this.ui;
        child.scene = this.scene;
        
        // Bileşeni başlat
        if (child.onAdd) {
            child.onAdd();
        }
    }
    
    /**
     * Alt bileşen kaldırır
     * @param {UIComponent} child - Kaldırılacak bileşen
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        
        if (index !== -1) {
            // Bileşeni kaldır
            if (child.onRemove) {
                child.onRemove();
            }
            
            child.parent = null;
            child.ui = null;
            child.scene = null;
            
            this.children.splice(index, 1);
        }
    }
    
    /**
     * Tüm alt bileşenleri kaldırır
     */
    removeAllChildren() {
        while (this.children.length > 0) {
            this.removeChild(this.children[0]);
        }
    }
    
    /**
     * Yerel koordinatları dünya koordinatlarına dönüştürür
     * @param {Number} x - Yerel X koordinatı
     * @param {Number} y - Yerel Y koordinatı
     * @return {Object} Dünya koordinatları {x, y}
     */
    localToWorld(x, y) {
        // Bileşenin dünya pozisyonu, ölçeği ve rotasyonu
        const position = this.getWorldPosition();
        const scale = this.getWorldScale();
        const rotation = this.getWorldRotation();
        
        // Bileşen merkezine göre koordinatları hesapla
        const localX = x - this.width * this.anchorX;
        const localY = y - this.height * this.anchorY;
        
        // Ölçekle
        const scaledX = localX * scale.x;
        const scaledY = localY * scale.y;
        
        // Döndür
        const cosRot = Math.cos(rotation);
        const sinRot = Math.sin(rotation);
        
        const rotatedX = scaledX * cosRot - scaledY * sinRot;
        const rotatedY = scaledX * sinRot + scaledY * cosRot;
        
        // Bileşen konumunu ekle
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
        // Bileşenin dünya pozisyonu, ölçeği ve rotasyonu
        const position = this.getWorldPosition();
        const scale = this.getWorldScale();
        const rotation = this.getWorldRotation();
        
        // Bileşen konumuna göre koordinatları hesapla
        const dx = x - position.x;
        const dy = y - position.y;
        
        // Ters döndür
        const cosRot = Math.cos(-rotation);
        const sinRot = Math.sin(-rotation);
        
        const unrotatedX = dx * cosRot - dy * sinRot;
        const unrotatedY = dx * sinRot + dy * cosRot;
        
        // Ters ölçekle
        const unscaledX = unrotatedX / scale.x;
        const unscaledY = unrotatedY / scale.y;
        
        // Bileşen merkezine göre konumu ekle
        return {
            x: unscaledX + this.width * this.anchorX,
            y: unscaledY + this.height * this.anchorY
        };
    }
    
    /**
     * Dünya pozisyonunu hesaplar
     * @return {Object} Dünya pozisyonu {x, y}
     */
    getWorldPosition() {
        if (!this.parent) {
            return { x: this.x, y: this.y };
        }
        
        // Üst bileşenin dünya pozisyonu, ölçeği ve rotasyonu
        const parentPos = this.parent.getWorldPosition();
        const parentScale = this.parent.getWorldScale();
        const parentRotation = this.parent.getWorldRotation();
        
        // Yerel koordinatları
        const localX = this.x;
        const localY = this.y;
        
        // Ölçekle
        const scaledX = localX * parentScale.x;
        const scaledY = localY * parentScale.y;
        
        // Döndür
        const cosRot = Math.cos(parentRotation);
        const sinRot = Math.sin(parentRotation);
        
        const rotatedX = scaledX * cosRot - scaledY * sinRot;
        const rotatedY = scaledX * sinRot + scaledY * cosRot;
        
        // Üst bileşen konumunu ekle
        return {
            x: parentPos.x + rotatedX,
            y: parentPos.y + rotatedY
        };
    }
    
    /**
     * Dünya ölçeğini hesaplar
     * @return {Object} Dünya ölçeği {x, y}
     */
    getWorldScale() {
        if (!this.parent) {
            return { x: this.scaleX, y: this.scaleY };
        }
        
        // Üst bileşenin dünya ölçeği
        const parentScale = this.parent.getWorldScale();
        
        // Ölçekleri çarp
        return {
            x: this.scaleX * parentScale.x,
            y: this.scaleY * parentScale.y
        };
    }
    
    /**
     * Dünya rotasyonunu hesaplar
     * @return {Number} Dünya rotasyonu (radyan)
     */
    getWorldRotation() {
        if (!this.parent) {
            return this.rotation;
        }
        
        // Üst bileşenin dünya rotasyonu
        const parentRotation = this.parent.getWorldRotation();
        
        // Rotasyonları topla
        return this.rotation + parentRotation;
    }
    
    /**
     * Benzersiz ID üretir
     * @return {String} Benzersiz ID
     */
    static _generateId() {
        return 'ui_' + Math.random().toString(36).substr(2, 9);
    }
}