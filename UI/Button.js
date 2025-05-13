/**
 * Button.js - Düğme bileşeni
 * Kullanıcı arayüzünde etkileşimli düğmeler oluşturur
 */
class Button extends UIComponent {
    constructor(params = {}) {
        // Temel parametreleri üst sınıfa gönder
        super(params);
        
        // Düğme özellikleri
        this.text = params.text || "";
        this.textColor = params.textColor || "#FFFFFF";
        this.font = params.font || "20px Arial";
        this.textAlign = params.textAlign || "center";
        this.textBaseline = params.textBaseline || "middle";
        
        // Durumlar
        this.normalState = {
            backgroundColor: params.backgroundColor || "#4444FF",
            textColor: params.textColor || "#FFFFFF",
            scale: 1.0
        };
        
        this.hoverState = {
            backgroundColor: params.hoverBackgroundColor || this._lightenColor(this.normalState.backgroundColor, 20),
            textColor: params.hoverTextColor || this.normalState.textColor,
            scale: params.hoverScale || 1.05
        };
        
        this.pressedState = {
            backgroundColor: params.pressedBackgroundColor || this._darkenColor(this.normalState.backgroundColor, 20),
            textColor: params.pressedTextColor || this.normalState.textColor,
            scale: params.pressedScale || 0.95
        };
        
        this.disabledState = {
            backgroundColor: params.disabledBackgroundColor || "#AAAAAA",
            textColor: params.disabledTextColor || "#666666",
            scale: 1.0
        };
        
        // İkon
        this.icon = params.icon || null;
        this.iconWidth = params.iconWidth || 0;
        this.iconHeight = params.iconHeight || 0;
        this.iconAlignment = params.iconAlignment || "left"; // left, right, top, bottom
        this.iconPadding = params.iconPadding || 5;
        this.iconTint = params.iconTint || null;
        
        // Animasyon ayarları
        this.animationDuration = params.animationDuration || 0.1;
        this.animationTimer = 0;
        this.animationStartScale = 1.0;
        this.animationTargetScale = 1.0;
        
        // Durum değişkenleri
        this.isPressed = false;
        this.isHovered = false;
        this.isEnabled = params.enabled !== undefined ? params.enabled : true;
        this.isAnimating = false;
        
        // Görsel durum
        this.currentState = this.normalState;
        this.backgroundColor = this.currentState.backgroundColor;
        this.currentScale = this.currentState.scale;
        
        // Olay işleyicileri
        this.onClick = params.onClick || null;
        
        // Ses
        this.clickSound = params.clickSound || null;
    }
    
    /**
     * İçeriği çizer
     * @param {Renderer} renderer - Renderer nesnesi
     * @param {Number} x - Çizim X koordinatı
     * @param {Number} y - Çizim Y koordinatı
     */
    drawContent(renderer, x, y) {
        const ctx = renderer.context;
        
        // İkonu çiz
        if (this.icon && this.icon.isLoaded) {
            let iconX = 0;
            let iconY = 0;
            
            // İkon hizalama
            switch (this.iconAlignment) {
                case "left":
                    iconX = x + this.iconPadding;
                    iconY = y + (this.height - this.iconHeight) / 2;
                    break;
                case "right":
                    iconX = x + this.width - this.iconWidth - this.iconPadding;
                    iconY = y + (this.height - this.iconHeight) / 2;
                    break;
                case "top":
                    iconX = x + (this.width - this.iconWidth) / 2;
                    iconY = y + this.iconPadding;
                    break;
                case "bottom":
                    iconX = x + (this.width - this.iconWidth) / 2;
                    iconY = y + this.height - this.iconHeight - this.iconPadding;
                    break;
                default:
                    iconX = x + (this.width - this.iconWidth) / 2;
                    iconY = y + (this.height - this.iconHeight) / 2;
            }
            
            renderer.drawImage(
                this.icon,
                iconX,
                iconY,
                this.iconWidth,
                this.iconHeight
            );
        }
        
        // Metni çiz
        if (this.text) {
            ctx.fillStyle = this.currentState.textColor;
            ctx.font = this.font;
            ctx.textAlign = this.textAlign;
            ctx.textBaseline = this.textBaseline;
            
            let textX = x + this.width / 2;
            let textY = y + this.height / 2;
            
            // İkona göre metin konumunu ayarla
            if (this.icon && this.icon.isLoaded) {
                switch (this.iconAlignment) {
                    case "left":
                        textX = x + this.width / 2 + this.iconWidth / 2;
                        break;
                    case "right":
                        textX = x + this.width / 2 - this.iconWidth / 2;
                        break;
                    case "top":
                        textY = y + this.height / 2 + this.iconHeight / 2;
                        break;
                    case "bottom":
                        textY = y + this.height / 2 - this.iconHeight / 2;
                        break;
                }
            }
            
            ctx.fillText(this.text, textX, textY);
        }
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Animasyon
        if (this.isAnimating) {
            this.animationTimer += deltaTime;
            
            if (this.animationTimer >= this.animationDuration) {
                // Animasyon tamamlandı
                this.isAnimating = false;
                this.scaleX = this.animationTargetScale;
                this.scaleY = this.animationTargetScale;
            } else {
                // Animasyon devam ediyor
                const progress = this.animationTimer / this.animationDuration;
                const scale = this.animationStartScale + (this.animationTargetScale - this.animationStartScale) * progress;
                
                this.scaleX = scale;
                this.scaleY = scale;
            }
        }
    }
    
