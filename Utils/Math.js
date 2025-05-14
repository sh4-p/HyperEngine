/**
 * Math.js - Matematik yardımcı fonksiyonları
 * Oyun içinde kullanılacak matematik işlevlerini sağlar
 */
class MathUtils {
    /**
     * Matematiksel sabitler
     */
    static get CONSTANTS() {
        return {
            PI: Math.PI,
            TWO_PI: Math.PI * 2,
            HALF_PI: Math.PI / 2,
            QUARTER_PI: Math.PI / 4,
            DEG_TO_RAD: Math.PI / 180,
            RAD_TO_DEG: 180 / Math.PI,
            EPSILON: 0.000001
        };
    }
    
    /**
     * Radyan cinsinden açıyı derece cinsine çevirir
     * @param {Number} radians - Radyan cinsinden açı
     * @return {Number} Derece cinsinden açı
     */
    static toDegrees(radians) {
        return radians * this.CONSTANTS.RAD_TO_DEG;
    }
    
    /**
     * Derece cinsinden açıyı radyan cinsine çevirir
     * @param {Number} degrees - Derece cinsinden açı
     * @return {Number} Radyan cinsinden açı
     */
    static toRadians(degrees) {
        return degrees * this.CONSTANTS.DEG_TO_RAD;
    }
    
