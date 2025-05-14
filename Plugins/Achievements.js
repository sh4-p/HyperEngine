/**
 * Achievements.js - Başarım sistemi
 * Oyuncunun kazandığı başarımları yönetir
 */
class Achievements {
    constructor(config = {}) {
        // Başarım yapılandırması
        this.config = Object.assign({
            storage: 'local', // 'local', 'cloud', 'hybrid'
            autoSave: true,   // Otomatik kaydetme
            useGameCenter: true, // iOS Game Center entegrasyonu
            useGooglePlay: true, // Google Play Games entegrasyonu
            showNotifications: true, // Başarım bildirimlerini göster
            notificationDuration: 3000, // Bildirim süresi (ms)
            savePrefix: 'hypergame_achievement_', // Kayıt öneki
            debug: false      // Debug modu
        }, config);
        
        // Tüm başarımlar
        this.achievements = {};
        
        // Kullanıcının kazandığı başarımlar
        this.unlockedAchievements = {};
        
        // Başarım ilerlemeleri
        this.progress = {};
        
        // Olaylar
        this.onAchievementUnlocked = null;
        this.onAchievementProgress = null;
        this.onSave = null;
        this.onLoad = null;
        this.onError = null;
        
        // Platform entegrasyonları
        this.platformIntegrations = {
            gameCenter: null,
            googlePlay: null
        };
        
        // Singleton instance
        if (Achievements.instance) {
            return Achievements.instance;
        }
        Achievements.instance = this;
    }
    
    /**
     * Başarım ekler
     * @param {Object} achievement - Başarım objesi
     */
    addAchievement(achievement) {
        if (!achievement || !achievement.id) {
            console.error('Invalid achievement', achievement);
            return;
        }
        
        this.achievements[achievement.id] = {
            id: achievement.id,
            title: achievement.title || achievement.id,
            description: achievement.description || '',
            icon: achievement.icon || '',
            hiddenDescription: achievement.hiddenDescription || false,
            hidden: achievement.hidden || false,
            progressEnabled: achievement.progressEnabled || false,
            maxProgress: achievement.maxProgress || 1,
            points: achievement.points || 0,
            category: achievement.category || 'default',
            platformIds: achievement.platformIds || {},
            unlockCondition: achievement.unlockCondition || null,
            dateAdded: achievement.dateAdded || new Date().toISOString()
        };
        
        // İlerleme izlemesini başlat
        if (!this.progress[achievement.id]) {
            this.progress[achievement.id] = 0;
        }
        
        if (this.config.debug) {
            console.log(`Achievement added: ${achievement.id}`);
        }
    }
    
    /**
     * Çoklu başarım ekler
     * @param {Array} achievements - Başarım dizisi
     */
    addAchievements(achievements) {
        if (!Array.isArray(achievements)) {
            console.error('Invalid achievements array', achievements);
            return;
        }
        
        achievements.forEach(achievement => {
            this.addAchievement(achievement);
        });
        
        if (this.config.debug) {
            console.log(`${achievements.length} achievements added`);
        }
    }
    
    /**
     * Başarımı kazandırır
     * @param {String} id - Başarım ID'si
     * @param {Boolean} silent - Bildirim gösterme (isteğe bağlı)
     * @return {Boolean} Başarım kazanıldı mı
     */
    unlock(id, silent = false) {
        const achievement = this.achievements[id];
        
        if (!achievement) {
            if (this.config.debug) {
                console.error(`Achievement not found: ${id}`);
            }
            return false;
        }
        
        // Zaten kazanılmış mı
        if (this.isUnlocked(id)) {
            return false;
        }
        
        // Kazanım zamanı
        const now = new Date();
        
        // Kazanım kaydı
        this.unlockedAchievements[id] = {
            unlockTime: now.toISOString(),
            confirmed: false
        };
        
        // İlerlemeyi maksimuma ayarla
        this.progress[id] = achievement.maxProgress;
        
        // Platform entegrasyonları
        this._syncWithPlatforms(id, achievement.maxProgress);
        
        // Otomatik kaydetme
        if (this.config.autoSave) {
            this.save();
        }
        
        // Bildirim göster
        if (this.config.showNotifications && !silent) {
            this._showNotification(achievement);
        }
        
        // Olayı tetikle
        if (this.onAchievementUnlocked) {
            this.onAchievementUnlocked(achievement);
        }
        
        if (this.config.debug) {
            console.log(`Achievement unlocked: ${id}`);
        }
        
        return true;
    }
    
