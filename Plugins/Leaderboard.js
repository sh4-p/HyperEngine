/**
 * Leaderboard.js - Lider tablosu yönetimi
 * Yüksek skorları ve sıralamaları yönetir
 */
class Leaderboard {
    constructor(config = {}) {
        // Lider tablosu yapılandırması
        this.config = Object.assign({
            storage: 'local', // 'local', 'cloud', 'hybrid'
            useGameCenter: true, // iOS Game Center entegrasyonu
            useGooglePlay: true, // Google Play Games entegrasyonu
            maxEntries: 100, // Maksimum kayıt sayısı
            savePrefix: 'hypergame_leaderboard_', // Kayıt öneki
            uniquePlayerIds: true, // Her oyuncu için tek kayıt
            scoreFormat: 'descending', // 'ascending', 'descending'
            autosave: true, // Otomatik kaydetme
            debug: false // Debug modu
        }, config);
        
        // Lider tabloları
        this.leaderboards = {};
        
        // Aktif lider tablosu
        this.activeLeaderboard = null;
        
        // Olaylar
        this.onScoreSubmitted = null;
        this.onLeaderboardLoaded = null;
        this.onError = null;
        
        // Singleton instance
        if (Leaderboard.instance) {
            return Leaderboard.instance;
        }
        Leaderboard.instance = this;
    }
    
    /**
     * Lider tablosu oluşturur
     * @param {String} id - Lider tablosu ID'si
     * @param {Object} options - Tablo seçenekleri
     * @return {Object} Oluşturulan lider tablosu
     */
    createLeaderboard(id, options = {}) {
        if (this.leaderboards[id]) {
            if (this.config.debug) {
                console.warn(`Leaderboard ${id} already exists`);
            }
            return this.leaderboards[id];
        }
        
        const leaderboard = {
            id: id,
            name: options.name || id,
            description: options.description || '',
            icon: options.icon || '',
            platformIds: options.platformIds || {},
            category: options.category || 'default',
            timeScope: options.timeScope || 'alltime', // 'alltime', 'weekly', 'daily'
            scoreFormat: options.scoreFormat || this.config.scoreFormat,
            entryFormatter: options.entryFormatter || null,
            scoreSort: options.scoreFormat === 'ascending' ? 
                (a, b) => a.score - b.score : 
                (a, b) => b.score - a.score,
            uniquePlayerIds: options.uniquePlayerIds !== undefined ? 
                options.uniquePlayerIds : this.config.uniquePlayerIds,
            maxEntries: options.maxEntries || this.config.maxEntries,
            entries: [],
            lastUpdated: null
        };
        
        this.leaderboards[id] = leaderboard;
        
        // Aktif lider tablosu yoksa bunu aktif yap
        if (!this.activeLeaderboard) {
            this.activeLeaderboard = id;
        }
        
        // Kayıtlı verileri yükle
        this._loadLeaderboard(id);
        
        if (this.config.debug) {
            console.log(`Leaderboard created: ${id}`);
        }
        
        return leaderboard;
    }
    
    /**
     * Aktif lider tablosunu değiştirir
     * @param {String} id - Lider tablosu ID'si
     * @return {Boolean} İşlem başarılı mı
     */
    setActiveLeaderboard(id) {
        if (!this.leaderboards[id]) {
            if (this.config.debug) {
                console.error(`Leaderboard not found: ${id}`);
            }
            return false;
        }
        
        this.activeLeaderboard = id;
        
        if (this.config.debug) {
            console.log(`Active leaderboard set to: ${id}`);
        }
        
        return true;
    }
    
