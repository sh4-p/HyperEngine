/**
 * TapGame.js - Tıklama oyun şablonu
 * Basit tıklama/dokunma tabanlı oyunlar için temel şablon
 */
class TapGame extends Game {
    constructor(config = {}) {
        // Temel yapılandırmayı genişlet
        const defaultConfig = {
            physics: {
                gravity: { x: 0, y: 0 }, // Tıklama oyunları için yerçekimi kapalı
                enabled: false
            },
            // Tap oyunu özel ayarları
            tap: {
                targetCount: 5,           // Ekrandaki hedef sayısı
                targetMinSize: 50,        // Minimum hedef boyutu
                targetMaxSize: 150,       // Maksimum hedef boyutu
                targetMinSpeed: 100,      // Minimum hedef hızı
                targetMaxSpeed: 300,      // Maksimum hedef hızı
                targetLifetime: 3,        // Hedef ömrü (saniye)
                targetScore: 10,          // Hedef puanı
                missedPenalty: 5,         // Kaçırma cezası
                gameTime: 60,             // Oyun süresi (saniye)
                spawnRate: 1,             // Hedef üretme sıklığı (saniye)
                comboTimeWindow: 0.5,     // Combo zamanı (saniye)
                comboMultiplier: 0.1,     // Her combo için çarpan artışı
                powerupChance: 0.1,       // Güç üretme şansı (0-1 arası)
                powerupDuration: 5,       // Güç süresi (saniye)
                difficultyIncrease: 0.05, // Zorluk artışı (seviye başına)
                targetTypes: ['circle', 'square', 'triangle', 'diamond', 'star'] // Hedef tipleri
            }
        };
        
        // Yapılandırmayı birleştir
        const mergedConfig = Utils.deepClone(defaultConfig);
        Utils.deepMerge(mergedConfig, config);
        
        // Üst sınıf yapıcısını çağır
        super(mergedConfig);
        
        // Tıklama oyun değişkenleri
        this.score = 0;              // Puan
        this.combo = 0;              // Combo sayısı
        this.comboMultiplier = 1.0;  // Combo çarpanı
        this.lastTapTime = 0;        // Son tıklama zamanı
        this.level = 1;              // Seviye
        this.timeLeft = this.config.tap.gameTime; // Kalan süre
        
        // Oyun nesneleri
        this.targets = [];           // Hedefler
        this.powerups = [];          // Güçler
        this.particles = [];         // Parçacıklar
        
        // Durum değişkenleri
        this.isGameActive = false;
        this.isPowerupActive = false;
        this.activePowerupType = null;
        this.powerupTimer = 0;
        
        // Zamanlayıcılar
        this.spawnTimer = 0;
        
        // Sahneleri hazırla
        this._setupScenes();
        
        // Olay dinleyicileri
        this._setupEventListeners();
    }
    
    /**
     * Sahneleri kurar
     */
    _setupScenes() {
        // Ana menü sahnesi
        const menuScene = new MainMenuScene('Tap Game');
        menuScene.onStart = () => this.loadScene('game');
        menuScene.onSettings = () => this.loadScene('settings');
        
        // Oyun sahnesi
        const gameScene = new TapGameScene(this);
        
        // Ayarlar sahnesi
        const settingsScene = new SettingsScene('Tap Game');
        
        // Game Over sahnesi
        const gameOverScene = new GameOverScene();
        gameOverScene.onRestart = () => this.loadScene('game');
        gameOverScene.onMainMenu = () => this.loadScene('menu');
        
        // Duraklama sahnesi
        const pauseScene = new PauseScene();
        pauseScene.onResume = () => this.resume();
        pauseScene.onRestart = () => this.loadScene('game');
        pauseScene.onMainMenu = () => this.loadScene('menu');
        
        // Sahneleri oyuna ekle
        this.addScene('menu', menuScene);
        this.addScene('game', gameScene);
        this.addScene('settings', settingsScene);
        this.addScene('gameOver', gameOverScene);
        this.addScene('pause', pauseScene);
        
        // İlk sahneyi ayarla
        this.config.firstScene = 'menu';
    }
    
