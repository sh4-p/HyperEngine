/**
 * Text.js - Metin bileşeni
 * Oyun arayüzünde metin öğelerini gösterir
 */
class Text extends UIComponent {
    constructor(params = {}) {
        // Temel parametreleri üst sınıfa gönder
        super(params);
        
        // Metin özellikleri
        this.text = params.text || "";
        this.font = params.font || "16px Arial";
        this.color = params.color || "#FFFFFF";
        this.align = params.align || "center"; // left, center, right
        this.baseline = params.baseline || "middle"; // top, middle, bottom
        this.shadowColor = params.shadowColor || null;
        this.shadowBlur = params.shadowBlur || 0;
        this.shadowOffsetX = params.shadowOffsetX || 0;
        this.shadowOffsetY = params.shadowOffsetY || 0;
        this.maxWidth = params.maxWidth || 0; // 0 = sınırsız
        this.lineHeight = params.lineHeight || 1.2; // satır yükseklik çarpanı
        this.strokeColor = params.strokeColor || null;
        this.strokeWidth = params.strokeWidth || 0;
        this.gradient = params.gradient || null; // { start: { x, y }, end: { x, y }, colors: [{pos, color}] }
        this.autoSize = params.autoSize !== undefined ? params.autoSize : true;
        this.textWrap = params.textWrap !== undefined ? params.textWrap : false;
        this.textOverflow = params.textOverflow || "ellipsis"; // "ellipsis", "clip", "visible"
        this.outline = params.outline || false;
        this.outlineColor = params.outlineColor || "#000000";
        this.outlineWidth = params.outlineWidth || 2;
        
        // Metin biçimlendirme seçenekleri
        this.bold = params.bold || false;
        this.italic = params.italic || false;
        this.underline = params.underline || false;
        this.uppercase = params.uppercase || false;
        this.lowercase = params.lowercase || false;
        this.capitalize = params.capitalize || false;
        
        // Animasyon seçenekleri
        this.bounce = params.bounce || false;
        this.bounceHeight = params.bounceHeight || 5;
        this.bounceSpeed = params.bounceSpeed || 2;
        this.rotation = params.rotation || 0;
        this.rotationSpeed = params.rotationSpeed || 0;
        this.scale = params.scale || 1;
        this.scaleSpeed = params.scaleSpeed || 0;
        this.fadeIn = params.fadeIn || false;
        this.fadeInSpeed = params.fadeInSpeed || 1;
        this.colorCycle = params.colorCycle || false;
        this.colorCycleSpeed = params.colorCycleSpeed || 1;
        this.colorCycleColors = params.colorCycleColors || ["#FF0000", "#00FF00", "#0000FF"];
        
        // Animasyon değişkenleri
        this._bounceOffset = 0;
        this._fadeAlpha = 0;
        this._colorCycleIndex = 0;
        
        // Otomatik boyutlandırma
        if (this.autoSize) {
            this._updateDimensions();
        }
    }
    
