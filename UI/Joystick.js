/**
 * Joystick.js - Sanal joystick bileşeni
 * Mobil oyunlar için dokunmatik kontroller sağlar
 */
class Joystick extends UIComponent {
    constructor(params = {}) {
        // Temel parametreleri üst sınıfa gönder
        super(params);
        
        // Joystick özellikleri
        this.outerRadius = params.outerRadius || 100;
        this.innerRadius = params.innerRadius || 40;
        this.outerColor = params.outerColor || 'rgba(50, 50, 50, 0.5)';
        this.innerColor = params.innerColor || 'rgba(100, 100, 100, 0.8)';
        this.outerStrokeColor = params.outerStrokeColor || 'rgba(100, 100, 100, 0.8)';
        this.innerStrokeColor = params.innerStrokeColor || 'rgba(200, 200, 200, 0.8)';
        this.outerStrokeWidth = params.outerStrokeWidth || 2;
        this.innerStrokeWidth = params.innerStrokeWidth || 2;
        this.movable = params.movable !== undefined ? params.movable : false;
        this.resetOnRelease = params.resetOnRelease !== undefined ? params.resetOnRelease : true;
        this.maxDistance = params.maxDistance || this.outerRadius;
        this.deadZone = params.deadZone || 0.1;
        this.stickMode = params.stickMode || 'all'; // 'all', 'horizontal', 'vertical', '4-way'
        this.snapStick = params.snapStick || false; // Snap to 4 or 8 directions
        this.snapAngles = params.snapAngles || 8; // Number of snap directions (4 or 8)
        this.stickImage = params.stickImage || null;
        this.baseImage = params.baseImage || null;
        this.opacity = params.opacity || 0.7;
        this.autoHide = params.autoHide || false;
        this.fadeInSpeed = params.fadeInSpeed || 5;
        this.fadeOutSpeed = params.fadeOutSpeed || 3;
        this.activeOpacity = params.activeOpacity || this.opacity;
        this.inactiveOpacity = params.inactiveOpacity || 0.3;
        this.useSpring = params.useSpring || false;
        this.springStrength = params.springStrength || 5;
        this.useAxisIndicators = params.useAxisIndicators || false;
        this.axisIndicatorColor = params.axisIndicatorColor || 'rgba(255, 255, 255, 0.3)';
        this.axisLabelColor = params.axisLabelColor || '#FFFFFF';
        this.axisLabelFont = params.axisLabelFont || '14px Arial';
        this.leftLabel = params.leftLabel || '';
        this.rightLabel = params.rightLabel || '';
        this.upLabel = params.upLabel || '';
        this.downLabel = params.downLabel || '';
        this.feedbackOnTouch = params.feedbackOnTouch || false; // Vibration feedback
        this.feedbackDuration = params.feedbackDuration || 20; // Vibration duration in ms
        this.useShadow = params.useShadow || false;
        this.shadowColor = params.shadowColor || 'rgba(0, 0, 0, 0.5)';
        this.shadowBlur = params.shadowBlur || 10;
        this.shadowOffsetX = params.shadowOffsetX || 2;
        this.shadowOffsetY = params.shadowOffsetY || 2;
        
        // Olay işleyicileri
        this.onMove = params.onMove || null;
        this.onStart = params.onStart || null;
        this.onEnd = params.onEnd || null;
        
        // İç değişkenler
        this.active = false;
        this.innerX = 0;
        this.innerY = 0;
        this.angle = 0;
        this.distance = 0;
        this.normalizedX = 0;
        this.normalizedY = 0;
        this.startX = 0;
        this.startY = 0;
        this.touchIdentifier = null;
        this.currentOpacity = this.autoHide ? 0 : this.opacity;
        this.touchStartTime = 0;
        
        // Ayarları kapat
        this.width = this.outerRadius * 2;
        this.height = this.outerRadius * 2;
    }
    