    /**
     * Bir değeri belirli bir aralıkta sınırlar
     * @param {Number} value - Değer
     * @param {Number} min - Minimum değer
     * @param {Number} max - Maksimum değer
     * @return {Number} Sınırlanmış değer
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    /**
     * Bir değeri bir aralıktan başka bir aralığa eşler
     * @param {Number} value - Değer
     * @param {Number} fromMin - Kaynak aralık minimum
     * @param {Number} fromMax - Kaynak aralık maksimum
     * @param {Number} toMin - Hedef aralık minimum
     * @param {Number} toMax - Hedef aralık maksimum
     * @param {Boolean} clamp - Sonucu sınırla (isteğe bağlı)
     * @return {Number} Eşlenmiş değer
     */
    static map(value, fromMin, fromMax, toMin, toMax, clamp = false) {
        const result = (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
        
        if (clamp) {
            if (toMin < toMax) {
                return this.clamp(result, toMin, toMax);
            } else {
                return this.clamp(result, toMax, toMin);
            }
        }
        
        return result;
    }
    
    /**
     * İki değer arasında lineer interpolasyon yapar
     * @param {Number} a - Başlangıç değeri
     * @param {Number} b - Bitiş değeri
     * @param {Number} t - İlerleme değeri (0-1 arası)
     * @return {Number} İnterpolasyon sonucu
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * İki değer arasında lineer interpolasyon yaparak ilerleme değerini hesaplar
     * @param {Number} a - Başlangıç değeri
     * @param {Number} b - Bitiş değeri
     * @param {Number} value - Mevcut değer
     * @return {Number} İlerleme değeri (0-1 arası)
     */
    static inverseLerp(a, b, value) {
        if (Math.abs(a - b) < this.CONSTANTS.EPSILON) {
            return 0;
        }
        
        return this.clamp((value - a) / (b - a), 0, 1);
    }
    
    /**
     * Bir değerin yumuşak geçişini sağlar (Smoothstep)
     * @param {Number} edge0 - Alt sınır
     * @param {Number} edge1 - Üst sınır
     * @param {Number} x - Değer
     * @return {Number} Yumuşatılmış değer (0-1 arası)
     */
    static smoothstep(edge0, edge1, x) {
        // Değeri 0-1 aralığına kısıtla
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        // Yumuşatma formülü: 3t² - 2t³
        return t * t * (3 - 2 * t);
    }
    
    /**
     * Değerin iki kenar arasında olup olmadığını kontrol eder
     * @param {Number} value - Kontrol edilecek değer
     * @param {Number} min - Alt sınır
     * @param {Number} max - Üst sınır
     * @param {Boolean} inclusive - Sınırlar dahil mi
     * @return {Boolean} Değer aralıkta mı
     */
    static inRange(value, min, max, inclusive = true) {
        return inclusive
            ? (value >= min && value <= max)
            : (value > min && value < max);
    }
    
    /**
     * İki nokta arasındaki mesafeyi hesaplar
     * @param {Number} x1 - İlk nokta X
     * @param {Number} y1 - İlk nokta Y
     * @param {Number} x2 - İkinci nokta X
     * @param {Number} y2 - İkinci nokta Y
     * @return {Number} İki nokta arasındaki mesafe
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * İki nokta arasındaki mesafenin karesini hesaplar
     * @param {Number} x1 - İlk nokta X
     * @param {Number} y1 - İlk nokta Y
     * @param {Number} x2 - İkinci nokta X
     * @param {Number} y2 - İkinci nokta Y
     * @return {Number} İki nokta arasındaki mesafenin karesi
     */
    static distanceSquared(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }
    
    /**
     * İki nokta arasındaki açıyı hesaplar
     * @param {Number} x1 - İlk nokta X
     * @param {Number} y1 - İlk nokta Y
     * @param {Number} x2 - İkinci nokta X
     * @param {Number} y2 - İkinci nokta Y
     * @return {Number} İki nokta arasındaki açı (radyan)
     */
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    /**
     * İki açı arasındaki farkı hesaplar
     * @param {Number} a - İlk açı (radyan)
     * @param {Number} b - İkinci açı (radyan)
     * @return {Number} En kısa açı farkı (-π ile π arası)
     */
    static angleDifference(a, b) {
        const diff = ((b - a + Math.PI) % this.CONSTANTS.TWO_PI) - Math.PI;
        return diff < -Math.PI ? diff + this.CONSTANTS.TWO_PI : diff;
    }
    
    /**
     * İki açı arasında lineer interpolasyon yapar
     * @param {Number} a - Başlangıç açısı (radyan)
     * @param {Number} b - Bitiş açısı (radyan)
     * @param {Number} t - İlerleme değeri (0-1 arası)
     * @return {Number} İnterpolasyon sonucu (radyan)
     */
    static lerpAngle(a, b, t) {
        const diff = this.angleDifference(a, b);
        return a + diff * t;
    }
    
    /**
     * Bir vektörü döndürür
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @param {Number} angle - Döndürme açısı (radyan)
     * @return {Object} Döndürülmüş vektör {x, y}
     */
    static rotateVector(x, y, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        return {
            x: x * cos - y * sin,
            y: x * sin + y * cos
        };
    }
    
    /**
     * Vektörü normalleştirir (birim vektör haline getirir)
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @return {Object} Normalleştirilmiş vektör {x, y}
     */
    static normalizeVector(x, y) {
        const length = Math.sqrt(x * x + y * y);
        
        if (length < this.CONSTANTS.EPSILON) {
            return { x: 0, y: 0 };
        }
        
        return {
            x: x / length,
            y: y / length
        };
    }
    
    /**
     * İki vektörün skaler çarpımını hesaplar
     * @param {Number} x1 - İlk vektör X
     * @param {Number} y1 - İlk vektör Y
     * @param {Number} x2 - İkinci vektör X
     * @param {Number} y2 - İkinci vektör Y
     * @return {Number} Skaler çarpım
     */
    static dotProduct(x1, y1, x2, y2) {
        return x1 * x2 + y1 * y2;
    }
    
    /**
     * İki vektörün vektörel çarpımını hesaplar (2D için skaler değer döner)
     * @param {Number} x1 - İlk vektör X
     * @param {Number} y1 - İlk vektör Y
     * @param {Number} x2 - İkinci vektör X
     * @param {Number} y2 - İkinci vektör Y
     * @return {Number} Vektörel çarpım (2D)
     */
    static crossProduct(x1, y1, x2, y2) {
        return x1 * y2 - y1 * x2;
    }
    
    /**
     * Bir noktanın bir dikdörtgenin içinde olup olmadığını kontrol eder
     * @param {Number} px - Nokta X
     * @param {Number} py - Nokta Y
     * @param {Number} rx - Dikdörtgen sol üst X
     * @param {Number} ry - Dikdörtgen sol üst Y
     * @param {Number} rw - Dikdörtgen genişlik
     * @param {Number} rh - Dikdörtgen yükseklik
     * @return {Boolean} Nokta dikdörtgenin içinde mi
     */
    static pointInRectangle(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }
    
    /**
     * Bir noktanın bir dairenin içinde olup olmadığını kontrol eder
     * @param {Number} px - Nokta X
     * @param {Number} py - Nokta Y
     * @param {Number} cx - Daire merkez X
     * @param {Number} cy - Daire merkez Y
     * @param {Number} radius - Daire yarıçapı
     * @return {Boolean} Nokta dairenin içinde mi
     */
    static pointInCircle(px, py, cx, cy, radius) {
        const dx = px - cx;
        const dy = py - cy;
        return dx * dx + dy * dy <= radius * radius;
    }
    
    /**
     * İki dikdörtgenin çakışıp çakışmadığını kontrol eder
     * @param {Number} ax - İlk dikdörtgen sol üst X
     * @param {Number} ay - İlk dikdörtgen sol üst Y
     * @param {Number} aw - İlk dikdörtgen genişlik
     * @param {Number} ah - İlk dikdörtgen yükseklik
     * @param {Number} bx - İkinci dikdörtgen sol üst X
     * @param {Number} by - İkinci dikdörtgen sol üst Y
     * @param {Number} bw - İkinci dikdörtgen genişlik
     * @param {Number} bh - İkinci dikdörtgen yükseklik
     * @return {Boolean} Dikdörtgenler çakışıyor mu
     */
    static rectanglesIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
        return !(ax + aw <= bx || bx + bw <= ax || ay + ah <= by || by + bh <= ay);
    }
    
