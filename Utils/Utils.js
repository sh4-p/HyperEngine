/**
 * Utils.js - Yardımcı fonksiyonlar
 * Çeşitli yardımcı fonksiyonlar içerir
 */
class Utils {
    /**
     * İki sayı arasında doğrusal interpolasyon yapar
     * @param {Number} a - Başlangıç değeri
     * @param {Number} b - Bitiş değeri
     * @param {Number} t - İlerleme değeri (0-1 arası)
     * @return {Number} İnterpolasyon sonucu
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * İki nokta arasındaki mesafeyi hesaplar
     * @param {Number} x1 - İlk noktanın X koordinatı
     * @param {Number} y1 - İlk noktanın Y koordinatı
     * @param {Number} x2 - İkinci noktanın X koordinatı
     * @param {Number} y2 - İkinci noktanın Y koordinatı
     * @return {Number} İki nokta arasındaki mesafe
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * İki nokta arasındaki açıyı hesaplar
     * @param {Number} x1 - İlk noktanın X koordinatı
     * @param {Number} y1 - İlk noktanın Y koordinatı
     * @param {Number} x2 - İkinci noktanın X koordinatı
     * @param {Number} y2 - İkinci noktanın Y koordinatı
     * @return {Number} İki nokta arasındaki açı (radyan)
     */
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    /**
     * Radyan değerini dereceye dönüştürür
     * @param {Number} radians - Radyan değeri
     * @return {Number} Derece değeri
     */
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }
    
    /**
     * Derece değerini radyana dönüştürür
     * @param {Number} degrees - Derece değeri
     * @return {Number} Radyan değeri
     */
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    /**
     * Sayıyı belirli bir aralıkta sınırlar
     * @param {Number} value - Değer
     * @param {Number} min - Minimum değer
     * @param {Number} max - Maksimum değer
     * @return {Number} Sınırlanmış değer
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    /**
     * Değeri bir aralıktan başka bir aralığa eşleştirir
     * @param {Number} value - Değer
     * @param {Number} fromMin - Kaynak aralık minimum
     * @param {Number} fromMax - Kaynak aralık maksimum
     * @param {Number} toMin - Hedef aralık minimum
     * @param {Number} toMax - Hedef aralık maksimum
     * @return {Number} Eşleştirilmiş değer
     */
    static map(value, fromMin, fromMax, toMin, toMax) {
        return toMin + (toMax - toMin) * ((value - fromMin) / (fromMax - fromMin));
    }
    
    /**
     * İki değer arasındaki farkın mutlak değerini alır
     * @param {Number} a - İlk değer
     * @param {Number} b - İkinci değer
     * @return {Number} Farkın mutlak değeri
     */
    static difference(a, b) {
        return Math.abs(a - b);
    }
    
    /**
     * İki açı arasındaki en kısa farkı hesaplar
     * @param {Number} a - İlk açı (derece)
     * @param {Number} b - İkinci açı (derece)
     * @return {Number} En kısa açı farkı (-180 ile 180 arası)
     */
    static angleDifference(a, b) {
        let diff = ((b - a + 180) % 360) - 180;
        return diff < -180 ? diff + 360 : diff;
    }
    
    /**
     * Rastgele tamsayı üretir
     * @param {Number} min - Minimum değer (dahil)
     * @param {Number} max - Maksimum değer (dahil)
     * @return {Number} Rastgele tamsayı
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Rastgele ondalıklı sayı üretir
     * @param {Number} min - Minimum değer (dahil)
     * @param {Number} max - Maksimum değer (dahil değil)
     * @return {Number} Rastgele ondalıklı sayı
     */
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Diziden rastgele bir öğe seçer
     * @param {Array} array - Dizi
     * @return {*} Rastgele seçilen öğe
     */
    static randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * Ağırlıklı rastgele seçim yapar
     * @param {Array} items - Öğeler dizisi
     * @param {Array} weights - Ağırlıklar dizisi
     * @return {*} Seçilen öğe
     */
    static weightedRandom(items, weights) {
        // Ağırlık toplamını hesapla
        let totalWeight = 0;
        for (const weight of weights) {
            totalWeight += weight;
        }
        
        // Rastgele bir değer seç
        let random = Math.random() * totalWeight;
        
        // Ağırlıklara göre öğe seç
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random < 0) {
                return items[i];
            }
        }
        
        // Güvenlik için (hata olmaması için)
        return items[items.length - 1];
    }
    
    /**
     * Diziyi karıştırır
     * @param {Array} array - Karıştırılacak dizi
     * @return {Array} Karıştırılmış dizi
     */
    static shuffle(array) {
        const result = [...array];
        
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        
        return result;
    }
    
    /**
     * Rastgele renk üretir
     * @param {Boolean} includeAlpha - Alpha değeri eklensin mi
     * @return {String} Renk kodu
     */
    static randomColor(includeAlpha = false) {
        if (includeAlpha) {
            return `rgba(${this.randomInt(0, 255)}, ${this.randomInt(0, 255)}, ${this.randomInt(0, 255)}, ${this.randomFloat(0, 1).toFixed(2)})`;
        } else {
            return `rgb(${this.randomInt(0, 255)}, ${this.randomInt(0, 255)}, ${this.randomInt(0, 255)})`;
        }
    }
    
    /**
     * Renk açma işlemi
     * @param {String} color - RGB renk kodu
     * @param {Number} percent - Açma yüzdesi
     * @return {String} Açık renk
     */
    static lightenColor(color, percent) {
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
     * @param {String} color - RGB renk kodu
     * @param {Number} percent - Koyulaştırma yüzdesi
     * @return {String} Koyu renk
     */
    static darkenColor(color, percent) {
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
    
    /**
     * UUID oluşturur
     * @return {String} UUID
     */
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Zaman damgasını okunabilir metin formatına dönüştürür
     * @param {Number} timestamp - Zaman damgası (milisaniye)
     * @param {Boolean} includeTime - Saat dahil edilsin mi
     * @return {String} Tarih metni
     */
    static formatDate(timestamp, includeTime = false) {
        const date = new Date(timestamp);
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        let result = `${day}/${month}/${year}`;
        
        if (includeTime) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            result += ` ${hours}:${minutes}`;
        }
        
        return result;
    }
    
    /**
     * Zamanı biçimlendirir (mm:ss)
     * @param {Number} seconds - Saniye
     * @return {String} Biçimlendirilmiş zaman
     */
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Sayıyı k, m, b gibi kısaltmalarla biçimlendirir
     * @param {Number} num - Sayı
     * @param {Number} digits - Ondalık basamak sayısı
     * @return {String} Biçimlendirilmiş sayı
     */
    static formatNumber(num, digits = 1) {
        const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "B" },
            { value: 1e12, symbol: "T" },
            { value: 1e15, symbol: "P" },
            { value: 1e18, symbol: "E" }
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        const item = lookup.slice().reverse().find(function(item) {
            return num >= item.value;
        });
        return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
    }
    
    /**
     * Metni belirli bir uzunlukta keser
     * @param {String} text - Metin
     * @param {Number} maxLength - Maksimum uzunluk
     * @param {String} suffix - Kesme sonrası eklenecek sonek
     * @return {String} Kesilmiş metin
     */
    static truncateText(text, maxLength, suffix = '...') {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + suffix;
    }
    
    /**
     * URL parametrelerini çözümler
     * @param {String} url - URL
     * @return {Object} Parametreler
     */
    static parseUrlParams(url) {
        const params = {};
        
        // URL'de ? işareti yoksa boş obje döndür
        if (url.indexOf('?') === -1) {
            return params;
        }
        
        // Parametreleri al
        const query = url.split('?')[1];
        const pairs = query.split('&');
        
        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
        
        return params;
    }
    
    /**
     * Tarayıcı türünü algılar
     * @return {String} Tarayıcı adı
     */
    static detectBrowser() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.indexOf("Chrome") > -1) {
            return "Chrome";
        } else if (userAgent.indexOf("Safari") > -1) {
            return "Safari";
        } else if (userAgent.indexOf("Firefox") > -1) {
            return "Firefox";
        } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
            return "IE";
        } else if (userAgent.indexOf("Edge") > -1) {
            return "Edge";
        } else {
            return "Unknown";
        }
    }
    
    /**
     * Mobil cihaz olup olmadığını kontrol eder
     * @return {Boolean} Mobil cihaz mı
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * iOS cihaz olup olmadığını kontrol eder
     * @return {Boolean} iOS cihaz mı
     */
    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    
    /**
     * Android cihaz olup olmadığını kontrol eder
     * @return {Boolean} Android cihaz mı
     */
    static isAndroid() {
        return /Android/.test(navigator.userAgent);
    }
    
    /**
     * Cihaz yönlendirmesini kontrol eder
     * @return {String} Yönlendirme (portrait veya landscape)
     */
    static getOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }
    
    /**
     * Canvas içeriğini resim olarak kaydeder
     * @param {HTMLCanvasElement} canvas - Canvas elementi
     * @param {String} filename - Dosya adı
     * @param {String} type - Dosya tipi (image/png, image/jpeg, vb.)
     * @param {Number} quality - Resim kalitesi (0-1 arası)
     */
    static saveCanvasImage(canvas, filename = 'image', type = 'image/png', quality = 0.95) {
        const link = document.createElement('a');
        
        // Canvas içeriğini URL'e dönüştür
        const dataUrl = canvas.toDataURL(type, quality);
        
        // Link özelliklerini ayarla
        link.download = filename;
        link.href = dataUrl;
        
        // Linke tıkla
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    /**
     * HSL rengini RGB'ye dönüştürür
     * @param {Number} h - Hue (0-360)
     * @param {Number} s - Saturation (0-100)
     * @param {Number} l - Lightness (0-100)
     * @return {Object} RGB değerleri {r, g, b}
     */
    static hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        
        let r, g, b;
        
        if (h >= 0 && h < 60) {
            [r, g, b] = [c, x, 0];
        } else if (h >= 60 && h < 120) {
            [r, g, b] = [x, c, 0];
        } else if (h >= 120 && h < 180) {
            [r, g, b] = [0, c, x];
        } else if (h >= 180 && h < 240) {
            [r, g, b] = [0, x, c];
        } else if (h >= 240 && h < 300) {
            [r, g, b] = [x, 0, c];
        } else {
            [r, g, b] = [c, 0, x];
        }
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }
    
    /**
     * RGB rengini HEX'e dönüştürür
     * @param {Number} r - Red (0-255)
     * @param {Number} g - Green (0-255)
     * @param {Number} b - Blue (0-255)
     * @return {String} HEX renk kodu
     */
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    /**
     * Metni HTML'den temizler
     * @param {String} html - HTML metni
     * @return {String} Temizlenmiş metin
     */
    static stripHtml(html) {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }
    
    /**
     * Nesneyi derin kopyalar
     * @param {Object} obj - Kopyalanacak nesne
     * @return {Object} Kopyalanmış nesne
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    /**
     * Dosya boyutunu formatlar
     * @param {Number} bytes - Bayt cinsinden boyut
     * @param {Number} decimals - Ondalık basamak sayısı
     * @return {String} Formatlanmış boyut
     */
    static formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}