    /**
     * İçeriği çizer
     * @param {Renderer} renderer - Renderer nesnesi
     * @param {Number} x - Çizim X koordinatı
     * @param {Number} y - Çizim Y koordinatı
     */
    drawContent(renderer, x, y) {
        if (!this.text) return;
        
        const ctx = renderer.context;
        
        // Metin stilini ayarla
        this._setupTextStyle(ctx);
        
        // Animasyonları uygula
        this._applyAnimations(ctx, x, y);
        
        // Metni çiz
        if (this.textWrap) {
            this._drawWrappedText(ctx, x, y);
        } else {
            this._drawSingleLineText(ctx, x, y);
        }
        
        // Varsayılan ayarları geri yükle
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.shadowColor = "rgba(0, 0, 0, 0)";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    /**
     * Metin stilini ayarlar
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    _setupTextStyle(ctx) {
        // Font stilleri
        let fontStyle = '';
        
        if (this.bold) fontStyle += 'bold ';
        if (this.italic) fontStyle += 'italic ';
        
        ctx.font = `${fontStyle}${this.font}`;
        
        // Tekst hizalama
        ctx.textAlign = this.align;
        ctx.textBaseline = this.baseline;
        
        // Gölge
        if (this.shadowColor) {
            ctx.shadowColor = this.shadowColor;
            ctx.shadowBlur = this.shadowBlur;
            ctx.shadowOffsetX = this.shadowOffsetX;
            ctx.shadowOffsetY = this.shadowOffsetY;
        }
        
        // Gradyan
        if (this.gradient) {
            const grad = ctx.createLinearGradient(
                this.gradient.start.x, this.gradient.start.y,
                this.gradient.end.x, this.gradient.end.y
            );
            
            for (const stop of this.gradient.colors) {
                grad.addColorStop(stop.pos, stop.color);
            }
            
            ctx.fillStyle = grad;
        } else {
            // Renk
            ctx.fillStyle = this.color;
        }
        
        // Kontur rengi
        if (this.strokeColor) {
            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.strokeWidth;
        }
    }
    
    /**
     * Animasyonları uygular
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     */
    _applyAnimations(ctx, x, y) {
        const time = this.scene ? this.scene.time.time : (Date.now() / 1000);
        
        // Zıplama animasyonu
        if (this.bounce) {
            this._bounceOffset = Math.sin(time * this.bounceSpeed) * this.bounceHeight;
        }
        
        // Soluklaşma animasyonu
        if (this.fadeIn && this._fadeAlpha < 1) {
            this._fadeAlpha += 0.016 * this.fadeInSpeed; // 60 FPS varsayımı
            this._fadeAlpha = Math.min(1, this._fadeAlpha);
            ctx.globalAlpha *= this._fadeAlpha;
        }
        
        // Renk döngüsü animasyonu
        if (this.colorCycle) {
            const index = Math.floor(time * this.colorCycleSpeed) % this.colorCycleColors.length;
            
            if (index !== this._colorCycleIndex) {
                this._colorCycleIndex = index;
                ctx.fillStyle = this.colorCycleColors[index];
            }
        }
        
        // Döndürme animasyonu
        if (this.rotationSpeed !== 0) {
            this.rotation += 0.016 * this.rotationSpeed; // 60 FPS varsayımı
            
            // 0-360 arasında sınırla
            this.rotation = this.rotation % 360;
        }
        
        // Ölçek animasyonu
        if (this.scaleSpeed !== 0) {
            this.scale += 0.016 * this.scaleSpeed; // 60 FPS varsayımı
            
            // Min/max ölçek
            if (this.scale < 0.5) {
                this.scale = 0.5;
                this.scaleSpeed *= -1;
            } else if (this.scale > 2) {
                this.scale = 2;
                this.scaleSpeed *= -1;
            }
        }
    }
    
    /**
     * Tek satır metin çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     */
    _drawSingleLineText(ctx, x, y) {
        let processedText = this.text;
        
        // Metin dönüşümleri
        if (this.uppercase) {
            processedText = processedText.toUpperCase();
        } else if (this.lowercase) {
            processedText = processedText.toLowerCase();
        } else if (this.capitalize) {
            processedText = processedText.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
        }
        
        // Overflow kontrolü
        if (this.maxWidth > 0) {
            const textWidth = ctx.measureText(processedText).width;
            
            if (textWidth > this.maxWidth) {
                if (this.textOverflow === "ellipsis") {
                    processedText = this._truncateTextWithEllipsis(ctx, processedText, this.maxWidth);
                } else if (this.textOverflow === "clip") {
                    // Ölçeği değiştirmeden kırp
                }
            }
        }
        
        // Y pozisyonunu zıplama animasyonuna göre ayarla
        const finalY = y + this._bounceOffset;
        
        // Ana metni çiz
        if (this.outline) {
            ctx.lineWidth = this.outlineWidth;
            ctx.strokeStyle = this.outlineColor;
            ctx.strokeText(processedText, x, finalY, this.maxWidth);
        }
        
        ctx.fillText(processedText, x, finalY, this.maxWidth);
        
        if (this.strokeColor) {
            ctx.strokeText(processedText, x, finalY, this.maxWidth);
        }
        
        // Altı çizili metin
        if (this.underline) {
            const metrics = ctx.measureText(processedText);
            const textWidth = metrics.width;
            
            let underlineY = finalY;
            
            if (this.baseline === "middle") {
                underlineY += metrics.actualBoundingBoxDescent + 2;
            } else if (this.baseline === "top") {
                underlineY += metrics.actualBoundingBoxDescent + metrics.actualBoundingBoxAscent + 2;
            } else {
                underlineY += 2;
            }
            
            ctx.beginPath();
            
            // Hizalamaya göre pozisyonu ayarla
            let lineX = x;
            if (this.align === "center") {
                lineX -= textWidth / 2;
            } else if (this.align === "right") {
                lineX -= textWidth;
            }
            
            ctx.moveTo(lineX, underlineY);
            ctx.lineTo(lineX + textWidth, underlineY);
            ctx.stroke();
        }
    }
    
    /**
     * Çok satırlı metin çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     */
    _drawWrappedText(ctx, x, y) {
        let processedText = this.text;
        
        // Metin dönüşümleri
        if (this.uppercase) {
            processedText = processedText.toUpperCase();
        } else if (this.lowercase) {
            processedText = processedText.toLowerCase();
        } else if (this.capitalize) {
            processedText = processedText.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
        }
        
        // Metni kelimelere böl
        const words = processedText.split(' ');
        let line = '';
        const lines = [];
        
        // Maksimum genişliği kontrol et
        const maxWidth = this.maxWidth > 0 ? this.maxWidth : this.width;
        
        // Metin satırlarını oluştur
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
                lines.push(line);
                line = words[i] + ' ';
            } else {
                line = testLine;
            }
        }
        
