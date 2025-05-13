/**
 * Image.js - Görüntü bileşeni
 * Oyun arayüzünde resim öğelerini gösterir
 */
class Image extends UIComponent {
    constructor(params = {}) {
        // Temel parametreleri üst sınıfa gönder
        super(params);
        
        // Görüntü özellikleri
        this.source = params.source || null;
        this.image = null;
        this.isLoaded = false;
        this.preserveAspect = params.preserveAspect !== undefined ? params.preserveAspect : true;
        this.fillMode = params.fillMode || 'fit'; // 'fit', 'fill', 'stretch', 'tile'
        this.clipOverflow = params.clipOverflow || false;
        this.tint = params.tint || null;
        this.grayscale = params.grayscale || false;
        this.blur = params.blur || 0;
        this.brightness = params.brightness !== undefined ? params.brightness : 1;
        this.contrast = params.contrast !== undefined ? params.contrast : 1;
        this.saturation = params.saturation !== undefined ? params.saturation : 1;
        this.hue = params.hue || 0;
        this.slice = params.slice || null; // {x, y, width, height} - Kaynak resimden kesim
        this.flipX = params.flipX || false;
        this.flipY = params.flipY || false;
        this.scaleMode = params.scaleMode || 'linear'; // 'linear' veya 'pixelated'
        this.roundedCorners = params.roundedCorners || false;
        this.cornerRadius = params.cornerRadius || 10;
        this.cropCircle = params.cropCircle || false;
        this.cropType = params.cropType || 'circle'; // 'circle', 'ellipse', 'rounded', 'custom'
        this.cropPath = params.cropPath || null; // Özel kırpma yolu
        this.border = params.border || false;
        this.borderColor = params.borderColor || '#FFFFFF';
        this.borderWidth = params.borderWidth || 2;
        this.shadow = params.shadow || false;
        this.shadowColor = params.shadowColor || 'rgba(0, 0, 0, 0.5)';
        this.shadowBlur = params.shadowBlur || 5;
        this.shadowOffsetX = params.shadowOffsetX || 2;
        this.shadowOffsetY = params.shadowOffsetY || 2;
        this.noSmoothing = params.noSmoothing || false;
        
        // Animasyon özellikleri
        this.pulse = params.pulse || false;
        this.pulseSpeed = params.pulseSpeed || 2;
        this.pulseScale = params.pulseScale || 0.1;
        this.rotation = params.rotation || 0;
        this.rotationSpeed = params.rotationSpeed || 0;
        this.fade = params.fade || false;
        this.fadeSpeed = params.fadeSpeed || 1;
        this.fadeMin = params.fadeMin || 0.5;
        this.fadeMax = params.fadeMax || 1;
        this.glowEffect = params.glowEffect || false;
        this.glowColor = params.glowColor || 'rgba(255, 255, 255, 0.5)';
        this.glowSize = params.glowSize || 10;
        this.glowPulse = params.glowPulse || false;
        this.glowPulseSpeed = params.glowPulseSpeed || 2;
        
        // Animasyon değişkenleri
        this._pulseValue = 0;
        this._fadeValue = 1;
        this._glowValue = 0;
        
        // Görüntüyü yükle
        if (this.source) {
            this._loadImage();
        }
    }
    
    /**
     * Görüntüyü yükler
     */
    _loadImage() {
        // Zaten resim nesnesi ise
        if (this.source instanceof Image || this.source instanceof HTMLImageElement) {
            this.image = this.source;
            this.isLoaded = this.image.complete;
            
            if (!this.isLoaded) {
                this.image.onload = () => {
                    this.isLoaded = true;
                    
                    // Boyutları ayarla
                    this._adjustDimensions();
                };
            } else {
                // Boyutları ayarla
                this._adjustDimensions();
            }
            return;
        }
        
        // Resim zaten AssetManager'da var mı kontrol et
        const assetManager = AssetManager.getInstance();
        const cachedImage = assetManager.getImage(this.source);
        
        if (cachedImage) {
            this.image = cachedImage;
            this.isLoaded = true;
            
            // Boyutları ayarla
            this._adjustDimensions();
            
            return;
        }
        
        // Önbelleğe alınmamışsa yeni bir resim yükle
        this.image = new Image();
        this.image.src = this.source;
        
        this.image.onload = () => {
            this.isLoaded = true;
            
            // Boyutları ayarla
            this._adjustDimensions();
            
            // Asset Manager'a ekle
            assetManager.addImage(this.source, this.image);
        };
        
        this.image.onerror = () => {
            console.error(`Image could not be loaded: ${this.source}`);
        };
    }
    
