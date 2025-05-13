/**
 * RunnerGame.js - Runner oyun şablonu
 * Koşu oyunları oluşturmak için temel şablon
 */
class RunnerGame extends Game {
    constructor(config = {}) {
        // Temel yapılandırmayı genişlet
        const defaultConfig = {
            physics: {
                gravity: { x: 0, y: 20 } // Runner oyunları için uygun yerçekimi
            },
            // Runner oyunu özel ayarları
            runner: {
                speed: 10,              // Oyun hızı
                acceleration: 0.01,     // Hız artışı (seviye zorluğu)
                jumpForce: 15,          // Zıplama kuvveti
                doubleJump: true,       // Çift zıplama
                lanes: 3,               // Şerit sayısı
                laneWidth: 200,         // Şerit genişliği
                obstacleSpawnRate: 2,   // Engel üretme sıklığı (saniye)
                collectibleSpawnRate: 3, // Toplanabilir öğe üretme sıklığı
                powerupSpawnRate: 10,   // Güç üretme sıklığı
                bgSpeed: 5,             // Arkaplan hareket hızı
                startDelay: 1,          // Başlangıç gecikmesi
                cameraFollow: true,     // Kamera oyuncuyu takip etsin mi
                cameraOffset: { x: 0, y: -200 } // Kamera ofseti
            }
        };
        
        // Yapılandırmayı birleştir
        const mergedConfig = Utils.deepClone(defaultConfig);
        Utils.deepMerge(mergedConfig, config);
        
        // Üst sınıf yapıcısını çağır
        super(mergedConfig);
        
        // Runner oyun değişkenleri
        this.distance = 0;          // Koşulan mesafe
        this.score = 0;             // Puan
        this.coins = 0;             // Toplanan para/jetonlar
        this.lives = 3;             // Can sayısı
        this.currentSpeed = this.config.runner.speed; // Güncel hız
        this.isJumping = false;     // Zıplama durumu
        this.canDoubleJump = false; // Çift zıplama yapılabilir mi
        this.isSliding = false;     // Kayma durumu
        
        // Oyun nesneleri
        this.player = null;         // Oyuncu
        this.obstacles = [];        // Engeller
        this.collectibles = [];     // Toplanabilir öğeler
        this.powerups = [];         // Güçler
        this.grounds = [];          // Zemin parçaları
        this.decorations = [];      // Dekoratif öğeler
        
        // Zamanlayıcılar
        this.obstacleTimer = 0;
        this.collectibleTimer = 0;
        this.powerupTimer = 0;
        
        // Durum değişkenleri
        this.isPowerupActive = false;
        this.powerupType = null;
        this.powerupTimer = 0;
        
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
        const menuScene = new MainMenuScene('Runner Game');
        menuScene.onStart = () => this.loadScene('game');
        menuScene.onSettings = () => this.loadScene('settings');
        
        // Oyun sahnesi
        const gameScene = new RunnerGameScene(this);
        
        // Ayarlar sahnesi
        const settingsScene = new SettingsScene('Runner Game');
        
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
        // Input olayları
        this.onUpdate = (deltaTime) => {
            if (this.isPaused) return;
            
            // Oyun içi ve aktifse
            if (this.sceneManager.activeScene &&
                this.sceneManager.activeScene.name === 'game') {
                
                // Yön tuşları / dokunmatik kontrolü
                const input = this.input;
                
                // Zıplama
                if (input.isTouchStarted() || input.isKeyPressed('Space') || input.isKeyPressed('ArrowUp')) {
                    this.jump();
                }
                
                // Yön kontrolü
                if (input.isKeyPressed('ArrowLeft')) {
                    this.moveLeft();
                } else if (input.isKeyPressed('ArrowRight')) {
                    this.moveRight();
                }
                
                // Kayma
                if (input.isKeyPressed('ArrowDown') || input.isKeyPressed('ShiftLeft')) {
                    this.slide();
                } else {
                    this.stopSlide();
                }
                
                // Dokunmatik sürükle
                if (input.isTouchMoving()) {
                    const touchDelta = input.getTouchDelta();
                    
                    // Sağa/sola kaydırma
                    if (Math.abs(touchDelta.x) > 20) {
                        if (touchDelta.x > 0) {
                            this.moveRight();
                        } else {
                            this.moveLeft();
                        }
                    }
                    
                    // Aşağı kaydırma (kayma)
                    if (touchDelta.y > 30) {
                        this.slide();
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
        
        // Runner oyun verilerini sıfırla
        this.reset();
    }
    
    /**
     * Oyun verilerini sıfırlar
     */
    reset() {
        this.distance = 0;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.currentSpeed = this.config.runner.speed;
        this.isJumping = false;
        this.canDoubleJump = false;
        this.isSliding = false;
        
        this.obstacles = [];
        this.collectibles = [];
        this.powerups = [];
        
        this.isPowerupActive = false;
        this.powerupType = null;
        this.powerupTimer = 0;
        
        this.obstacleTimer = 0;
        this.collectibleTimer = 0;
        this.powerupTimer = 0;
    }
    
    /**
     * Zıplama hareketi
     */
    jump() {
        // Oyuncu nesnesini kontrol et
        if (!this.player || this.isSliding) return;
        
        // Eğer zıplıyorsa ve çift zıplama yapılabilirse
        if (this.isJumping && this.canDoubleJump && this.config.runner.doubleJump) {
            this.player.jump(this.config.runner.jumpForce * 0.8);
            this.canDoubleJump = false;
            
            // Çift zıplama sesi çal
            const audio = Audio.getInstance();
            audio.playSound('doubleJump');
            
            return;
        }
        
        // Normal zıplama
        if (!this.isJumping) {
            this.player.jump(this.config.runner.jumpForce);
            this.isJumping = true;
            this.canDoubleJump = true;
            
            // Zıplama sesi çal
            const audio = Audio.getInstance();
            audio.playSound('jump');
        }
    }
    
    /**
     * Sola hareket
     */
    moveLeft() {
        if (!this.player) return;
        
        this.player.moveLeft();
    }
    
    /**
     * Sağa hareket
     */
    moveRight() {
        if (!this.player) return;
        
        this.player.moveRight();
    }
    
    /**
     * Kayma hareketi
     */
    slide() {
        if (!this.player || this.isSliding) return;
        
        this.player.slide();
        this.isSliding = true;
        
        // Kayma sesi çal
        const audio = Audio.getInstance();
        audio.playSound('slide');
    }
    
    /**
     * Kaymayı durdur
     */
    stopSlide() {
        if (!this.player || !this.isSliding) return;
        
        this.player.stopSlide();
        this.isSliding = false;
    }
    
    /**
     * Para/jeton toplandığında
     * @param {Number} value - Toplanan para değeri
     */
    collectCoin(value = 1) {
        this.coins += value;
        this.score += value * 10;
        
        // Para toplama sesi çal
        const audio = Audio.getInstance();
        audio.playSound('coin');
        
        // Analitik kaydı
        const analytics = Analytics.getInstance();
        analytics.logCurrencyGain('coins', value, 'gameplay');
    }
    
    /**
     * Güç toplandığında
     * @param {String} type - Güç tipi
     * @param {Number} duration - Süre (saniye)
     */
    collectPowerup(type, duration = 5) {
        this.isPowerupActive = true;
        this.powerupType = type;
        this.powerupTimer = duration;
        
        // Güç etkisini uygula
        switch (type) {
            case 'shield':
                // Kalkan
                this.player.setShield(true);
                break;
                
            case 'magnet':
                // Mıknatıs
                break;
                
            case 'boost':
                // Hız artırma
                this.currentSpeed *= 1.5;
                break;
                
            case 'multiplier':
                // Puan çarpanı
                break;
        }
        
        // Güç toplama sesi çal
        const audio = Audio.getInstance();
        audio.playSound('powerup');
        
        // Analitik kaydı
        const analytics = Analytics.getInstance();
        analytics.logEvent('powerup_collect', {
            type: type,
            duration: duration
        });
    }
    
    /**
     * Engele çarpıldığında
     */
    hitObstacle() {
        // Kalkan varsa, kalkanı kaldır
        if (this.isPowerupActive && this.powerupType === 'shield') {
            this.isPowerupActive = false;
            this.powerupType = null;
            this.player.setShield(false);
            
            // Kalkan kırılma sesi çal
            const audio = Audio.getInstance();
            audio.playSound('shieldBreak');
            
            return;
        }
        
        // Can azalt
        this.lives--;
        
        // Çarpma efekti
        this.player.hit();
        
        // Çarpma sesi çal
        const audio = Audio.getInstance();
        audio.playSound('hit');
        
        // Can kalmadıysa oyun bitti
        if (this.lives <= 0) {
            this.gameOver();
        }
        
        // Analitik kaydı
        const analytics = Analytics.getInstance();
        analytics.logEvent('obstacle_hit', {
            distance: Math.floor(this.distance),
            lives_remaining: this.lives
        });
    }
    
    /**
     * Oyun sonu
     */
    gameOver() {
        // Game Over ekranına geç
        const gameOverScene = this.sceneManager.getScene('gameOver');
        gameOverScene.setScore(this.score);
        gameOverScene.setDistance(Math.floor(this.distance));
        gameOverScene.setCoins(this.coins);
        
        this.loadScene('gameOver');
        
        // Oyun sonu sesi çal
        const audio = Audio.getInstance();
        audio.playSound('gameOver');
        
        // Analitik kaydı
        const analytics = Analytics.getInstance();
        analytics.logEvent('game_over', {
            score: this.score,
            distance: Math.floor(this.distance),
            coins: this.coins
        });
    }
    
    /**
     * Engel oluştur
     * @param {String} type - Engel tipi
     * @param {Number} lane - Şerit numarası
     * @param {Number} distance - Mesafe
     */
    spawnObstacle(type, lane, distance) {
        if (!this.player) return null;
        
        const obstacle = new Obstacle(type, lane, distance);
        this.obstacles.push(obstacle);
        
        // Oyun sahnesine ekle
        const gameScene = this.sceneManager.getScene('game');
        gameScene.addGameObject(obstacle);
        
        return obstacle;
    }
    
    /**
     * Toplanabilir öğe oluştur
     * @param {String} type - Öğe tipi (coin, gem, vb.)
     * @param {Number} lane - Şerit numarası
     * @param {Number} distance - Mesafe
     */
    spawnCollectible(type, lane, distance) {
        if (!this.player) return null;
        
        const collectible = new Collectible(type, lane, distance);
        this.collectibles.push(collectible);
        
        // Oyun sahnesine ekle
        const gameScene = this.sceneManager.getScene('game');
        gameScene.addGameObject(collectible);
        
        return collectible;
    }
    
    /**
     * Güç oluştur
     * @param {String} type - Güç tipi
     * @param {Number} lane - Şerit numarası
     * @param {Number} distance - Mesafe
     */
    spawnPowerup(type, lane, distance) {
        if (!this.player) return null;
        
        const powerup = new Powerup(type, lane, distance);
        this.powerups.push(powerup);
        
        // Oyun sahnesine ekle
        const gameScene = this.sceneManager.getScene('game');
        gameScene.addGameObject(powerup);
        
        return powerup;
    }
    
    /**
     * Nesneleri temizle (görüş alanından çıkanlar)
     */
    cleanupObjects() {
        const playerDistance = this.player ? this.player.distance : 0;
        const cleanupDistance = playerDistance - 10; // 10 birim geride kalanları temizle
        
        // Engelleri temizle
        this.obstacles = this.obstacles.filter(obstacle => {
            if (obstacle.distance > cleanupDistance) {
                return true;
            } else {
                // Oyun sahnesinden kaldır
                const gameScene = this.sceneManager.getScene('game');
                gameScene.removeGameObject(obstacle);
                return false;
            }
        });
        
        // Toplanabilir öğeleri temizle
        this.collectibles = this.collectibles.filter(collectible => {
            if (collectible.distance > cleanupDistance) {
                return true;
            } else {
                // Oyun sahnesinden kaldır
                const gameScene = this.sceneManager.getScene('game');
                gameScene.removeGameObject(collectible);
                return false;
            }
        });
        
        // Güçleri temizle
        this.powerups = this.powerups.filter(powerup => {
            if (powerup.distance > cleanupDistance) {
                return true;
            } else {
                // Oyun sahnesinden kaldır
                const gameScene = this.sceneManager.getScene('game');
                gameScene.removeGameObject(powerup);
                return false;
            }
        });
    }
}

/**
 * RunnerGameScene.js - Runner oyun sahnesi
 * Runner oyun tipinin temel sahnesi
 */
class RunnerGameScene extends Scene {
    constructor(game) {
        super('game');
        
        this.game = game;
        this.config = game.config.runner;
        
        // Sahne değişkenleri
        this.groundY = game.engine.canvas.height * 0.8;
        this.lastGroundDistance = 0;
        
        // Puan metni
        this.scoreText = new Text({
            text: 'Score: 0',
            x: 20,
            y: 40,
            font: '24px Arial',
            color: '#FFFFFF',
            align: 'left'
        });
        
        // Mesafe metni
        this.distanceText = new Text({
            text: 'Distance: 0m',
            x: 20,
            y: 70,
            font: '20px Arial',
            color: '#FFFFFF',
            align: 'left'
        });
        
        // Para metni
        this.coinsText = new Text({
            text: 'Coins: 0',
            x: 20,
            y: 100,
            font: '20px Arial',
            color: '#FFDD00',
            align: 'left'
        });
        
        // Can göstergesi
        this.livesIndicator = new LivesIndicator({
            x: game.engine.canvas.width - 100,
            y: 40,
            lives: 3
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
        
        // Güç bilgisi
        this.powerupInfo = new Text({
            text: '',
            x: game.engine.canvas.width / 2,
            y: 40,
            font: '20px Arial',
            color: '#FFAA00',
            align: 'center'
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
            text: 'Runner Game',
            x: 0,
            y: -100,
            font: '36px Arial',
            color: '#FFFFFF',
            align: 'center'
        });
        
        const startText = new Text({
            text: 'Tap to Start',
            x: 0,
            y: 0,
            font: '24px Arial',
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
        this.ui.addComponent(this.distanceText);
        this.ui.addComponent(this.coinsText);
        this.ui.addComponent(this.livesIndicator);
        this.ui.addComponent(this.pauseButton);
        this.ui.addComponent(this.powerupInfo);
        this.ui.addComponent(this.startScreen);
        
        // Arkaplanı oluştur
        this._createBackground();
    }
    
    /**
     * Sahne başladığında çağrılır
     */
    start() {
        super.start();
    }
    
    /**
     * Oyunu başlat
     */
    startGame() {
        // Başlangıç ekranını gizle
        this.startScreen.visible = false;
        
        // Oyuncu oluştur
        this._createPlayer();
        
        // İlk zemin parçalarını oluştur
        this._createInitialGround();
        
        // Oyun başlangıç müziğini çal
        const audio = Audio.getInstance();
        audio.playMusic('gameplayMusic');
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Oyun öğeleri oluşturulmadan önce çıkış
        if (!this.game.player) return;
        
        // Oyun hızını güncelle
        this.game.currentSpeed += this.config.acceleration * deltaTime;
        
        // Mesafeyi güncelle
        this.game.distance += this.game.currentSpeed * deltaTime;
        
        // UI'ı güncelle
        this._updateUI();
        
        // Zemini güncelle
        this._updateGround();
        
        // Nesneleri oluştur
        this._spawnObjects(deltaTime);
        
        // Güç durumunu güncelle
        this._updatePowerups(deltaTime);
        
        // Çarpışmaları kontrol et
        this._checkCollisions();
        
        // Nesneleri temizle
        this.game.cleanupObjects();
        
        // Kamerayı güncelle
        this._updateCamera();
    }
    
    /**
     * UI'ı güncelle
     */
    _updateUI() {
        this.scoreText.setText(`Score: ${this.game.score}`);
        this.distanceText.setText(`Distance: ${Math.floor(this.game.distance)}m`);
        this.coinsText.setText(`Coins: ${this.game.coins}`);
        this.livesIndicator.setLives(this.game.lives);
        
        // Güç bilgisi
        if (this.game.isPowerupActive) {
            const timeLeft = Math.ceil(this.game.powerupTimer);
            let powerupName = '';
            
            switch (this.game.powerupType) {
                case 'shield':
                    powerupName = 'Shield';
                    break;
                case 'magnet':
                    powerupName = 'Coin Magnet';
                    break;
                case 'boost':
                    powerupName = 'Speed Boost';
                    break;
                case 'multiplier':
                    powerupName = 'Score x2';
                    break;
            }
            
            this.powerupInfo.setText(`${powerupName}: ${timeLeft}s`);
            this.powerupInfo.visible = true;
        } else {
            this.powerupInfo.visible = false;
        }
    }
    
    /**
     * Oyuncu oluştur
     */
    _createPlayer() {
        // Oyuncu nesnesini oluştur
        const player = new Player(this.config);
        player.x = this.game.engine.canvas.width / 2;
        player.y = this.groundY - player.height / 2;
        
        // Oyuna ekle
        this.addGameObject(player);
        this.game.player = player;
    }
    
    /**
     * Arkaplan oluştur
     */
    _createBackground() {
        // Uzak arkaplan (dağlar, bulutlar)
        const farBg = new ParallaxBackground({
            images: ['bg_far1.png', 'bg_far2.png', 'bg_far3.png'],
            scrollSpeed: this.config.bgSpeed * 0.2,
            y: this.game.engine.canvas.height * 0.3,
            height: this.game.engine.canvas.height * 0.5
        });
        
        // Orta arkaplan (tepeler, ağaçlar)
        const midBg = new ParallaxBackground({
            images: ['bg_mid1.png', 'bg_mid2.png', 'bg_mid3.png'],
            scrollSpeed: this.config.bgSpeed * 0.5,
            y: this.game.engine.canvas.height * 0.6,
            height: this.game.engine.canvas.height * 0.3
        });
        
        // Yakın arkaplan (çalılar, taşlar)
        const nearBg = new ParallaxBackground({
            images: ['bg_near1.png', 'bg_near2.png', 'bg_near3.png'],
            scrollSpeed: this.config.bgSpeed * 0.8,
            y: this.game.engine.canvas.height * 0.75,
            height: this.game.engine.canvas.height * 0.15
        });
        
        // Sahneye ekle
        this.addGameObject(farBg);
        this.addGameObject(midBg);
        this.addGameObject(nearBg);
    }
    
    /**
     * İlk zemin parçalarını oluştur
     */
    _createInitialGround() {
        // İlk on zemin parçasını oluştur
        for (let i = 0; i < 10; i++) {
            this._createGroundSegment(i * 10); // Her parça 10 birim uzunluğunda
        }
    }
    
    /**
     * Zemin parçası oluştur
     * @param {Number} distance - Mesafe
     */
    _createGroundSegment(distance) {
        const groundSegment = new GroundSegment({
            distance: distance,
            width: 10,
            y: this.groundY,
            textures: ['ground1.png', 'ground2.png', 'ground3.png']
        });
        
        // Sahneye ekle
        this.addGameObject(groundSegment);
        this.game.grounds.push(groundSegment);
        
        this.lastGroundDistance = distance + 10; // 10 birim genişlik
    }
    
    /**
     * Zemini güncelle
     */
    _updateGround() {
        const playerDistance = this.game.player.distance;
        
        // Oyuncudan çok geride kalan zemin parçalarını temizle
        this.game.grounds = this.game.grounds.filter(ground => {
            if (ground.distance + ground.width > playerDistance - 20) {
                return true;
            } else {
                this.removeGameObject(ground);
                return false;
            }
        });
        
        // Gerekirse yeni zemin parçaları oluştur
        while (this.lastGroundDistance < playerDistance + 50) {
            this._createGroundSegment(this.lastGroundDistance);
        }
    }
    
    /**
     * Nesneleri oluştur
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    _spawnObjects(deltaTime) {
        // Engeller
        this.game.obstacleTimer -= deltaTime;
        if (this.game.obstacleTimer <= 0) {
            // Rastgele engel oluştur
            const types = ['rock', 'log', 'hole', 'cactus', 'fence'];
            const type = Utils.randomItem(types);
            const lane = Utils.randomInt(0, this.config.lanes - 1);
            const distance = this.game.player.distance + 30; // Önde oluştur
            
            this.game.spawnObstacle(type, lane, distance);
            
            // Zamanlayıcıyı sıfırla (rastgele aralıkta)
            this.game.obstacleTimer = Utils.randomFloat(
                this.config.obstacleSpawnRate * 0.7,
                this.config.obstacleSpawnRate * 1.3
            );
        }
        
        // Toplanabilir öğeler
        this.game.collectibleTimer -= deltaTime;
        if (this.game.collectibleTimer <= 0) {
            // Rastgele toplanabilir öğe oluştur
            const types = ['coin', 'coin', 'coin', 'gem']; // Jeton daha yaygın
            const type = Utils.randomItem(types);
            const lane = Utils.randomInt(0, this.config.lanes - 1);
            const distance = this.game.player.distance + 30; // Önde oluştur
            
            // Grup oluştur
            const count = type === 'coin' ? Utils.randomInt(1, 5) : 1;
            
            for (let i = 0; i < count; i++) {
                this.game.spawnCollectible(type, lane, distance + i * 2);
            }
            
            // Zamanlayıcıyı sıfırla (rastgele aralıkta)
            this.game.collectibleTimer = Utils.randomFloat(
                this.config.collectibleSpawnRate * 0.7,
                this.config.collectibleSpawnRate * 1.3
            );
        }
        
        // Güçler
        this.game.powerupTimer -= deltaTime;
        if (this.game.powerupTimer <= 0) {
            // Rastgele güç oluştur
            const types = ['shield', 'magnet', 'boost', 'multiplier'];
            const type = Utils.randomItem(types);
            const lane = Utils.randomInt(0, this.config.lanes - 1);
            const distance = this.game.player.distance + 30; // Önde oluştur
            
            this.game.spawnPowerup(type, lane, distance);
            
            // Zamanlayıcıyı sıfırla (rastgele aralıkta)
            this.game.powerupTimer = Utils.randomFloat(
                this.config.powerupSpawnRate * 0.8,
                this.config.powerupSpawnRate * 1.2
            );
        }
    }
    
    /**
     * Güç durumunu güncelle
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    _updatePowerups(deltaTime) {
        if (this.game.isPowerupActive) {
            this.game.powerupTimer -= deltaTime;
            
            if (this.game.powerupTimer <= 0) {
                // Güç süresi doldu
                this.game.isPowerupActive = false;
                
                // Etkiyi kaldır
                switch (this.game.powerupType) {
                    case 'shield':
                        this.game.player.setShield(false);
                        break;
                        
                    case 'boost':
                        this.game.currentSpeed /= 1.5;
                        break;
                }
                
                this.game.powerupType = null;
            }
        }
    }
    
    /**
     * Çarpışmaları kontrol et
     */
    _checkCollisions() {
        const player = this.game.player;
        
        // Engeller ile çarpışma
        for (const obstacle of this.game.obstacles) {
            if (obstacle.checkCollision(player)) {
                this.game.hitObstacle();
                obstacle.hit();
            }
        }
        
        // Toplanabilir öğeler ile çarpışma
        for (const collectible of [...this.game.collectibles]) {
            if (collectible.checkCollision(player)) {
                // Topla
                if (collectible.type === 'coin') {
                    this.game.collectCoin(1);
                } else if (collectible.type === 'gem') {
                    this.game.collectCoin(5);
                }
                
                // Efekt göster
                collectible.collect();
                
                // Listeden kaldır
                const index = this.game.collectibles.indexOf(collectible);
                if (index !== -1) {
                    this.game.collectibles.splice(index, 1);
                }
                
                // Sahneden kaldır
                this.removeGameObject(collectible);
            }
        }
        
        // Güçler ile çarpışma
        for (const powerup of [...this.game.powerups]) {
            if (powerup.checkCollision(player)) {
                // Topla
                this.game.collectPowerup(powerup.type, 10); // 10 saniyelik güç
                
                // Efekt göster
                powerup.collect();
                
                // Listeden kaldır
                const index = this.game.powerups.indexOf(powerup);
                if (index !== -1) {
                    this.game.powerups.splice(index, 1);
                }
                
                // Sahneden kaldır
                this.removeGameObject(powerup);
            }
        }
    }
    
    /**
     * Kamerayı güncelle
     */
    _updateCamera() {
        if (!this.config.cameraFollow || !this.game.player) return;
        
        const renderer = this.game.renderer;
        
        // Oyuncuyu takip eden kamera
        renderer.setCameraPosition(
            this.game.player.x + this.config.cameraOffset.x,
            this.groundY + this.config.cameraOffset.y
        );
    }
}

/**
 * Runner oyun öğeleri
 */

/**
 * Player.js - Oyuncu sınıfı
 */
class Player extends GameObject {
    constructor(config) {
        super('Player');
        
        this.config = config;
        this.width = 80;
        this.height = 120;
        
        this.distance = 0;         // Koşulan mesafe
        this.lane = 1;             // Şu anki şerit (0, 1, 2, ...)
        this.laneCount = config.lanes;
        this.laneWidth = config.laneWidth;
        
        this.velocity = { x: 0, y: 0 };
        this.isGrounded = true;
        this.isSliding = false;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        
        this.hasShield = false;
        
        // Bileşenler
        this.sprite = new Sprite('player.png', {
            width: this.width,
            height: this.height
        });
        this.addComponent(this.sprite);
        
        this.runAnimation = new Animation({
            frameRate: 12,
            frameCount: 8,
            isHorizontal: true
        });
        this.addComponent(this.runAnimation);
        
        this.slideAnimation = new Animation({
            frameRate: 12,
            frameCount: 4,
            isHorizontal: true
        });
        this.addComponent(this.slideAnimation);
        
        this.jumpAnimation = new Animation({
            frameRate: 10,
            frameCount: 4,
            isHorizontal: true,
            loop: false
        });
        this.addComponent(this.jumpAnimation);
        
        this.collider = new Collider('box', {
            width: 60,
            height: 100
        });
        this.addComponent(this.collider);
        
        // Fizik bileşeni
        this.rigidbody = new Rigidbody({
            mass: 1,
            drag: 0.1,
            useGravity: true
        });
        this.addComponent(this.rigidbody);
        
        // Kalkan efekti
        this.shieldSprite = new Sprite('shield.png', {
            width: this.width * 1.5,
            height: this.height * 1.5,
            alpha: 0.7,
            visible: false
        });
        this.addComponent(this.shieldSprite);
        
        // Animasyonları ayarla
        this.setupAnimations();
        
        // Koşma animasyonunu başlat
        this.runAnimation.play('run', true);
    }
    
    /**
     * Animasyonları ayarla
     */
    setupAnimations() {
        // Koşma animasyonu
        this.runAnimation.addAnimation('run', {
            startFrame: 0,
            frameCount: 8,
            frameRate: 12,
            loop: true
        });
        
        // Zıplama animasyonu
        this.jumpAnimation.addAnimation('jump', {
            startFrame: 0,
            frameCount: 4,
            frameRate: 10,
            loop: false
        });
        
        // Kayma animasyonu
        this.slideAnimation.addAnimation('slide', {
            startFrame: 0,
            frameCount: 4,
            frameRate: 12,
            loop: true
        });
    }
    
    /**
     * Güncelleme
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Mesafeyi güncelle
        this.distance += this.scene.game.currentSpeed * deltaTime;
        
        // Yer kontrolü
        this.checkGround();
        
        // Şerit konumunu güncelle
        const targetX = this.scene.game.engine.canvas.width / 2 + 
                       (this.lane - 1) * this.laneWidth;
        
        this.x = Utils.lerp(this.x, targetX, deltaTime * 10);
        
        // Zıplama davranışı
        if (!this.isGrounded) {
            // Havadayken animasyon
            this.runAnimation.stop();
            this.slideAnimation.stop();
            
            if (!this.jumpAnimation.isPlaying) {
                this.jumpAnimation.play('jump', true);
            }
            
            // Collider ayarla
            this.collider.width = 60;
            this.collider.height = 100;
            
            // Sprite boyutu
            this.sprite.width = this.width;
            this.sprite.height = this.height;
        } else {
            if (this.isSliding) {
                // Kayma animasyonu
                this.slideAnimation.play('slide', false);
                this.runAnimation.stop();
                this.jumpAnimation.stop();
                
                // Collider ayarla (alçak)
                this.collider.width = 80;
                this.collider.height = 60;
                
                // Sprite boyutu (alçak)
                this.sprite.width = this.width * 1.2;
                this.sprite.height = this.height * 0.5;
                this.sprite.pivotY = 0.9; // Alt taraftan hizala
            } else {
                // Koşma animasyonu
                this.runAnimation.play('run', false);
                this.slideAnimation.stop();
                this.jumpAnimation.stop();
                
                // Collider ayarla
                this.collider.width = 60;
                this.collider.height = 100;
                
                // Sprite boyutu
                this.sprite.width = this.width;
                this.sprite.height = this.height;
                this.sprite.pivotY = 0.5; // Ortadan hizala
            }
        }
        
        // Yere inme pozisyonu
        if (this.isGrounded) {
            this.y = this.scene.groundY - (this.isSliding ? this.height * 0.25 : this.height * 0.5);
        }
        
        // Yenilmezlik süresi
        if (this.isInvincible) {
            this.invincibleTimer -= deltaTime;
            
            // Yanıp sönme efekti
            this.sprite.alpha = Math.sin(this.invincibleTimer * 10) * 0.5 + 0.5;
            
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.sprite.alpha = 1;
            }
        }
        
        // Kalkan efekti
        if (this.hasShield) {
            this.shieldSprite.visible = true;
            // Kalkanı oyuncunun etrafında döndür
            this.shieldSprite.rotation += deltaTime * 2;
        } else {
            this.shieldSprite.visible = false;
        }
    }
    
    /**
     * Yere değip değmediğini kontrol et
     */
    checkGround() {
        const physics = Physics.getInstance();
        const groundY = this.scene.groundY;
        
        if (this.y + this.height * 0.5 >= groundY && this.velocity.y >= 0) {
            // Yere değdi
            this.isGrounded = true;
            this.y = groundY - this.height * 0.5;
            this.velocity.y = 0;
        } else {
            // Havada
            this.isGrounded = false;
        }
    }
    
    /**
     * Zıplama
     * @param {Number} force - Zıplama kuvveti
     */
    jump(force) {
        if (!this.isGrounded && !this.scene.game.canDoubleJump) return;
        
        this.velocity.y = -force;
        this.rigidbody.setVelocity(0, -force);
        this.isGrounded = false;
        this.isSliding = false;
        
        // Zıplama animasyonunu oynat
        this.jumpAnimation.play('jump', true);
    }
    
    /**
     * Sola hareket
     */
    moveLeft() {
        if (this.lane > 0) {
            this.lane--;
        }
    }
    
    /**
     * Sağa hareket
     */
    moveRight() {
        if (this.lane < this.laneCount - 1) {
            this.lane++;
        }
    }
    
    /**
     * Kayma
     */
    slide() {
        if (!this.isGrounded) return;
        
        this.isSliding = true;
    }
    
    /**
     * Kaymayı durdur
     */
    stopSlide() {
        this.isSliding = false;
    }
    
    /**
     * Engele çarpma
     */
    hit() {
        if (this.isInvincible) return;
        
        // Yenilmezlik süresi
        this.isInvincible = true;
        this.invincibleTimer = 2; // 2 saniye
        
        // Çarpma efekti
        this.sprite.tint = '#FF0000';
        
        // 0.2 saniye sonra rengi geri getir
        setTimeout(() => {
            this.sprite.tint = '#FFFFFF';
        }, 200);
    }
    
    /**
     * Kalkan ayarla
     * @param {Boolean} active - Kalkan aktif mi
     */
    setShield(active) {
        this.hasShield = active;
    }
}

/**
 * Obstacle.js - Engel sınıfı
 */
class Obstacle extends GameObject {
    constructor(type, lane, distance) {
        super('Obstacle');
        
        this.type = type;
        this.lane = lane;
        this.distance = distance;
        
        // Engel türüne göre boyut
        switch (type) {
            case 'rock':
                this.width = 80;
                this.height = 60;
                break;
            case 'log':
                this.width = 120;
                this.height = 40;
                break;
            case 'hole':
                this.width = 100;
                this.height = 20;
                break;
            case 'cactus':
                this.width = 60;
                this.height = 100;
                break;
            case 'fence':
                this.width = 100;
                this.height = 80;
                break;
            default:
                this.width = 80;
                this.height = 80;
        }
        
        // Sprite
        this.sprite = new Sprite(`obstacle_${type}.png`, {
            width: this.width,
            height: this.height
        });
        this.addComponent(this.sprite);
        
        // Collider
        this.collider = new Collider('box', {
            width: this.width * 0.8,
            height: this.height * 0.8
        });
        this.addComponent(this.collider);
    }
    
    /**
     * Güncelleme
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Oyuncu hızında hareket et
        if (this.scene && this.scene.game && this.scene.game.player) {
            const player = this.scene.game.player;
            
            // Mesafe farkını hesapla
            const distanceDiff = this.distance - player.distance;
            
            // X pozisyonu (şerit)
            const baseX = this.scene.game.engine.canvas.width / 2;
            this.x = baseX + (this.lane - 1) * this.scene.game.config.runner.laneWidth;
            
            // Z derinliğine göre Y pozisyonu
            const groundY = this.scene.groundY;
            this.y = groundY - this.height * 0.5;
            
            // Z derinliğine göre ölçek
            const scale = Utils.map(distanceDiff, 30, 0, 0.5, 1.2);
            this.transform.scaleX = scale;
            this.transform.scaleY = scale;
            
            // Ekrandan çıktıysa oyun nesnesini kaldır
            if (distanceDiff < -10) {
                this.scene.removeGameObject(this);
            }
        }
    }
    
    /**
     * Çarpışma kontrolü
     * @param {GameObject} other - Diğer nesne
     * @return {Boolean} Çarpışma var mı
     */
    checkCollision(other) {
        // Basit çarpışma kontrolü
        const dx = Math.abs(this.x - other.x);
        const dy = Math.abs(this.y - other.y);
        
        return dx < (this.width + other.width) * 0.4 &&
               dy < (this.height + other.height) * 0.4;
    }
    
    /**
     * Çarpışma olduğunda
     */
    hit() {
        // Çarpışma efekti
        this.sprite.tint = '#FF0000';
        
        // 0.2 saniye sonra rengi geri getir
        setTimeout(() => {
            this.sprite.tint = '#FFFFFF';
        }, 200);
    }
}

/**
 * Collectible.js - Toplanabilir öğe sınıfı
 */
class Collectible extends GameObject {
    constructor(type, lane, distance) {
        super('Collectible');
        
        this.type = type;
        this.lane = lane;
        this.distance = distance;
        
        // Öğe türüne göre boyut
        if (type === 'coin') {
            this.width = 40;
            this.height = 40;
        } else if (type === 'gem') {
            this.width = 50;
            this.height = 50;
        } else {
            this.width = 40;
            this.height = 40;
        }
        
        // Sprite
        this.sprite = new Sprite(`collectible_${type}.png`, {
            width: this.width,
            height: this.height
        });
        this.addComponent(this.sprite);
        
        // Collider
        this.collider = new Collider('circle', {
            radius: this.width * 0.5
        });
        this.addComponent(this.collider);
        
        // Animasyon
        this.animation = new Animation({
            frameRate: 10,
            frameCount: 8,
            isHorizontal: true
        });
        this.addComponent(this.animation);
        
        // Animasyonu ayarla
        this.animation.addAnimation('spin', {
            startFrame: 0,
            frameCount: 8,
            frameRate: 10,
            loop: true
        });
        
        // Animasyonu başlat
        this.animation.play('spin', true);
    }
    
    /**
     * Güncelleme
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Zıplama efekti
        this.y += Math.sin(this.scene.time.time * 5) * 0.5;
        
        // Oyuncu hızında hareket et
        if (this.scene && this.scene.game && this.scene.game.player) {
            const player = this.scene.game.player;
            
            // Mesafe farkını hesapla
            const distanceDiff = this.distance - player.distance;
            
            // X pozisyonu (şerit)
            const baseX = this.scene.game.engine.canvas.width / 2;
            this.x = baseX + (this.lane - 1) * this.scene.game.config.runner.laneWidth;
            
            // Z derinliğine göre Y pozisyonu
            const groundY = this.scene.groundY;
            this.y = groundY - this.height * 2; // Yerden yüksekte
            
            // Z derinliğine göre ölçek
            const scale = Utils.map(distanceDiff, 30, 0, 0.5, 1.2);
            this.transform.scaleX = scale;
            this.transform.scaleY = scale;
            
            // Ekrandan çıktıysa oyun nesnesini kaldır
            if (distanceDiff < -10) {
                this.scene.removeGameObject(this);
            }
        }
    }
    
    /**
     * Çarpışma kontrolü
     * @param {GameObject} other - Diğer nesne
     * @return {Boolean} Çarpışma var mı
     */
    checkCollision(other) {
        // Basit çarpışma kontrolü
        const dx = Math.abs(this.x - other.x);
        const dy = Math.abs(this.y - other.y);
        
        return dx < (this.width + other.width) * 0.5 &&
               dy < (this.height + other.height) * 0.5;
    }
    
    /**
     * Toplandığında
     */
    collect() {
        // Toplama efekti
        this.sprite.alpha = 0;
        
        // Parçacık efekti
        if (this.scene) {
            const particles = new ParticleSystem({
                x: this.x,
                y: this.y,
                count: 10,
                speed: 100,
                lifetime: 0.5,
                colors: ['#FFDD00', '#FFFFFF', '#FFA500'],
                size: 5
            });
            
            this.scene.addGameObject(particles);
            
            // 0.5 saniye sonra kaldır
            setTimeout(() => {
                this.scene.removeGameObject(particles);
            }, 500);
        }
    }
}

/**
 * Powerup.js - Güç sınıfı
 */
class Powerup extends GameObject {
    constructor(type, lane, distance) {
        super('Powerup');
        
        this.type = type;
        this.lane = lane;
        this.distance = distance;
        
        // Güç türüne göre boyut
        this.width = 60;
        this.height = 60;
        
        // Sprite
        this.sprite = new Sprite(`powerup_${type}.png`, {
            width: this.width,
            height: this.height
        });
        this.addComponent(this.sprite);
        
        // Collider
        this.collider = new Collider('circle', {
            radius: this.width * 0.5
        });
        this.addComponent(this.collider);
        
        // Halo efekti
        this.halo = new Sprite('powerup_halo.png', {
            width: this.width * 1.5,
            height: this.height * 1.5,
            alpha: 0.5
        });
        this.addComponent(this.halo);
    }
    
    /**
     * Güncelleme
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Zıplama efekti
        this.y += Math.sin(this.scene.time.time * 3) * 1;
        
        // Dönme efekti
        this.transform.rotation += deltaTime * 2;
        
        // Halo efekti
        this.halo.alpha = 0.3 + Math.sin(this.scene.time.time * 5) * 0.2;
        this.halo.rotation -= deltaTime;
        
        // Oyuncu hızında hareket et
        if (this.scene && this.scene.game && this.scene.game.player) {
            const player = this.scene.game.player;
            
            // Mesafe farkını hesapla
            const distanceDiff = this.distance - player.distance;
            
            // X pozisyonu (şerit)
            const baseX = this.scene.game.engine.canvas.width / 2;
            this.x = baseX + (this.lane - 1) * this.scene.game.config.runner.laneWidth;
            
            // Z derinliğine göre Y pozisyonu
            const groundY = this.scene.groundY;
            this.y = groundY - this.height * 2; // Yerden yüksekte
            
            // Z derinliğine göre ölçek
            const scale = Utils.map(distanceDiff, 30, 0, 0.5, 1.2);
            this.transform.scaleX = scale;
            this.transform.scaleY = scale;
            
            // Ekrandan çıktıysa oyun nesnesini kaldır
            if (distanceDiff < -10) {
                this.scene.removeGameObject(this);
            }
        }
    }
    
    /**
     * Çarpışma kontrolü
     * @param {GameObject} other - Diğer nesne
     * @return {Boolean} Çarpışma var mı
     */
    checkCollision(other) {
        // Basit çarpışma kontrolü
        const dx = Math.abs(this.x - other.x);
        const dy = Math.abs(this.y - other.y);
        
        return dx < (this.width + other.width) * 0.5 &&
               dy < (this.height + other.height) * 0.5;
    }
    
    /**
     * Toplandığında
     */
    collect() {
        // Toplama efekti
        this.sprite.alpha = 0;
        this.halo.alpha = 0;
        
        // Parçacık efekti
        if (this.scene) {
            let colors;
            
            switch (this.type) {
                case 'shield':
                    colors = ['#00AAFF', '#FFFFFF', '#0088FF'];
                    break;
                case 'magnet':
                    colors = ['#FF00FF', '#FFFFFF', '#AA00AA'];
                    break;
                case 'boost':
                    colors = ['#FF0000', '#FFFFFF', '#AA0000'];
                    break;
                case 'multiplier':
                    colors = ['#00FF00', '#FFFFFF', '#00AA00'];
                    break;
                default:
                    colors = ['#FFFFFF', '#AAAAAA', '#DDDDDD'];
            }
            
            const particles = new ParticleSystem({
                x: this.x,
                y: this.y,
                count: 20,
                speed: 150,
                lifetime: 1,
                colors: colors,
                size: 8
            });
            
            this.scene.addGameObject(particles);
            
            // 1 saniye sonra kaldır
            setTimeout(() => {
                this.scene.removeGameObject(particles);
            }, 1000);
        }
    }
}