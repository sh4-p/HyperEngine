/**
 * GameConfig.js - Oyun yapılandırması
 * Oyuna özgü ayarları ve yapılandırmaları yönetir
 */
class GameConfig {
    constructor(config = {}) {
        // Temel oyun yapılandırması
        this.config = Object.assign({
            // Oyun bilgileri
            name: 'HyperGame',
            version: '1.0.0',
            author: 'HyperStudios',
            description: 'A HyperCasual Game',
            
            // Oyun tasarım ayarları
            difficulty: 'medium', // 'easy', 'medium', 'hard'
            progressionRate: 1.0, // Oyun zorluğunun artış hızı
            startLevel: 1,
            maxLevel: 100,
            livesPerPlay: 3,
            
            // Ekonomi ayarları
            currency: {
                types: ['coins', 'gems'],
                startingAmounts: {
                    coins: 100,
                    gems: 5
                },
                rewards: {
                    levelCompletion: {
                        coins: 10,
                        gems: 1
                    },
                    dailyBonus: {
                        coins: [10, 20, 30, 40, 50, 60, 100], // 7 günlük ödül
                        gems: [0, 0, 1, 0, 0, 1, 3]
                    }
                }
            },
            
            // Oyun mekaniği ayarları
            gameplaySettings: {
                movementSpeed: 5,
                jumpForce: 10,
                gravity: 9.8,
                timeScale: 1.0,
                comboMultiplier: 1.5,
                scoreMultiplier: 1.0
            },
            
            // Görsel ve ses ayarları
            visualSettings: {
                theme: 'default',
                colorScheme: 'vibrant', // 'vibrant', 'pastel', 'monochrome'
                particleDensity: 'medium', // 'low', 'medium', 'high'
                showEffects: true,
                cameraShake: true
            },
            
            // Kullanıcı arayüzü ayarları
            uiSettings: {
                language: 'en',
                tutorialEnabled: true,
                showHints: true,
                vibrationEnabled: true,
                autoOrientation: true,
                uiScale: 1.0
            },
            
            // Reklam ayarları
            adSettings: {
                enabled: true,
                interstitialFrequency: 3, // Kaç seviyede bir araya reklam gösterilir
                rewarded: {
                    doubleCoins: {
                        enabled: true,
                        reward: {
                            type: 'multiply',
                            value: 2
                        }
                    },
                    extraLife: {
                        enabled: true,
                        reward: {
                            type: 'lives',
                            value: 1
                        }
                    },
                    skipLevel: {
                        enabled: false
                    }
                }
            },
            
            // İstatistik ve analitik ayarları
            statsSettings: {
                trackPlayTime: true,
                trackLevelAttempts: true,
                trackCompletionRate: true,
                trackMonetization: true,
                shareDiagnostics: true
            },
            
            // Öğeler ve eşyalar
            items: {
                powerups: [
                    {
                        id: 'shield',
                        name: 'Shield',
                        description: 'Protects from one hit',
                        duration: 10,
                        cooldown: 30,
                        cost: {
                            coins: 50
                        }
                    },
                    {
                        id: 'magnet',
                        name: 'Coin Magnet',
                        description: 'Attracts coins from a distance',
                        duration: 15,
                        cooldown: 45,
                        cost: {
                            coins: 75
                        }
                    },
                    {
                        id: 'slowmo',
                        name: 'Slow Motion',
                        description: 'Slows down game time',
                        duration: 5,
                        cooldown: 60,
                        cost: {
                            gems: 1
                        }
                    }
                ],
                characters: [
                    {
                        id: 'default',
                        name: 'Runner',
                        description: 'The default character',
                        stats: {
                            speed: 5,
                            jump: 10,
                            luck: 1
                        },
                        unlocked: true
                    },
                    {
                        id: 'speedy',
                        name: 'Speedy',
                        description: 'Faster but jumps lower',
                        stats: {
                            speed: 7,
                            jump: 8,
                            luck: 1
                        },
                        cost: {
                            coins: 1000
                        }
                    },
                    {
                        id: 'jumper',
                        name: 'Jumper',
                        description: 'Jumps higher but moves slower',
                        stats: {
                            speed: 4,
                            jump: 12,
                            luck: 1
                        },
                        cost: {
                            coins: 1000
                        }
                    }
                ]
            },
            
            // Oyun dünyası ayarları
            worldSettings: {
                themes: ['forest', 'desert', 'snow', 'city'],
                obstacleFrequency: 0.8,
                collectibleDensity: 0.5,
                levelLength: 1000
            },
            
            // Özel oyun bayrakları (feature flags)
            features: {
                dailyRewards: true,
                leaderboards: true,
                achievements: true,
                socialSharing: true,
                cloudSave: false,
                seasonalEvents: true
            }
        }, config);
        
        // Singleton instance
        if (GameConfig.instance) {
            return GameConfig.instance;
        }
        GameConfig.instance = this;
        
        // Kullanıcı ayarlarını yükle
        this._loadUserSettings();
        
        // Oyun dengesini hesapla
        this._calculateGameBalance();
    }
    