    /**
     * Olay dinleyicileri kurar
     */
    _setupEventListeners() {
        // Dokunma olayı
        this.onUpdate = (deltaTime) => {
            if (this.isPaused) return;
            
            // Oyun içi ve aktifse
            if (this.isGameActive && 
                this.sceneManager.activeScene &&
                this.sceneManager.activeScene.name === 'game') {
                
                // Zamanı güncelle
                this.timeLeft -= deltaTime;
                
                if (this.timeLeft <= 0) {
                    this.timeLeft = 0;
                    this.gameOver();
                    return;
                }
                
                // Hedef üretme
                this.spawnTimer -= deltaTime;
                if (this.spawnTimer <= 0) {
                    this.spawnTarget();
                    
                    // Üretme sıklığını güçlendirici durumuna göre ayarla
                    let spawnRate = this.config.tap.spawnRate;
                    
                    if (this.isPowerupActive && this.activePowerupType === 'slowmo') {
                        spawnRate *= 1.5; // Yavaşlatma güçlendirici
                    }
                    
                    this.spawnTimer = spawnRate * (1 - (this.level - 1) * this.config.tap.difficultyIncrease * 0.1);
                }
                
                // Güçlendirici süre kontrolü
                if (this.isPowerupActive) {
                    this.powerupTimer -= deltaTime;
                    
                    if (this.powerupTimer <= 0) {
                        this.deactivatePowerup();
                    }
                }
                
                // Hedefleri güncelle
                for (const target of [...this.targets]) {
                    // Ömür kontrolü
                    target.lifetime -= deltaTime;
                    
                    if (target.lifetime <= 0) {
                        this.missTarget(target);
                    }
                    
                    // Hareket
                    target.x += target.velocityX * deltaTime * (this.isPowerupActive && this.activePowerupType === 'slowmo' ? 0.5 : 1);
                    target.y += target.velocityY * deltaTime * (this.isPowerupActive && this.activePowerupType === 'slowmo' ? 0.5 : 1);
                    
                    // Ekran sınırları kontrolü
                    if (target.x - target.width / 2 < 0 || target.x + target.width / 2 > this.engine.canvas.width) {
                        target.velocityX *= -1;
                    }
                    
                    if (target.y - target.height / 2 < 0 || target.y + target.height / 2 > this.engine.canvas.height) {
                        target.velocityY *= -1;
                    }
                }
                
                // Combo süresi kontrolü
                if (this.combo > 0) {
                    const currentTime = this.time.time;
                    
                    if (currentTime - this.lastTapTime > this.config.tap.comboTimeWindow) {
                        this.resetCombo();
                    }
                }
            }
        };
        
        // Duraklat tuşu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (this.isPaused) {
                    this.resume();
                } else {
                    this.pause();
                }
            }
        });
    }
    
    /**
     * Oyunu başlatır
     */
    start() {
        super.start();
        
        // Tap oyun verilerini sıfırla
        this.reset();
    }
    
    /**
     * Oyun verilerini sıfırlar
     */
    reset() {
        this.score = 0;
        this.combo = 0;
        this.comboMultiplier = 1.0;
        this.lastTapTime = 0;
        this.level = 1;
        this.timeLeft = this.config.tap.gameTime;
        
        this.targets = [];
        this.powerups = [];
        this.particles = [];
        
        this.isGameActive = false;
        this.isPowerupActive = false;
        this.activePowerupType = null;
        this.powerupTimer = 0;
        
        this.spawnTimer = 0;
    }
    
    /**
     * Oyunu başlatır
     */
    startGame() {
        this.isGameActive = true;
        this.timeLeft = this.config.tap.gameTime;
        
        // Başlangıç hedeflerini üret
        for (let i = 0; i < this.config.tap.targetCount; i++) {
            this.spawnTarget();
        }
        
        // Oyun başlangıç müziğini çal
        const audio = Audio.getInstance();
        audio.playMusic('gameplayMusic');
        
        // Analitik kaydı
        const analytics = Analytics.getInstance();
        analytics.logEvent('game_start', {
            game_mode: 'tap',
            level: this.level
        });
    }
    
    /**
     * Hedef üretir
     * @return {Target} Üretilen hedef
     */
    spawnTarget() {
        // Ekran boyutları
        const canvasWidth = this.engine.canvas.width;
        const canvasHeight = this.engine.canvas.height;
        
        // Hedef tipi
        const types = this.config.tap.targetTypes;
        const type = Utils.randomItem(types);
        
        // Hedef boyutu (seviyeye göre küçülür)
        const sizeFactor = 1 - (this.level - 1) * this.config.tap.difficultyIncrease * 0.05;
        const minSize = this.config.tap.targetMinSize * sizeFactor;
        const maxSize = this.config.tap.targetMaxSize * sizeFactor;
        const size = Utils.randomFloat(minSize, maxSize);
        
        // Hedef hızı (seviyeye göre artar)
        const speedFactor = 1 + (this.level - 1) * this.config.tap.difficultyIncrease * 0.1;
        const minSpeed = this.config.tap.targetMinSpeed * speedFactor;
        const maxSpeed = this.config.tap.targetMaxSpeed * speedFactor;
        const speed = Utils.randomFloat(minSpeed, maxSpeed);
        
        // Rastgele yön
        const angle = Utils.randomFloat(0, Math.PI * 2);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        // Hedef ömrü (seviyeye göre azalır)
        const lifetimeFactor = 1 - (this.level - 1) * this.config.tap.difficultyIncrease * 0.1;
        const lifetime = this.config.tap.targetLifetime * lifetimeFactor;
        
        // Güçlendirici olasılığı
        const isPowerup = Math.random() < this.config.tap.powerupChance;
        
        // Yeni hedef nesnesi
        const target = new Target({
            type: type,
            x: Utils.randomFloat(size, canvasWidth - size),
            y: Utils.randomFloat(size, canvasHeight - size),
            width: size,
            height: size,
            velocityX: vx,
            velocityY: vy,
            lifetime: lifetime,
            isPowerup: isPowerup
        });
        
        // Hedefi diziye ekle
        this.targets.push(target);
        
        // Oyun sahnesine ekle
        const gameScene = this.sceneManager.getScene('game');
        if (gameScene) {
            gameScene.addGameObject(target);
        }
        
        return target;
    }
    
    /**
     * Hedefe tıklama/dokunma
     * @param {Target} target - Hedef
     */
    tapTarget(target) {
        // Güçlendirici ise aktifleştir
        if (target.isPowerup) {
            const powerupTypes = ['slowmo', 'multiplier', 'freeze', 'timebonus'];
            const powerupType = Utils.randomItem(powerupTypes);
            
            this.activatePowerup(powerupType);
        }
        
        // Combo hesapla
        this.combo++;
        this.comboMultiplier = 1 + (this.combo - 1) * this.config.tap.comboMultiplier;
        this.lastTapTime = this.time.time;
        
        // Puan ekle
        const baseScore = this.config.tap.targetScore;
        const sizeBonus = target.width < (this.config.tap.targetMinSize + this.config.tap.targetMaxSize) / 2 ? 1.5 : 1;
        const lifeTimeBonus = target.lifetime < this.config.tap.targetLifetime / 2 ? 1.5 : 1;
        
        const pointsEarned = Math.round(baseScore * sizeBonus * lifeTimeBonus * this.comboMultiplier);
        this.score += pointsEarned;
        
        // Tıklama sesi çal
        const audio = Audio.getInstance();
        audio.playSound('tap');
        
        // Parçacık efekti
        this.createParticleEffect(target.x, target.y, target.type, pointsEarned);
        
        // Hedefi kaldır
        this.removeTarget(target);
        
        // Seviye kontrolü (her 100 puan için bir seviye)
        const newLevel = Math.floor(this.score / 100) + 1;
        if (newLevel > this.level) {
            this.levelUp(newLevel);
        }
        
        // Analitik kaydı
        const analytics = Analytics.getInstance();
        analytics.logEvent('target_tap', {
            target_type: target.type,
            points: pointsEarned,
            combo: this.combo,
            level: this.level
        });
    }
    
    /**
     * Kaçırılan hedef
     * @param {Target} target - Kaçırılan hedef
     */
    missTarget(target) {
        // Ceza puanı
        if (!target.isPowerup) {
            this.score = Math.max(0, this.score - this.config.tap.missedPenalty);
        }
        
        // Comboyu sıfırla
        this.resetCombo();
        
        // Kaçırma sesi çal
        const audio = Audio.getInstance();
        audio.playSound('miss');
        
        // Hedefi kaldır
        this.removeTarget(target);
        
        // Analitik kaydı
        const analytics = Analytics.getInstance();
        analytics.logEvent('target_miss', {
            target_type: target.type,
            level: this.level
        });
    }
    
    /**
     * Hedefi kaldırır
     * @param {Target} target - Kaldırılacak hedef
     */
    removeTarget(target) {
        const index = this.targets.indexOf(target);
        
        if (index !== -1) {
            this.targets.splice(index, 1);
            
            // Oyun sahnesinden kaldır
            const gameScene = this.sceneManager.getScene('game');
            if (gameScene) {
                gameScene.removeGameObject(target);
            }
        }
    }
    
    /**
     * Parçacık efekti oluşturur
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @param {String} type - Hedef tipi
     * @param {Number} score - Kazanılan puan
     */
    createParticleEffect(x, y, type, score) {
        // Renk seçimi
        let colors;
        
        switch (type) {
            case 'circle':
                colors = ['#FF0000', '#FF5555', '#FF8888'];
                break;
            case 'square':
                colors = ['#00FF00', '#55FF55', '#88FF88'];
                break;
            case 'triangle':
                colors = ['#0000FF', '#5555FF', '#8888FF'];
                break;
            case 'diamond':
                colors = ['#FFFF00', '#FFFF55', '#FFFF88'];
                break;
            case 'star':
                colors = ['#FF00FF', '#FF55FF', '#FF88FF'];
                break;
            default:
                colors = ['#FFFFFF', '#AAAAAA', '#DDDDDD'];
        }
        
        // Parçacık sistemi
        const particles = new ParticleSystem({
            x: x,
            y: y,
            count: 10 + score / 5,
            speed: 100 + score * 2,
            lifetime: 0.5,
            colors: colors,
            size: 3 + score / 20
        });
        
        // Sahneye ekle
        const gameScene = this.sceneManager.getScene('game');
        if (gameScene) {
            gameScene.addGameObject(particles);
        }
        
        // Listeye ekle
        this.particles.push(particles);
        
        // Belirli bir süre sonra kaldır
        setTimeout(() => {
            const index = this.particles.indexOf(particles);
            
            if (index !== -1) {
                this.particles.splice(index, 1);
                
                if (gameScene) {
                    gameScene.removeGameObject(particles);
                }
            }
        }, 500);
        
        // Puan metni
        const scoreText = new FloatingText({
            text: `+${score}`,
            x: x,
            y: y - 20,
            font: '20px Arial',
            color: colors[0],
            lifetime: 1,
            velocityY: -50
        });
        
        // Sahneye ekle
        if (gameScene) {
            gameScene.addGameObject(scoreText);
        }
    }
    
    /**
     * Comboyu sıfırlar
     */
    resetCombo() {
        this.combo = 0;
        this.comboMultiplier = 1.0;
    }
    
    /**
     * Güçlendirici aktifleştirir
     * @param {String} type - Güçlendirici tipi
     */
    activatePowerup(type) {
        this.isPowerupActive = true;
        this.activePowerupType = type;
        this.powerupTimer = this.config.tap.powerupDuration;
        
        // Güçlendirici sesi çal
        const audio = Audio.getInstance();
        audio.playSound('powerup');
        
        // Tip bazlı etkiler
        switch (type) {
            case 'slowmo':
                // Yavaşlatma efekti
                break;
                
            case 'multiplier':
                // Puan çarpanı
                this.comboMultiplier *= 2;
                break;
                
            case 'freeze':
                // Tüm hedefleri dondur
                for (const target of this.targets) {
                    target.originalVelocityX = target.velocityX;
                    target.originalVelocityY = target.velocityY;
                    target.velocityX = 0;
                    target.velocityY = 0;
                }
                break;
                
            case 'timebonus':
                // Zaman bonusu
                this.timeLeft += 5;
                break;
        }
        
        // Analitik kaydı
        const analytics = Analytics.getInstance();
        analytics.logEvent('powerup_activate', {
            powerup_type: type,
            level: this.level
        });
    }
    
    /**
     * Güçlendirici deaktifleştirir
     */
    deactivatePowerup() {
        // Tip bazlı etkiler
        switch (this.activePowerupType) {
            case 'freeze':
                // Tüm hedefleri çöz
                for (const target of this.targets) {
                    if (target.originalVelocityX !== undefined && target.originalVelocityY !== undefined) {
                        target.velocityX = target.originalVelocityX;
                        target.velocityY = target.originalVelocityY;
                    }
                }
                break;
                
            case 'multiplier':
                // Puan çarpanını normale döndür
                this.comboMultiplier = 1 + (this.combo - 1) * this.config.tap.comboMultiplier;
                break;
        }
        
        this.isPowerupActive = false;
        this.activePowerupType = null;
        this.powerupTimer = 0;
    }
    
    /**
     * Seviye atlatır
     * @param {Number} newLevel - Yeni seviye
     */
    levelUp(newLevel) {
        this.level = newLevel;
        
        // Seviye sesi çal
        const audio = Audio.getInstance();
        audio.playSound('levelUp');
        
        // Seviye mesajı göster
        const gameScene = this.sceneManager.getScene('game');
        if (gameScene) {
            gameScene.showLevelUpMessage(this.level);
        }
        
        // Analitik kaydı
        const analytics = Analytics.getInstance();
        analytics.logEvent('level_up', {
            new_level: this.level,
            score: this.score
        });
    }
    
    /**
     * Oyun sonu
     */
    gameOver() {
        if (!this.isGameActive) return;
        
        this.isGameActive = false;
        
        // Game Over ekranına geç
        const gameOverScene = this.sceneManager.getScene('gameOver');
        gameOverScene.setScore(this.score);
        gameOverScene.setLevel(this.level);
        
        this.loadScene('gameOver');
        
        // Oyun sonu sesi çal
        const audio = Audio.getInstance();
        audio.playSound('gameOver');
        
        // Analitik kaydı
        const analytics = Analytics.getInstance();
        analytics.logEvent('game_over', {
            score: this.score,
            level: this.level,
            played_time: this.config.tap.gameTime - this.timeLeft
        });
    }
}