    /**
     * Başarım ilerlemesini günceller
     * @param {String} id - Başarım ID'si
     * @param {Number} progress - Yeni ilerleme değeri
     * @param {Boolean} silent - Bildirim gösterme (isteğe bağlı)
     * @return {Boolean} Güncelleme başarılı mı
     */
    updateProgress(id, progress, silent = false) {
        const achievement = this.achievements[id];
        
        if (!achievement) {
            if (this.config.debug) {
                console.error(`Achievement not found: ${id}`);
            }
            return false;
        }
        
        // İlerleme takibi etkin değilse
        if (!achievement.progressEnabled) {
            if (this.config.debug) {
                console.warn(`Progress tracking not enabled for achievement: ${id}`);
            }
            return false;
        }
        
        // Zaten kazanılmış mı
        if (this.isUnlocked(id)) {
            return false;
        }
        
        // Geçerli ilerleme
        const currentProgress = this.progress[id] || 0;
        
        // Yeni ilerleme değeri
        const newProgress = Math.min(Math.max(0, progress), achievement.maxProgress);
        
        // İlerleme değişmemiş mi
        if (newProgress <= currentProgress) {
            return false;
        }
        
        // İlerlemeyi güncelle
        this.progress[id] = newProgress;
        
        // Platform entegrasyonları
        this._syncWithPlatforms(id, newProgress);
        
        // Maksimum ilerlemeye ulaşıldıysa başarımı aç
        if (newProgress >= achievement.maxProgress) {
            return this.unlock(id, silent);
        }
        
        // İlerleme bildirimi göster
        if (this.config.showNotifications && !silent) {
            this._showProgressNotification(achievement, newProgress);
        }
        
        // Olayı tetikle
        if (this.onAchievementProgress) {
            this.onAchievementProgress(achievement, newProgress, achievement.maxProgress);
        }
        
        // Otomatik kaydetme
        if (this.config.autoSave) {
            this.save();
        }
        
        if (this.config.debug) {
            console.log(`Achievement progress updated: ${id} - ${newProgress}/${achievement.maxProgress}`);
        }
        
        return true;
    }
    
    /**
     * İlerlemeyi artırır
     * @param {String} id - Başarım ID'si
     * @param {Number} amount - Artış miktarı (varsayılan: 1)
     * @param {Boolean} silent - Bildirim gösterme (isteğe bağlı)
     * @return {Boolean} Güncelleme başarılı mı
     */
    incrementProgress(id, amount = 1, silent = false) {
        const currentProgress = this.progress[id] || 0;
        return this.updateProgress(id, currentProgress + amount, silent);
    }
    
    /**
     * Başarım kazanılmış mı
     * @param {String} id - Başarım ID'si
     * @return {Boolean} Kazanılmış mı
     */
    isUnlocked(id) {
        return !!this.unlockedAchievements[id];
    }
    
    /**
     * Başarım ilerlemesini alır
     * @param {String} id - Başarım ID'si
     * @return {Number} İlerleme değeri (0-1 arası)
     */
    getProgress(id) {
        const achievement = this.achievements[id];
        
        if (!achievement) {
            return 0;
        }
        
        const progress = this.progress[id] || 0;
        const maxProgress = achievement.maxProgress || 1;
        
        return Math.min(progress / maxProgress, 1);
    }
    
    /**
     * Başarım ilerlemesini ham olarak alır
     * @param {String} id - Başarım ID'si
     * @return {Object} İlerleme değerleri {current, max}
     */
    getRawProgress(id) {
        const achievement = this.achievements[id];
        
        if (!achievement) {
            return { current: 0, max: 1 };
        }
        
        return {
            current: this.progress[id] || 0,
            max: achievement.maxProgress || 1
        };
    }
    
