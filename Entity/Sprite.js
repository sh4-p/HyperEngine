/**
 * Sprite.js - Görsel bileşen
 * Oyun nesnelerini temsil eden görsel bileşen
 */
class Sprite extends Component {
    constructor(imageSource = null, params = {}) {
        super();
        
        // Görüntü kaynağı
        this.imageSource = imageSource;
        this.image = null;
        
        // Sprite özellikleri
        this.width = params.width || 0;
        this.height = params.height || 0;
        this.pivotX = params.pivotX !== undefined ? params.pivotX : 0.5;
        this.pivotY = params.pivotY !== undefined ? params.pivotY : 0.5;
        this.flipX = params.flipX || false;
        this.flipY = params.flipY || false;
        
        // Sprite sheet (animasyonlar için)
        this.frameX = params.frameX || 0;
        this.frameY = params.frameY || 0;
        this.frameWidth = params.frameWidth || 0;
        this.frameHeight = params.frameHeight || 0;
        this.useFrames = params.useFrames || false;
        
        // Renk ve görünürlük
        this.tint = params.tint || '#FFFFFF';
        this.alpha = params.alpha !== undefined ? params.alpha : 1;
        this.visible = params.visible !== undefined ? params.visible : true;
        
        // Render katmanı
        this.layer = params.layer || 0;
        
        // Görüntü hazır mı
        this.isLoaded = false;
        
        // Görüntüyü yükle
        if (this.imageSource) {
            this._loadImage();
        }
    }
    
    /**
     * Resmi yükler
     */
    _loadImage() {
        // Resim zaten AssetManager'da var mı kontrol et
        const assetManager = AssetManager.getInstance();
        const cachedImage = assetManager.getImage(this.imageSource);
        
        if (cachedImage) {
            this.image = cachedImage;
            this.isLoaded = true;
            
            // Boyutları otomatik ayarla
            if (this.width === 0) this.width = this.image.width;
            if (this.height === 0) this.height = this.image.height;
            
            if (this.useFrames && this.frameWidth === 0 && this.frameHeight === 0) {
                this.frameWidth = this.image.width;
                this.frameHeight = this.image.height;
            }
            
            return;
        }
        
        // Önbelleğe alınmamışsa yeni bir resim yükle
        this.image = new Image();
        this.image.src = this.imageSource;
        
        this.image.onload = () => {
            this.isLoaded = true;
            
            // Boyutları otomatik ayarla
            if (this.width === 0) this.width = this.image.width;
            if (this.height === 0) this.height = this.image.height;
            
            if (this.useFrames && this.frameWidth === 0 && this.frameHeight === 0) {
                this.frameWidth = this.image.width;
                this.frameHeight = this.image.height;
            }
            
            // Asset Manager'a ekle
            assetManager.addImage(this.imageSource, this.image);
        };
        
        this.image.onerror = () => {
            console.error(`Sprite image could not be loaded: ${this.imageSource}`);
        };
    }
    
    /**
     * Sprite görüntüsünü değiştirir
     * @param {String} imageSource - Yeni görüntü kaynağı
     */
    setImage(imageSource) {
        this.imageSource = imageSource;
        this.isLoaded = false;
        this._loadImage();
    }
    
    /**
     * Sprite görünürlüğünü değiştirir
     * @param {Boolean} visible - Görünür mü
     */
    setVisible(visible) {
        this.visible = visible;
    }
    
    /**
     * Sprite'ı render eder
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        if (!this.visible || !this.image || !this.isLoaded) return;
        
        const position = this.transform.getWorldPosition();
        const scale = this.transform.getWorldScale();
        const rotation = this.transform.getWorldRotation();
        
        const width = this.width * scale.x;
        const height = this.height * scale.y;
        
        // Render katmanına ekle
        renderer.addToLayer(this.gameObject, this.layer);
        
        // Sprite çizme işlemi
        if (this.useFrames) {
            // Sprite sheet'ten bir kare çiz
            renderer.drawSprite(
                this.image,
                this.frameX * this.frameWidth,
                this.frameY * this.frameHeight,
                this.frameWidth,
                this.frameHeight,
                position.x - width * this.pivotX,
                position.y - height * this.pivotY,
                width,
                height,
                rotation,
                this.pivotX,
                this.pivotY
            );
        } else {
            // Tek resim çiz
            renderer.drawImage(
                this.image,
                position.x - width * this.pivotX,
                position.y - height * this.pivotY,
                width,
                height,
                rotation,
                this.pivotX,
                this.pivotY,
                this.flipX,
                this.flipY
            );
        }
    }
    
    /**
     * Sprite sheet'teki kareyi değiştirir
     * @param {Number} frameX - X kare indeksi
     * @param {Number} frameY - Y kare indeksi
     */
    setFrame(frameX, frameY) {
        this.frameX = frameX;
        this.frameY = frameY;
    }
}