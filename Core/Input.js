/**
 * Input.js - Giriş kontrolü sınıfı
 * Dokunma, hareket ve diğer kullanıcı girdilerini yönetir
 */
class Input {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Dokunma durumları
        this.touches = [];
        this.touchStarted = false;
        this.touchMoved = false;
        this.touchEnded = false;
        
        // Dokunma pozisyonları
        this.touchX = 0;
        this.touchY = 0;
        this.prevTouchX = 0;
        this.prevTouchY = 0;
        this.touchDeltaX = 0;
        this.touchDeltaY = 0;
        
        // Cihaz yönlendirme
        this.accelerationX = 0;
        this.accelerationY = 0;
        this.accelerationZ = 0;
        
        // Singleton instance
        if (Input.instance) {
            return Input.instance;
        }
        Input.instance = this;
        
        // Olay dinleyicileri
        this._setupEventListeners();
    }
    
    /**
     * Olay dinleyicilerini kurulumu
     */
    _setupEventListeners() {
        // Dokunma olayları
        this.canvas.addEventListener('touchstart', (e) => this._handleTouchStart(e), false);
        this.canvas.addEventListener('touchmove', (e) => this._handleTouchMove(e), false);
        this.canvas.addEventListener('touchend', (e) => this._handleTouchEnd(e), false);
        this.canvas.addEventListener('touchcancel', (e) => this._handleTouchEnd(e), false);
        
        // Fare olayları (geliştirme için)
        this.canvas.addEventListener('mousedown', (e) => this._handleMouseDown(e), false);
        this.canvas.addEventListener('mousemove', (e) => this._handleMouseMove(e), false);
        this.canvas.addEventListener('mouseup', (e) => this._handleMouseUp(e), false);
        
        // Cihaz yönlendirme olayları
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (e) => this._handleDeviceMotion(e), false);
        }
    }
    
    /**
     * Dokunma başlangıç olayını işle
     */
    _handleTouchStart(e) {
        e.preventDefault();
        this.touchStarted = true;
        this.touchMoved = false;
        this.touchEnded = false;
        
        this.touches = e.touches;
        
        if (this.touches.length > 0) {
            const touch = this.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            
            this.prevTouchX = this.touchX;
            this.prevTouchY = this.touchY;
            
            this.touchX = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            this.touchY = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            this.touchDeltaX = 0;
            this.touchDeltaY = 0;
        }
    }
    
    /**
     * Dokunma hareket olayını işle
     */
    _handleTouchMove(e) {
        e.preventDefault();
        this.touchStarted = false;
        this.touchMoved = true;
        this.touchEnded = false;
        
        this.touches = e.touches;
        
        if (this.touches.length > 0) {
            const touch = this.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            
            this.prevTouchX = this.touchX;
            this.prevTouchY = this.touchY;
            
            this.touchX = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            this.touchY = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            this.touchDeltaX = this.touchX - this.prevTouchX;
            this.touchDeltaY = this.touchY - this.prevTouchY;
        }
    }
    
    /**
     * Dokunma bitiş olayını işle
     */
    _handleTouchEnd(e) {
        e.preventDefault();
        this.touchStarted = false;
        this.touchMoved = false;
        this.touchEnded = true;
        
        this.touches = e.touches;
    }
    
    /**
     * Fare aşağı olayını işle (geliştirme için)
     */
    _handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        this.touchStarted = true;
        this.touchMoved = false;
        this.touchEnded = false;
        
        this.prevTouchX = this.touchX;
        this.prevTouchY = this.touchY;
        
        this.touchX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        this.touchY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        this.touchDeltaX = 0;
        this.touchDeltaY = 0;
    }
    
    /**
     * Fare hareket olayını işle (geliştirme için)
     */
    _handleMouseMove(e) {
        if (e.buttons === 1) { // Sol fare tuşu basılı
            const rect = this.canvas.getBoundingClientRect();
            
            this.touchStarted = false;
            this.touchMoved = true;
            this.touchEnded = false;
            
            this.prevTouchX = this.touchX;
            this.prevTouchY = this.touchY;
            
            this.touchX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.touchY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            
            this.touchDeltaX = this.touchX - this.prevTouchX;
            this.touchDeltaY = this.touchY - this.prevTouchY;
        }
    }
    
    /**
     * Fare yukarı olayını işle (geliştirme için)
     */
    _handleMouseUp(e) {
        this.touchStarted = false;
        this.touchMoved = false;
        this.touchEnded = true;
    }
    
    /**
     * Cihaz hareket olayını işle
     */
    _handleDeviceMotion(e) {
        this.accelerationX = e.accelerationIncludingGravity.x;
        this.accelerationY = e.accelerationIncludingGravity.y;
        this.accelerationZ = e.accelerationIncludingGravity.z;
    }
    
    /**
     * Girişleri güncelle - Her karede çağrılır
     */
    update() {
        // Bu kare için touch flags güncellemesi
        if (this.touchStarted) {
            this._touchStartedThisFrame = true;
        }
        
        if (this.touchEnded) {
            this._touchEndedThisFrame = true;
        }
    }
    
    /**
     * Kare bitiminde temizleme işlemi
     */
    lateUpdate() {
        // Touch flag'leri temizle
        this.touchStarted = false;
        this.touchEnded = false;
        this._touchStartedThisFrame = false;
        this._touchEndedThisFrame = false;
    }
    
    /**
     * Dokunma var mı kontrol et
     */
    isTouching() {
        return this.touches.length > 0;
    }
    
    /**
     * Bu kare içinde dokunma başladı mı
     */
    isTouchStarted() {
        return this._touchStartedThisFrame;
    }
    
    /**
     * Bu kare içinde dokunma bitti mi
     */
    isTouchEnded() {
        return this._touchEndedThisFrame;
    }
    
    /**
     * Dokunma hareketi var mı
     */
    isTouchMoving() {
        return this.touchMoved;
    }
    
    /**
     * Dokunma pozisyonunu al
     */
    getTouchPosition() {
        return { x: this.touchX, y: this.touchY };
    }
    
    /**
     * Dokunma hareketini al (delta)
     */
    getTouchDelta() {
        return { x: this.touchDeltaX, y: this.touchDeltaY };
    }
    
    /**
     * Cihaz ivmesini al
     */
    getAcceleration() {
        return {
            x: this.accelerationX,
            y: this.accelerationY,
            z: this.accelerationZ
        };
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!Input.instance) {
            const engine = Engine.getInstance();
            new Input(engine.canvas);
        }
        return Input.instance;
    }
}

// Singleton instance
Input.instance = null;