    /**
     * Yeni skor ekler
     * @param {Object} entry - Skor girdisi
     * @param {String} leaderboardId - Lider tablosu ID'si (isteğe bağlı)
     * @return {Object|Boolean} Eklenen girdi veya false (başarısız olursa)
     */
    submitScore(entry, leaderboardId = null) {
        const id = leaderboardId || this.activeLeaderboard;
        
        if (!id) {
            if (this.config.debug) {
                console.error('No active leaderboard');
            }
            return false;
        }
        
        const leaderboard = this.leaderboards[id];
        
        if (!leaderboard) {
            if (this.config.debug) {
                console.error(`Leaderboard not found: ${id}`);
            }
            return false;
        }
        
        // Temel alanları doğrula
        if (!entry.playerName || entry.score === undefined) {
            if (this.config.debug) {
                console.error('Invalid entry, missing required fields');
            }
            return false;
        }
        
        // Skor girdisini hazırla
        const newEntry = {
            playerName: entry.playerName,
            playerId: entry.playerId || entry.playerName,
            score: Number(entry.score),
            rank: 0, // Sıralama sonra hesaplanacak
            date: entry.date || new Date().toISOString(),
            data: entry.data || {},
            platform: entry.platform || 'web',
            formattedScore: entry.formattedScore || this._formatScore(entry.score, leaderboard)
        };
        
        // Platforma özgü skoru gönder
        this._submitScoreToPlatforms(newEntry, leaderboard);
        
        // Aynı oyuncunun önceki kaydı varsa kontrol et
        if (leaderboard.uniquePlayerIds) {
            const existingIndex = leaderboard.entries.findIndex(e => e.playerId === newEntry.playerId);
            
            if (existingIndex !== -1) {
                const existing = leaderboard.entries[existingIndex];
                
                // Yeni skor daha iyi mi?
                if ((leaderboard.scoreFormat === 'descending' && newEntry.score > existing.score) ||
                    (leaderboard.scoreFormat === 'ascending' && newEntry.score < existing.score)) {
                    
                    // Eski skoru güncelle
                    leaderboard.entries[existingIndex] = newEntry;
                    
                    if (this.config.debug) {
                        console.log(`Updated existing score for ${newEntry.playerName}`);
                    }
                } else {
                    if (this.config.debug) {
                        console.log(`Score not good enough to replace existing score for ${newEntry.playerName}`);
                    }
                    return false;
                }
            } else {
                // Yeni girdi ekle
                leaderboard.entries.push(newEntry);
            }
        } else {
            // Her zaman yeni girdi ekle
            leaderboard.entries.push(newEntry);
        }
        
        // Lider tablosunu sırala
        this._sortLeaderboard(leaderboard);
        
        // Maksimum girdi sayısını kontrol et
        if (leaderboard.entries.length > leaderboard.maxEntries) {
            leaderboard.entries = leaderboard.entries.slice(0, leaderboard.maxEntries);
        }
        
        // Son güncelleme zamanını kaydet
        leaderboard.lastUpdated = new Date().toISOString();
        
        // Otomatik kaydetme
        if (this.config.autosave) {
            this._saveLeaderboard(id);
        }
        
        // Olayı tetikle
        if (this.onScoreSubmitted) {
            this.onScoreSubmitted(newEntry, id);
        }
        
        return newEntry;
    }
    
    /**
     * Lider tablosunu sıralar
     * @param {Object} leaderboard - Lider tablosu
     */
    _sortLeaderboard(leaderboard) {
        // Skora göre sırala
        leaderboard.entries.sort(leaderboard.scoreSort);
        
        // Sıralamaları güncelle
        leaderboard.entries.forEach((entry, index) => {
            entry.rank = index + 1;
        });
    }
    
    /**
     * Skoru biçimlendirir
     * @param {Number} score - Skor değeri
     * @param {Object} leaderboard - Lider tablosu
     * @return {String} Biçimlendirilmiş skor
     */
    _formatScore(score, leaderboard) {
        // Özel biçimlendirici varsa kullan
        if (leaderboard.entryFormatter && typeof leaderboard.entryFormatter === 'function') {
            return leaderboard.entryFormatter(score);
        }
        
        // Basit biçimlendirme
        return score.toLocaleString();
    }
    
    /**
     * Skoru platformlara gönderir
     * @param {Object} entry - Skor girdisi
     * @param {Object} leaderboard - Lider tablosu
     */
    _submitScoreToPlatforms(entry, leaderboard) {
        // iOS Game Center
        if (this.config.useGameCenter && window.gameCenter && leaderboard.platformIds.gameCenter) {
            window.gameCenter.submitScore({
                score: entry.score,
                leaderboardId: leaderboard.platformIds.gameCenter
            }, () => {}, () => {});
        }
        
        // Google Play Games
        if (this.config.useGooglePlay && window.plugins && window.plugins.playGamesServices && leaderboard.platformIds.googlePlay) {
            window.plugins.playGamesServices.submitScore({
                score: entry.score,
                leaderboardId: leaderboard.platformIds.googlePlay
            }, () => {}, () => {});
        }
    }
    