    /**
     * İki dairenin çakışıp çakışmadığını kontrol eder
     * @param {Number} x1 - İlk daire merkez X
     * @param {Number} y1 - İlk daire merkez Y
     * @param {Number} r1 - İlk daire yarıçapı
     * @param {Number} x2 - İkinci daire merkez X
     * @param {Number} y2 - İkinci daire merkez Y
     * @param {Number} r2 - İkinci daire yarıçapı
     * @return {Boolean} Daireler çakışıyor mu
     */
    static circlesIntersect(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distanceSquared = dx * dx + dy * dy;
        const radiusSum = r1 + r2;
        
        return distanceSquared <= radiusSum * radiusSum;
    }
    
    /**
     * Bir daire ile bir dikdörtgenin çakışıp çakışmadığını kontrol eder
     * @param {Number} cx - Daire merkez X
     * @param {Number} cy - Daire merkez Y
     * @param {Number} r - Daire yarıçapı
     * @param {Number} rx - Dikdörtgen sol üst X
     * @param {Number} ry - Dikdörtgen sol üst Y
     * @param {Number} rw - Dikdörtgen genişlik
     * @param {Number} rh - Dikdörtgen yükseklik
     * @return {Boolean} Daire ve dikdörtgen çakışıyor mu
     */
    static circleRectangleIntersect(cx, cy, r, rx, ry, rw, rh) {
        // Daire merkezinden dikdörtgene en yakın noktayı bul
        const closestX = this.clamp(cx, rx, rx + rw);
        const closestY = this.clamp(cy, ry, ry + rh);
        
        // En yakın nokta ile daire merkezi arasındaki mesafe
        const dx = closestX - cx;
        const dy = closestY - cy;
        
        // Mesafenin karesi yarıçapın karesinden küçük veya eşitse çakışıyorlar
        return dx * dx + dy * dy <= r * r;
    }
    