/**
 * TapGameScene.js - Tıklama oyun sahnesi
 * Tıklama oyun tipinin temel sahnesi
 */
class TapGameScene extends Scene {
    constructor(game) {
        super('game');
        
        this.game = game;
        this.config = game.config.tap;
        
        // Puan metni
        this.scoreText = new Text({
            text: 'Score: 0',
            x: 20,
            y: 40,
            font: '24px Arial',
            color: '#FFFFFF',
            align: 'left'
        });
        
        // Süre metni
        this.timeText = new Text({
            text: 'Time: 60s',
            x: 20,
            y: 70,
            font: '20px Arial',
            color: '#FFFFFF',
            align: 'left'
        });
        
        // Combo metni
        this.comboText = new Text({
            text: '',
            x: 20,
            y: 100,
            font: '20px Arial',
            color: '#FFDD00',
            align: 'left',
            visible: false
        });
        
        // Seviye metni
        this.levelText = new Text({
            text: 'Level: 1',
            x: game.engine.canvas.width - 120,
            y: 40,
            font: '20px Arial',
            color: '#FFFFFF',
            align: 'right'
        });
        
        // Güçlendirici metni
        this.powerupText = new Text({
            text: '',
            x: game.engine.canvas.width / 2,
            y: 40,
            font: '20px Arial',
            color: '#FFAA00',
            align: 'center',
            visible: false
        });
        
        // Duraklat düğmesi
        this.pauseButton = new Button({
            x: game.engine.canvas.width - 40,
            y: 40,
            width: 40,
            height: 40,
            text: '⏸️',
            onClick: () => {
                game.pause();
                game.loadScene('pause');
            }
        });
        
        // Seviye atlama mesajı
        this.levelUpMessage = new Text({
            text: 'Level Up!',
            x: game.engine.canvas.width / 2,
            y: game.engine.canvas.height / 2,
            font: '36px Arial',
            color: '#FFFF00',
            align: 'center',
            visible: false
        });
        
        // Başlangıç ekranı
        this.startScreen = new UIPanel({
            x: game.engine.canvas.width / 2,
            y: game.engine.canvas.height / 2,
            width: 400,
            height: 300,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            cornerRadius: 20,
            visible: true
        });
        
        const startTitle = new Text({
            text: 'Tap Game',
            x: 0,
            y: -100,
            font: '36px Arial',
            color: '#FFFFFF',
            align: 'center'
        });
        
        const startText = new Text({
            text: 'Tap targets as quickly as possible!',
            x: 0,
            y: -40,
            font: '20px Arial',
            color: '#FFFFFF',
            align: 'center'
        });
        
        const instructionText = new Text({
            text: 'Larger targets = More points\nDon\'t miss targets!',
            x: 0,
            y: 20,
            font: '16px Arial',
            color: '#FFFFFF',
            align: 'center'
        });
        
        const startButton = new Button({
            x: 0,
            y: 80,
            width: 200,
            height: 60,
            text: 'START',
            onClick: () => {
                this.startGame();
            }
        });
        
        this.startScreen.addChild(startTitle);
        this.startScreen.addChild(startText);
        this.startScreen.addChild(instructionText);
        this.startScreen.addChild(startButton);
    }
    
