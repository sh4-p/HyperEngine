/**
 * Panel.js - Panel bileşeni
 * Oyun arayüzünde panel, kutu, çerçeve vb. oluşturur
 */
class Panel extends UIComponent {
    constructor(params = {}) {
        // Temel parametreleri üst sınıfa gönder
        super(params);
        
        // Panel özellikleri
        this.padding = params.padding || 10;
        this.backgroundImage = params.backgroundImage || null;
        this.clipContent = params.clipContent || false;
        this.isModal = params.isModal !== undefined ? params.isModal : false;
        this.modalOpacity = params.modalOpacity !== undefined ? params.modalOpacity : 0.7;
        this.modalColor = params.modalColor || "#000000";
    }
    
    /**
     * İçeriği çizer
     * @param {Renderer} renderer - Renderer nesnesi
     * @param {Number} x - Çizim X koordinatı
     * @param {Number} y - Çizim Y koordinatı
     */
    drawContent(renderer, x, y) {
        const ctx = renderer.context;
        
        // Arkaplan resmi
        if (this.backgroundImage && this.backgroundImage.isLoaded) {
            ctx.drawImage(
                this.backgroundImage,
                x, y,
                this.width, this.height
            );
        }
    }
    
    /**
     * Render işlemi sırasında çağrılır
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        const ctx = renderer.context;
        
        // Eğer modal panelse, arkaplanı karart
        if (this.isModal && this.visible) {
            ctx.save();
            
            // Ekranın tamamına karartma uygula
            ctx.fillStyle = this.modalColor;
            ctx.globalAlpha = this.modalOpacity;
            ctx.fillRect(0, 0, renderer.canvas.width, renderer.canvas.height);
            
            ctx.restore();
        }
        
        // Normal render
        super.render(renderer);
        
        // İçerik kırpma
        if (this.clipContent) {
            this.clipChildren = true;
        }
    }
    
    /**
     * Dokunma testi
     * @param {Number} touchX - Dokunma X koordinatı
     * @param {Number} touchY - Dokunma Y koordinatı
     * @return {Boolean} Dokunma gerçekleşti mi
     */
    hitTest(touchX, touchY) {
        // Modal panel ise, tüm ekrana tıklamaları yakala
        if (this.isModal) {
            return true;
        }
        
        // Normal dokunma testi
        return super.hitTest(touchX, touchY);
    }
}