    /**
     * Basamaklama fonksiyonu
     * @param {Number} value - Değer
     * @param {Number} step - Basamak değeri
     * @return {Number} Basamaklanmış değer
     */
    static snap(value, step) {
        return Math.round(value / step) * step;
    }
    
    /**
     * Yukarı yuvarlama fonksiyonu (basamaklı)
     * @param {Number} value - Değer
     * @param {Number} step - Basamak değeri
     * @return {Number} Yuvarlanmış değer
     */
    static snapCeil(value, step) {
        return Math.ceil(value / step) * step;
    }
    
    /**
     * Aşağı yuvarlama fonksiyonu (basamaklı)
     * @param {Number} value - Değer
     * @param {Number} step - Basamak değeri
     * @return {Number} Yuvarlanmış değer
     */
    static snapFloor(value, step) {
        return Math.floor(value / step) * step;
    }
    
    /**
     * Bir sayının pozitif modunu hesaplar
     * @param {Number} n - Sayı
     * @param {Number} m - Mod
     * @return {Number} Pozitif mod
     */
    static mod(n, m) {
        return ((n % m) + m) % m;
    }
    
    /**
     * Ping-pong fonksiyonu (0-length arasında gidip gelir)
     * @param {Number} t - Değer
     * @param {Number} length - Üst sınır
     * @return {Number} Ping-pong değeri
     */
    static pingPong(t, length) {
        const t2 = this.mod(t, length * 2);
        return length - Math.abs(t2 - length);
    }
    
    /**
     * Kübik Bezier eğrisi interpolasyonu
     * @param {Number} t - İlerleme değeri (0-1 arası)
     * @param {Number} p0 - Başlangıç değeri
     * @param {Number} p1 - Kontrol noktası 1
     * @param {Number} p2 - Kontrol noktası 2
     * @param {Number} p3 - Bitiş değeri
     * @return {Number} İnterpolasyon sonucu
     */
    static bezier(t, p0, p1, p2, p3) {
        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        
        return p0 * mt3 + 3 * p1 * mt2 * t + 3 * p2 * mt * t2 + p3 * t3;
    }
    
    /**
     * Kuadratik Bezier eğrisi interpolasyonu
     * @param {Number} t - İlerleme değeri (0-1 arası)
     * @param {Number} p0 - Başlangıç değeri
     * @param {Number} p1 - Kontrol noktası
     * @param {Number} p2 - Bitiş değeri
     * @return {Number} İnterpolasyon sonucu
     */
    static quadraticBezier(t, p0, p1, p2) {
        const mt = 1 - t;
        return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
    }
    
