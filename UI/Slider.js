/**
 * Slider.js - Kaydırıcı bileşeni
 * Değer ayarlamak için kaydırıcı kontrol oluşturur
 */
class Slider extends UIComponent {
    constructor(params = {}) {
        // Temel parametreleri üst sınıfa gönder
        super(params);
        
        // Slider özellikleri
        this.value = params.value !== undefined ? params.value : 50;
        this.minValue = params.minValue !== undefined ? params.minValue : 0;
        this.maxValue = params.maxValue !== undefined ? params.maxValue : 100;
        this.step = params.step !== undefined ? params.step : 1;
        this.orientation = params.orientation || 'horizontal'; // 'horizontal' veya 'vertical'
        this.trackWidth = params.trackWidth || (this.orientation === 'horizontal' ? this.width : 10);
        this.trackHeight = params.trackHeight || (this.orientation === 'vertical' ? this.height : 10);
        this.trackColor = params.trackColor || '#E0E0E0';
        this.trackActiveColor = params.trackActiveColor || '#4CAF50';
        this.handleSize = params.handleSize || 20;
        this.handleColor = params.handleColor || '#FFFFFF';
        this.handleBorderColor = params.handleBorderColor || '#CCCCCC';
        this.handleBorderWidth = params.handleBorderWidth || 2;
        this.showLabels = params.showLabels || false;
        this.labelFont = params.labelFont || '12px Arial';
        this.labelColor = params.labelColor || '#000000';
        this.labelPosition = params.labelPosition || 'bottom'; // 'top', 'bottom', 'left', 'right'
        this.labelFormat = params.labelFormat || '{value}';
        this.labelStep = params.labelStep || 0; // 0 = sadece min/max, diğer değerler = ara etiketler
        this.showTicks = params.showTicks || false;
        this.tickCount = params.tickCount || 5;
        this.tickColor = params.tickColor || '#AAAAAA';
        this.tickSize = params.tickSize || 5;
        this.showCurrentValue = params.showCurrentValue || false;
        this.snapToTicks = params.snapToTicks || false;
        this.roundedTrack = params.roundedTrack || false;
        this.roundedHandle = params.roundedHandle || true;
        this.handleImage = params.handleImage || null;
        this.hoverEffect = params.hoverEffect || false;
        this.hoverColor = params.hoverColor || '#EEEEEE';
        this.hoverScale = params.hoverScale || 1.1;
        this.animation = params.animation || false;
        this.animationSpeed = params.animationSpeed || 5;
        this.shadow = params.shadow || false;
        this.shadowColor = params.shadowColor || 'rgba(0, 0, 0, 0.3)';
        this.shadowBlur = params.shadowBlur || 5;
        this.shadowOffsetX = params.shadowOffsetX || 2;
        this.shadowOffsetY = params.shadowOffsetY || 2;
        this.disabled = params.disabled || false;
        this.disabledColor = params.disabledColor || '#CCCCCC';
        this.disabledOpacity = params.disabledOpacity || 0.5;
        
        // Olay işleyicileri
        this.onChange = params.onChange || null;
        this.onChangeEnd = params.onChangeEnd || null;
        
        // İç değişkenler
        this.isDragging = false;
        this.isHovered = false;
        this.displayValue = this.value;
        this.handlePosition = this._valueToPosition(this.value);
        this._lastChangeValue = this.value;
    }
    