    /**
     * Düğme durumunu günceller
     */
    updateState() {
        if (!this.isEnabled) {
            this.currentState = this.disabledState;
        } else if (this.isPressed) {
            this.currentState = this.pressedState;
        } else if (this.isHovered) {
            this.currentState = this.hoverState;
        } else {
            this.currentState = this.normalState;
        }
        
        // Görünümü güncelle
        this.backgroundColor = this.currentState.backgroundColor;
        
        // Ölçek animasyonu
        this.startScaleAnimation(this.currentState.scale);
    }
    
    /**
     * Ölçek animasyonu başlatır
     * @param {Number} targetScale - Hedef ölçek
     */
    startScaleAnimation(targetScale) {
        this.isAnimating = true;
        this.animationTimer = 0;
        this.animationStartScale = this.scaleX;
        this.animationTargetScale = targetScale;
    }
    
    /**
     * Dokunma başlangıç olayı
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    onTouchStart(x, y) {
        super.onTouchStart(x, y);
        
        if (!this.isEnabled) return;
        
        this.isPressed = true;
        this.updateState();
    }
    
    /**
     * Dokunma hareket olayı
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    onTouchMove(x, y) {
        super.onTouchMove(x, y);
        
        if (!this.isEnabled) return;
        
        // Dokunma düğme üzerinde mi kontrol et
        const isOver = this.hitTest(x, y);
        
        if (isOver !== this.isPressed) {
            this.isPressed = isOver;
            this.updateState();
        }
    }
    
    /**
     * Dokunma bitiş olayı
     * @param {Number} x - Dokunma X koordinatı
     * @param {Number} y - Dokunma Y koordinatı
     */
    onTouchEnd(x, y) {
        super.onTouchEnd(x, y);
        
        if (!this.isEnabled) return;
        
        // Düğme basılıysa ve dokunma düğme üzerinde bittiyse
        if (this.isPressed && this.hitTest(x, y)) {
            this.click();
        }
        
        this.isPressed = false;
        this.updateState();
    }
    
    /**
     * Düğme tıklama olayı
     */
    click() {
        if (!this.isEnabled) return;
        
        // Tıklama sesi çal
        if (this.clickSound) {
            const audio = Audio.getInstance();
            audio.playSound(this.clickSound);
        }
        
        // Tıklama olayını çağır
        if (this.onClick) {
            this.onClick();
        }
    }
    
    /**
     * Düğmeyi etkinleştirir/devre dışı bırakır
     * @param {Boolean} enabled - Etkin mi
     */
    setEnabled(enabled) {
        if (this.isEnabled !== enabled) {
            this.isEnabled = enabled;
            this.updateState();
        }
    }
    
    /**
     * Düğme metnini değiştirir
     * @param {String} text - Yeni metin
     */
    setText(text) {
        this.text = text;
    }
    
    /**
     * Düğme ikonunu değiştirir
     * @param {Image} icon - Yeni ikon
     * @param {Number} width - İkon genişliği
     * @param {Number} height - İkon yüksekliği
     */
    setIcon(icon, width, height) {
        this.icon = icon;
        this.iconWidth = width || this.iconWidth;
        this.iconHeight = height || this.iconHeight;
    }
    
    /**
     * Renk açma işlemi
     * @param {String} color - Renk
     * @param {Number} percent - Açma yüzdesi
     * @return {String} Açık renk
     */
    _lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return "#" + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }
    
    /**
     * Renk koyulaştırma işlemi
     * @param {String} color - Renk
     * @param {Number} percent - Koyulaştırma yüzdesi
     * @return {String} Koyu renk
     */
    _darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return "#" + (
            0x1000000 +
            (R > 0 ? R : 0) * 0x10000 +
            (G > 0 ? G : 0) * 0x100 +
            (B > 0 ? B : 0)
        ).toString(16).slice(1);
    }
}