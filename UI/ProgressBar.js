/**
 * ProgressBar.js - İlerleme çubuğu bileşeni
 * Oyun arayüzünde ilerleme göstergeleri oluşturur
 */
class ProgressBar extends UIComponent {
    constructor(params = {}) {
        // Temel parametreleri üst sınıfa gönder
        super(params);
        
        // İlerleme çubuğu özellikleri
        this.value = params.value !== undefined ? params.value : 0;
        this.minValue = params.minValue !== undefined ? params.minValue : 0;
        this.maxValue = params.maxValue !== undefined ? params.maxValue : 100;
        this.fillColor = params.fillColor || '#4CAF50';
        this.emptyColor = params.emptyColor || '#E0E0E0';
        this.direction = params.direction || 'horizontal'; // 'horizontal' veya 'vertical'
        this.showText = params.showText !== undefined ? params.showText : false;
        this.textFormat = params.textFormat || '{value}/{max}';
        this.textColor = params.textColor || '#FFFFFF';
        this.textFont = params.textFont || '14px Arial';
        this.textPosition = params.textPosition || 'center'; // 'center', 'left', 'right', 'top', 'bottom'
        this.textOffset = params.textOffset || 0;
        this.textShadow = params.textShadow || false;
        this.textShadowColor = params.textShadowColor || 'rgba(0, 0, 0, 0.5)';
        this.textShadowBlur = params.textShadowBlur || 3;
        this.outline = params.outline || false;
        this.outlineColor = params.outlineColor || '#000000';
        this.outlineWidth = params.outlineWidth || 2;
        this.roundedCorners = params.roundedCorners !== undefined ? params.roundedCorners : true;
        this.cornerRadius = params.cornerRadius !== undefined ? params.cornerRadius : 5;
        this.segmented = params.segmented || false;
        this.segments = params.segments || 10;
        this.segmentGap = params.segmentGap || 2;
        this.segmentSpacing = params.segmentSpacing || 2;
        this.gradient = params.gradient || false;
        this.gradientColors = params.gradientColors || ['#FF0000', '#FFFF00', '#00FF00'];
        this.fillImage = params.fillImage || null;
        this.emptyImage = params.emptyImage || null;
        this.animationSpeed = params.animationSpeed || 5;
        this.animateChanges = params.animateChanges !== undefined ? params.animateChanges : true;
        this.glowEffect = params.glowEffect || false;
        this.glowColor = params.glowColor || 'rgba(255, 255, 255, 0.5)';
        this.pulseEffect = params.pulseEffect || false;
        this.pulseSpeed = params.pulseSpeed || 2;
        this.dropShadow = params.dropShadow || false;
        this.dropShadowColor = params.dropShadowColor || 'rgba(0, 0, 0, 0.5)';
        this.dropShadowBlur = params.dropShadowBlur || 5;
        this.dropShadowOffsetX = params.dropShadowOffsetX || 2;
        this.dropShadowOffsetY = params.dropShadowOffsetY || 2;
        
        // Animasyon değişkenleri
        this.targetValue = this.value;
        this.displayValue = this.value;
        this.pulseValue = 0;
    }
    
    /**
     * İçeriği çizer
     * @param {Renderer} renderer - Renderer nesnesi
     * @param {Number} x - Çizim X koordinatı
     * @param {Number} y - Çizim Y koordinatı
     */
    drawContent(renderer, x, y) {
        const ctx = renderer.context;
        
        // Değeri 0-1 arasına normalize et
        const normalizedValue = Math.max(0, Math.min(1, (this.displayValue - this.minValue) / (this.maxValue - this.minValue)));
        
        // Pulse efekti
        let pulseScale = 1;
        if (this.pulseEffect) {
            const time = this.scene ? this.scene.time.time : (Date.now() / 1000);
            this.pulseValue = Math.sin(time * this.pulseSpeed) * 0.1 + 1;
            pulseScale = this.pulseValue;
        }
        
        // Gölge efekti
        if (this.dropShadow) {
            ctx.shadowColor = this.dropShadowColor;
            ctx.shadowBlur = this.dropShadowBlur;
            ctx.shadowOffsetX = this.dropShadowOffsetX;
            ctx.shadowOffsetY = this.dropShadowOffsetY;
        }
        
        // Kontur
        if (this.outline) {
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = this.outlineWidth;
            
            if (this.roundedCorners) {
                this._drawRoundedRect(ctx, x, y, this.width, this.height, this.cornerRadius);
                ctx.stroke();
            } else {
                ctx.strokeRect(x, y, this.width, this.height);
            }
        }
        
        // Arka plan çiz
        if (this.emptyImage && this.emptyImage.isLoaded) {
            ctx.drawImage(this.emptyImage, x, y, this.width, this.height);
        } else {
            ctx.fillStyle = this.emptyColor;
            
            if (this.roundedCorners) {
                this._drawRoundedRect(ctx, x, y, this.width, this.height, this.cornerRadius);
                ctx.fill();
            } else {
                ctx.fillRect(x, y, this.width, this.height);
            }
        }
        
        // Gölgeyi kapat (dolgu çizimini etkilemesin)
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Parçalı mod
        if (this.segmented) {
            this._drawSegmentedFill(ctx, x, y, normalizedValue);
        } else {
            // Sürekli mod
            this._drawContinuousFill(ctx, x, y, normalizedValue);
        }
        
        // Metni çiz
        if (this.showText) {
            this._drawText(ctx, x, y, normalizedValue);
        }
    }
    