    /**
     * İçeriği çizer
     * @param {Renderer} renderer - Renderer nesnesi
     * @param {Number} x - Çizim X koordinatı
     * @param {Number} y - Çizim Y koordinatı
     */
    drawContent(renderer, x, y) {
        const ctx = renderer.context;
        
        // Opaklığı ayarla
        ctx.globalAlpha *= this.currentOpacity;
        
        // Merkez koordinatları
        const centerX = x + this.width / 2;
        const centerY = y + this.height / 2;
        
        // Gölge
        if (this.useShadow) {
            ctx.shadowColor = this.shadowColor;
            ctx.shadowBlur = this.shadowBlur;
            ctx.shadowOffsetX = this.shadowOffsetX;
            ctx.shadowOffsetY = this.shadowOffsetY;
        }
        
        // Dış daire (joystick tabanı)
        if (this.baseImage && this.baseImage.isLoaded) {
            // Resimli taban
            ctx.drawImage(
                this.baseImage,
                centerX - this.outerRadius,
                centerY - this.outerRadius,
                this.outerRadius * 2,
                this.outerRadius * 2
            );
        } else {
            // Normal taban
            ctx.fillStyle = this.outerColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.outerRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Dış çizgi
            ctx.strokeStyle = this.outerStrokeColor;
            ctx.lineWidth = this.outerStrokeWidth;
            ctx.stroke();
        }
        
        // Eksen göstergelerini çiz
        if (this.useAxisIndicators) {
            this._drawAxisIndicators(ctx, centerX, centerY);
        }
        
        // Gölgeyi kapat (joystick için)
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // İç daire (joystick)
        if (this.stickImage && this.stickImage.isLoaded) {
            // Resimli joystick
            ctx.drawImage(
                this.stickImage,
                centerX + this.innerX - this.innerRadius,
                centerY + this.innerY - this.innerRadius,
                this.innerRadius * 2,
                this.innerRadius * 2
            );
        } else {
            // Normal joystick
            ctx.fillStyle = this.innerColor;
            ctx.beginPath();
            ctx.arc(centerX + this.innerX, centerY + this.innerY, this.innerRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // İç çizgi
            ctx.strokeStyle = this.innerStrokeColor;
            ctx.lineWidth = this.innerStrokeWidth;
            ctx.stroke();
        }
    }
    
    /**
     * Eksen göstergelerini çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} centerX - Merkez X koordinatı
     * @param {Number} centerY - Merkez Y koordinatı
     */
    _drawAxisIndicators(ctx, centerX, centerY) {
        ctx.fillStyle = this.axisIndicatorColor;
        
        if (this.stickMode === 'all' || this.stickMode === 'horizontal') {
            // Yatay eksen
            ctx.fillRect(
                centerX - this.outerRadius,
                centerY - 1,
                this.outerRadius * 2,
                2
            );
            
            // Etiketler
            if (this.leftLabel || this.rightLabel) {
                ctx.fillStyle = this.axisLabelColor;
                ctx.font = this.axisLabelFont;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                if (this.leftLabel) {
                    ctx.fillText(
                        this.leftLabel,
                        centerX - this.outerRadius * 0.7,
                        centerY - 20
                    );
                }
                
                if (this.rightLabel) {
                    ctx.fillText(
                        this.rightLabel,
                        centerX + this.outerRadius * 0.7,
                        centerY - 20
                    );
                }
            }
        }
        
        if (this.stickMode === 'all' || this.stickMode === 'vertical') {
            // Dikey eksen
            ctx.fillStyle = this.axisIndicatorColor;
            ctx.fillRect(
                centerX - 1,
                centerY - this.outerRadius,
                2,
                this.outerRadius * 2
            );
            
            // Etiketler
            if (this.upLabel || this.downLabel) {
                ctx.fillStyle = this.axisLabelColor;
                ctx.font = this.axisLabelFont;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                if (this.upLabel) {
                    ctx.fillText(
                        this.upLabel,
                        centerX + 20,
                        centerY - this.outerRadius * 0.7
                    );
                }
                
                if (this.downLabel) {
                    ctx.fillText(
                        this.downLabel,
                        centerX + 20,
                        centerY + this.outerRadius * 0.7
                    );
                }
            }
        }
        
        if (this.stickMode === '4-way') {
            // 4 yönlü eksenler
            ctx.fillStyle = this.axisIndicatorColor;
            
            // Yatay eksen
            ctx.fillRect(
                centerX - this.outerRadius,
                centerY - 1,
                this.outerRadius * 2,
                2
            );
            
            // Dikey eksen
            ctx.fillRect(
                centerX - 1,
                centerY - this.outerRadius,
                2,
                this.outerRadius * 2
            );
            
            // Etiketler
            ctx.fillStyle = this.axisLabelColor;
            ctx.font = this.axisLabelFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (this.upLabel) {
                ctx.fillText(
                    this.upLabel,
                    centerX,
                    centerY - this.outerRadius * 0.7
                );
            }
            
            if (this.rightLabel) {
                ctx.fillText(
                    this.rightLabel,
                    centerX + this.outerRadius * 0.7,
                    centerY
                );
            }
            
            if (this.downLabel) {
                ctx.fillText(
                    this.downLabel,
                    centerX,
                    centerY + this.outerRadius * 0.7
                );
            }
            
            if (this.leftLabel) {
                ctx.fillText(
                    this.leftLabel,
                    centerX - this.outerRadius * 0.7,
                    centerY
                );
            }
        }
    }
    
    /**
     * Joystick pozisyonunu normalleştirir
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @return {Object} Normalleştirilmiş koordinatlar
     */
    _normalizePosition(x, y) {
        let normalizedX = 0;
        let normalizedY = 0;
        let angle = 0;
        let distance = Math.sqrt(x * x + y * y);
        
        if (distance > 0) {
            // Uzaklığı 0-1 arasına normalleştir
            const normalizedDistance = distance / this.maxDistance;
            
            // Ölü bölge kontrolü
            if (normalizedDistance < this.deadZone) {
                return { x: 0, y: 0, angle: 0, distance: 0 };
            }
            
            // Açıyı hesapla
            angle = Math.atan2(y, x);
            
            // Snap modu
            if (this.snapStick) {
                const snapAngle = (Math.PI * 2) / this.snapAngles;
                angle = Math.round(angle / snapAngle) * snapAngle;
            }
            
            // Joystick moduna göre kısıtla
            if (this.stickMode === 'horizontal') {
                normalizedX = Utils.clamp(x / this.maxDistance, -1, 1);
                normalizedY = 0;
            } else if (this.stickMode === 'vertical') {
                normalizedX = 0;
                normalizedY = Utils.clamp(y / this.maxDistance, -1, 1);
            } else if (this.stickMode === '4-way') {
                // Hangi yönün daha fazla olduğuna bak
                if (Math.abs(x) > Math.abs(y)) {
                    normalizedX = x > 0 ? 1 : -1;
                    normalizedY = 0;
                } else {
                    normalizedX = 0;
                    normalizedY = y > 0 ? 1 : -1;
                }
            } else {
                // Tüm yönler
                normalizedX = Utils.clamp(x / this.maxDistance, -1, 1);
                normalizedY = Utils.clamp(y / this.maxDistance, -1, 1);
            }
            
            // Gerçek uzaklık
            const realDistance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
            
            // 1 üzerindeki değerleri kısıtla
            if (realDistance > 1) {
                normalizedX /= realDistance;
                normalizedY /= realDistance;
            }
        }
        
        return { x: normalizedX, y: normalizedY, angle, distance: Utils.clamp(distance / this.maxDistance, 0, 1) };
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Otomatik gizleme - solma animasyonları
        if (this.autoHide) {
            if (this.active) {
                // Kademeli olarak göster
                this.currentOpacity = Utils.lerp(
                    this.currentOpacity,
                    this.activeOpacity,
                    deltaTime * this.fadeInSpeed
                );
            } else {
                // Kademeli olarak gizle
                this.currentOpacity = Utils.lerp(
                    this.currentOpacity,
                    this.inactiveOpacity,
                    deltaTime * this.fadeOutSpeed
                );
            }
        }
        
        // Yay efekti
        if (this.useSpring && !this.active && (this.innerX !== 0 || this.innerY !== 0)) {
            // Kademeli olarak merkeze döndür
            this.innerX = Utils.lerp(this.innerX, 0, deltaTime * this.springStrength);
            this.innerY = Utils.lerp(this.innerY, 0, deltaTime * this.springStrength);
            
            // Hareket değeri çok küçükse sıfırla
            if (Math.abs(this.innerX) < 0.1 && Math.abs(this.innerY) < 0.1) {
                this.innerX = 0;
                this.innerY = 0;
            }
            
            // Değerleri güncelle
            const result = this._normalizePosition(this.innerX, this.innerY);
            
            this.normalizedX = result.x;
            this.normalizedY = result.y;
            this.angle = result.angle;
            this.distance = result.distance;
            
            // Hareket olayını tetikle
            if (this.onMove) {
                this.onMove(this.normalizedX, this.normalizedY, this.angle, this.distance);
            }
        }
    }
    
    /**
     * Dokunma başlangıç olayı
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    onTouchStart(x, y) {
        super.onTouchStart(x, y);
        
        // Dokunma kimliğini kaydet
        const input = Input.getInstance();
        this.touchIdentifier = input.touches.length > 0 ? input.touches[0].identifier : null;
        
        // Dokunma zamanını kaydet
        this.touchStartTime = Date.now();
        
        // Joystick'i hareketli modda başlangıç noktasına taşı
        if (this.movable) {
            this.x = x - this.width / 2;
            this.y = y - this.height / 2;
            
            this.startX = this.x + this.width / 2;
            this.startY = this.y + this.height / 2;
        } else {
            // Joystick merkezi
            this.startX = this.x + this.width / 2;
            this.startY = this.y + this.height / 2;
        }
        
        // Aktif
        this.active = true;
        
        // İç joystick pozisyonunu ayarla
        this._updateJoystickPosition(x, y);
        
        // Başlangıç olayını tetikle
        if (this.onStart) {
            this.onStart(this.normalizedX, this.normalizedY, this.angle, this.distance);
        }
        
        // Geri bildirim (titreşim)
        if (this.feedbackOnTouch && 'vibrate' in navigator) {
            try {
                navigator.vibrate(this.feedbackDuration);
            } catch (e) {
                // Titreşim özelliği desteklenmiyorsa veya hata oluşursa sessizce devam et
            }
        }
    }
    
    /**
     * Dokunma hareket olayı
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    onTouchMove(x, y) {
        super.onTouchMove(x, y);
        
        if (!this.active) return;
        
        // Dokunma kimliğini kontrol et
        const input = Input.getInstance();
        const touch = input.touches.find(t => t.identifier === this.touchIdentifier);
        
        // Eğer bu dokunma artık yoksa, işlemi sonlandır
        if (!touch) {
            this.onTouchEnd(x, y);
            return;
        }
        
        // İç joystick pozisyonunu ayarla
        this._updateJoystickPosition(x, y);
    }
    
    /**
     * Dokunma bitiş olayı
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    onTouchEnd(x, y) {
        super.onTouchEnd(x, y);
        
        if (!this.active) return;
        
        // Aktif değil
        this.active = false;
        
        // Merkeze döndür
        if (this.resetOnRelease && !this.useSpring) {
            this.innerX = 0;
            this.innerY = 0;
            this.normalizedX = 0;
            this.normalizedY = 0;
            this.angle = 0;
            this.distance = 0;
        }
        
        // Bitiş olayını tetikle
        if (this.onEnd) {
            this.onEnd(this.normalizedX, this.normalizedY, this.angle, this.distance);
        }
    }
    
    /**
     * İç joystick pozisyonunu günceller
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    _updateJoystickPosition(x, y) {
        // Joystick başlangıç noktasına göre fark
        const dx = x - this.startX;
        const dy = y - this.startY;
        
        // Uzaklık
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        // Maksimum uzaklığı kısıtla
        if (distance > this.maxDistance) {
            const ratio = this.maxDistance / distance;
            distance = this.maxDistance;
            this.innerX = dx * ratio;
            this.innerY = dy * ratio;
        } else {
            this.innerX = dx;
            this.innerY = dy;
        }
        
        // Değerleri normalleştir
        const result = this._normalizePosition(this.innerX, this.innerY);
        
        this.normalizedX = result.x;
        this.normalizedY = result.y;
        this.angle = result.angle;
        this.distance = result.distance;
        
        // Hareket olayını tetikle
        if (this.onMove) {
            this.onMove(this.normalizedX, this.normalizedY, this.angle, this.distance);
        }
    }
    
    /**
     * Normalleştirilmiş pozisyonu alır
     * @return {Object} - X ve Y değerleri (-1 ile 1 arasında)
     */
    getValue() {
        return {
            x: this.normalizedX,
            y: this.normalizedY,
            angle: this.angle,
            distance: this.distance
        };
    }
    
    /**
     * Joystick'i belirli bir pozisyona ayarlar
     * @param {Number} x - Normalleştirilmiş X değeri (-1 ile 1 arasında)
     * @param {Number} y - Normalleştirilmiş Y değeri (-1 ile 1 arasında)
     */
    setValue(x, y) {
        // Değerleri kısıtla
        x = Utils.clamp(x, -1, 1);
        y = Utils.clamp(y, -1, 1);
        
        // İç değerleri ayarla
        this.normalizedX = x;
        this.normalizedY = y;
        
        // İç joystick pozisyonunu güncelle
        this.innerX = x * this.maxDistance;
        this.innerY = y * this.maxDistance;
        
        // Uzaklık ve açıyı hesapla
        this.distance = Math.sqrt(x * x + y * y);
        this.angle = Math.atan2(y, x);
    }
}