    /**
     * Sahne yüklendiğinde çağrılır
     */
    load() {
        super.load();
        
        // Oyun verilerini sıfırla
        this.game.reset();
        
        // UI bileşenlerini ekle
        this.ui.addComponent(this.scoreText);
        this.ui.addComponent(this.timeText);
        this.ui.addComponent(this.comboText);
        this.ui.addComponent(this.levelText);
        this.ui.addComponent(this.powerupText);
        this.ui.addComponent(this.pauseButton);
        this.ui.addComponent(this.levelUpMessage);
        this.ui.addComponent(this.startScreen);
        
        // Arkaplanı oluştur
        this._createBackground();
        
        // Dokunma olaylarını dinle
        this._setupTouchEvents();
    }
    
    /**
     * Sahne başladığında çağrılır
     */
    start() {
        super.start();
    }
    
    /**
     * Dokunma olaylarını kurar
     */
    _setupTouchEvents() {
        // Canvas üzerinde dokunma
        const canvas = this.game.engine.canvas;
        
        canvas.addEventListener('click', (e) => {
            if (!this.game.isGameActive || this.game.isPaused) return;
            
            // Tıklama pozisyonu
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            // Hedef kontrolü
            let tappedTarget = null;
            
            // Hedefleri kontrol et (en üsttekine öncelik ver)
            for (let i = this.game.targets.length - 1; i >= 0; i--) {
                const target = this.game.targets[i];
                
                // Basit çarpışma kontrolü
                const dx = Math.abs(target.x - x);
                const dy = Math.abs(target.y - y);
                
                if (dx < target.width / 2 && dy < target.height / 2) {
                    tappedTarget = target;
                    break;
                }
            }
            
            if (tappedTarget) {
                this.game.tapTarget(tappedTarget);
            } else {
                // Boşluğa tıklama
                this.game.resetCombo();
                
                // Boşluğa tıklama sesi
                const audio = Audio.getInstance();
                audio.playSound('tapEmpty');
            }
        });
    }
    