    /**
     * Kullanıcı ayarlarını yükler
     */
    _loadUserSettings() {
        try {
            const savedSettings = localStorage.getItem('hyperGame_userSettings');
            
            if (savedSettings) {
                const userSettings = JSON.parse(savedSettings);
                
                // Kullanıcı tercihlerini yapılandırmaya uygula
                if (userSettings.uiSettings) {
                    this.config.uiSettings = {...this.config.uiSettings, ...userSettings.uiSettings};
                }
                
                if (userSettings.visualSettings) {
                    this.config.visualSettings = {...this.config.visualSettings, ...userSettings.visualSettings};
                }
                
                // Diğer ayarları da uygula
                console.log('User settings loaded successfully');
            }
        } catch (error) {
            console.error('Failed to load user settings:', error);
        }
    }
    
    /**
     * Kullanıcı ayarlarını kaydeder
     */
    saveUserSettings() {
        try {
            // Yalnızca kullanıcı tercihlerini kaydet, tüm yapılandırmayı değil
            const userSettings = {
                uiSettings: this.config.uiSettings,
                visualSettings: this.config.visualSettings
            };
            
            localStorage.setItem('hyperGame_userSettings', JSON.stringify(userSettings));
            console.log('User settings saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save user settings:', error);
            return false;
        }
    }
    
    /**
     * Oyun dengesi hesaplamaları yapar
     * Özel formüller ve algoritmalar uygulanabilir
     */
    _calculateGameBalance() {
        // Oyun zorluğu çarpanını hesapla
        const difficultyFactor = 
            this.config.difficulty === 'easy' ? 0.8 :
            this.config.difficulty === 'hard' ? 1.2 : 1.0;
        
        // Zorluğa göre ayarlamaları uygula
        const gameplaySettings = this.config.gameplaySettings;
        gameplaySettings.scoreMultiplier *= difficultyFactor;
        
        // Oyun öğelerinin maliyetlerini dengele
        this.config.items.powerups.forEach(powerup => {
            if (powerup.cost.coins) {
                powerup.cost.coins = Math.round(powerup.cost.coins * difficultyFactor);
            }
        });
        
        // Karakter istatistiklerini dengele
        this.config.items.characters.forEach(character => {
            // Varsayılan karakter için zorluk ayarlaması yok
            if (character.id !== 'default') {
                character.stats.speed *= difficultyFactor;
                character.stats.jump *= difficultyFactor;
            }
        });
        
        // Dünya ayarlarını dengele
        const worldSettings = this.config.worldSettings;
        worldSettings.obstacleFrequency *= difficultyFactor;
        worldSettings.collectibleDensity /= difficultyFactor;
    }
    
    /**
     * Belirli bir yapılandırma ayarını alır
     * @param {String} key - Ayar anahtarı (nokta notasyonu ile iç içe alanlara erişilebilir, örn: 'currency.startingAmounts.coins')
     * @param {*} defaultValue - Ayar bulunamazsa dönecek varsayılan değer
     * @return {*} Ayar değeri
     */
    get(key, defaultValue = null) {
        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }
    
    /**
     * Belirli bir yapılandırma ayarını değiştirir
     * @param {String} key - Ayar anahtarı (nokta notasyonu ile iç içe alanlara erişilebilir, örn: 'currency.startingAmounts.coins')
     * @param {*} value - Yeni değer
     */
    set(key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        let target = this.config;
        
        for (const k of keys) {
            if (!(k in target)) {
                target[k] = {};
            }
            target = target[k];
        }
        
        target[lastKey] = value;
        
        // Oyunun dengesini etkileyen ayarlar için yeniden hesaplama yap
        if (key === 'difficulty' || key.startsWith('gameplaySettings.')) {
            this._calculateGameBalance();
        }
        
        // Kullanıcı tercihlerini kaydet
        if (key.startsWith('uiSettings.') || key.startsWith('visualSettings.')) {
            this.saveUserSettings();
        }
    }
    
