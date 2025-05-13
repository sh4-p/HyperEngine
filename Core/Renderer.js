/**
 * Renderer.js - Grafik işleme sınıfı
 * Canvas üzerinde nesneleri çizme işlemlerini yönetir
 */
class Renderer {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        
        // Kamera ayarları
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1
        };
        
        // Render katmanları
        this.layers = {};
        this.layerOrder = [];
        
        // Singleton instance
        if (Renderer.instance) {
            return Renderer.instance;
        }
        Renderer.instance = this;
    }
    
    /**
     * Canvas'ı temizler
     * @param {String} color - Arkaplan rengi (isteğe bağlı)
     */
    clear(color = '#000000') {
        this.context.fillStyle = color;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Render katmanı oluşturur veya alır
     * @param {Number} layerId - Katman ID
     * @param {Number} order - Render sırası (düşük değerler önce çizilir)
     * @return {Object} Katman nesnesi
     */
    getLayer(layerId, order = 0) {
        if (!this.layers[layerId]) {
            this.layers[layerId] = {
                id: layerId,
                order: order,
                objects: []
            };
            
            // Katmanları sırala
            this.layerOrder = Object.values(this.layers).sort((a, b) => a.order - b.order);
        }
        
        return this.layers[layerId];
    }
    
    /**
     * Katmana nesne ekler
     * @param {GameObject} object - Eklenecek nesne
     * @param {Number} layerId - Katman ID
     */
    addToLayer(object, layerId = 0) {
        const layer = this.getLayer(layerId);
        
        if (layer.objects.indexOf(object) === -1) {
            layer.objects.push(object);
        }
    }
    
    /**
     * Katmandan nesne kaldırır
     * @param {GameObject} object - Kaldırılacak nesne
     * @param {Number} layerId - Katman ID
     */
    removeFromLayer(object, layerId = 0) {
        if (this.layers[layerId]) {
            const index = this.layers[layerId].objects.indexOf(object);
            
            if (index !== -1) {
                this.layers[layerId].objects.splice(index, 1);
            }
        }
    }
    
    /**
     * Tüm nesneleri render eder
     */
    renderAll() {
        // Kamera dönüşümünü uygula
        this.context.save();
        this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.context.scale(this.camera.zoom, this.camera.zoom);
        this.context.translate(-this.camera.x, -this.camera.y);
        
        // Katmanlara göre nesneleri çiz
        for (const layer of this.layerOrder) {
            for (const object of layer.objects) {
                if (object.active) {
                    object.render(this);
                }
            }
        }
        
        // Kamera dönüşümünü resetle
        this.context.restore();
    }
    
    /**
     * Resim çizer
     * @param {Image} image - Çizilecek resim
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @param {Number} width - Genişlik
     * @param {Number} height - Yükseklik
     * @param {Number} rotation - Döndürme açısı (radyan)
     * @param {Number} originX - Döndürme merkezi X (0-1 arası)
     * @param {Number} originY - Döndürme merkezi Y (0-1 arası)
     * @param {Boolean} flipX - X ekseninde çevirme
     * @param {Boolean} flipY - Y ekseninde çevirme
     */
    drawImage(image, x, y, width, height, rotation = 0, originX = 0.5, originY = 0.5, flipX = false, flipY = false) {
        this.context.save();
        
        // Döndürme merkezine göre konumu ayarla
        const pivotX = x + width * originX;
        const pivotY = y + height * originY;
        
        // Döndürme merkezine taşı, döndür, tekrar eski konuma getir
        this.context.translate(pivotX, pivotY);
        this.context.rotate(rotation);
        
        // Çevirme işlemi
        if (flipX || flipY) {
            this.context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        }
        
        // Döndürme merkezine göre resmi çiz
        this.context.drawImage(
            image,
            -width * originX,
            -height * originY,
            width,
            height
        );
        
        this.context.restore();
    }
    
    /**
     * Sprite sheet'ten bir kare çizer
     * @param {Image} image - Sprite sheet resmi
     * @param {Number} srcX - Kaynak X koordinatı
     * @param {Number} srcY - Kaynak Y koordinatı
     * @param {Number} srcWidth - Kaynak genişliği
     * @param {Number} srcHeight - Kaynak yüksekliği
     * @param {Number} destX - Hedef X koordinatı
     * @param {Number} destY - Hedef Y koordinatı
     * @param {Number} destWidth - Hedef genişliği
     * @param {Number} destHeight - Hedef yüksekliği
     * @param {Number} rotation - Döndürme açısı (radyan)
     * @param {Number} originX - Döndürme merkezi X (0-1 arası)
     * @param {Number} originY - Döndürme merkezi Y (0-1 arası)
     */
    drawSprite(image, srcX, srcY, srcWidth, srcHeight, destX, destY, destWidth, destHeight, rotation = 0, originX = 0.5, originY = 0.5) {
        this.context.save();
        
        // Döndürme merkezine göre konumu ayarla
        const pivotX = destX + destWidth * originX;
        const pivotY = destY + destHeight * originY;
        
        // Döndürme merkezine taşı, döndür, tekrar eski konuma getir
        this.context.translate(pivotX, pivotY);
        this.context.rotate(rotation);
        
        // Döndürme merkezine göre resmi çiz
        this.context.drawImage(
            image,
            srcX, srcY, srcWidth, srcHeight,
            -destWidth * originX, -destHeight * originY, destWidth, destHeight
        );
        
        this.context.restore();
    }
    
    /**
     * Dikdörtgen çizer
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @param {Number} width - Genişlik
     * @param {Number} height - Yükseklik
     * @param {String} color - Renk
     * @param {Boolean} fill - Dolgu var mı
     * @param {Number} lineWidth - Çizgi kalınlığı
     * @param {Number} rotation - Döndürme açısı (radyan)
     */
    drawRect(x, y, width, height, color = '#FFFFFF', fill = true, lineWidth = 1, rotation = 0) {
        this.context.save();
        
        // Döndürme merkezine göre konumu ayarla
        const pivotX = x + width / 2;
        const pivotY = y + height / 2;
        
        // Döndürme merkezine taşı, döndür, tekrar eski konuma getir
        this.context.translate(pivotX, pivotY);
        this.context.rotate(rotation);
        
        // Renk ve çizgi kalınlığını ayarla
        if (fill) {
            this.context.fillStyle = color;
        } else {
            this.context.strokeStyle = color;
            this.context.lineWidth = lineWidth;
        }
        
        // Dikdörtgeni çiz
        if (fill) {
            this.context.fillRect(-width / 2, -height / 2, width, height);
        } else {
            this.context.strokeRect(-width / 2, -height / 2, width, height);
        }
        
        this.context.restore();
    }
    
    /**
     * Daire çizer
     * @param {Number} x - X koordinatı (merkez)
     * @param {Number} y - Y koordinatı (merkez)
     * @param {Number} radius - Yarıçap
     * @param {String} color - Renk
     * @param {Boolean} fill - Dolgu var mı
     * @param {Number} lineWidth - Çizgi kalınlığı
     */
    drawCircle(x, y, radius, color = '#FFFFFF', fill = true, lineWidth = 1) {
        this.context.save();
        
        // Renk ve çizgi kalınlığını ayarla
        if (fill) {
            this.context.fillStyle = color;
        } else {
            this.context.strokeStyle = color;
            this.context.lineWidth = lineWidth;
        }
        
        // Daireyi çiz
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI * 2);
        
        if (fill) {
            this.context.fill();
        } else {
            this.context.stroke();
        }
        
        this.context.restore();
    }
    
    /**
     * Çizgi çizer
     * @param {Number} x1 - Başlangıç X koordinatı
     * @param {Number} y1 - Başlangıç Y koordinatı
     * @param {Number} x2 - Bitiş X koordinatı
     * @param {Number} y2 - Bitiş Y koordinatı
     * @param {String} color - Renk
     * @param {Number} lineWidth - Çizgi kalınlığı
     */
    drawLine(x1, y1, x2, y2, color = '#FFFFFF', lineWidth = 1) {
        this.context.save();
        
        // Renk ve çizgi kalınlığını ayarla
        this.context.strokeStyle = color;
        this.context.lineWidth = lineWidth;
        
        // Çizgi çiz
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.stroke();
        
        this.context.restore();
    }
    
    /**
     * Metin çizer
     * @param {String} text - Metin
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @param {String} color - Renk
     * @param {String} font - Font
     * @param {String} align - Hizalama (left, center, right)
     * @param {String} baseline - Baseline (top, middle, bottom)
     * @param {Number} rotation - Döndürme açısı (radyan)
     */
    drawText(text, x, y, color = '#FFFFFF', font = '16px Arial', align = 'center', baseline = 'middle', rotation = 0) {
        this.context.save();
        
        // Döndürme
        if (rotation !== 0) {
            this.context.translate(x, y);
            this.context.rotate(rotation);
            x = 0;
            y = 0;
        }
        
        // Metin ayarları
        this.context.fillStyle = color;
        this.context.font = font;
        this.context.textAlign = align;
        this.context.textBaseline = baseline;
        
        // Metni çiz
        this.context.fillText(text, x, y);
        
        this.context.restore();
    }
    
    /**
     * Kamera konumunu ayarlar
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     */
    setCameraPosition(x, y) {
        this.camera.x = x;
        this.camera.y = y;
    }
    
    /**
     * Kamera yakınlaştırmasını ayarlar
     * @param {Number} zoom - Yakınlaştırma değeri
     */
    setCameraZoom(zoom) {
        this.camera.zoom = Math.max(0.1, zoom);
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!Renderer.instance) {
            const engine = Engine.getInstance();
            new Renderer(engine.canvas, engine.context);
        }
        return Renderer.instance;
    }
}

// Singleton instance
Renderer.instance = null;