    /**
     * Lider tablosunu kaydeder
     * @param {String} id - Lider tablosu ID'si
     * @return {Boolean} Kaydetme başarılı mı
     */
    _saveLeaderboard(id) {
        try {
            const leaderboard = this.leaderboards[id];
            
            if (!leaderboard) {
                return false;
            }
            
            // Kaydedilecek verileri hazırla
            const data = {
                entries: leaderboard.entries,
                lastUpdated: leaderboard.lastUpdated
            };
            
            // Local Storage
            if (this.config.storage === 'local' || this.config.storage === 'hybrid') {
                localStorage.setItem(
                    this.config.savePrefix + id,
                    JSON.stringify(data)
                );
                
                if (this.config.debug) {
                    console.log(`Leaderboard saved: ${id}`);
                }
            }
            
            // Cloud Storage (özel implementasyon gerektirir)
            if (this.config.storage === 'cloud' || this.config.storage === 'hybrid') {
                // Bulut kayıt sisteminizi entegre edin
                // Örnek: CloudStorage.save(this.config.savePrefix + id, data);
            }
            
            return true;
        } catch (error) {
            console.error(`Failed to save leaderboard ${id}`, error);
            
            if (this.onError) {
                this.onError(error);
            }
            
            return false;
        }
    }
    
