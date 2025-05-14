/**
 * Random.js - Gelişmiş rastgele sayı üreteci
 * Oyunlar için yüksek kaliteli rastgele sayı ve dağılım fonksiyonları sağlar
 */
class Random {
    constructor(seed = null) {
        // Seed değeri
        this.seed = seed !== null ? seed : Math.floor(Math.random() * 2147483647);
        this._initialSeed = this.seed;
        
        // Mersenne Twister için değişkenler
        this.N = 624;
        this.M = 397;
        this.MATRIX_A = 0x9908b0df;
        this.UPPER_MASK = 0x80000000;
        this.LOWER_MASK = 0x7fffffff;
        this.mt = new Array(this.N);
        this.mti = this.N + 1;
        
        // Seed'i kullanarak random üreteci başlat
        this._initializeGenerator(this.seed);
        
        // Singleton instance
        if (Random.instance) {
            return Random.instance;
        }
        Random.instance = this;
    }
    
    /**
     * Üreteci başlatır
     * @private
     * @param {Number} seed - Seed değeri
     */
    _initializeGenerator(seed) {
        this.mt[0] = seed >>> 0;
        
        for (this.mti = 1; this.mti < this.N; this.mti++) {
            const s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
            this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253) + this.mti;
            this.mt[this.mti] >>>= 0;
        }
    }
    
    /**
     * İlk seed değerini yeniden kullanarak üreteci sıfırlar
     */
    reset() {
        this._initializeGenerator(this._initialSeed);
    }
    
    /**
     * Yeni bir seed değeri ayarlar
     * @param {Number} seed - Yeni seed değeri
     */
    setSeed(seed) {
        this.seed = seed;
        this._initialSeed = seed;
        this._initializeGenerator(seed);
    }
    
    /**
     * Rastgele bir 32-bit tamsayı üretir
     * @private
     * @return {Number} Rastgele tamsayı
     */
    _int32() {
        let y;
        const mag01 = [0x0, this.MATRIX_A];
        
        // mt dizisini yenile
        if (this.mti >= this.N) {
            let kk;
            
            if (this.mti === this.N + 1) {
                this._initializeGenerator(5489);
            }
            
            for (kk = 0; kk < this.N - this.M; kk++) {
                y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            
            for (; kk < this.N - 1; kk++) {
                y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            
            y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
            this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
            
            this.mti = 0;
        }
        
        y = this.mt[this.mti++];
        
        // Tempering
        y ^= (y >>> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >>> 18);
        
        return y >>> 0;
    }
    
    /**
     * 0-1 arasında rastgele bir sayı üretir
     * @return {Number} 0-1 arasında rastgele sayı
     */
    random() {
        return this._int32() * (1.0 / 4294967296.0);
    }
    
    /**
     * min-max arasında rastgele bir tamsayı üretir (her iki değer de dahil)
     * @param {Number} min - Minimum değer
     * @param {Number} max - Maksimum değer
     * @return {Number} Rastgele tamsayı
     */
    randomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return min + Math.floor(this.random() * (max - min + 1));
    }
    
    /**
     * min-max arasında rastgele bir ondalıklı sayı üretir
     * @param {Number} min - Minimum değer
     * @param {Number} max - Maksimum değer
     * @return {Number} Rastgele ondalıklı sayı
     */
    randomFloat(min, max) {
        return min + this.random() * (max - min);
    }
    
    /**
     * Verilen diziden rastgele bir öğe seçer
     * @param {Array} array - Öğe dizisi
     * @return {*} Seçilen öğe
     */
    randomItem(array) {
        if (array.length === 0) return null;
        return array[this.randomInt(0, array.length - 1)];
    }
    
    /**
     * Verilen diziden belirli sayıda rastgele öğe seçer
     * @param {Array} array - Öğe dizisi
     * @param {Number} count - Seçilecek öğe sayısı
     * @param {Boolean} allowDuplicates - Tekrarlara izin verilsin mi
     * @return {Array} Seçilen öğelerin dizisi
     */
    randomItems(array, count, allowDuplicates = false) {
        if (array.length === 0) return [];
        if (count <= 0) return [];
        
        if (allowDuplicates) {
            // Tekrarlara izin veriliyorsa
            const result = [];
            for (let i = 0; i < count; i++) {
                result.push(this.randomItem(array));
            }
            return result;
        } else {
            // Tekrarlara izin verilmiyorsa
            if (count > array.length) {
                count = array.length;
            }
            
            const arrayCopy = [...array];
            const result = [];
            
            for (let i = 0; i < count; i++) {
                const index = this.randomInt(0, arrayCopy.length - 1);
                result.push(arrayCopy[index]);
                arrayCopy.splice(index, 1);
            }
            
            return result;
        }
    }
    
    /**
     * Verilen diziyi karıştırır (Fisher-Yates shuffle)
     * @param {Array} array - Karıştırılacak dizi
     * @return {Array} Karıştırılmış dizi
     */
    shuffle(array) {
        const result = [...array];
        
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        
        return result;
    }
    
    /**
     * Ağırlıklı olasılıklarla rastgele bir öğe seçer
     * @param {Array} items - Öğe dizisi
     * @param {Array} weights - Öğelerin ağırlıkları
     * @return {*} Seçilen öğe
     */
    weightedRandom(items, weights) {
        if (items.length !== weights.length) {
            throw new Error('Items and weights arrays must be of the same length');
        }
        
        if (items.length === 0) return null;
        
        // Ağırlık toplamını hesapla
        let totalWeight = 0;
        for (const weight of weights) {
            totalWeight += weight;
        }
        
        // Rastgele bir değer seç
        let random = this.random() * totalWeight;
        
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
     * Normal dağılımlı (Gaussian) rastgele sayı üretir
     * @param {Number} mean - Ortalama değer
     * @param {Number} stdDev - Standart sapma
     * @return {Number} Normal dağılımlı rastgele sayı
     */
    randomNormal(mean = 0, stdDev = 1) {
        // Box-Muller dönüşümü
        const u1 = this.random();
        const u2 = this.random();
        
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        
        return mean + z0 * stdDev;
    }
    
    /**
     * Üstel dağılımlı rastgele sayı üretir
     * @param {Number} lambda - Lambda parametresi (ortalama = 1/lambda)
     * @return {Number} Üstel dağılımlı rastgele sayı
     */
    randomExponential(lambda = 1) {
        return -Math.log(1 - this.random()) / lambda;
    }
    
    /**
     * Poisson dağılımlı rastgele tamsayı üretir
     * @param {Number} lambda - Lambda parametresi (ortalama)
     * @return {Number} Poisson dağılımlı rastgele tamsayı
     */
    randomPoisson(lambda = 1) {
        if (lambda <= 0) {
            return 0;
        }
        
        const L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        
        do {
            k++;
            p *= this.random();
        } while (p > L);
        
        return k - 1;
    }
    
    /**
     * Yanlı bir para atışı simüle eder
     * @param {Number} probability - Yazı gelme olasılığı (0-1 arası)
     * @return {Boolean} Yazı geldi mi
     */
    coinFlip(probability = 0.5) {
        return this.random() < probability;
    }
    
    /**
     * Zarla atma simüle eder
     * @param {Number} sides - Zar yüzü sayısı
     * @param {Number} count - Atılacak zar sayısı
     * @return {Array} Zar sonuçları
     */
    rollDice(sides = 6, count = 1) {
        const results = [];
        
        for (let i = 0; i < count; i++) {
            results.push(this.randomInt(1, sides));
        }
        
        return results;
    }
    
    /**
     * Rastgele renk üretir
     * @param {Boolean} includeAlpha - Alpha değeri eklensin mi
     * @return {String} Renk kodu
     */
    randomColor(includeAlpha = false) {
        if (includeAlpha) {
            return `rgba(${this.randomInt(0, 255)}, ${this.randomInt(0, 255)}, ${this.randomInt(0, 255)}, ${this.randomFloat(0, 1).toFixed(2)})`;
        } else {
            return `rgb(${this.randomInt(0, 255)}, ${this.randomInt(0, 255)}, ${this.randomInt(0, 255)})`;
        }
    }
    
    /**
     * Rastgele hex renk kodu üretir
     * @return {String} Hex renk kodu
     */
    randomHexColor() {
        let r = this.randomInt(0, 255).toString(16);
        let g = this.randomInt(0, 255).toString(16);
        let b = this.randomInt(0, 255).toString(16);
        
        r = r.length === 1 ? '0' + r : r;
        g = g.length === 1 ? '0' + g : g;
        b = b.length === 1 ? '0' + b : b;
        
        return `#${r}${g}${b}`;
    }
    
    /**
     * Belirli bir uzunlukta rastgele dizge üretir
     * @param {Number} length - Dizge uzunluğu
     * @param {String} charset - Karakter seti (isteğe bağlı)
     * @return {String} Rastgele dizge
     */
    randomString(length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        const charsetLength = charset.length;
        
        for (let i = 0; i < length; i++) {
            result += charset.charAt(this.randomInt(0, charsetLength - 1));
        }
        
        return result;
    }
    
    /**
     * Belirli bir uzunlukta uuid benzeri bir dizge üretir
     * @return {String} UUID benzeri dizge
     */
    uuid() {
        const pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
        
        return pattern.replace(/[xy]/g, (c) => {
            const r = this.randomInt(0, 15);
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Perlin gürültüsü benzeri değer üretir (basitleştirilmiş)
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı (isteğe bağlı)
     * @return {Number} Gürültü değeri (0-1 arası)
     */
    noise(x, y = 0) {
        // Basitleştirilmiş gürültü fonksiyonu
        
        // Koordinatları tamsayıya dönüştür
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        
        // Kesirli kısımlar
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        
        // Yumuşatma eğrisi
        const u = this._fade(xf);
        const v = this._fade(yf);
        
        // Hash değerleri
        const aaa = this._p[this._p[xi] + yi];
        const aba = this._p[this._p[xi] + yi + 1];
        const baa = this._p[this._p[xi + 1] + yi];
        const bba = this._p[this._p[xi + 1] + yi + 1];
        
        // Gradyan vektörler
        const g1 = this._grad(aaa, xf, yf);
        const g2 = this._grad(baa, xf - 1, yf);
        const g3 = this._grad(aba, xf, yf - 1);
        const g4 = this._grad(bba, xf - 1, yf - 1);
        
        // Lineer interpolasyon
        const lerp1 = this._lerp(g1, g2, u);
        const lerp2 = this._lerp(g3, g4, u);
        const lerp3 = this._lerp(lerp1, lerp2, v);
        
        // 0-1 aralığına normalize et
        return (lerp3 + 1) / 2;
    }
    
    /**
     * Perlin gürültüsü yardımcı fonksiyonu - Yumuşatma eğrisi
     * @private
     * @param {Number} t - Değer
     * @return {Number} Yumuşatılmış değer
     */
    _fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    /**
     * Perlin gürültüsü yardımcı fonksiyonu - Lineer interpolasyon
     * @private
     * @param {Number} a - İlk değer
     * @param {Number} b - İkinci değer
     * @param {Number} t - İnterpolasyon faktörü
     * @return {Number} İnterpolasyon sonucu
     */
    _lerp(a, b, t) {
        return a + t * (b - a);
    }
    
    /**
     * Perlin gürültüsü yardımcı fonksiyonu - Gradyan
     * @private
     * @param {Number} hash - Hash değeri
     * @param {Number} x - X değeri
     * @param {Number} y - Y değeri
     * @return {Number} Gradyan değeri
     */
    _grad(hash, x, y) {
        const h = hash & 15;
        const grad_x = (h < 8) ? x : y;
        const grad_y = (h < 4) ? y : ((h === 12 || h === 14) ? x : 0);
        return ((h & 1) ? -grad_x : grad_x) + ((h & 2) ? -grad_y : grad_y);
    }
    
    /**
     * Perlin gürültüsü yardımcı fonksiyonu - Hash tablosu
     */
    get _p() {
        if (!this._pTable) {
            this._pTable = new Array(512);
            for (let i = 0; i < 256; i++) {
                this._pTable[i] = this._pTable[i + 256] = this.randomInt(0, 255);
            }
        }
        return this._pTable;
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!Random.instance) {
            new Random();
        }
        return Random.instance;
    }
}

// Singleton instance
Random.instance = null;

module.exports = Random;