    /**
     * Arkaplan oluştur
     */
    _createBackground() {
        // Gradient arkaplan
        const bg = new GameObject('Background');
        
        // Arkaplan çizimi için özel bir component ekle
        bg.addComponent(new Component());
        bg.getComponent('Component').render = (renderer) => {
            const ctx = renderer.context;
            const width = renderer.canvas.width;
            const height = renderer.canvas.height;
            
            // Gradient arkaplan
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#333366');
            gradient.addColorStop(1, '#111133');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Dekoratif parçacıklar (yıldızlar)
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 100; i++) {
                const size = Math.random() * 3;
                const x = Math.random() * width;
                const y = Math.random() * height;
                const alpha = Math.random() * 0.7 + 0.3;
                
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.globalAlpha = 1;
        };
        
        // Sahneye ekle
        this.addGameObject(bg);
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // UI güncelle
        this._updateUI();
    }
    
    /**
     * UI'ı güncelle
     */
    _updateUI() {
        this.scoreText.setText(`Score: ${this.game.score}`);
        this.timeText.setText(`Time: ${Math.ceil(this.game.timeLeft)}s`);
        this.levelText.setText(`Level: ${this.game.level}`);
        
        // Combo metni
        if (this.game.combo > 1) {
            const comboText = `${this.game.combo}x Combo! (${this.game.comboMultiplier.toFixed(1)}x)`;
            this.comboText.setText(comboText);
            this.comboText.visible = true;
        } else {
            this.comboText.visible = false;
        }
        
        // Güçlendirici metni
        if (this.game.isPowerupActive) {
            let powerupName = '';
            
            switch (this.game.activePowerupType) {
                case 'slowmo':
                    powerupName = 'Slow Motion';
                    break;
                case 'multiplier':
                    powerupName = 'Score x2';
                    break;
                case 'freeze':
                    powerupName = 'Freeze';
                    break;
                case 'timebonus':
                    powerupName = 'Time Bonus';
                    break;
            }
            
            const timeLeft = Math.ceil(this.game.powerupTimer);
            this.powerupText.setText(`${powerupName}: ${timeLeft}s`);
            this.powerupText.visible = true;
        } else {
            this.powerupText.visible = false;
        }
    }
    