    /**
     * Catmull-Rom spline interpolasyonu
     * @param {Number} t - İlerleme değeri (0-1 arası)
     * @param {Number} p0 - Kontrol noktası 0
     * @param {Number} p1 - Başlangıç değeri
     * @param {Number} p2 - Bitiş değeri
     * @param {Number} p3 - Kontrol noktası 3
     * @return {Number} İnterpolasyon sonucu
     */
    static catmullRom(t, p0, p1, p2, p3) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        return 0.5 * (
            (2 * p1) +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3
        );
    }
    
    /**
     * Barycentric koordinat hesaplama
     * @param {Number} px - Nokta X
     * @param {Number} py - Nokta Y
     * @param {Number} ax - Üçgen köşesi A X
     * @param {Number} ay - Üçgen köşesi A Y
     * @param {Number} bx - Üçgen köşesi B X
     * @param {Number} by - Üçgen köşesi B Y
     * @param {Number} cx - Üçgen köşesi C X
     * @param {Number} cy - Üçgen köşesi C Y
     * @return {Object} Barycentric koordinatlar {u, v, w}
     */
    static barycentric(px, py, ax, ay, bx, by, cx, cy) {
        const v0x = bx - ax;
        const v0y = by - ay;
        const v1x = cx - ax;
        const v1y = cy - ay;
        const v2x = px - ax;
        const v2y = py - ay;
        
        const d00 = v0x * v0x + v0y * v0y;
        const d01 = v0x * v1x + v0y * v1y;
        const d11 = v1x * v1x + v1y * v1y;
        const d20 = v2x * v0x + v2y * v0y;
        const d21 = v2x * v1x + v2y * v1y;
        
        const denom = d00 * d11 - d01 * d01;
        
        if (Math.abs(denom) < this.CONSTANTS.EPSILON) {
            return { u: 0, v: 0, w: 1 };
        }
        
        const v = (d11 * d20 - d01 * d21) / denom;
        const w = (d00 * d21 - d01 * d20) / denom;
        const u = 1.0 - v - w;
        
        return { u, v, w };
    }
    
    /**
     * Bir noktanın bir üçgenin içinde olup olmadığını kontrol eder
     * @param {Number} px - Nokta X
     * @param {Number} py - Nokta Y
     * @param {Number} ax - Üçgen köşesi A X
     * @param {Number} ay - Üçgen köşesi A Y
     * @param {Number} bx - Üçgen köşesi B X
     * @param {Number} by - Üçgen köşesi B Y
     * @param {Number} cx - Üçgen köşesi C X
     * @param {Number} cy - Üçgen köşesi C Y
     * @return {Boolean} Nokta üçgenin içinde mi
     */
    static pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
        // Barycentric koordinatları hesapla
        const { u, v, w } = this.barycentric(px, py, ax, ay, bx, by, cx, cy);
        
        // Tüm koordinatlar 0 ile 1 arasındaysa nokta üçgenin içindedir
        const epsilon = this.CONSTANTS.EPSILON;
        return u >= -epsilon && v >= -epsilon && w >= -epsilon && 
               u <= 1 + epsilon && v <= 1 + epsilon && w <= 1 + epsilon;
    }
    
    /**
     * Doğrusal olmayan yumuşak geçiş fonksiyonu
     * @param {Number} x - Değer (0-1 arası)
     * @param {Number} a - Şekil parametresi
     * @return {Number} Yumuşatılmış değer
     */
    static smoothDamp(x, a = 2) {
        const fa = Math.max(0, Math.min(a, 10));
        const k = fa === 0 ? 0 : Math.pow(a, 3);
        
        return x * x * (k + x) / (k + x * x);
    }
    
    /**
     * Yay hareketi için geçiş fonksiyonu
     * @param {Number} x - Değer (0-1 arası)
     * @param {Number} bounces - Zıplama sayısı
     * @param {Number} damping - Sönümleme faktörü
     * @return {Number} Yay hareketi değeri
     */
    static bounce(x, bounces = 3, damping = 0.5) {
        const k = Math.max(1, bounces) * Math.PI;
        const d = Math.max(0, Math.min(damping, 0.999));
        
        return 1 - Math.pow(d, x * 10) * Math.abs(Math.cos(k * x));
    }
    
    /**
     * Elastik hareket için geçiş fonksiyonu
     * @param {Number} x - Değer (0-1 arası)
     * @param {Number} oscillations - Salınım sayısı
     * @param {Number} damping - Sönümleme faktörü
     * @return {Number} Elastik hareket değeri
     */
    static elastic(x, oscillations = 3, damping = 0.5) {
        const k = Math.max(1, oscillations) * Math.PI;
        const d = Math.max(0, Math.min(damping, 0.999));
        
        return 1 - Math.pow(d, x * 10) * Math.cos(k * x);
    }
    
    /**
     * Sinüs fonksiyonu üzerinde interpolasyon yapar
     * @param {Number} min - Minimum değer
     * @param {Number} max - Maksimum değer
     * @param {Number} t - Zaman değeri
     * @return {Number} Sinüs interpolasyonu
     */
    static sinLerp(min, max, t) {
        return this.lerp(min, max, Math.sin(t));
    }
    
    /**
     * Kosinüs fonksiyonu üzerinde interpolasyon yapar
     * @param {Number} min - Minimum değer
     * @param {Number} max - Maksimum değer
     * @param {Number} t - Zaman değeri
     * @return {Number} Kosinüs interpolasyonu
     */
    static cosLerp(min, max, t) {
        return this.lerp(min, max, Math.cos(t));
    }
    
    /**
     * Perlin gürültüsü benzeri değer üretir (basitleştirilmiş)
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı (isteğe bağlı)
     * @return {Number} Gürültü değeri (-1 ile 1 arası)
     */
    static noise(x, y = 0) {
        // Basitleştirilmiş gürültü fonksiyonu
        // Gerçek bir Perlin gürültüsü için daha karmaşık bir implementasyon gerekir
        
        // Koordinatları birleştir
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        // Kesirli kısımları al
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        
        // Yön vektörleri için
        const u = this.smoothstep(0, 1, xf);
        const v = this.smoothstep(0, 1, yf);
        
        // Permütasyon tablosu
        const p = new Array(512);
        for (let i = 0; i < 256; i++) {
            p[i] = p[i + 256] = Math.floor(Math.random() * 256);
        }
        
        // Hash'leme
        const A = p[X] + Y;
        const B = p[X + 1] + Y;
        
        const AA = p[A];
        const AB = p[A + 1];
        const BA = p[B];
        const BB = p[B + 1];
        
        // Köşe değerlerini hesapla
        const v1 = this._grad(p[AA], xf, yf);
        const v2 = this._grad(p[BA], xf - 1, yf);
        const v3 = this._grad(p[AB], xf, yf - 1);
        const v4 = this._grad(p[BB], xf - 1, yf - 1);
        
        // İnterpolasyon
        const result = this.lerp(
            this.lerp(v1, v2, u),
            this.lerp(v3, v4, u),
            v
        );
        
        // -1 ile 1 arasına normalize et
        return (result + 1) / 2;
    }
    
    /**
     * Gürültü yardımcı fonksiyonu
     * @private
     * @param {Number} hash - Hash değeri
     * @param {Number} x - X değeri
     * @param {Number} y - Y değeri
     * @return {Number} Gradyan değeri
     */
    static _grad(hash, x, y) {
        const h = hash & 15;
        const grad = 1 + (h & 7); // 1, 2, ..., 8 değerleri
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : x;
        
        return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }
    
    /**
     * Bir dizi değer arasından rasgele seçim yapar
     * @param {Array} values - Değerler dizisi
     * @return {*} Rasgele seçilen değer
     */
    static randomChoice(values) {
        return values[Math.floor(Math.random() * values.length)];
    }
    
    /**
     * Rastgele bir integer değer üretir
     * @param {Number} min - Minimum değer (dahil)
     * @param {Number} max - Maksimum değer (dahil)
     * @return {Number} Rastgele integer
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Rastgele bir float değer üretir
     * @param {Number} min - Minimum değer (dahil)
     * @param {Number} max - Maksimum değer (hariç)
     * @return {Number} Rastgele float
     */
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Bir değerin kare kökünü hızlı yaklaşım ile hesaplar
     * @param {Number} x - Değer
     * @return {Number} Kare kök
     */
    static fastSqrt(x) {
        // Kare kökün hızlı yaklaşımı
        // Tam doğruluk gerekmediğinde kullanışlı
        
        const halfx = 0.5 * x;
        let y = x;
        
        // Float bit manipülasyonu
        let i = new Int32Array(1);
        let f = new Float32Array(i.buffer);
        f[0] = x;
        i[0] = 0x5f375a86 - (i[0] >> 1);
        y = f[0];
        
        // Newton iterasyonu (daha iyi yaklaşım)
        y = y * (1.5 - halfx * y * y);
        
        return y * x;
    }
    
    /**
     * Bir değerin karesi
     * @param {Number} x - Değer
     * @return {Number} Kare
     */
    static square(x) {
        return x * x;
    }
    
    /**
     * Bir değerin küpü
     * @param {Number} x - Değer
     * @return {Number} Küp
     */
    static cube(x) {
        return x * x * x;
    }
}

module.exports = MathUtils;