    /**
     * Lider tablosunu yükler
     * @param {String} id - Lider tablosu ID'si
     * @return {Boolean} Yükleme başarılı mı
     */
    _loadLeaderboard(id) {
        try {
            const leaderboard = this.leaderboards[id];
            
            if (!leaderboard) {
                return false;
            }
            
            let data = null;
            
            // Local Storage
            if (this.config.storage === 'local' || this.config.storage === 'hybrid') {
                const savedData = localStorage.getItem(this.config.savePrefix + id);
                
                if (savedData) {
                    data = JSON.parse(savedData);
                }
            }
            
            // Cloud Storage (özel implementasyon gerektirir)
            if (!data && (this.config.storage === 'cloud' || this.config.storage === 'hybrid')) {
                // Bulut kayıt sisteminizi entegre edin
                // Örnek: data = CloudStorage.load(this.config.savePrefix + id);
            }
            
            if (data && data.entries) {
                leaderboard.entries = data.entries;
                leaderboard.lastUpdated = data.lastUpdated;
                
                // Sıralamayı güncelle
                this._sortLeaderboard(leaderboard);
                
                if (this.config.debug) {
                    console.log(`Leaderboard loaded: ${id}`);
                }
                
                // Olayı tetikle
                if (this.onLeaderboardLoaded) {
                    this.onLeaderboardLoaded(id);
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`Failed to load leaderboard ${id}`, error);
            
            if (this.onError) {
                this.onError(error);
            }
            
            return false;
        }
    }
    
    /**
     * Tüm lider tablolarını kaydeder
     * @return {Boolean} Kaydetme başarılı mı
     */
    saveAll() {
        let success = true;
        
        for (const id in this.leaderboards) {
            if (!this._saveLeaderboard(id)) {
                success = false;
            }
        }
        
        return success;
    }
    
    /**
     * Belirli bir oyuncunun sıralamasını alır
     * @param {String} playerId - Oyuncu ID'si
     * @param {String} leaderboardId - Lider tablosu ID'si (isteğe bağlı)
     * @return {Object|null} Oyuncu sıralaması veya null (bulunamazsa)
     */
    getPlayerRank(playerId, leaderboardId = null) {
        const id = leaderboardId || this.activeLeaderboard;
        
        if (!id) {
            if (this.config.debug) {
                console.error('No active leaderboard');
            }
            return null;
        }
        
        const leaderboard = this.leaderboards[id];
        
        if (!leaderboard) {
            if (this.config.debug) {
                console.error(`Leaderboard not found: ${id}`);
            }
            return null;
        }
        
        const entry = leaderboard.entries.find(e => e.playerId === playerId);
        
        if (!entry) {
            return null;
        }
        
        return {
            rank: entry.rank,
            score: entry.score,
            formattedScore: entry.formattedScore,
            totalPlayers: leaderboard.entries.length
        };
    }
    
    /**
     * Lider tablosunun en iyi skorlarını alır
     * @param {String} leaderboardId - Lider tablosu ID'si (isteğe bağlı)
     * @param {Number} limit - Maksimum girdi sayısı (isteğe bağlı)
     * @return {Array} Lider tablosu girdileri
     */
    getTopScores(leaderboardId = null, limit = 10) {
        const id = leaderboardId || this.activeLeaderboard;
        
        if (!id) {
            if (this.config.debug) {
                console.error('No active leaderboard');
            }
            return [];
        }
        
        const leaderboard = this.leaderboards[id];
        
        if (!leaderboard) {
            if (this.config.debug) {
                console.error(`Leaderboard not found: ${id}`);
            }
            return [];
        }
        
        return leaderboard.entries.slice(0, limit);
    }
    
    /**
     * Belirli bir oyuncunun çevresindeki skorları alır
     * @param {String} playerId - Oyuncu ID'si
     * @param {Number} count - Çevredeki kayıt sayısı
     * @param {String} leaderboardId - Lider tablosu ID'si (isteğe bağlı)
     * @return {Array} Çevredeki skorlar
     */
    getScoresAroundPlayer(playerId, count = 5, leaderboardId = null) {
        const id = leaderboardId || this.activeLeaderboard;
        
        if (!id) {
            if (this.config.debug) {
                console.error('No active leaderboard');
            }
            return [];
        }
        
        const leaderboard = this.leaderboards[id];
        
        if (!leaderboard) {
            if (this.config.debug) {
                console.error(`Leaderboard not found: ${id}`);
            }
            return [];
        }
        
        // Oyuncunun sıralamasını bul
        const playerIndex = leaderboard.entries.findIndex(e => e.playerId === playerId);
        
        if (playerIndex === -1) {
            return [];
        }
        
        // Başlangıç ve bitiş indekslerini hesapla
        const half = Math.floor(count / 2);
        let start = Math.max(0, playerIndex - half);
        let end = Math.min(leaderboard.entries.length, start + count);
        
        // Başlangıç indeksini tekrar ayarla
        if (end === leaderboard.entries.length) {
            start = Math.max(0, end - count);
        }
        
        return leaderboard.entries.slice(start, end);
    }
    
    /**
     * Platformdan lider tablosunu yükler
     * @param {String} leaderboardId - Lider tablosu ID'si
     * @param {String} platform - Platform adı ('gameCenter', 'googlePlay')
     * @param {Number} limit - Maksimum girdi sayısı
     * @return {Promise} Yükleme sözü
     */
    loadFromPlatform(leaderboardId, platform = 'gameCenter', limit = 10) {
        return new Promise((resolve, reject) => {
            const leaderboard = this.leaderboards[leaderboardId];
            
            if (!leaderboard) {
                reject(new Error(`Leaderboard not found: ${leaderboardId}`));
                return;
            }
            
            const platformId = leaderboard.platformIds[platform];
            
            if (!platformId) {
                reject(new Error(`Platform ID not found for ${platform}`));
                return;
            }
            
            if (platform === 'gameCenter' && window.gameCenter) {
                window.gameCenter.showLeaderboard({
                    leaderboardId: platformId
                }, resolve, reject);
            } else if (platform === 'googlePlay' && window.plugins && window.plugins.playGamesServices) {
                window.plugins.playGamesServices.showLeaderboard({
                    leaderboardId: platformId
                }, resolve, reject);
            } else {
                reject(new Error(`Platform not supported or not available: ${platform}`));
            }
        });
    }
    
    /**
     * Lider tablosunu sıfırlar
     * @param {String} leaderboardId - Lider tablosu ID'si (isteğe bağlı)
     * @return {Boolean} Sıfırlama başarılı mı
     */
    resetLeaderboard(leaderboardId = null) {
        const id = leaderboardId || this.activeLeaderboard;
        
        if (!id) {
            if (this.config.debug) {
                console.error('No active leaderboard');
            }
            return false;
        }
        
        const leaderboard = this.leaderboards[id];
        
        if (!leaderboard) {
            if (this.config.debug) {
                console.error(`Leaderboard not found: ${id}`);
            }
            return false;
        }
        
        // Girdileri temizle
        leaderboard.entries = [];
        leaderboard.lastUpdated = new Date().toISOString();
        
        // Kaydı sil
        try {
            localStorage.removeItem(this.config.savePrefix + id);
            
            if (this.config.debug) {
                console.log(`Leaderboard reset: ${id}`);
            }
            
            return true;
        } catch (error) {
            console.error(`Failed to reset leaderboard ${id}`, error);
            
            if (this.onError) {
                this.onError(error);
            }
            
            return false;
        }
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!Leaderboard.instance) {
            new Leaderboard();
        }
        return Leaderboard.instance;
    }
}

// Singleton instance
Leaderboard.instance = null;