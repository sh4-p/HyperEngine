/**
 * Audio.js - Ses yönetimi
 * Ses efektleri ve müzik çalma işlemlerini yönetir
 */
class Audio {
    constructor() {
        // Ses koleksiyonları
        this.sounds = {};
        this.music = {};
        
        // Aktif müzik
        this.currentMusic = null;
        
        // Ses ayarları
        this.soundVolume = 1.0;
        this.musicVolume = 0.5;
        this.muted = false;
        
        // Ses havuzu (aynı sesi birden fazla kez çalmak için)
        this.soundPool = {};
        this.poolSize = 5;
        
        // Web Audio API
        this.context = null;
        this.masterGain = null;
        this.musicGain = null;
        this.soundGain = null;
        
        // Web Audio API desteği varsa başlat
        this._initAudioContext();
        
        // Singleton instance
        if (Audio.instance) {
            return Audio.instance;
        }
        Audio.instance = this;
    }
    
    /**
     * Web Audio API'yi başlatır
     */
    _initAudioContext() {
        try {
            // Web Audio API'yi oluştur
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            
            // Ana gain node'u
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = this.muted ? 0 : 1;
            this.masterGain.connect(this.context.destination);
            
            // Müzik gain node'u
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);
            
            // Ses gain node'u
            this.soundGain = this.context.createGain();
            this.soundGain.gain.value = this.soundVolume;
            this.soundGain.connect(this.masterGain);
        } catch (e) {
            console.warn('Web Audio API is not supported in this browser');
        }
    }
    
    /**
     * Ses dosyası ekler
     * @param {String} key - Ses anahtarı
     * @param {String} url - Ses dosyası URL'si
     * @param {Boolean} isMusic - Müzik mi ses efekti mi
     */
    add(key, url, isMusic = false) {
        if (isMusic) {
            this.music[key] = {
                url: url,
                buffer: null,
                source: null,
                loop: true,
                volume: 1.0,
                playing: false,
                loaded: false
            };
        } else {
            this.sounds[key] = {
                url: url,
                buffer: null,
                volume: 1.0,
                loaded: false
            };
            
            // Ses havuzunu oluştur
            this.soundPool[key] = [];
        }
        
        // Ses dosyasını hafızaya yükle
        this._loadAudio(key, url, isMusic);
    }
    
    /**
     * Ses dosyasını hafızaya yükler
     * @param {String} key - Ses anahtarı
     * @param {String} url - Ses dosyası URL'si
     * @param {Boolean} isMusic - Müzik mi ses efekti mi
     */
    _loadAudio(key, url, isMusic) {
        // Web Audio API desteği yoksa
        if (!this.context) return;
        
        // AJAX isteği ile ses dosyasını yükle
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        
        request.onload = () => {
            // Ses dosyasını decode et
            this.context.decodeAudioData(
                request.response,
                (buffer) => {
                    // Decode başarılı
                    if (isMusic) {
                        this.music[key].buffer = buffer;
                        this.music[key].loaded = true;
                    } else {
                        this.sounds[key].buffer = buffer;
                        this.sounds[key].loaded = true;
                        
                        // Ses havuzunu önceden doldur
                        this._fillSoundPool(key);
                    }
                },
                (error) => {
                    // Decode hatası
                    console.error(`Error decoding audio data for ${key}: ${error}`);
                }
            );
        };
        
        request.onerror = () => {
            console.error(`Error loading audio file: ${url}`);
        };
        
        request.send();
    }
    
    /**
     * Ses havuzunu doldurur
     * @param {String} key - Ses anahtarı
     */
    _fillSoundPool(key) {
        // Ses yüklenmemişse veya havuz zaten doluysa
        if (!this.sounds[key] || !this.sounds[key].loaded) return;
        if (this.soundPool[key].length >= this.poolSize) return;
        
        // Havuz boyutuna göre source node oluştur
        const buffer = this.sounds[key].buffer;
        
        for (let i = this.soundPool[key].length; i < this.poolSize; i++) {
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            
            const gainNode = this.context.createGain();
            gainNode.gain.value = this.sounds[key].volume;
            
            source.connect(gainNode);
            gainNode.connect(this.soundGain);
            
            this.soundPool[key].push({
                source: source,
                gain: gainNode,
                playing: false
            });
        }
    }
    
    /**
     * Ses efekti çalar
     * @param {String} key - Ses anahtarı
     * @param {Object} options - Çalma seçenekleri
     * @return {Object} Ses kaynağı veya null
     */
    playSound(key, options = {}) {
        // Web Audio API desteği yoksa veya ses yüklenmemişse
        if (!this.context || !this.sounds[key] || !this.sounds[key].loaded) return null;
        
        // Varsayılan seçenekler
        const settings = Object.assign({
            volume: 1.0,
            loop: false,
            rate: 1.0,
            detune: 0
        }, options);
        
        // Mute durumunda çalma
        if (this.muted) return null;
        
        // Ses havuzundan boş bir source al
        const poolItem = this._getAvailableSoundSource(key);
        
        if (!poolItem) return null;
        
        const source = poolItem.source;
        const gain = poolItem.gain;
        
        // Ses seçeneklerini ayarla
        source.loop = settings.loop;
        source.playbackRate.value = settings.rate;
        if (source.detune) {
            source.detune.value = settings.detune;
        }
        
        gain.gain.value = settings.volume * this.sounds[key].volume;
        
        // Sesi çal
        source.start(0);
        poolItem.playing = true;
        
        // Çalma bitince havuza geri ekle
        source.onended = () => {
            poolItem.playing = false;
            
            // Yeni bir source ekle
            const newSource = this.context.createBufferSource();
            newSource.buffer = this.sounds[key].buffer;
            newSource.connect(gain);
            
            poolItem.source = newSource;
        };
        
        return {
            source: source,
            gain: gain,
            stop: () => {
                source.stop();
                poolItem.playing = false;
            }
        };
    }
    
    /**
     * Ses havuzundan boş bir source alır
     * @param {String} key - Ses anahtarı
     * @return {Object} Havuz öğesi veya null
     */
    _getAvailableSoundSource(key) {
        // Ses havuzunu kontrol et
        for (const item of this.soundPool[key]) {
            if (!item.playing) {
                return item;
            }
        }
        
        // Havuz doluysa, yeni bir öğe oluştur
        if (this.soundPool[key].length < this.poolSize) {
            this._fillSoundPool(key);
            return this.soundPool[key][this.soundPool[key].length - 1];
        }
        
        // Havuz dolu ve tüm öğeler kullanılıyorsa, en eski öğeyi yeniden kullan
        const oldestItem = this.soundPool[key][0];
        oldestItem.source.stop();
        oldestItem.playing = false;
        
        // Yeni bir source ekle
        const newSource = this.context.createBufferSource();
        newSource.buffer = this.sounds[key].buffer;
        newSource.connect(oldestItem.gain);
        
        oldestItem.source = newSource;
        
        return oldestItem;
    }
    
    /**
     * Müzik çalar
     * @param {String} key - Müzik anahtarı
     * @param {Object} options - Çalma seçenekleri
     */
    playMusic(key, options = {}) {
        // Web Audio API desteği yoksa veya müzik yüklenmemişse
        if (!this.context || !this.music[key] || !this.music[key].loaded) return;
        
        // Varsayılan seçenekler
        const settings = Object.assign({
            volume: 1.0,
            loop: true,
            rate: 1.0,
            fadeIn: 0,
            fadeOut: 0
        }, options);
        
        // Şu anda çalan bir müzik varsa durdur
        if (this.currentMusic && this.music[this.currentMusic].playing) {
            this.stopMusic(settings.fadeOut);
        }
        
        // Yeni müziği ayarla
        const music = this.music[key];
        
        // Source node oluştur
        music.source = this.context.createBufferSource();
        music.source.buffer = music.buffer;
        music.source.loop = settings.loop;
        music.source.playbackRate.value = settings.rate;
        
        // Gain node oluştur
        const gainNode = this.context.createGain();
        
        // Fade-in için başlangıç volume'unu 0 yap
        if (settings.fadeIn > 0) {
            gainNode.gain.value = 0;
        } else {
            gainNode.gain.value = settings.volume * music.volume * this.musicVolume;
        }
        
        // Bağlantıları yap
        music.source.connect(gainNode);
        gainNode.connect(this.musicGain);
        music.gainNode = gainNode;
        
        // Müziği çal
        music.source.start(0);
        music.playing = true;
        this.currentMusic = key;
        
        // Fade-in
        if (settings.fadeIn > 0) {
            this._fadeMusicVolume(gainNode, 0, settings.volume * music.volume * this.musicVolume, settings.fadeIn);
        }
        
        // Çalma bitince
        music.source.onended = () => {
            if (!settings.loop) {
                music.playing = false;
                if (this.currentMusic === key) {
                    this.currentMusic = null;
                }
            }
        };
    }
    
    /**
     * Çalan müziği durdurur
     * @param {Number} fadeOut - Fade-out süresi (saniye)
     */
    stopMusic(fadeOut = 0) {
        // Çalan müzik yoksa
        if (!this.currentMusic || !this.music[this.currentMusic].playing) return;
        
        const music = this.music[this.currentMusic];
        
        // Fade-out
        if (fadeOut > 0) {
            const finalVolume = music.gainNode.gain.value;
            this._fadeMusicVolume(music.gainNode, finalVolume, 0, fadeOut, () => {
                music.source.stop();
                music.playing = false;
                this.currentMusic = null;
            });
        } else {
            // Hemen durdur
            music.source.stop();
            music.playing = false;
            this.currentMusic = null;
        }
    }
    
    /**
     * Fade efekti uygular
     * @param {GainNode} gainNode - Gain node
     * @param {Number} startVolume - Başlangıç ses seviyesi
     * @param {Number} endVolume - Bitiş ses seviyesi
     * @param {Number} duration - Süre (saniye)
     * @param {Function} callback - Tamamlandığında çağrılacak fonksiyon
     */
    _fadeMusicVolume(gainNode, startVolume, endVolume, duration, callback = null) {
        const currentTime = this.context.currentTime;
        
        // Ses seviyesini başlangıç değerine ayarla
        gainNode.gain.setValueAtTime(startVolume, currentTime);
        
        // Bitiş değerine lineer olarak değiştir
        gainNode.gain.linearRampToValueAtTime(endVolume, currentTime + duration);
        
        // Callback'i çağır
        if (callback) {
            setTimeout(callback, duration * 1000);
        }
    }
    
    /**
     * Ses efekti sesini ayarlar
     * @param {Number} volume - Ses seviyesi (0.0 - 1.0)
     */
    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        
        if (this.soundGain) {
            this.soundGain.gain.value = this.soundVolume;
        }
    }
    
    /**
     * Müzik sesini ayarlar
     * @param {Number} volume - Ses seviyesi (0.0 - 1.0)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }
    
    /**
     * Sessize alma durumunu değiştirir
     * @param {Boolean} muted - Sessize al/kapat
     */
    setMuted(muted) {
        this.muted = muted;
        
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : 1;
        }
    }
    
    /**
     * Belirli bir sesin sesini ayarlar
     * @param {String} key - Ses anahtarı
     * @param {Number} volume - Ses seviyesi (0.0 - 1.0)
     * @param {Boolean} isMusic - Müzik mi ses efekti mi
     */
    setVolume(key, volume, isMusic = false) {
        volume = Math.max(0, Math.min(1, volume));
        
        if (isMusic && this.music[key]) {
            this.music[key].volume = volume;
            
            // Şu anda çalıyorsa güncelle
            if (this.currentMusic === key && this.music[key].playing) {
                this.music[key].gainNode.gain.value = volume * this.musicVolume;
            }
        } else if (!isMusic && this.sounds[key]) {
            this.sounds[key].volume = volume;
        }
    }
    
    /**
     * Ses sistemini başlatır (kullanıcı etkileşimi gerektirir)
     */
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!Audio.instance) {
            new Audio();
        }
        return Audio.instance;
    }
}

// Singleton instance
Audio.instance = null;