    /**
     * İçeriği çizer
     * @param {Renderer} renderer - Renderer nesnesi
     * @param {Number} x - Çizim X koordinatı
     * @param {Number} y - Çizim Y koordinatı
     */
    drawContent(renderer, x, y) {
        const ctx = renderer.context;
        
        // Değeri pozisyona çevir
        this.handlePosition = this._valueToPosition(this.displayValue);
        
        // Gölge
        if (this.shadow) {
            ctx.shadowColor = this.shadowColor;
            ctx.shadowBlur = this.shadowBlur;
            ctx.shadowOffsetX = this.shadowOffsetX;
            ctx.shadowOffsetY = this.shadowOffsetY;
        }
        
        // Track yolu ve dolgu hesaplamaları
        let trackX, trackY, trackWidth, trackHeight;
        let fillX, fillY, fillWidth, fillHeight;
        let handleX, handleY;
        
        if (this.orientation === 'horizontal') {
            // Yatay kaydırıcı
            trackX = x;
            trackY = y + (this.height - this.trackHeight) / 2;
            trackWidth = this.width;
            trackHeight = this.trackHeight;
            
            fillX = trackX;
            fillY = trackY;
            fillWidth = this.handlePosition;
            fillHeight = trackHeight;
            
            handleX = trackX + this.handlePosition - this.handleSize / 2;
            handleY = trackY + trackHeight / 2 - this.handleSize / 2;
        } else {
            // Dikey kaydırıcı
            trackX = x + (this.width - this.trackWidth) / 2;
            trackY = y;
            trackWidth = this.trackWidth;
            trackHeight = this.height;
            
            // Dikey kaydırıcıda dolgu aşağıdan yukarı doğru
            fillX = trackX;
            fillY = trackY + trackHeight - this.handlePosition;
            fillWidth = trackWidth;
            fillHeight = this.handlePosition;
            
            handleX = trackX + trackWidth / 2 - this.handleSize / 2;
            handleY = trackY + trackHeight - this.handlePosition - this.handleSize / 2;
        }
        
        // Devre dışı stil
        if (this.disabled) {
            ctx.globalAlpha *= this.disabledOpacity;
        }
        
        // Track yolunu çiz
        ctx.fillStyle = this.disabled ? this.disabledColor : this.trackColor;
        
        if (this.roundedTrack) {
            // Yuvarlak köşeli track
            this._drawRoundedRect(
                ctx,
                trackX,
                trackY,
                trackWidth,
                trackHeight,
                trackHeight / 2
            );
            ctx.fill();
        } else {
            // Normal track
            ctx.fillRect(trackX, trackY, trackWidth, trackHeight);
        }
        
        // Aktif bölümü çiz
        ctx.fillStyle = this.disabled ? this.disabledColor : this.trackActiveColor;
        
        if (this.roundedTrack) {
            // Yuvarlak köşeli dolgu
            this._drawRoundedRect(
                ctx,
                fillX,
                fillY,
                fillWidth,
                fillHeight,
                fillHeight / 2
            );
            ctx.fill();
        } else {
            // Normal dolgu
            ctx.fillRect(fillX, fillY, fillWidth, fillHeight);
        }
        
        // Tick işaretleri
        if (this.showTicks) {
            this._drawTicks(ctx, trackX, trackY, trackWidth, trackHeight);
        }
        
        // Etiketler
        if (this.showLabels) {
            this._drawLabels(ctx, trackX, trackY, trackWidth, trackHeight);
        }
        
        // Gölgeyi kaydırıcı kısmı için kapat
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Kaydırıcı tutamağı
        if (this.handleImage && this.handleImage.isLoaded) {
            // Resimli tutamaç
            ctx.drawImage(
                this.handleImage,
                handleX,
                handleY,
                this.handleSize,
                this.handleSize
            );
        } else {
            // Temel tutamaç
            ctx.fillStyle = this.disabled ? this.disabledColor : (this.isHovered ? this.hoverColor : this.handleColor);
            
            if (this.roundedHandle) {
                // Yuvarlak tutamaç
                ctx.beginPath();
                ctx.arc(
                    handleX + this.handleSize / 2,
                    handleY + this.handleSize / 2,
                    this.handleSize / 2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                
                // Tutamaç kenarlığı
                if (this.handleBorderWidth > 0) {
                    ctx.strokeStyle = this.handleBorderColor;
                    ctx.lineWidth = this.handleBorderWidth;
                    ctx.stroke();
                }
            } else {
                // Kare tutamaç
                ctx.fillRect(handleX, handleY, this.handleSize, this.handleSize);
                
                // Tutamaç kenarlığı
                if (this.handleBorderWidth > 0) {
                    ctx.strokeStyle = this.handleBorderColor;
                    ctx.lineWidth = this.handleBorderWidth;
                    ctx.strokeRect(handleX, handleY, this.handleSize, this.handleSize);
                }
            }
        }
        
        // Mevcut değer gösterimi
        if (this.showCurrentValue) {
            this._drawCurrentValue(ctx, handleX, handleY);
        }
    }
    
    /**
     * Tick işaretlerini çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} trackX - Track X koordinatı
     * @param {Number} trackY - Track Y koordinatı
     * @param {Number} trackWidth - Track genişliği
     * @param {Number} trackHeight - Track yüksekliği
     */
    _drawTicks(ctx, trackX, trackY, trackWidth, trackHeight) {
        ctx.fillStyle = this.tickColor;
        
        const range = this.maxValue - this.minValue;
        
        for (let i = 0; i <= this.tickCount; i++) {
            const value = this.minValue + (range * i) / this.tickCount;
            const position = this._valueToPosition(value);
            
            if (this.orientation === 'horizontal') {
                // Yatay tick
                ctx.fillRect(
                    trackX + position - 1,
                    trackY - this.tickSize,
                    2,
                    this.tickSize * 2 + trackHeight
                );
            } else {
                // Dikey tick
                ctx.fillRect(
                    trackX - this.tickSize,
                    trackY + trackHeight - position - 1,
                    this.tickSize * 2 + trackWidth,
                    2
                );
            }
        }
    }
    
    /**
     * Etiketleri çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} trackX - Track X koordinatı
     * @param {Number} trackY - Track Y koordinatı
     * @param {Number} trackWidth - Track genişliği
     * @param {Number} trackHeight - Track yüksekliği
     */
    _drawLabels(ctx, trackX, trackY, trackWidth, trackHeight) {
        ctx.fillStyle = this.labelColor;
        ctx.font = this.labelFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Min ve max etiketleri
        const formatLabel = (value) => this.labelFormat.replace('{value}', value);
        const minLabel = formatLabel(this.minValue);
        const maxLabel = formatLabel(this.maxValue);
        
        // Etiket pozisyonu ayarları
        let labelOffsetX = 0;
        let labelOffsetY = 0;
        
        if (this.orientation === 'horizontal') {
            if (this.labelPosition === 'top') {
                labelOffsetY = -20;
            } else {
                // Default: bottom
                labelOffsetY = trackHeight + 20;
            }
        } else {
            if (this.labelPosition === 'left') {
                labelOffsetX = -20;
                ctx.textAlign = 'right';
            } else {
                // Default: right
                labelOffsetX = trackWidth + 20;
                ctx.textAlign = 'left';
            }
        }
        
        if (this.orientation === 'horizontal') {
            // Min etiketi
            ctx.fillText(
                minLabel,
                trackX,
                trackY + trackHeight / 2 + labelOffsetY
            );
            
            // Max etiketi
            ctx.fillText(
                maxLabel,
                trackX + trackWidth,
                trackY + trackHeight / 2 + labelOffsetY
            );
            
            // Ara etiketler
            if (this.labelStep > 0) {
                const range = this.maxValue - this.minValue;
                const steps = Math.floor(range / this.labelStep);
                
                for (let i = 1; i < steps; i++) {
                    const value = this.minValue + i * this.labelStep;
                    const position = this._valueToPosition(value);
                    
                    ctx.fillText(
                        formatLabel(value),
                        trackX + position,
                        trackY + trackHeight / 2 + labelOffsetY
                    );
                }
            }
        } else {
            // Min etiketi
            ctx.fillText(
                minLabel,
                trackX + trackWidth / 2 + labelOffsetX,
                trackY + trackHeight
            );
            
            // Max etiketi
            ctx.fillText(
                maxLabel,
                trackX + trackWidth / 2 + labelOffsetX,
                trackY
            );
            
            // Ara etiketler
            if (this.labelStep > 0) {
                const range = this.maxValue - this.minValue;
                const steps = Math.floor(range / this.labelStep);
                
                for (let i = 1; i < steps; i++) {
                    const value = this.minValue + i * this.labelStep;
                    const position = this._valueToPosition(value);
                    
                    ctx.fillText(
                        formatLabel(value),
                        trackX + trackWidth / 2 + labelOffsetX,
                        trackY + trackHeight - position
                    );
                }
            }
        }
    }
    
    /**
     * Mevcut değeri çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} handleX - Tutamaç X koordinatı
     * @param {Number} handleY - Tutamaç Y koordinatı
     */
    _drawCurrentValue(ctx, handleX, handleY) {
        ctx.fillStyle = this.labelColor;
        ctx.font = this.labelFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const valueText = this.labelFormat.replace('{value}', Math.round(this.displayValue));
        
        if (this.orientation === 'horizontal') {
            ctx.fillText(
                valueText,
                handleX + this.handleSize / 2,
                handleY - 15
            );
        } else {
            ctx.fillText(
                valueText,
                handleX + this.handleSize + 15,
                handleY + this.handleSize / 2
            );
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
     * Değeri pozisyona dönüştürür
     * @param {Number} value - Değer
     * @return {Number} Pozisyon
     */
    _valueToPosition(value) {
        const range = this.maxValue - this.minValue;
        const normalizedValue = (value - this.minValue) / range;
        
        if (this.orientation === 'horizontal') {
            return normalizedValue * this.width;
        } else {
            return normalizedValue * this.height;
        }
    }
    
    /**
     * Pozisyonu değere dönüştürür
     * @param {Number} position - Pozisyon
     * @return {Number} Değer
     */
    _positionToValue(position) {
        const range = this.maxValue - this.minValue;
        let normalizedPosition;
        
        if (this.orientation === 'horizontal') {
            normalizedPosition = Utils.clamp(position / this.width, 0, 1);
        } else {
            normalizedPosition = Utils.clamp(position / this.height, 0, 1);
        }
        
        // Step değerine göre yuvarla
        let value = this.minValue + normalizedPosition * range;
        
        if (this.step > 0) {
            value = Math.round(value / this.step) * this.step;
        }
        
        // Tick'lere yap
        if (this.snapToTicks && this.tickCount > 0) {
            const tickStep = range / this.tickCount;
            value = Math.round(value / tickStep) * tickStep;
        }
        
        return Utils.clamp(value, this.minValue, this.maxValue);
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Animasyon
        if (this.animation && this.displayValue !== this.value) {
            const diff = this.value - this.displayValue;
            
            if (Math.abs(diff) < 0.1) {
                this.displayValue = this.value;
            } else {
                this.displayValue += diff * this.animationSpeed * deltaTime;
            }
        } else {
            this.displayValue = this.value;
        }
    }
    
    /**
     * Dokunma başlangıç olayı
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    onTouchStart(x, y) {
        super.onTouchStart(x, y);
        
        if (this.disabled) return;
        
        this.isDragging = true;
        this._updateValueFromTouch(x, y);
        
        // Son değeri kaydet
        this._lastChangeValue = this.value;
    }
    
    /**
     * Dokunma hareket olayı
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    onTouchMove(x, y) {
        super.onTouchMove(x, y);
        
        if (!this.isDragging || this.disabled) return;
        
        this._updateValueFromTouch(x, y);
    }
    
    /**
     * Dokunma bitiş olayı
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    onTouchEnd(x, y) {
        super.onTouchEnd(x, y);
        
        if (!this.isDragging || this.disabled) return;
        
        this.isDragging = false;
        
        // Değişim sonu olayı (sadece değer değiştiyse)
        if (this.onChangeEnd && this._lastChangeValue !== this.value) {
            this.onChangeEnd(this.value);
        }
    }
    
    /**
     * Dokunma pozisyonundan değeri günceller
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    _updateValueFromTouch(x, y) {
        // Yerel koordinatlara çevir
        const rect = this.worldToLocal(x, y);
        
        // Pozisyonu değere çevir
        let position;
        
        if (this.orientation === 'horizontal') {
            position = Utils.clamp(rect.x, 0, this.width);
        } else {
            // Dikey kaydırıcıda, aşağıdan yukarı doğru değer artar
            position = this.height - Utils.clamp(rect.y, 0, this.height);
        }
        
        // Yeni değer
        const newValue = this._positionToValue(position);
        
        // Değer değiştiyse
        if (newValue !== this.value) {
            this.setValue(newValue);
            
            // Değişim olayı
            if (this.onChange) {
                this.onChange(this.value);
            }
        }
    }
    
    /**
     * Değeri ayarlar
     * @param {Number} value - Yeni değer
     * @param {Boolean} animate - Animasyonlu geçiş
     */
    setValue(value, animate = false) {
        // Sınırlar içinde kısıtla
        value = Utils.clamp(value, this.minValue, this.maxValue);
        
        // Step değerine göre yuvarla
        if (this.step > 0) {
            value = Math.round(value / this.step) * this.step;
        }
        
        this.value = value;
        
        if (!animate) {
            this.displayValue = value;
        }
    }
    
    /**
     * Kaydırıcıyı etkinleştirir/devre dışı bırakır
     * @param {Boolean} disabled - Devre dışı mı
     */
    setDisabled(disabled) {
        this.disabled = disabled;
    }
}