    /**
     * Oyunu başlat
     */
    startGame() {
        // Başlangıç ekranını gizle
        this.startScreen.visible = false;
        
        // Oyunu başlat
        this.game.startGame();
    }
    
    /**
     * Seviye atlama mesajını göster
     * @param {Number} level - Yeni seviye
     */
    showLevelUpMessage(level) {
        this.levelUpMessage.setText(`Level ${level}!`);
        this.levelUpMessage.visible = true;
        
        // Kısa süre sonra gizle
        setTimeout(() => {
            this.levelUpMessage.visible = false;
        }, 1500);
    }
}

/**
 * Target.js - Hedef sınıfı
 */
class Target extends GameObject {
    constructor(params = {}) {
        super('Target');
        
        this.type = params.type || 'circle';
        this.width = params.width || 50;
        this.height = params.height || 50;
        this.x = params.x || 0;
        this.y = params.y || 0;
        this.velocityX = params.velocityX || 0;
        this.velocityY = params.velocityY || 0;
        this.lifetime = params.lifetime || 3;
        this.isPowerup = params.isPowerup || false;
        
        // Özgün hız (freeze powerup için)
        this.originalVelocityX = undefined;
        this.originalVelocityY = undefined;
        
        // Ölçek değişimi (animasyon için)
        this.scale = 0;
        this.scaleDirection = 1;
        
        // Sprite
        const sprite = new Sprite(this.isPowerup ? 'powerup.png' : `target_${this.type}.png`, {
            width: this.width,
            height: this.height
        });
        this.addComponent(sprite);
        
        // Özel efekt (güçlendirici için)
        if (this.isPowerup) {
            const halo = new Sprite('powerup_halo.png', {
                width: this.width * 1.5,
                height: this.height * 1.5,
                alpha: 0.5
            });
            this.addComponent(halo);
            
            // Özel güncelleme
            halo.update = (deltaTime) => {
                halo.rotation += deltaTime * 2;
                halo.alpha = 0.3 + Math.sin(this.scene.time.time * 5) * 0.2;
            };
        }
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Ölçek animasyonu
        this.scale += this.scaleDirection * deltaTime * 2;
        
        if (this.scale > 0.1) {
            this.scaleDirection = -1;
        } else if (this.scale < -0.1) {
            this.scaleDirection = 1;
        }
        
        this.transform.scaleX = 1 + this.scale * 0.1;
        this.transform.scaleY = 1 + this.scale * 0.1;
        
        // Döndürme animasyonu (güçlendirici için)
        if (this.isPowerup) {
            this.transform.rotation += deltaTime * 2;
        }
        
        // Ömür görselleştirmesi
        const lifetimeRatio = this.lifetime / 3; // 3 saniye varsayılan
        const sprite = this.getComponent('Sprite');
        
        if (sprite) {
            sprite.alpha = 0.3 + lifetimeRatio * 0.7;
        }
    }
}