    /**
     * Başarım detaylarını alır
     * @param {String} id - Başarım ID'si
     * @return {Object} Başarım detayları
     */
    getAchievement(id) {
        const achievement = this.achievements[id];
        
        if (!achievement) {
            return null;
        }
        
        // Gizli başarım ve henüz açılmamışsa
        if (achievement.hidden && !this.isUnlocked(id)) {
            return {
                id: achievement.id,
                hidden: true,
                hiddenDescription: achievement.hiddenDescription,
                category: achievement.category,
                icon: achievement.icon
            };
        }
        
        return {
            ...achievement,
            progress: this.getProgress(id),
            unlocked: this.isUnlocked(id),
            unlockTime: this.unlockedAchievements[id] ? this.unlockedAchievements[id].unlockTime : null
        };
    }
    
    /**
     * Tüm başarımları alır
     * @param {Boolean} includeHidden - Gizli başarımlar dahil edilsin mi
     * @return {Array} Başarım listesi
     */
    getAllAchievements(includeHidden = true) {
        return Object.keys(this.achievements).map(id => {
            const achievement = this.achievements[id];
            
            // Gizli başarımı filtrele
            if (!includeHidden && achievement.hidden && !this.isUnlocked(id)) {
                return null;
            }
            
            return this.getAchievement(id);
        }).filter(a => a !== null);
    }
    
    /**
     * Kazanılmış başarımları alır
     * @return {Array} Kazanılmış başarım listesi
     */
    getUnlockedAchievements() {
        return Object.keys(this.unlockedAchievements).map(id => this.getAchievement(id));
    }
    
    /**
     * Kazanılmış başarım sayısını alır
     * @return {Number} Kazanılmış başarım sayısı
     */
    getUnlockedCount() {
        return Object.keys(this.unlockedAchievements).length;
    }
    
    /**
     * Toplam başarım sayısını alır
     * @return {Number} Toplam başarım sayısı
     */
    getTotalCount() {
        return Object.keys(this.achievements).length;
    }
    
    /**
     * Başarım tamamlama oranını alır
     * @return {Number} Tamamlama oranı (0-1 arası)
     */
    getCompletionRate() {
        const total = this.getTotalCount();
        if (total === 0) return 0;
        
        return this.getUnlockedCount() / total;
    }
    
    /**
     * Toplam puanı hesaplar
     * @return {Number} Toplam puan
     */
    getTotalPoints() {
        return Object.keys(this.unlockedAchievements).reduce((total, id) => {
            const achievement = this.achievements[id];
            return total + (achievement ? achievement.points : 0);
        }, 0);
    }
    
    /**
     * Kategori bazında başarımları alır
     * @param {String} category - Kategori adı
     * @param {Boolean} includeHidden - Gizli başarımlar dahil edilsin mi
     * @return {Array} Başarım listesi
     */
    getAchievementsByCategory(category, includeHidden = true) {
        return this.getAllAchievements(includeHidden).filter(a => a.category === category);
    }
    
    /**
     * Platformlar ile başarım senkronizasyonu
     * @param {String} id - Başarım ID'si
     * @param {Number} progress - İlerleme değeri
     */
    _syncWithPlatforms(id, progress) {
        const achievement = this.achievements[id];
        if (!achievement) return;
        
        // Maksimum ilerleme
        const maxProgress = achievement.maxProgress || 1;
        
        // İlerleme yüzdesi
        const percentage = Math.min(progress / maxProgress, 1) * 100;
        
        // iOS Game Center
        if (this.config.useGameCenter && window.gameCenter && achievement.platformIds.gameCenter) {
            if (percentage >= 100) {
                window.gameCenter.reportAchievement({
                    achievementId: achievement.platformIds.gameCenter,
                    percent: 100
                }, () => {}, () => {});
            } else {
                window.gameCenter.reportAchievement({
                    achievementId: achievement.platformIds.gameCenter,
                    percent: percentage
                }, () => {}, () => {});
            }
        }
        
        // Google Play Games
        if (this.config.useGooglePlay && window.plugins && window.plugins.playGamesServices && achievement.platformIds.googlePlay) {
            if (percentage >= 100) {
                window.plugins.playGamesServices.unlockAchievement({
                    achievementId: achievement.platformIds.googlePlay
                }, () => {}, () => {});
            } else if (achievement.progressEnabled) {
                window.plugins.playGamesServices.incrementAchievement({
                    achievementId: achievement.platformIds.googlePlay,
                    numSteps: progress
                }, () => {}, () => {});
            }
        }
    }
    