    /**
     * Oyun zorluğunu değiştirir
     * @param {String} difficulty - Zorluk seviyesi ('easy', 'medium', 'hard')
     */
    setDifficulty(difficulty) {
        if (['easy', 'medium', 'hard'].includes(difficulty)) {
            this.config.difficulty = difficulty;
            this._calculateGameBalance();
            console.log(`Game difficulty set to: ${difficulty}`);
        } else {
            console.error(`Invalid difficulty value: ${difficulty}`);
        }
    }
    
    /**
     * Bir öğenin maliyetini kontrol eder
     * @param {String} itemType - Öğe tipi ('powerup', 'character')
     * @param {String} itemId - Öğe ID'si
     * @return {Object|null} Maliyet nesnesi veya null (öğe bulunamazsa)
     */
    getItemCost(itemType, itemId) {
        let item = null;
        
        if (itemType === 'powerup') {
            item = this.config.items.powerups.find(p => p.id === itemId);
        } else if (itemType === 'character') {
            item = this.config.items.characters.find(c => c.id === itemId);
        }
        
        return item ? item.cost : null;
    }
    
    /**
     * Bir düzeye ait ödülü hesaplar
     * @param {Number} level - Düzey numarası
     * @param {Number} score - Oyuncunun skoru
     * @param {Number} stars - Kazanılan yıldız sayısı (0-3)
     * @return {Object} Ödül miktarları
     */
    calculateLevelReward(level, score, stars) {
        const baseReward = this.config.currency.rewards.levelCompletion;
        const difficulty = this.config.difficulty;
        const progRate = this.config.progressionRate;
        
        // Temel ödülleri kopyala
        const reward = {
            coins: baseReward.coins,
            gems: baseReward.gems
        };
        
        // Düzey bazlı artış
        reward.coins += Math.floor(baseReward.coins * 0.1 * level * progRate);
        
        // Skor bazlı bonus
        reward.coins += Math.floor(score * 0.01);
        
        // Yıldız bonusu
        if (stars > 0) {
            reward.coins *= (1 + 0.25 * stars); // Her yıldız %25 bonus
            
            if (stars === 3) {
                reward.gems += 1; // Tam yıldız için ekstra gem
            }
        }
        
        // Zorluk ayarı
        if (difficulty === 'hard') {
            reward.coins = Math.floor(reward.coins * 1.5);
            reward.gems = Math.floor(reward.gems * 1.5);
        } else if (difficulty === 'easy') {
            reward.coins = Math.floor(reward.coins * 0.75);
            reward.gems = Math.floor(reward.gems * 0.75);
        }
        
        // Son değerleri tam sayıya yuvarla
        reward.coins = Math.floor(reward.coins);
        reward.gems = Math.floor(reward.gems);
        
        return reward;
    }
    
    /**
     * Belirli bir karakter için istatistikleri hesaplar
     * @param {String} characterId - Karakter ID'si
     * @return {Object|null} Karakter istatistikleri veya null (karakter bulunamazsa)
     */
    getCharacterStats(characterId) {
        const character = this.config.items.characters.find(c => c.id === characterId);
        
        if (!character) {
            return null;
        }
        
        // Temel istatistikleri kopyala
        const stats = {...character.stats};
        
        // Oyun zorluğuna göre istatistik uyarlaması
        const difficulty = this.config.difficulty;
        
        if (difficulty === 'hard') {
            stats.speed *= 0.9;
            stats.jump *= 0.9;
        } else if (difficulty === 'easy') {
            stats.speed *= 1.1;
            stats.jump *= 1.1;
        }
        
        // Hassas değerleri yuvarla
        Object.keys(stats).forEach(key => {
            stats[key] = parseFloat(stats[key].toFixed(2));
        });
        
        return stats;
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!GameConfig.instance) {
            new GameConfig();
        }
        return GameConfig.instance;
    }
}

// Singleton instance
GameConfig.instance = null;