        lines.push(line);
        
        // Metin hizalaması için başlangıç Y pozisyonu
        let startY = y;
        
        if (this.baseline === "middle") {
            startY -= ((lines.length - 1) * this.lineHeight * parseInt(this.font)) / 2;
        } else if (this.baseline === "bottom") {
            startY -= (lines.length - 1) * this.lineHeight * parseInt(this.font);
        }
        
        // Satırları çiz
        for (let i = 0; i < lines.length; i++) {
            const lineY = startY + (i * this.lineHeight * parseInt(this.font)) + this._bounceOffset;
            
            // Ana metni çiz
            if (this.outline) {
                ctx.lineWidth = this.outlineWidth;
                ctx.strokeStyle = this.outlineColor;
                ctx.strokeText(lines[i], x, lineY, maxWidth);
            }
            
            ctx.fillText(lines[i], x, lineY, maxWidth);
            
            if (this.strokeColor) {
                ctx.strokeText(lines[i], x, lineY, maxWidth);
            }
            
            // Altı çizili metin
            if (this.underline) {
                const metrics = ctx.measureText(lines[i]);
                const lineWidth = metrics.width;
                
                let underlineY = lineY + 2;
                
                ctx.beginPath();
                
                // Hizalamaya göre pozisyonu ayarla
                let lineX = x;
                if (this.align === "center") {
                    lineX -= lineWidth / 2;
                } else if (this.align === "right") {
                    lineX -= lineWidth;
                }
                
                ctx.moveTo(lineX, underlineY);
                ctx.lineTo(lineX + lineWidth, underlineY);
                ctx.stroke();
            }
        }
    }
    
    /**
     * Metni belirli bir genişlikte keser ve "..." ekler
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {String} text - Metin
     * @param {Number} maxWidth - Maksimum genişlik
     * @return {String} Kesilmiş metin
     */
    _truncateTextWithEllipsis(ctx, text, maxWidth) {
        const ellipsis = "...";
        const ellipsisWidth = ctx.measureText(ellipsis).width;
        
        let textWidth = ctx.measureText(text).width;
        let truncatedText = text;
        
        if (textWidth <= maxWidth) {
            return text;
        }
        
        while (textWidth + ellipsisWidth > maxWidth) {
            truncatedText = truncatedText.slice(0, -1);
            textWidth = ctx.measureText(truncatedText).width;
            
            if (truncatedText.length <= 0) {
                break;
            }
        }
        
        return truncatedText + ellipsis;
    }
    
    /**
     * Metni değiştirir
     * @param {String} text - Yeni metin
     */
    setText(text) {
        this.text = text;
        
        if (this.autoSize) {
            this._updateDimensions();
        }
    }
    
    /**
     * Boyutları günceller (otomatik boyutlandırma için)
     */
    _updateDimensions() {
        if (!this.text) return;
        
        // Tarayıcıda çalışıyorsa ölçüm yap
        if (typeof document !== "undefined") {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            // Font stilini ayarla
            let fontStyle = '';
            if (this.bold) fontStyle += 'bold ';
            if (this.italic) fontStyle += 'italic ';
            ctx.font = `${fontStyle}${this.font}`;
            
            if (this.textWrap && this.maxWidth > 0) {
                // Çok satırlı metin için satırları hesapla
                const words = this.text.split(' ');
                let line = '';
                const lines = [];
                
                for (let i = 0; i < words.length; i++) {
                    const testLine = line + words[i] + ' ';
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;
                    
                    if (testWidth > this.maxWidth && i > 0) {
                        lines.push(line);
                        line = words[i] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                
                lines.push(line);
                
                // En geniş satırı bul
                let maxLineWidth = 0;
                for (const line of lines) {
                    const lineWidth = ctx.measureText(line).width;
                    maxLineWidth = Math.max(maxLineWidth, lineWidth);
                }
                
                // Boyutları ayarla
                this.width = maxLineWidth;
                
                // Satır yüksekliğini font boyutundan çıkar
                const fontSize = parseInt(this.font);
                this.height = fontSize * this.lineHeight * lines.length;
            } else {
                // Tek satır metin için ölç
                const metrics = ctx.measureText(this.text);
                
                // Tahmini yükseklik hesapla
                const fontSize = parseInt(this.font);
                this.width = metrics.width;
                this.height = fontSize * 1.2;
            }
        }
    }
    
    /**
     * Fontu değiştirir
     * @param {String} font - Yeni font
     */
    setFont(font) {
        this.font = font;
        
        if (this.autoSize) {
            this._updateDimensions();
        }
    }
    
    /**
     * Rengi değiştirir
     * @param {String} color - Yeni renk
     */
    setColor(color) {
        this.color = color;
    }
}