    /**
     * Boyutları ayarlar
     */
    _adjustDimensions() {
        if (!this.isLoaded) return;
        
        // Eğer width ve height belirtilmemişse, resmin boyutlarını kullan
        if (this.width === 0) this.width = this.image.width;
        if (this.height === 0) this.height = this.image.height;
        
        // En-boy oranını koru
        if (this.preserveAspect) {
            const imgRatio = this.image.width / this.image.height;
            const componentRatio = this.width / this.height;
            
            if (this.fillMode === 'fit') {
                // Resmi tamamen sığdır
                if (imgRatio > componentRatio) {
                    // Genişlik sınırlayıcı
                    this.height = this.width / imgRatio;
                } else {
                    // Yükseklik sınırlayıcı
                    this.width = this.height * imgRatio;
                }
            } else if (this.fillMode === 'fill') {
                // Resmi alanı doldur (taşma olabilir)
                if (imgRatio > componentRatio) {
                    // Yükseklik sınırlayıcı
                    this.width = this.height * imgRatio;
                } else {
                    // Genişlik sınırlayıcı
                    this.height = this.width / imgRatio;
                }
            }
        }
    }
    
    /**
     * İçeriği çizer
     * @param {Renderer} renderer - Renderer nesnesi
     * @param {Number} x - Çizim X koordinatı
     * @param {Number} y - Çizim Y koordinatı
     */
    drawContent(renderer, x, y) {
        if (!this.isLoaded) return;
        
        const ctx = renderer.context;
        
        // Animasyonları güncelle
        this._updateAnimations(ctx);
        
        // Gölge efekti
        if (this.shadow) {
            ctx.shadowColor = this.shadowColor;
            ctx.shadowBlur = this.shadowBlur;
            ctx.shadowOffsetX = this.shadowOffsetX;
            ctx.shadowOffsetY = this.shadowOffsetY;
        }
        
        // Kaynak bölgesi
        let srcX = 0;
        let srcY = 0;
        let srcWidth = this.image.width;
        let srcHeight = this.image.height;
        
        if (this.slice) {
            srcX = this.slice.x || 0;
            srcY = this.slice.y || 0;
            srcWidth = this.slice.width || srcWidth;
            srcHeight = this.slice.height || srcHeight;
        }
        
        // Hedef bölgesi
        let destWidth = this.width;
        let destHeight = this.height;
        
        // Pulse animasyonu
        if (this.pulse) {
            const pulseFactor = 1 + this._pulseValue * this.pulseScale;
            destWidth *= pulseFactor;
            destHeight *= pulseFactor;
        }
        
        // Kırpma ve şekil efektleri
        if (this.roundedCorners || this.cropCircle || this.cropType !== 'circle') {
            ctx.save();
            
            // Kırpma şekli oluştur
            if (this.cropCircle || this.cropType === 'circle') {
                // Daire şeklinde kırp
                const radius = Math.min(destWidth, destHeight) / 2;
                const centerX = x + destWidth / 2;
                const centerY = y + destHeight / 2;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.closePath();
            } else if (this.cropType === 'ellipse') {
                // Elips şeklinde kırp
                const centerX = x + destWidth / 2;
                const centerY = y + destHeight / 2;
                const radiusX = destWidth / 2;
                const radiusY = destHeight / 2;
                
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
                ctx.closePath();
            } else if (this.roundedCorners || this.cropType === 'rounded') {
                // Yuvarlak köşeli dikdörtgen
                this._drawRoundedRect(ctx, x, y, destWidth, destHeight, this.cornerRadius);
            } else if (this.cropType === 'custom' && this.cropPath) {
                // Özel kırpma yolu
                ctx.beginPath();
                this.cropPath(ctx, x, y, destWidth, destHeight);
                ctx.closePath();
            }
            
            // Kenar çizgisi
            if (this.border) {
                ctx.strokeStyle = this.borderColor;
                ctx.lineWidth = this.borderWidth;
                ctx.stroke();
            }
            
            // Kırpma uygula
            ctx.clip();
            
            // Image smoothing
            ctx.imageSmoothingEnabled = !this.noSmoothing;
            if (this.scaleMode === 'pixelated') {
                ctx.imageSmoothingEnabled = false;
            }
            
            // Çevirme
            ctx.translate(x + destWidth / 2, y + destHeight / 2);
            if (this.flipX) ctx.scale(-1, 1);
            if (this.flipY) ctx.scale(1, -1);
            
            // Döndürme
            ctx.rotate(this.rotation);
            
            // Resmi çiz
            if (this.fillMode === 'tile') {
                // Döşeme modu
                const pattern = ctx.createPattern(this.image, 'repeat');
                ctx.fillStyle = pattern;
                ctx.fillRect(-destWidth / 2, -destHeight / 2, destWidth, destHeight);
            } else {
                // Filtreleri uygula
                if (this.grayscale || this.brightness !== 1 || this.contrast !== 1 || 
                    this.saturation !== 1 || this.hue !== 0 || this.blur > 0 || this.tint) {
                    
                    // Filtreler için yeni bir canvas oluştur
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = srcWidth;
                    tempCanvas.height = srcHeight;
                    
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(this.image, srcX, srcY, srcWidth, srcHeight, 0, 0, srcWidth, srcHeight);
                    
                    // Filtre listesi
                    let filters = '';
                    
                    if (this.grayscale) filters += `grayscale(100%) `;
                    if (this.brightness !== 1) filters += `brightness(${this.brightness}) `;
                    if (this.contrast !== 1) filters += `contrast(${this.contrast}) `;
                    if (this.saturation !== 1) filters += `saturate(${this.saturation}) `;
                    if (this.hue !== 0) filters += `hue-rotate(${this.hue}deg) `;
                    if (this.blur > 0) filters += `blur(${this.blur}px) `;
                    
                    // Filtreleri uygula
                    if (filters) {
                        tempCtx.filter = filters;
                        tempCtx.drawImage(tempCanvas, 0, 0);
                    }
                    
                    // Renk tonu filtresi
                    if (this.tint) {
                        tempCtx.globalCompositeOperation = 'multiply';
                        tempCtx.fillStyle = this.tint;
                        tempCtx.fillRect(0, 0, srcWidth, srcHeight);
                        
                        // Orijinal alfa değerlerini koru
                        tempCtx.globalCompositeOperation = 'destination-in';
                        tempCtx.drawImage(tempCanvas, 0, 0);
                    }
                    
                    // İşlenmiş resmi çiz
                    ctx.drawImage(tempCanvas, -destWidth / 2, -destHeight / 2, destWidth, destHeight);
                } else {
                    // Normal resim
                    ctx.drawImage(
                        this.image,
                        srcX, srcY, srcWidth, srcHeight,
                        -destWidth / 2, -destHeight / 2, destWidth, destHeight
                    );
                }
            }
            
            ctx.restore();
        } else {
            // Basit resim çizimi (kırpma ve şekil efektleri olmadan)
            ctx.save();
            
            // Image smoothing
            ctx.imageSmoothingEnabled = !this.noSmoothing;
            if (this.scaleMode === 'pixelated') {
                ctx.imageSmoothingEnabled = false;
            }
            
            // Çevirme ve döndürme
            ctx.translate(x + destWidth / 2, y + destHeight / 2);
            if (this.flipX) ctx.scale(-1, 1);
            if (this.flipY) ctx.scale(1, -1);
            ctx.rotate(this.rotation);
            
            // Filtreler
            if (this.grayscale || this.brightness !== 1 || this.contrast !== 1 || 
                this.saturation !== 1 || this.hue !== 0 || this.blur > 0 || this.tint) {
                
                let filters = '';
                
                if (this.grayscale) filters += `grayscale(100%) `;
                if (this.brightness !== 1) filters += `brightness(${this.brightness}) `;
                if (this.contrast !== 1) filters += `contrast(${this.contrast}) `;
                if (this.saturation !== 1) filters += `saturate(${this.saturation}) `;
                if (this.hue !== 0) filters += `hue-rotate(${this.hue}deg) `;
                if (this.blur > 0) filters += `blur(${this.blur}px) `;
                
                if (filters) {
                    ctx.filter = filters;
                }
            }
            
            if (this.fillMode === 'tile') {
                // Döşeme modu
                const pattern = ctx.createPattern(this.image, 'repeat');
                ctx.fillStyle = pattern;
                ctx.fillRect(-destWidth / 2, -destHeight / 2, destWidth, destHeight);
            } else {
                // Normal resim
                ctx.drawImage(
                    this.image,
                    srcX, srcY, srcWidth, srcHeight,
                    -destWidth / 2, -destHeight / 2, destWidth, destHeight
                );
                
                // Renk tonu
                if (this.tint) {
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.fillStyle = this.tint;
                    ctx.fillRect(-destWidth / 2, -destHeight / 2, destWidth, destHeight);
                    
                    // Orijinal alfa değerlerini koru
                    ctx.globalCompositeOperation = 'destination-in';
                    ctx.drawImage(
                        this.image,
                        srcX, srcY, srcWidth, srcHeight,
                        -destWidth / 2, -destHeight / 2, destWidth, destHeight
                    );
                }
            }
            
            ctx.restore();
        }
        
        // Gölge efektini kapat
        if (this.shadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        // Parlama efekti
        if (this.glowEffect) {
            ctx.save();
            
            const glowSize = this.glowSize;
            const glowAlpha = this.glowPulse ? 0.3 + this._glowValue * 0.4 : 0.5;
            
            // Parlama gradyanı
            const centerX = x + destWidth / 2;
            const centerY = y + destHeight / 2;
            const radius = Math.max(destWidth, destHeight) / 2 + glowSize;
            
            const gradient = ctx.createRadialGradient(
                centerX, centerY, radius / 2,
                centerX, centerY, radius
            );
            
            gradient.addColorStop(0, `rgba(${this._hexToRgb(this.glowColor)}, ${glowAlpha})`);
            gradient.addColorStop(1, `rgba(${this._hexToRgb(this.glowColor)}, 0)`);
            
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = gradient;
            
            if (this.cropCircle || this.cropType === 'circle') {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(
                    centerX - radius,
                    centerY - radius,
                    radius * 2,
                    radius * 2
                );
            }
            
            ctx.restore();
        }
    }
    
    /**
     * Animasyonları günceller
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    _updateAnimations(ctx) {
        const time = this.scene ? this.scene.time.time : (Date.now() / 1000);
        
        // Pulse animasyonu
        if (this.pulse) {
            this._pulseValue = Math.sin(time * this.pulseSpeed);
        }
        
        // Fade animasyonu
        if (this.fade) {
            this._fadeValue = Utils.lerp(this.fadeMin, this.fadeMax, (Math.sin(time * this.fadeSpeed) + 1) / 2);
            ctx.globalAlpha *= this._fadeValue;
        }
        
        // Döndürme animasyonu
        if (this.rotationSpeed !== 0) {
            this.rotation += this.rotationSpeed * 0.016; // 60 FPS varsayımı
        }
        
        // Parlama animasyonu
        if (this.glowPulse) {
            this._glowValue = (Math.sin(time * this.glowPulseSpeed) + 1) / 2;
        }
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
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
    }
    
    /**
     * Hex renk kodunu RGB'ye dönüştürür
     * @param {String} hex - Hex renk kodu
     * @return {String} RGB değerleri "r, g, b" formatında
     */
    _hexToRgb(hex) {
        // Hex kodu temizle
        hex = hex.replace(/^#/, '');
        
        // Kısaltılmış hex'i genişlet
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        
        // RGB değerlerini çıkar
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `${r}, ${g}, ${b}`;
    }
    
    /**
     * Görüntüyü değiştirir
     * @param {String|Image} source - Yeni görüntü
     */
    setImage(source) {
        this.source = source;
        this.isLoaded = false;
        this._loadImage();
    }
    
    /**
     * Filtre değerlerini ayarlar
     * @param {Object} filters - Filtre değerleri
     */
    setFilters(filters) {
        if (filters.grayscale !== undefined) this.grayscale = filters.grayscale;
        if (filters.brightness !== undefined) this.brightness = filters.brightness;
        if (filters.contrast !== undefined) this.contrast = filters.contrast;
        if (filters.saturation !== undefined) this.saturation = filters.saturation;
        if (filters.hue !== undefined) this.hue = filters.hue;
        if (filters.blur !== undefined) this.blur = filters.blur;
        if (filters.tint !== undefined) this.tint = filters.tint;
    }
}