    /**
     * Sürekli dolgu çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @param {Number} normalizedValue - 0-1 arası değer
     */
    _drawContinuousFill(ctx, x, y, normalizedValue) {
        let fillWidth, fillHeight, fillX, fillY;
        
        if (this.direction === 'horizontal') {
            fillWidth = Math.max(0, this.width * normalizedValue);
            fillHeight = this.height;
            fillX = x;
            fillY = y;
        } else {
            fillWidth = this.width;
            fillHeight = Math.max(0, this.height * normalizedValue);
            fillX = x;
            fillY = y + (this.height - fillHeight);
        }
        
        // Dolgu resmi
        if (this.fillImage && this.fillImage.isLoaded) {
            // Kırpma bölgesi ayarla
            ctx.save();
            
            if (this.roundedCorners) {
                this._drawRoundedRect(ctx, x, y, this.width, this.height, this.cornerRadius);
                ctx.clip();
            } else {
                ctx.beginPath();
                ctx.rect(x, y, this.width, this.height);
                ctx.clip();
            }
            
            // Dolgu resmini çiz
            ctx.drawImage(
                this.fillImage,
                fillX, fillY,
                fillWidth, fillHeight
            );
            
            ctx.restore();
        } else {
            // Gradient
            if (this.gradient) {
                let gradient;
                
                if (this.direction === 'horizontal') {
                    gradient = ctx.createLinearGradient(x, y, x + this.width, y);
                } else {
                    gradient = ctx.createLinearGradient(x, y + this.height, x, y);
                }
                
                // Gradient renkleri
                const stopCount = this.gradientColors.length;
                for (let i = 0; i < stopCount; i++) {
                    gradient.addColorStop(i / (stopCount - 1), this.gradientColors[i]);
                }
                
                ctx.fillStyle = gradient;
            } else {
                ctx.fillStyle = this.fillColor;
            }
            
            // Parlama efekti
            if (this.glowEffect) {
                ctx.shadowColor = this.glowColor;
                ctx.shadowBlur = 10;
            }
            
            if (this.roundedCorners) {
                // Kırpma bölgesi ile çiz
                ctx.save();
                
                this._drawRoundedRect(ctx, x, y, this.width, this.height, this.cornerRadius);
                ctx.clip();
                
                ctx.fillRect(fillX, fillY, fillWidth, fillHeight);
                
                ctx.restore();
            } else {
                ctx.fillRect(fillX, fillY, fillWidth, fillHeight);
            }
            
            // Parlama efektini kapat
            if (this.glowEffect) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0)';
                ctx.shadowBlur = 0;
            }
        }
    }
    
    /**
     * Parçalı dolgu çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @param {Number} normalizedValue - 0-1 arası değer
     */
    _drawSegmentedFill(ctx, x, y, normalizedValue) {
        const filledSegments = Math.floor(normalizedValue * this.segments);
        
        // Segment boyutunu hesapla
        let segmentWidth, segmentHeight;
        
        if (this.direction === 'horizontal') {
            segmentWidth = (this.width - (this.segments - 1) * this.segmentSpacing) / this.segments;
            segmentHeight = this.height - this.segmentGap * 2;
        } else {
            segmentWidth = this.width - this.segmentGap * 2;
            segmentHeight = (this.height - (this.segments - 1) * this.segmentSpacing) / this.segments;
        }
        
        // Gradient
        let gradient = null;
        if (this.gradient) {
            if (this.direction === 'horizontal') {
                gradient = ctx.createLinearGradient(x, y, x + this.width, y);
            } else {
                gradient = ctx.createLinearGradient(x, y + this.height, x, y);
            }
            
            // Gradient renkleri
            const stopCount = this.gradientColors.length;
            for (let i = 0; i < stopCount; i++) {
                gradient.addColorStop(i / (stopCount - 1), this.gradientColors[i]);
            }
        }
        
        // Parlama efekti
        if (this.glowEffect) {
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = 10;
        }
        
        // Segmentleri çiz
        for (let i = 0; i < this.segments; i++) {
            const isFilled = i < filledSegments;
            let segmentX, segmentY;
            
            if (this.direction === 'horizontal') {
                segmentX = x + i * (segmentWidth + this.segmentSpacing);
                segmentY = y + this.segmentGap;
            } else {
                segmentX = x + this.segmentGap;
                segmentY = y + this.height - (i + 1) * (segmentHeight + this.segmentSpacing);
            }
            
            if (isFilled) {
                // Dolu segment
                if (this.fillImage && this.fillImage.isLoaded) {
                    ctx.drawImage(
                        this.fillImage,
                        segmentX, segmentY,
                        segmentWidth, segmentHeight
                    );
                } else {
                    ctx.fillStyle = gradient || this.fillColor;
                    
                    if (this.roundedCorners) {
                        this._drawRoundedRect(ctx, segmentX, segmentY, segmentWidth, segmentHeight, this.cornerRadius / 2);
                        ctx.fill();
                    } else {
                        ctx.fillRect(segmentX, segmentY, segmentWidth, segmentHeight);
                    }
                }
            }
        }
        
        // Parlama efektini kapat
        if (this.glowEffect) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            ctx.shadowBlur = 0;
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
     * Metni çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @param {Number} normalizedValue - 0-1 arası değer
     */
    _drawText(ctx, x, y, normalizedValue) {
        // Metin formatı
        const text = this.textFormat
            .replace('{value}', Math.round(this.displayValue))
            .replace('{min}', this.minValue)
            .replace('{max}', this.maxValue)
            .replace('{percent}', Math.round(normalizedValue * 100));
        
        // Font ayarları
        ctx.font = this.textFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Metin gölgesi
        if (this.textShadow) {
            ctx.shadowColor = this.textShadowColor;
            ctx.shadowBlur = this.textShadowBlur;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
        }
        
        // Metin pozisyonu
        let textX = x + this.width / 2;
        let textY = y + this.height / 2;
        
        if (this.textPosition === 'left') {
            textX = x + 10;
            ctx.textAlign = 'left';
        } else if (this.textPosition === 'right') {
            textX = x + this.width - 10;
            ctx.textAlign = 'right';
        } else if (this.textPosition === 'top') {
            textY = y - 5 - this.textOffset;
            ctx.textBaseline = 'bottom';
        } else if (this.textPosition === 'bottom') {
            textY = y + this.height + 5 + this.textOffset;
            ctx.textBaseline = 'top';
        }
        
        // Metni çiz
        ctx.fillStyle = this.textColor;
        ctx.fillText(text, textX, textY);
        
        // Gölgeyi kapat
        if (this.textShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Değer animasyonu
        if (this.animateChanges && this.displayValue !== this.targetValue) {
            const diff = this.targetValue - this.displayValue;
            
            // Delta ile birlikte yumuşak geçiş
            let step = diff * this.animationSpeed * deltaTime;
            
            // Minimum adım büyüklüğü
            if (Math.abs(step) < 0.05) {
                step = Math.sign(step) * 0.05;
            }
            
            this.displayValue += step;
            
            // Hedef değeri aştıysa sınırla
            if ((diff > 0 && this.displayValue > this.targetValue) ||
                (diff < 0 && this.displayValue < this.targetValue)) {
                this.displayValue = this.targetValue;
            }
        }
    }
    
    /**
     * Değeri ayarlar
     * @param {Number} value - Yeni değer
     * @param {Boolean} animate - Animasyonlu geçiş
     */
    setValue(value, animate = true) {
        this.targetValue = Math.max(this.minValue, Math.min(this.maxValue, value));
        
        if (!animate) {
            this.displayValue = this.targetValue;
        }
    }
    
    /**
     * İlerlemeyi artırır
     * @param {Number} amount - Artış miktarı
     */
    increment(amount = 1) {
        this.setValue(this.targetValue + amount);
    }
    
    /**
     * İlerlemeyi azaltır
     * @param {Number} amount - Azalış miktarı
     */
    decrement(amount = 1) {
        this.setValue(this.targetValue - amount);
    }
}