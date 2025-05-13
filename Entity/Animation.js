/**
 * Animation.js - Animasyon bileşeni
 * Sprite animasyonlarını yönetir
 */
class Animation extends Component {
    constructor(params = {}) {
        super();
        
        // Animasyon özellikleri
        this.frameWidth = params.frameWidth || 0;
        this.frameHeight = params.frameHeight || 0;
        this.frameCount = params.frameCount || 0;
        this.frameRate = params.frameRate || 10; // Saniyedeki kare sayısı
        this.loop = params.loop !== undefined ? params.loop : true;
        
        // Animasyon durumu
        this.currentFrame = 0;
        this.elapsed = 0;
        this.isPlaying = false;
        
        // Animasyon yönü (yatay veya dikey sprite sheet)
        this.isHorizontal = params.isHorizontal !== undefined ? params.isHorizontal : true;
        
        // Animasyon olayları
        this.onComplete = params.onComplete || null;
        this.onLoop = params.onLoop || null;
        this.onFrame = params.onFrame || null;
        
        // Animasyon koleksiyonu
        this.animations = {};
        this.currentAnimation = '';
        
        // Hedef sprite
        this.targetSprite = null;
    }
    
    /**
     * Bileşen başlatıldığında
     */
    start() {
        // Sprite bileşenini bul
        this.targetSprite = this.gameObject.getComponent('Sprite');
        
        if (!this.targetSprite) {
            console.warn("Animation component requires a Sprite component");
        } else {
            // Sprite'ı frame moduna getir
            this.targetSprite.useFrames = true;
            
            // Frame boyutlarını ayarla
            if (this.frameWidth > 0) this.targetSprite.frameWidth = this.frameWidth;
            if (this.frameHeight > 0) this.targetSprite.frameHeight = this.frameHeight;
        }
    }
    
    /**
     * Animasyon ekler
     * @param {String} name - Animasyon adı
     * @param {Object} params - Animasyon parametreleri
     */
    addAnimation(name, params) {
        this.animations[name] = {
            startFrame: params.startFrame || 0,
            frameCount: params.frameCount || 1,
            frameRate: params.frameRate || this.frameRate,
            loop: params.loop !== undefined ? params.loop : this.loop,
            row: params.row || 0,
            onComplete: params.onComplete || null,
            onLoop: params.onLoop || null,
            onFrame: params.onFrame || null
        };
    }
    
    /**
     * Animasyonu oynatır
     * @param {String} name - Animasyon adı
     * @param {Boolean} resetFrame - İlk kareden başlat
     */
    play(name, resetFrame = true) {
        if (!this.animations[name]) {
            console.warn(`Animation "${name}" not found`);
            return;
        }
        
        // Zaten aynı animasyon oynuyorsa ve reset istenmiyorsa
        if (this.currentAnimation === name && this.isPlaying && !resetFrame) {
            return;
        }
        
        this.currentAnimation = name;
        this.isPlaying = true;
        
        if (resetFrame) {
            this.currentFrame = 0;
            this.elapsed = 0;
        }
        
        // Sprite yoksa işlemi atlat
        if (!this.targetSprite) return;
        
        const anim = this.animations[name];
        
        // Sprite frame'ini ayarla
        if (this.isHorizontal) {
            this.targetSprite.frameX = anim.startFrame + this.currentFrame;
            this.targetSprite.frameY = anim.row;
        } else {
            this.targetSprite.frameX = anim.row;
            this.targetSprite.frameY = anim.startFrame + this.currentFrame;
        }
    }
    
    /**
     * Animasyonu durdurur
     */
    stop() {
        this.isPlaying = false;
    }
    
    /**
     * Animasyonu devam ettirir
     */
    resume() {
        this.isPlaying = true;
    }
    
    /**
     * Animasyonu sıfırlar
     */
    reset() {
        this.currentFrame = 0;
        this.elapsed = 0;
        
        if (this.targetSprite && this.currentAnimation) {
            const anim = this.animations[this.currentAnimation];
            
            if (this.isHorizontal) {
                this.targetSprite.frameX = anim.startFrame;
            } else {
                this.targetSprite.frameY = anim.startFrame;
            }
        }
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        if (!this.isPlaying || !this.targetSprite || !this.currentAnimation) return;
        
        const anim = this.animations[this.currentAnimation];
        
        // Geçen süreyi güncelle
        this.elapsed += deltaTime;
        
        // Kare oranına göre ilerleme
        const frameTime = 1 / anim.frameRate;
        
        if (this.elapsed >= frameTime) {
            // Geçen süreyi sıfırla
            this.elapsed -= frameTime;
            
            // Bir sonraki kare
            this.currentFrame++;
            
            // Son kareye gelindi mi
            if (this.currentFrame >= anim.frameCount) {
                if (anim.loop) {
                    // Döngüye devam et
                    this.currentFrame = 0;
                    
                    // Döngü olayını çağır
                    if (anim.onLoop) anim.onLoop();
                    if (this.onLoop) this.onLoop(this.currentAnimation);
                } else {
                    // Döngüyü durdur
                    this.currentFrame = anim.frameCount - 1;
                    this.isPlaying = false;
                    
                    // Tamamlanma olayını çağır
                    if (anim.onComplete) anim.onComplete();
                    if (this.onComplete) this.onComplete(this.currentAnimation);
                }
            }
            
            // Kare olayını çağır
            if (anim.onFrame) anim.onFrame(this.currentFrame);
            if (this.onFrame) this.onFrame(this.currentAnimation, this.currentFrame);
            
            // Sprite frame'ini güncelle
            if (this.isHorizontal) {
                this.targetSprite.frameX = anim.startFrame + this.currentFrame;
                this.targetSprite.frameY = anim.row;
            } else {
                this.targetSprite.frameX = anim.row;
                this.targetSprite.frameY = anim.startFrame + this.currentFrame;
            }
        }
    }
}