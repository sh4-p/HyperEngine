/**
 * Time.js - Zaman yönetimi sınıfı
 * Oyun döngüsünde zamanı ve kare hızını yönetir
 */
class Time {
    constructor() {
        this.time = 0;           // Toplam geçen süre (saniye)
        this.deltaTime = 0;      // Son iki kare arasındaki süre (saniye)
        this.lastFrameTime = 0;  // Son karenin zaman damgası
        this.frameCount = 0;     // Toplam kare sayısı
        this.fps = 0;            // Saniyedeki kare sayısı
        
        // FPS hesaplama için değişkenler
        this._fpsUpdateInterval = 1.0;  // FPS güncelleme aralığı (saniye)
        this._fpsTimer = 0;             // FPS zamanlayıcısı
        this._fpsFrameCount = 0;        // FPS hesaplama için kare sayacı
    }
    
    /**
     * Zamanı başlat
     */
    start() {
        this.lastFrameTime = performance.now() / 1000;
    }
    
    /**
     * Zamanı güncelle
     */
    update() {
        const currentTime = performance.now() / 1000;
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        this.time += this.deltaTime;
        this.frameCount++;
        
        // FPS hesapla
        this._fpsTimer += this.deltaTime;
        this._fpsFrameCount++;
        
        if (this._fpsTimer >= this._fpsUpdateInterval) {
            this.fps = Math.round(this._fpsFrameCount / this._fpsTimer);
            this._fpsTimer = 0;
            this._fpsFrameCount = 0;
        }
    }
    
    /**
     * Belirli saniyeden sonra bir fonksiyon çağırmak için
     * @param {Function} callback - Çağrılacak fonksiyon
     * @param {Number} delay - Gecikme süresi (saniye)
     * @return {Object} Timer nesnesi
     */
    setTimeout(callback, delay) {
        const timer = {
            callback: callback,
            delay: delay,
            elapsed: 0,
            isActive: true
        };
        
        // Timer güncelleme fonksiyonu
        const updateTimer = (deltaTime) => {
            if (!timer.isActive) return;
            
            timer.elapsed += deltaTime;
            if (timer.elapsed >= timer.delay) {
                timer.callback();
                timer.isActive = false;
            }
        };
        
        // Her karede çağrılacak güncelleme fonksiyonunu kaydet
        const engine = Engine.getInstance();
        engine.systems.time.timers = engine.systems.time.timers || [];
        engine.systems.time.timers.push(updateTimer);
        
        return timer;
    }
    
    /**
     * Düzenli aralıklarla fonksiyon çağırmak için
     * @param {Function} callback - Çağrılacak fonksiyon
     * @param {Number} interval - Çağrı aralığı (saniye)
     * @return {Object} Timer nesnesi
     */
    setInterval(callback, interval) {
        const timer = {
            callback: callback,
            interval: interval,
            elapsed: 0,
            isActive: true
        };
        
        // Timer güncelleme fonksiyonu
        const updateTimer = (deltaTime) => {
            if (!timer.isActive) return;
            
            timer.elapsed += deltaTime;
            if (timer.elapsed >= timer.interval) {
                timer.callback();
                timer.elapsed = 0; // Sayacı sıfırla
            }
        };
        
        // Her karede çağrılacak güncelleme fonksiyonunu kaydet
        const engine = Engine.getInstance();
        engine.systems.time.timers = engine.systems.time.timers || [];
        engine.systems.time.timers.push(updateTimer);
        
        return timer;
    }
    
    /**
     * Timer'ı durdur
     * @param {Object} timer - Durdurulacak timer
     */
    clearTimer(timer) {
        if (timer) {
            timer.isActive = false;
        }
    }
}