    /**
     * Başarım bildirimini gösterir
     * @param {Object} achievement - Başarım objesi
     */
    _showNotification(achievement) {
        if (!achievement) return;
        
        // Bildirim sistemi entegrasyonu burada yapılır
        // Bu örnek DOM manipülasyonu kullanır, gerçek oyununuza uyarlayabilirsiniz
        
        // Bildirim elementleri
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 9999;
            display: flex;
            align-items: center;
            max-width: 400px;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
            transform: translateX(120%);
            transition: transform 0.5s ease;
        `;
        
        if (achievement.icon) {
            const icon = document.createElement('img');
            icon.src = achievement.icon;
            icon.alt = achievement.title;
            icon.style.cssText = `
                width: 50px;
                height: 50px;
                margin-right: 15px;
                border-radius: 5px;
            `;
            notification.appendChild(icon);
        }
        
        const textContainer = document.createElement('div');
        
        const title = document.createElement('h3');
        title.textContent = achievement.title;
        title.style.cssText = `
            margin: 0 0 5px 0;
            font-size: 18px;
            color: gold;
        `;
        textContainer.appendChild(title);
        
        const header = document.createElement('div');
        header.textContent = 'Achievement Unlocked!';
        header.style.cssText = `
            margin: 0 0 5px 0;
            font-size: 12px;
            opacity: 0.7;
        `;
        textContainer.insertBefore(header, textContainer.firstChild);
        
        if (achievement.description) {
            const description = document.createElement('p');
            description.textContent = achievement.description;
            description.style.cssText = `
                margin: 0;
                font-size: 14px;
            `;
            textContainer.appendChild(description);
        }
        
        if (achievement.points > 0) {
            const points = document.createElement('div');
            points.textContent = `+${achievement.points} points`;
            points.style.cssText = `
                margin-top: 5px;
                font-size: 12px;
                color: lightgreen;
            `;
            textContainer.appendChild(points);
        }
        
        notification.appendChild(textContainer);
        document.body.appendChild(notification);
        
        // Animasyon için timeout
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Bildirim süresince göster
        setTimeout(() => {
            notification.style.transform = 'translateX(120%)';
            
            // Animasyon tamamlandıktan sonra kaldır
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, this.config.notificationDuration);
    }
    
    /**
     * İlerleme bildirimini gösterir
     * @param {Object} achievement - Başarım objesi
     * @param {Number} progress - İlerleme değeri
     */
    _showProgressNotification(achievement, progress) {
        if (!achievement || !achievement.progressEnabled) return;
        
        // Bildirim sistemi entegrasyonu burada yapılır
        // Bu örnek DOM manipülasyonu kullanır, gerçek oyununuza uyarlayabilirsiniz
        
        // Bildirim elementleri
        const notification = document.createElement('div');
        notification.className = 'achievement-progress-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
            max-width: 300px;
            transform: translateY(120%);
            transition: transform 0.3s ease;
        `;
        
        const title = document.createElement('div');
        title.textContent = achievement.title;
        title.style.cssText = `
            font-size: 14px;
            margin-bottom: 5px;
        `;
        notification.appendChild(title);
        
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            background-color: rgba(255, 255, 255, 0.2);
            height: 10px;
            border-radius: 5px;
            overflow: hidden;
        `;
        
        const progressBar = document.createElement('div');
        const progressPercent = Math.min((progress / achievement.maxProgress) * 100, 100);
        progressBar.style.cssText = `
            height: 100%;
            width: ${progressPercent}%;
            background-color: gold;
            transition: width 0.5s ease;
        `;
        progressContainer.appendChild(progressBar);
        notification.appendChild(progressContainer);
        
        const progressText = document.createElement('div');
        progressText.textContent = `${progress} / ${achievement.maxProgress}`;
        progressText.style.cssText = `
            font-size: 12px;
            margin-top: 5px;
            text-align: right;
        `;
        notification.appendChild(progressText);
        
        document.body.appendChild(notification);
        
        // Animasyon için timeout
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Bildirim süresince göster
        setTimeout(() => {
            notification.style.transform = 'translateY(120%)';
            
            // Animasyon tamamlandıktan sonra kaldır
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, this.config.notificationDuration / 2); // İlerleme bildirimleri daha kısa sürer
    }
    
    /**
     * Başarımları kaydeder
     * @return {Boolean} Kaydetme başarılı mı
     */
    save() {
        try {
            // Local Storage
            if (this.config.storage === 'local' || this.config.storage === 'hybrid') {
                const data = JSON.stringify({
                    unlockedAchievements: this.unlockedAchievements,
                    progress: this.progress,
                    lastSaved: new Date().toISOString()
                });
                
                localStorage.setItem(this.config.savePrefix + 'data', data);
                
                if (this.config.debug) {
                    console.log('Achievements saved to local storage');
                }
            }
            
            // Cloud Storage (özel implementasyon gerektirir)
            if (this.config.storage === 'cloud' || this.config.storage === 'hybrid') {
                // Bulut kayıt sisteminizi entegre edin
                // Örnek: CloudStorage.save(this.config.savePrefix + 'data', data);
            }
            
            // Olayı tetikle
            if (this.onSave) {
                this.onSave();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save achievements', error);
            
            if (this.onError) {
                this.onError(error);
            }
            
            return false;
        }
    }
    
    /**
     * Başarımları yükler
     * @return {Boolean} Yükleme başarılı mı
     */
    load() {
        try {
            let data = null;
            
            // Local Storage
            if (this.config.storage === 'local' || this.config.storage === 'hybrid') {
                const savedData = localStorage.getItem(this.config.savePrefix + 'data');
                
                if (savedData) {
                    data = JSON.parse(savedData);
                    
                    if (this.config.debug) {
                        console.log('Achievements loaded from local storage');
                    }
                }
            }
            
            // Cloud Storage (özel implementasyon gerektirir)
            if (!data && (this.config.storage === 'cloud' || this.config.storage === 'hybrid')) {
                // Bulut kayıt sisteminizi entegre edin
                // Örnek: data = CloudStorage.load(this.config.savePrefix + 'data');
            }
            
            if (data) {
                this.unlockedAchievements = data.unlockedAchievements || {};
                this.progress = data.progress || {};
                
                // Olayı tetikle
                if (this.onLoad) {
                    this.onLoad(data);
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to load achievements', error);
            
            if (this.onError) {
                this.onError(error);
            }
            
            return false;
        }
    }
    
    /**
     * Tüm başarım verilerini sıfırlar
     * @return {Boolean} Sıfırlama başarılı mı
     */
    reset() {
        try {
            this.unlockedAchievements = {};
            this.progress = {};
            
            // Kayıtları temizle
            localStorage.removeItem(this.config.savePrefix + 'data');
            
            if (this.config.debug) {
                console.log('Achievements reset');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to reset achievements', error);
            
            if (this.onError) {
                this.onError(error);
            }
            
            return false;
        }
    }
    
    /**
     * Başarımların otomatik kontrolünü yapar
     * @param {Object} gameState - Oyun durumu (isteğe bağlı)
     */
    checkAutomaticAchievements(gameState = {}) {
        // Her başarım için kontrol et
        Object.values(this.achievements).forEach(achievement => {
            // Zaten kazanılmış mı
            if (this.isUnlocked(achievement.id)) {
                return;
            }
            
            // Kilit açma koşulu varsa kontrol et
            if (achievement.unlockCondition && typeof achievement.unlockCondition === 'function') {
                try {
                    const shouldUnlock = achievement.unlockCondition(gameState, this);
                    
                    if (shouldUnlock) {
                        this.unlock(achievement.id);
                    }
                } catch (error) {
                    console.error(`Error checking unlock condition for ${achievement.id}`, error);
                }
            }
        });
    }
    
    /**
     * Başarım bildirimlerini açar/kapatır
     * @param {Boolean} enabled - Bildirimler aktif mi
     */
    setNotificationsEnabled(enabled) {
        this.config.showNotifications = enabled;
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!Achievements.instance) {
            new Achievements();
        }
        return Achievements.instance;
    }
}

// Singleton instance
Achievements.instance = null;