/**
 * FloatingText.js - Yükselen metin
 */
class FloatingText extends GameObject {
    constructor(params = {}) {
        super('FloatingText');
        
        this.text = params.text || '';
        this.x = params.x || 0;
        this.y = params.y || 0;
        this.font = params.font || '20px Arial';
        this.color = params.color || '#FFFFFF';
        this.lifetime = params.lifetime || 1;
        this.originalLifetime = this.lifetime;
        this.velocityX = params.velocityX || 0;
        this.velocityY = params.velocityY || -50;
        
        // Özel bileşen
        const textComp = new Component();
        textComp.render = (renderer) => {
            const ctx = renderer.context;
            
            ctx.save();
            
            // Alfa değeri (zamanla azalır)
            ctx.globalAlpha = this.lifetime / this.originalLifetime;
            
            // Metin ayarları
            ctx.font = this.font;
            ctx.fillStyle = this.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Metni çiz
            ctx.fillText(this.text, this.x, this.y);
            
            ctx.restore();
        };
        
        this.addComponent(textComp);
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Hareket
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Ömür azalt
        this.lifetime -= deltaTime;
        
        // Ömrü bitti mi kontrol et
        if (this.lifetime <= 0) {
            // Sahne varsa kaldır
            if (this.scene) {
                this.scene.removeGameObject(this);
            }
        }
    }
}