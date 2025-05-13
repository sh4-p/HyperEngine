/**
 * PuzzleGame.js - Bulmaca oyun şablonu
 * Match-3, blok bulmaca vb. oyunlar için temel şablon
 */
class PuzzleGame extends Game {
    constructor(config = {}) {
        // Temel yapılandırmayı genişlet
        const defaultConfig = {
            physics: {
                gravity: { x: 0, y: 0 }, // Bulmaca oyunları için yerçekimi kapalı
                enabled: false
            },
            // Puzzle oyunu özel ayarları
            puzzle: {
                gridWidth: 8,              // Izgara genişliği
                gridHeight: 8,             // Izgara yüksekliği
                tileSize: 60,              // Kare boyutu
                tileTypes: 5,              // Farklı kare tipi sayısı
                matchMin: 3,               // Minimum eşleşme sayısı
                swapTime: 0.2,             // Takas animasyon süresi
                fallTime: 0.5,             // Düşme animasyon süresi
                clearTime: 0.3,            // Temizleme animasyon süresi
                matchScore: 10,            // Temel eşleşme puanı
                comboMultiplier: 0.1,      // Kombo çarpanı
                specialTileChance: 0.1,    // Özel kare oluşturma şansı
                bombRadius: 1,             // Bomba etki yarıçapı
                gameTime: 60,              // Oyun süresi (0 = sınırsız)
                moveLimit: 0,              // Hamle limiti (0 = sınırsız)
                targetScore: 1000,         // Hedef puan
                levelUpScore: 500,         // Seviye atlama puanı
                tileShuffleAllowed: true,  // Mümkün hamle kalmadığında kareler karıştırılsın mı
                gameMode: 'score'          // Oyun modu: 'score', 'time', 'moves', 'target'
            }
        };
        
        // Yapılandırmayı birleştir
        const mergedConfig = Utils.deepClone(defaultConfig);
        Utils.deepMerge(mergedConfig, config);
        
        // Üst sınıf yapıcısını çağır
        super(mergedConfig);
        
        // Bulmaca oyun değişkenleri
        this.score = 0;              // Puan
        this.level = 1;              // Seviye
        this.moves = 0;              // Hamle sayısı
        this.timeLeft = this.config.puzzle.gameTime; // Kalan süre
        this.combo = 0;              // Kombo sayısı
        this.grid = [];              // Oyun ızgarası
        this.selectedTile = null;    // Seçili kare
        this.swappingTiles = false;  // Takas edilme durumu
        this.fallingTiles = false;   // Düşme durumu
        this.clearingTiles = false;  // Temizlenme durumu
        this.animations = [];        // Animasyonlar
        
        // Durum değişkenleri
        this.gameState = 'idle';     // Oyun durumu: 'idle', 'playing', 'levelComplete', 'gameOver'
        this.interactionEnabled = true; // Etkileşim etkin mi
        
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
        const menuScene = new MainMenuScene('Puzzle Game');
        menuScene.onStart = () => this.loadScene('game');
        menuScene.onSettings = () => this.loadScene('settings');
        
        // Oyun sahnesi
        const gameScene = new PuzzleGameScene(this);
        
        // Ayarlar sahnesi
        const settingsScene = new SettingsScene('Puzzle Game');
        
        // Seviye tamamlama sahnesi
        const levelCompleteScene = new LevelCompleteScene();
        levelCompleteScene.onNextLevel = () => {
            this.nextLevel();
            this.loadScene('game');
        };
        levelCompleteScene.onMainMenu = () => this.loadScene('menu');
        
        // Game Over sahnesi
        const gameOverScene = new GameOverScene();
        gameOverScene.onRestart = () => {
            this.reset();
            this.loadScene('game');
        };
        gameOverScene.onMainMenu = () => this.loadScene('menu');
        
        // Duraklama sahnesi
        const pauseScene = new PauseScene();
        pauseScene.onResume = () => this.resume();
        pauseScene.onRestart = () => {
            this.reset();
            this.loadScene('game');
        };
        pauseScene.onMainMenu = () => this.loadScene('menu');
        
        // Sahneleri oyuna ekle
        this.addScene('menu', menuScene);
        this.addScene('game', gameScene);
        this.addScene('settings', settingsScene);
        this.addScene('levelComplete', levelCompleteScene);
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
            if (this.gameState === 'playing' && 
                this.sceneManager.activeScene &&
                this.sceneManager.activeScene.name === 'game') {
                
                // Zamana bağlı oyun modları
                if (this.config.puzzle.gameMode === 'time') {
                    this.timeLeft -= deltaTime;
                    
                    if (this.timeLeft <= 0) {
                        this.timeLeft = 0;
                        this.gameOver();
                        return;
                    }
                }
                
                // Animasyonları güncelle
                this._updateAnimations(deltaTime);
                
                // Etkileşim durumu
                this.interactionEnabled = !this.swappingTiles && !this.fallingTiles && !this.clearingTiles;
                
                // Otomatik kontroller
                if (this.interactionEnabled) {
                    // Eşleşme kontrolü
                    if (this._checkMatches()) {
                        // Eşleşme varsa temizle
                        this._clearMatches();
                    } else if (this._checkGameEnd()) {
                        // Oyun sonu kontrolü
                        this.gameOver();
                    } else if (!this._checkPossibleMoves()) {
                        // Mümkün hamle kontrolü
                        if (this.config.puzzle.tileShuffleAllowed) {
                            this._shuffleTiles();
                        } else {
                            this.gameOver();
                        }
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
        
        // Bulmaca oyun verilerini sıfırla
        this.reset();
    }
    
    /**
     * Oyun verilerini sıfırlar
     */
    reset() {
        this.score = 0;
        this.level = 1;
        this.moves = 0;
        this.timeLeft = this.config.puzzle.gameTime;
        this.combo = 0;
        this.grid = [];
        this.selectedTile = null;
        this.swappingTiles = false;
        this.fallingTiles = false;
        this.clearingTiles = false;
        this.animations = [];
        
        this.gameState = 'idle';
        this.interactionEnabled = true;
    }
    
    /**
     * Oyunu başlatır
     */
    startGame() {
        // Izgarayı oluştur
        this._createGrid();
        
        // Eşleşme kontrolü
        while (this._checkMatches()) {
            // Başlangıçta eşleşme varsa ızgarayı yeniden oluştur
            this._createGrid();
        }
        
        // Mümkün hamle kontrolü
        if (!this._checkPossibleMoves()) {
            // Mümkün hamle yoksa ızgarayı karıştır
            this._shuffleTiles();
        }
        
        this.gameState = 'playing';
        
        // Oyun başlangıç müziğini çal
        const audio = Audio.getInstance();
        audio.playMusic('gameplayMusic');
        
        // Analitik kaydı
        const analytics = Analytics.getInstance();
        analytics.logEvent('game_start', {
            game_mode: 'puzzle',
            level: this.level
        });
    }
    
    /**
     * Izgarayı oluştur
     */
    _createGrid() {
        this.grid = [];
        
        // Izgara boyutlarına göre kareler oluştur
        for (let y = 0; y < this.config.puzzle.gridHeight; y++) {
            const row = [];
            
            for (let x = 0; x < this.config.puzzle.gridWidth; x++) {
                // Rastgele kare tipi
                let tileType;
                let validTypes = [];
                
                // Üst ve sol komşulara bakarak aynı tipin oluşmasını engelle
                for (let type = 0; type < this.config.puzzle.tileTypes; type++) {
                    let isValid = true;
                    
                    // Sol komşu kontrolü (yatay eşleşmeyi engelle)
                    if (x >= 2) {
                        if (row[x - 1].type === type && row[x - 2].type === type) {
                            isValid = false;
                        }
                    }
                    
                    // Üst komşu kontrolü (dikey eşleşmeyi engelle)
                    if (y >= 2) {
                        if (this.grid[y - 1][x].type === type && this.grid[y - 2][x].type === type) {
                            isValid = false;
                        }
                    }
                    
                    if (isValid) {
                        validTypes.push(type);
                    }
                }
                
                // Eğer geçerli tip yoksa tüm tipleri kullan
                if (validTypes.length === 0) {
                    for (let type = 0; type < this.config.puzzle.tileTypes; type++) {
                        validTypes.push(type);
                    }
                }
                
                // Rastgele geçerli tip seç
                tileType = Utils.randomItem(validTypes);
                
                // Kare nesnesi
                const tile = {
                    x: x,
                    y: y,
                    type: tileType,
                    special: null, // 'bomb', 'row', 'column', 'color'
                    selected: false,
                    falling: false,
                    removing: false,
                    sprite: null
                };
                
                row.push(tile);
            }
            
            this.grid.push(row);
        }
    }
    
    /**
     * Kare seç
     * @param {Number} x - Izgara X koordinatı
     * @param {Number} y - Izgara Y koordinatı
     */
    selectTile(x, y) {
        if (!this.interactionEnabled) return;
        if (x < 0 || x >= this.config.puzzle.gridWidth || y < 0 || y >= this.config.puzzle.gridHeight) return;
        
        const tile = this.grid[y][x];
        
        // Zaten seçili mi kontrol et
        if (this.selectedTile) {
            // Komşu mu kontrol et
            const dx = Math.abs(this.selectedTile.x - x);
            const dy = Math.abs(this.selectedTile.y - y);
            
            if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                // Komşu kareyi takas et
                this._swapTiles(this.selectedTile, tile);
                
                // Seçimi temizle
                this.selectedTile.selected = false;
                this.selectedTile = null;
            } else {
                // Seçimi değiştir
                this.selectedTile.selected = false;
                tile.selected = true;
                this.selectedTile = tile;
                
                // Seçme sesi çal
                const audio = Audio.getInstance();
                audio.playSound('tileSelect');
            }
        } else {
            // Kareyi seç
            tile.selected = true;
            this.selectedTile = tile;
            
            // Seçme sesi çal
            const audio = Audio.getInstance();
            audio.playSound('tileSelect');
        }
    }
    
    /**
     * Kareleri takas et
     * @param {Object} tile1 - İlk kare
     * @param {Object} tile2 - İkinci kare
     */
    _swapTiles(tile1, tile2) {
        // Takas durumu
        this.swappingTiles = true;
        
        // Hamle sayısını artır
        this.moves++;
        
        // Takas animasyonu
        const startTime = Date.now() / 1000;
        const anim = {
            type: 'swap',
            tile1: tile1,
            tile2: tile2,
            startTime: startTime,
            duration: this.config.puzzle.swapTime,
            startX1: tile1.x,
            startY1: tile1.y,
            startX2: tile2.x,
            startY2: tile2.y,
            onComplete: () => {
                // Geçici olarak ızgara konumlarını değiştir
                const tempX = tile1.x;
                const tempY = tile1.y;
                
                tile1.x = tile2.x;
                tile1.y = tile2.y;
                
                tile2.x = tempX;
                tile2.y = tempY;
                
                // Izgara referanslarını güncelle
                this.grid[tile1.y][tile1.x] = tile1;
                this.grid[tile2.y][tile2.x] = tile2;
                
                // Eşleşmeyi kontrol et
                if (this._checkMatches()) {
                    // Eşleşme varsa temizle
                    this._clearMatches();
                } else {
                    // Eşleşme yoksa geri takas et
                    const revertAnim = {
                        type: 'swap',
                        tile1: tile1,
                        tile2: tile2,
                        startTime: Date.now() / 1000,
                        duration: this.config.puzzle.swapTime,
                        startX1: tile1.x,
                        startY1: tile1.y,
                        startX2: tile2.x,
                        startY2: tile2.y,
                        onComplete: () => {
                            // Geri takas
                            const tempX = tile1.x;
                            const tempY = tile1.y;
                            
                            tile1.x = tile2.x;
                            tile1.y = tile2.y;
                            
                            tile2.x = tempX;
                            tile2.y = tempY;
                            
                            // Izgara referanslarını güncelle
                            this.grid[tile1.y][tile1.x] = tile1;
                            this.grid[tile2.y][tile2.x] = tile2;
                            
                            this.swappingTiles = false;
                            
                            // Hamle sayısını azalt
                            this.moves--;
                        }
                    };
                    
                    this.animations.push(revertAnim);
                }
            }
        };
        
        this.animations.push(anim);
        
        // Takas sesi çal
        const audio = Audio.getInstance();
        audio.playSound('tileSwap');
    }
    
    /**
     * Eşleşmeleri kontrol et
     * @return {Boolean} Eşleşme var mı
     */
    _checkMatches() {
        // Tüm eşleşmeleri bul
        const matches = this._findMatches();
        
        return matches.length > 0;
    }
    
    /**
     * Eşleşmeleri bul
     * @return {Array} Eşleşme dizisi
     */
    _findMatches() {
        const matches = [];
        
        // Yatay eşleşmeleri kontrol et
        for (let y = 0; y < this.config.puzzle.gridHeight; y++) {
            for (let x = 0; x < this.config.puzzle.gridWidth - 2; x++) {
                const tile1 = this.grid[y][x];
                const tile2 = this.grid[y][x + 1];
                const tile3 = this.grid[y][x + 2];
                
                if (tile1.type === tile2.type && tile2.type === tile3.type) {
                    // En az 3'lü eşleşme
                    const match = [tile1, tile2, tile3];
                    
                    // Daha fazla eşleşme var mı kontrol et
                    for (let i = x + 3; i < this.config.puzzle.gridWidth; i++) {
                        const nextTile = this.grid[y][i];
                        if (nextTile.type === tile1.type) {
                            match.push(nextTile);
                        } else {
                            break;
                        }
                    }
                    
                    matches.push(match);
                    
                    // Bir sonraki potansiyel eşleşmenin başlangıcına atla
                    x += match.length - 1;
                }
            }
        }
        
        // Dikey eşleşmeleri kontrol et
        for (let x = 0; x < this.config.puzzle.gridWidth; x++) {
            for (let y = 0; y < this.config.puzzle.gridHeight - 2; y++) {
                const tile1 = this.grid[y][x];
                const tile2 = this.grid[y + 1][x];
                const tile3 = this.grid[y + 2][x];
                
                if (tile1.type === tile2.type && tile2.type === tile3.type) {
                    // En az 3'lü eşleşme
                    const match = [tile1, tile2, tile3];
                    
                    // Daha fazla eşleşme var mı kontrol et
                    for (let i = y + 3; i < this.config.puzzle.gridHeight; i++) {
                        const nextTile = this.grid[i][x];
                        if (nextTile.type === tile1.type) {
                            match.push(nextTile);
                        } else {
                            break;
                        }
                    }
                    
                    matches.push(match);
                    
                    // Bir sonraki potansiyel eşleşmenin başlangıcına atla
                    y += match.length - 1;
                }
            }
        }
        
        return matches;
    }
    
    /**
     * Eşleşmeleri temizle
     */
    _clearMatches() {
        const matches = this._findMatches();
        
        if (matches.length === 0) {
            this.combo = 0;
            this.swappingTiles = false;
            return;
        }
        
        // Temizleme durumu
        this.clearingTiles = true;
        
        // Kombo sayısını artır
        this.combo++;
        
        // Eşleşmeleri işaretle
        const tilesToRemove = new Set();
        
        for (const match of matches) {
            // Özel kare oluşturma durumu
            let specialTile = null;
            
            if (match.length >= 5) {
                // 5+ eşleşme: Renk bombası
                specialTile = { type: match[0].type, special: 'color' };
            } else if (match.length === 4) {
                // 4'lü eşleşme: Satır/sütun temizleyici
                // Yatay/dikey eşleşme durumuna göre belirle
                if (match[0].y === match[1].y) {
                    // Yatay eşleşme: Satır temizleyici
                    specialTile = { type: match[0].type, special: 'row' };
                } else {
                    // Dikey eşleşme: Sütun temizleyici
                    specialTile = { type: match[0].type, special: 'column' };
                }
            } else if (match.length === 3 && Math.random() < this.config.puzzle.specialTileChance) {
                // 3'lü eşleşme: Düşük ihtimalle bomba
                specialTile = { type: match[0].type, special: 'bomb' };
            }
            
            // Eşleşmeleri kaldırılacaklar listesine ekle
            for (const tile of match) {
                tilesToRemove.add(tile);
            }
        }
        
        // Kaldırma animasyonu
        const startTime = Date.now() / 1000;
        const anim = {
            type: 'clear',
            tiles: Array.from(tilesToRemove),
            startTime: startTime,
            duration: this.config.puzzle.clearTime,
            onComplete: () => {
                // Kaldırma işlemi tamamlandı
                this.clearingTiles = false;
                
                // Kareleri kaldır ve yenilerini oluştur
                this._removeTiles(tilesToRemove);
                
                // Puanı güncelle
                const matchCount = tilesToRemove.size;
                const baseScore = matchCount * this.config.puzzle.matchScore;
                const comboMultiplier = 1 + (this.combo - 1) * this.config.puzzle.comboMultiplier;
                const score = Math.floor(baseScore * comboMultiplier);
                
                this.score += score;
                
                // Seviye kontrolü
                if (this.score >= this.level * this.config.puzzle.levelUpScore) {
                    this.levelComplete();
                    return;
                }
                
                // Puanı güncelle ve süreyi kontrol et
                if (this.config.puzzle.gameMode === 'score') {
                    // Hedef puana ulaştıysa seviye tamamlandı
                    if (this.score >= this.config.puzzle.targetScore) {
                        this.levelComplete();
                        return;
                    }
                } else if (this.config.puzzle.gameMode === 'moves') {
                    // Hamle limiti dolduysa oyun bitti
                    if (this.config.puzzle.moveLimit > 0 && this.moves >= this.config.puzzle.moveLimit) {
                        this.gameOver();
                        return;
                    }
                }
            }
        };
        
        this.animations.push(anim);
        
        // Eşleşme sesi çal
        const audio = Audio.getInstance();
        audio.playSound('match');
        
        // Kombo efekti
        if (this.combo > 1) {
            audio.playSound('combo');
        }
    }
    
    /**
     * Kareleri kaldır ve yenilerini oluştur
     * @param {Set} tilesToRemove - Kaldırılacak kareler
     */
    _removeTiles(tilesToRemove) {
        // Düşme durumu
        this.fallingTiles = true;
        
        // Kaldırılacak kareleri işaretle
        for (const tile of tilesToRemove) {
            this.grid[tile.y][tile.x] = null;
        }
        
        // Özel kare oluştur
        if (tilesToRemove.size >= 3) {
            // İlk kaldırılan karenin yerine özel kare olasılığı
            const specialChance = this.config.puzzle.specialTileChance * (tilesToRemove.size - 2);
            
            if (Math.random() < specialChance) {
                const tileArray = Array.from(tilesToRemove);
                const randomTile = Utils.randomItem(tileArray);
                const specialType = Math.random() < 0.5 ? 'bomb' : (Math.random() < 0.5 ? 'row' : 'column');
                
                this.grid[randomTile.y][randomTile.x] = {
                    x: randomTile.x,
                    y: randomTile.y,
                    type: randomTile.type,
                    special: specialType,
                    selected: false,
                    falling: false,
                    removing: false,
                    sprite: null
                };
            }
        }
        
        // Boşlukları doldur (kareleri aşağı düşür)
        for (let x = 0; x < this.config.puzzle.gridWidth; x++) {
            // Boşlukları yukarı kaydır
            let emptySpaces = 0;
            
            for (let y = this.config.puzzle.gridHeight - 1; y >= 0; y--) {
                if (this.grid[y][x] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    // Kareyi aşağı kaydır
                    const tile = this.grid[y][x];
                    const newY = y + emptySpaces;
                    
                    // Animasyonu ayarla
                    tile.falling = true;
                    
                    const startTime = Date.now() / 1000;
                    const anim = {
                        type: 'fall',
                        tile: tile,
                        startTime: startTime,
                        duration: this.config.puzzle.fallTime,
                        startY: tile.y,
                        endY: newY,
                        onComplete: () => {
                            tile.falling = false;
                            tile.y = newY;
                            this.grid[newY][x] = tile;
                            this.grid[y][x] = null;
                        }
                    };
                    
                    this.animations.push(anim);
                }
            }
            
            // Üst kısımdaki boşlukları yeni karelerle doldur
            for (let y = emptySpaces - 1; y >= 0; y--) {
                // Yeni kare oluştur
                const tileType = Math.floor(Math.random() * this.config.puzzle.tileTypes);
                
                const tile = {
                    x: x,
                    y: y,
                    type: tileType,
                    special: null,
                    selected: false,
                    falling: true,
                    removing: false,
                    sprite: null
                };
                
                this.grid[y][x] = tile;
                
                // Animasyonu ayarla
                const startTime = Date.now() / 1000;
                const anim = {
                    type: 'new',
                    tile: tile,
                    startTime: startTime,
                    duration: this.config.puzzle.fallTime,
                    startY: -1,
                    endY: y,
                    onComplete: () => {
                        tile.falling = false;
                    }
                };
                
                this.animations.push(anim);
            }
        }
        
        // Düşme sesi çal
        const audio = Audio.getInstance();
        audio.playSound('tileFall');
    }
    
    /**
     * Mümkün hamleleri kontrol et
     * @return {Boolean} Mümkün hamle var mı
     */
    _checkPossibleMoves() {
        // Yatay takas kontrolü
        for (let y = 0; y < this.config.puzzle.gridHeight; y++) {
            for (let x = 0; x < this.config.puzzle.gridWidth - 1; x++) {
                // Takas et ve eşleşmeyi kontrol et
                const temp = this.grid[y][x];
                this.grid[y][x] = this.grid[y][x + 1];
                this.grid[y][x + 1] = temp;
                
                // Konumları güncelle
                this.grid[y][x].x = x;
                this.grid[y][x + 1].x = x + 1;
                
                // Eşleşmeyi kontrol et
                const matches = this._findMatches();
                
                // Takas geri al
                this.grid[y][x + 1] = this.grid[y][x];
                this.grid[y][x] = temp;
                
                // Konumları geri al
                this.grid[y][x].x = x;
                this.grid[y][x + 1].x = x + 1;
                
                if (matches.length > 0) {
                    return true;
                }
            }
        }
        
        // Dikey takas kontrolü
        for (let x = 0; x < this.config.puzzle.gridWidth; x++) {
            for (let y = 0; y < this.config.puzzle.gridHeight - 1; y++) {
                // Takas et ve eşleşmeyi kontrol et
                const temp = this.grid[y][x];
                this.grid[y][x] = this.grid[y + 1][x];
                this.grid[y + 1][x] = temp;
                
                // Konumları güncelle
                this.grid[y][x].y = y;
                this.grid[y + 1][x].y = y + 1;
                
                // Eşleşmeyi kontrol et
                const matches = this._findMatches();
                
                // Takas geri al
                this.grid[y + 1][x] = this.grid[y][x];
                this.grid[y][x] = temp;
                
                // Konumları geri al
                this.grid[y][x].y = y;
                this.grid[y + 1][x].y = y + 1;
                
                if (matches.length > 0) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Kareleri karıştır
     */
    _shuffleTiles() {
        // Tüm kareleri bir diziye al
        const allTiles = [];
        
        for (let y = 0; y < this.config.puzzle.gridHeight; y++) {
            for (let x = 0; x < this.config.puzzle.gridWidth; x++) {
                allTiles.push(this.grid[y][x]);
            }
        }
        
        // Kareleri karıştır
        const shuffledTiles = Utils.shuffle(allTiles);
        
        // Kareleri yeni konumlara yerleştir
        let index = 0;
        
        for (let y = 0; y < this.config.puzzle.gridHeight; y++) {
            for (let x = 0; x < this.config.puzzle.gridWidth; x++) {
                const tile = shuffledTiles[index++];
                
                // Yeni konumu ayarla
                tile.x = x;
                tile.y = y;
                
                // Izgara referansını güncelle
                this.grid[y][x] = tile;
            }
        }
        
        // Eşleşme olmayana kadar karıştır
        if (this._checkMatches() || !this._checkPossibleMoves()) {
            this._shuffleTiles();
        }
        
        // Karıştırma sesi çal
        const audio = Audio.getInstance();
        audio.playSound('shuffle');
    }
    
    /**
     * Oyun sonu kontrolü
     * @return {Boolean} Oyun bitti mi
     */
    _checkGameEnd() {
        // Oyun moduna göre kontrol
        if (this.config.puzzle.gameMode === 'time') {
            // Süre kontrolü
            return this.timeLeft <= 0;
        } else if (this.config.puzzle.gameMode === 'moves') {
            // Hamle kontrolü
            return this.config.puzzle.moveLimit > 0 && this.moves >= this.config.puzzle.moveLimit;
        } else if (this.config.puzzle.gameMode === 'target') {
            // Hedef puan kontrolü
            return this.score >= this.config.puzzle.targetScore;
        }
        
        return false;
    }
    
    /**
     * Animasyonları güncelle
     * @param {Number} deltaTime - Geçen süre
     */
    _updateAnimations(deltaTime) {
        const completedAnimations = [];
        
        for (let i = 0; i < this.animations.length; i++) {
            const anim = this.animations[i];
            const elapsed = (Date.now() / 1000) - anim.startTime;
            const progress = Math.min(1, elapsed / anim.duration);
            
            // Animasyon tipine göre güncelle
            if (anim.type === 'swap') {
                // Takas animasyonu
                const tile1 = anim.tile1;
                const tile2 = anim.tile2;
                
                if (progress >= 1) {
                    // Animasyonu tamamla
                    if (anim.onComplete) {
                        anim.onComplete();
                    }
                    
                    completedAnimations.push(i);
                }
            } else if (anim.type === 'clear') {
                // Temizleme animasyonu
                const tiles = anim.tiles;
                
                for (const tile of tiles) {
                    tile.removing = true;
                }
                
                if (progress >= 1) {
                    // Animasyonu tamamla
                    for (const tile of tiles) {
                        tile.removing = false;
                    }
                    
                    if (anim.onComplete) {
                        anim.onComplete();
                    }
                    
                    completedAnimations.push(i);
                }
            } else if (anim.type === 'fall' || anim.type === 'new') {
                // Düşme animasyonu
                const tile = anim.tile;
                
                if (progress >= 1) {
                    // Animasyonu tamamla
                    if (anim.onComplete) {
                        anim.onComplete();
                    }
                    
                    completedAnimations.push(i);
                }
            }
        }
        
        // Tamamlanan animasyonları kaldır (sondan başa doğru)
        for (let i = completedAnimations.length - 1; i >= 0; i--) {
            this.animations.splice(completedAnimations[i], 1);
        }
        
        // Tüm animasyonlar bittiyse durum kontrolü
        if (this.animations.length === 0) {
            // Düşme durumunu güncelle
            this.fallingTiles = false;
            
            // Tekrar eşleşme kontrolü
            if (this._checkMatches()) {
                // Eşleşme varsa temizle
                this._clearMatches();
            } else {
                // Takas durumunu güncelle
                this.swappingTiles = false;
            }
        }
    }
    
    /**
     * Seviye tamamlandı
     */
    levelComplete() {
        this.gameState = 'levelComplete';
        
        // Seviye tamamlama sahnesi
        const levelCompleteScene = this.sceneManager.getScene('levelComplete');
        levelCompleteScene.setScore(this.score);
        levelCompleteScene.setLevel(this.level);
        levelCompleteScene.setStars(this._calculateStars());
        
        this.loadScene('levelComplete');
        
        // Seviye tamamlama sesi çal
        const audio = Audio.getInstance();
        audio.playSound('levelComplete');
        
        // Analitik kaydı
        const analytics = Analytics.getInstance();
        analytics.logEvent('level_complete', {
            level: this.level,
            score: this.score,
            moves: this.moves,
            stars: this._calculateStars()
        });
    }
    
    /**
     * Oyun sonu
     */
    gameOver() {
        if (this.gameState === 'gameOver') return;
        
        this.gameState = 'gameOver';
        
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
            level: this.level,
            score: this.score,
            moves: this.moves
        });
    }
    
    /**
     * Sonraki seviye
     */
    nextLevel() {
        this.level++;
        
        // Zorluk artışı
        this.config.puzzle.tileTypes = Math.min(8, this.config.puzzle.tileTypes + 1);
        
        // Önceki değerleri sıfırla
        this.moves = 0;
        this.timeLeft = this.config.puzzle.gameTime;
        this.combo = 0;
        this.grid = [];
        this.selectedTile = null;
        this.swappingTiles = false;
        this.fallingTiles = false;
        this.clearingTiles = false;
        this.animations = [];
        
        this.gameState = 'idle';
        this.interactionEnabled = true;
    }
    
    /**
     * Yıldız sayısını hesapla
     * @return {Number} Yıldız sayısı (0-3)
     */
    _calculateStars() {
        // Oyun moduna göre farklı hesapla
        if (this.config.puzzle.gameMode === 'score') {
            // Hedef puana göre
            const ratio = this.score / this.config.puzzle.targetScore;
            
            if (ratio >= 1.5) {
                return 3;
            } else if (ratio >= 1.2) {
                return 2;
            } else if (ratio >= 1.0) {
                return 1;
            }
        } else if (this.config.puzzle.gameMode === 'moves') {
            // Hamle sayısına göre
            const efficiency = this.config.puzzle.moveLimit / this.moves;
            
            if (efficiency >= 1.3) {
                return 3;
            } else if (efficiency >= 1.1) {
                return 2;
            } else if (efficiency >= 0.9) {
                return 1;
            }
        } else if (this.config.puzzle.gameMode === 'time') {
            // Kalan süreye göre
            const timeEfficiency = this.timeLeft / this.config.puzzle.gameTime;
            
            if (timeEfficiency >= 0.5) {
                return 3;
            } else if (timeEfficiency >= 0.3) {
                return 2;
            } else if (timeEfficiency >= 0.1) {
                return 1;
            }
        }
        
        return 0;
    }
}

/**
 * PuzzleGameScene.js - Bulmaca oyun sahnesi
 * Bulmaca oyun tipinin temel sahnesi
 */
class PuzzleGameScene extends Scene {
    constructor(game) {
        super('game');
        
        this.game = game;
        this.config = game.config.puzzle;
        
        // Izgara koordinatları
        this.gridX = 0;
        this.gridY = 0;
        
        // Kare sprite'ları
        this.tileSprites = [];
    }
    
    /**
     * Sahne yüklendiğinde çağrılır
     */
    load() {
        super.load();
        
        // Oyun verilerini sıfırla
        this.game.reset();
        
        // Iş ve panelleri oluştur
        this._createUI();
        
        // Izgara koordinatlarını hesapla
        const screenWidth = this.game.engine.canvas.width;
        const screenHeight = this.game.engine.canvas.height;
        
        this.gridX = (screenWidth - this.config.gridWidth * this.config.tileSize) / 2;
        this.gridY = (screenHeight - this.config.gridHeight * this.config.tileSize) / 2;
        
        // Başlangıç ekranı
        this.startScreen = new Panel({
            x: screenWidth / 2 - 200,
            y: screenHeight / 2 - 150,
            width: 400,
            height: 300,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            cornerRadius: 20,
            visible: true
        });
        
        const startTitle = new Text({
            text: 'Puzzle Game',
            x: 200,
            y: 60,
            font: '36px Arial',
            color: '#FFFFFF',
            align: 'center'
        });
        
        const startText = new Text({
            text: 'Match tiles and complete the level!',
            x: 200,
            y: 120,
            font: '20px Arial',
            color: '#FFFFFF',
            align: 'center'
        });
        
        const startButton = new Button({
            x: 100,
            y: 200,
            width: 200,
            height: 60,
            text: 'START',
            backgroundColor: '#4CAF50',
            hoverBackgroundColor: '#66BB6A',
            pressedBackgroundColor: '#388E3C',
            onClick: () => {
                this.startGame();
            }
        });
        
        this.startScreen.addChild(startTitle);
        this.startScreen.addChild(startText);
        this.startScreen.addChild(startButton);
        
        this.ui.addComponent(this.startScreen);
        
        // Arkaplanı oluştur
        this._createBackground();
        
        // Dokunma olaylarını dinle
        this._setupTouchEvents();
    }
    
    /**
     * UI bileşenlerini oluştur
     */
    _createUI() {
        const screenWidth = this.game.engine.canvas.width;
        
        // Üst panel
        const topPanel = new Panel({
            x: 0,
            y: 0,
            width: screenWidth,
            height: 60,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
        });
        
        // Skor metin
        this.scoreText = new Text({
            text: 'Score: 0',
            x: 20,
            y: 30,
            font: '24px Arial',
            color: '#FFFFFF',
            align: 'left'
        });
        
        // Seviye metin
        this.levelText = new Text({
            text: 'Level: 1',
            x: screenWidth - 100,
            y: 30,
            font: '24px Arial',
            color: '#FFFFFF',
            align: 'right'
        });
        
        // Oyun moduna göre farklı bilgiler
        if (this.config.gameMode === 'time') {
            // Süre göstergesi
            this.timeText = new Text({
                text: `Time: ${this.config.gameTime}s`,
                x: screenWidth / 2,
                y: 30,
                font: '24px Arial',
                color: '#FFFFFF',
                align: 'center'
            });
            
            topPanel.addChild(this.timeText);
        } else if (this.config.gameMode === 'moves') {
            // Hamle göstergesi
            this.movesText = new Text({
                text: `Moves: 0/${this.config.moveLimit}`,
                x: screenWidth / 2,
                y: 30,
                font: '24px Arial',
                color: '#FFFFFF',
                align: 'center'
            });
            
            topPanel.addChild(this.movesText);
        } else if (this.config.gameMode === 'target') {
            // Hedef göstergesi
            this.targetText = new Text({
                text: `Target: ${this.config.targetScore}`,
                x: screenWidth / 2,
                y: 30,
                font: '24px Arial',
                color: '#FFFFFF',
                align: 'center'
            });
            
            topPanel.addChild(this.targetText);
        }
        
        // Duraklat düğmesi
        const pauseButton = new Button({
            x: screenWidth - 50,
            y: 30,
            width: 40,
            height: 40,
            text: '⏸️',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            onClick: () => {
                this.game.pause();
                this.game.loadScene('pause');
            }
        });
        
        topPanel.addChild(this.scoreText);
        topPanel.addChild(this.levelText);
        topPanel.addChild(pauseButton);
        
        // Alt panel (bonus bilgiler)
        const bottomPanel = new Panel({
            x: 0,
            y: this.game.engine.canvas.height - 40,
            width: screenWidth,
            height: 40,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
        });
        
        // Kombo metin
        this.comboText = new Text({
            text: '',
            x: screenWidth / 2,
            y: 20,
            font: '20px Arial',
            color: '#FFEB3B',
            align: 'center'
        });
        
        bottomPanel.addChild(this.comboText);
        
        // UI bileşenlerini ekle
        this.ui.addComponent(topPanel);
        this.ui.addComponent(bottomPanel);
    }
    
    /**
     * Sahne başladığında çağrılır
     */
    start() {
        super.start();
    }
    
    /**
     * Arkaplan oluştur
     */
    _createBackground() {
        // Arkaplan nesnesi
        const bg = new GameObject('Background');
        
        // Arkaplan çizimi için özel bir component ekle
        bg.addComponent(new Component());
        bg.getComponent('Component').render = (renderer) => {
            const ctx = renderer.context;
            const width = renderer.canvas.width;
            const height = renderer.canvas.height;
            
            // Gradient arkaplan
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#673AB7');
            gradient.addColorStop(1, '#3F51B5');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Desen
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            const patternSize = 40;
            
            for (let x = 0; x < width; x += patternSize) {
                for (let y = 0; y < height; y += patternSize) {
                    ctx.fillRect(x, y, patternSize / 2, patternSize / 2);
                    ctx.fillRect(x + patternSize / 2, y + patternSize / 2, patternSize / 2, patternSize / 2);
                }
            }
        };
        
        // Sahneye ekle
        this.addGameObject(bg);
    }
    
    /**
     * Dokunma olaylarını kurar
     */
    _setupTouchEvents() {
        // Canvas üzerinde dokunma
        const canvas = this.game.engine.canvas;
        
        canvas.addEventListener('click', (e) => {
            if (this.game.gameState !== 'playing' || !this.game.interactionEnabled) return;
            
            // Tıklama pozisyonu
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            // Izgara içinde mi kontrol et
            if (x >= this.gridX && x < this.gridX + this.config.gridWidth * this.config.tileSize &&
                y >= this.gridY && y < this.gridY + this.config.gridHeight * this.config.tileSize) {
                
                // Izgara koordinatlarını hesapla
                const gridX = Math.floor((x - this.gridX) / this.config.tileSize);
                const gridY = Math.floor((y - this.gridY) / this.config.tileSize);
                
                // Kareyi seç
                this.game.selectTile(gridX, gridY);
            }
        });
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // UI güncelle
        this._updateUI();
        
        // Kare sprite'larını yönet
        this._manageTileSprites();
    }
    
    /**
     * UI güncellemeleri
     */
    _updateUI() {
        // Skor ve seviye güncellemesi
        this.scoreText.setText(`Score: ${this.game.score}`);
        this.levelText.setText(`Level: ${this.game.level}`);
        
        // Oyun moduna göre farklı bilgiler
        if (this.config.gameMode === 'time' && this.timeText) {
            // Süre güncellemesi
            this.timeText.setText(`Time: ${Math.ceil(this.game.timeLeft)}s`);
        } else if (this.config.gameMode === 'moves' && this.movesText) {
            // Hamle güncellemesi
            this.movesText.setText(`Moves: ${this.game.moves}/${this.config.moveLimit || '∞'}`);
        }
        
        // Kombo güncellemesi
        if (this.game.combo > 1) {
            this.comboText.setText(`Combo x${this.game.combo}!`);
            this.comboText.color = '#FFEB3B';
            this.comboText.scale = 1 + this.game.combo * 0.1;
        } else {
            this.comboText.setText('');
        }
    }
    
    /**
     * Kare sprite'larını yönet
     */
    _manageTileSprites() {
        // Tüm sprite'ları temizle
        for (const sprite of this.tileSprites) {
            this.removeGameObject(sprite);
        }
        
        this.tileSprites = [];
        
        // Izgara henüz oluşturulmadıysa çık
        if (!this.game.grid || this.game.grid.length === 0) return;
        
        // Izgaradaki tüm kareleri çiz
        for (let y = 0; y < this.config.gridHeight; y++) {
            for (let x = 0; x < this.config.gridWidth; x++) {
                const tile = this.game.grid[y][x];
                
                if (tile) {
                    // Animasyonlu konum hesaplamaları
                    let tileX = this.gridX + tile.x * this.config.tileSize;
                    let tileY = this.gridY + tile.y * this.config.tileSize;
                    let scale = 1;
                    let alpha = 1;
                    
                    // Animasyonları uygula
                    for (const anim of this.game.animations) {
                        if (anim.type === 'swap') {
                            if (anim.tile1 === tile || anim.tile2 === tile) {
                                const progress = Math.min(1, ((Date.now() / 1000) - anim.startTime) / anim.duration);
                                const easedProgress = this._easeInOut(progress);
                                
                                if (anim.tile1 === tile) {
                                    tileX = this.gridX + (anim.startX1 + (tile.x - anim.startX1) * easedProgress) * this.config.tileSize;
                                    tileY = this.gridY + (anim.startY1 + (tile.y - anim.startY1) * easedProgress) * this.config.tileSize;
                                } else {
                                    tileX = this.gridX + (anim.startX2 + (tile.x - anim.startX2) * easedProgress) * this.config.tileSize;
                                    tileY = this.gridY + (anim.startY2 + (tile.y - anim.startY2) * easedProgress) * this.config.tileSize;
                                }
                            }
                        } else if (anim.type === 'clear') {
                            if (anim.tiles.includes(tile)) {
                                const progress = Math.min(1, ((Date.now() / 1000) - anim.startTime) / anim.duration);
                                scale = 1 - progress;
                                alpha = 1 - progress;
                            }
                        } else if (anim.type === 'fall' && anim.tile === tile) {
                            const progress = Math.min(1, ((Date.now() / 1000) - anim.startTime) / anim.duration);
                            const easedProgress = this._easeInOut(progress);
                            
                            tileY = this.gridY + (anim.startY + (tile.y - anim.startY) * easedProgress) * this.config.tileSize;
                        } else if (anim.type === 'new' && anim.tile === tile) {
                            const progress = Math.min(1, ((Date.now() / 1000) - anim.startTime) / anim.duration);
                            const easedProgress = this._easeInOut(progress);
                            
                            tileY = this.gridY + (anim.startY + (tile.y - anim.startY) * easedProgress) * this.config.tileSize;
                            alpha = progress;
                        }
                    }
                    
                    // Kare sprite'ını oluştur
                    const tileSprite = new GameObject('Tile');
                    tileSprite.x = tileX + this.config.tileSize / 2;
                    tileSprite.y = tileY + this.config.tileSize / 2;
                    tileSprite.transform.scaleX = scale;
                    tileSprite.transform.scaleY = scale;
                    
                    // Sprite bileşeni
                    const sprite = new Sprite(`tile_${tile.type}.png`, {
                        width: this.config.tileSize,
                        height: this.config.tileSize,
                        alpha: alpha
                    });
                    
                    tileSprite.addComponent(sprite);
                    
                    // Özel kare efekti
                    if (tile.special) {
                        const specialSprite = new Sprite(`special_${tile.special}.png`, {
                            width: this.config.tileSize,
                            height: this.config.tileSize,
                            alpha: alpha
                        });
                        
                        tileSprite.addComponent(specialSprite);
                    }
                    
                    // Seçili kare efekti
                    if (tile.selected) {
                        const selectedEffect = new Component();
                        selectedEffect.render = (renderer) => {
                            const ctx = renderer.context;
                            
                            ctx.save();
                            
                            // Yanıp sönen çerçeve
                            const time = Date.now() / 1000;
                            const alpha = (Math.sin(time * 5) + 1) / 2 * 0.5 + 0.5;
                            
                            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                            ctx.lineWidth = 4;
                            ctx.strokeRect(-this.config.tileSize / 2, -this.config.tileSize / 2, this.config.tileSize, this.config.tileSize);
                            
                            ctx.restore();
                        };
                        
                        tileSprite.addComponent(selectedEffect);
                    }
                    
                    // Sahneye ekle
                    this.addGameObject(tileSprite);
                    this.tileSprites.push(tileSprite);
                }
            }
        }
    }
    
    /**
     * Ease-in-out fonksiyonu
     * @param {Number} t - Zaman (0-1)
     * @return {Number} Yumuşatılmış zaman (0-1)
     */
    _easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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
     * Render işlemi sırasında çağrılır
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        super.render(renderer);
        
        // Izgara zemin çizimi
        const ctx = renderer.context;
        
        // Eğer oyun henüz başlamadıysa, ızgarayı çizme
        if (this.game.gameState !== 'playing') return;
        
        ctx.save();
        
        // Izgara zemin
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.gridX, this.gridY, this.config.gridWidth * this.config.tileSize, this.config.gridHeight * this.config.tileSize);
        
        // Izgara çizgileri
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Dikey çizgiler
        for (let x = 0; x <= this.config.gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(this.gridX + x * this.config.tileSize, this.gridY);
            ctx.lineTo(this.gridX + x * this.config.tileSize, this.gridY + this.config.gridHeight * this.config.tileSize);
            ctx.stroke();
        }
        
        // Yatay çizgiler
        for (let y = 0; y <= this.config.gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(this.gridX, this.gridY + y * this.config.tileSize);
            ctx.lineTo(this.gridX + this.config.gridWidth * this.config.tileSize, this.gridY + y * this.config.tileSize);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

/**
 * LevelCompleteScene.js - Seviye tamamlama sahnesi
 * Seviye tamamlandığında gösterilen ekran
 */
class LevelCompleteScene extends Scene {
    constructor() {
        super('levelComplete');
        
        // Skor ve diğer bilgiler
        this.score = 0;
        this.level = 1;
        this.stars = 0;
        
        // Olay işleyicileri
        this.onNextLevel = null;
        this.onMainMenu = null;
    }
    
    /**
     * Sahne yüklendiğinde çağrılır
     */
    load() {
        super.load();
        
        // Ana panel
        const screenWidth = this.game.engine.canvas.width;
        const screenHeight = this.game.engine.canvas.height;
        
        const levelCompletePanel = new Panel({
            x: screenWidth / 2 - 200,
            y: screenHeight / 2 - 200,
            width: 400,
            height: 400,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            cornerRadius: 20
        });
        
        // Level Complete başlığı
        const titleText = new Text({
            text: 'Level Complete!',
            x: 200,
            y: 60,
            font: '36px Arial',
            color: '#4CAF50',
            align: 'center'
        });
        
        // Seviye metni
        const levelText = new Text({
            text: `Level ${this.level}`,
            x: 200,
            y: 110,
            font: '24px Arial',
            color: '#FFFFFF',
            align: 'center'
        });
        
        // Skor metni
        const scoreText = new Text({
            text: `Score: ${this.score}`,
            x: 200,
            y: 150,
            font: '24px Arial',
            color: '#FFFFFF',
            align: 'center'
        });
        
        // Yıldızlar
        const starsPanel = new Panel({
            x: 100,
            y: 200,
            width: 200,
            height: 50,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            cornerRadius: 10
        });
        
        // Yıldızları ekle
        for (let i = 0; i < 3; i++) {
            const star = new Image({
                x: 50 + i * 50,
                y: 25,
                width: 40,
                height: 40,
                source: i < this.stars ? 'star_filled.png' : 'star_empty.png'
            });
            
            starsPanel.addChild(star);
        }
        
        // Sonraki seviye düğmesi
        const nextLevelButton = new Button({
            x: 100,
            y: 280,
            width: 200,
            height: 50,
            text: 'NEXT LEVEL',
            backgroundColor: '#4CAF50',
            hoverBackgroundColor: '#66BB6A',
            pressedBackgroundColor: '#388E3C',
            onClick: () => {
                if (this.onNextLevel) {
                    this.onNextLevel();
                }
            }
        });
        
        // Ana menü düğmesi
        const menuButton = new Button({
            x: 100,
            y: 340,
            width: 200,
            height: 50,
            text: 'MAIN MENU',
            backgroundColor: '#2196F3',
            hoverBackgroundColor: '#42A5F5',
            pressedBackgroundColor: '#1976D2',
            onClick: () => {
                if (this.onMainMenu) {
                    this.onMainMenu();
                }
            }
        });
        
        // Bileşenleri panele ekle
        levelCompletePanel.addChild(titleText);
        levelCompletePanel.addChild(levelText);
        levelCompletePanel.addChild(scoreText);
        levelCompletePanel.addChild(starsPanel);
        levelCompletePanel.addChild(nextLevelButton);
        levelCompletePanel.addChild(menuButton);
        
        // Paneli UI'a ekle
        this.ui.addComponent(levelCompletePanel);
        
        // Arkaplan oluştur
        this._createBackground();
        
        // Ses çal
        const audio = Audio.getInstance();
        audio.playSound('levelComplete');
    }
    
    /**
     * Arkaplan oluştur
     */
    _createBackground() {
        // Arkaplan nesnesi
        const bg = new GameObject('Background');
        
        // Arkaplan çizimi için özel bir component ekle
        bg.addComponent(new Component());
        bg.getComponent('Component').render = (renderer) => {
            const ctx = renderer.context;
            const width = renderer.canvas.width;
            const height = renderer.canvas.height;
            
            // Gradient arkaplan
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#4CAF50');
            gradient.addColorStop(1, '#009688');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Konfeti efekti
            const time = Date.now() / 1000;
            
            for (let i = 0; i < 100; i++) {
                const x = (width * i / 100 + time * 50) % width;
                const y = (height * i / 100 + time * 100) % height;
                const size = Math.random() * 10 + 5;
                const hue = (time * 20 + i * 10) % 360;
                
                ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.7)`;
                ctx.fillRect(x, y, size, size);
            }
        };
        
        // Sahneye ekle
        this.addGameObject(bg);
    }
    
    /**
     * Skoru ayarlar
     * @param {Number} score - Skor
     */
    setScore(score) {
        this.score = score;
    }
    
    /**
     * Seviyeyi ayarlar
     * @param {Number} level - Seviye
     */
    setLevel(level) {
        this.level = level;
    }
    
    /**
     * Yıldız sayısını ayarlar
     * @param {Number} stars - Yıldız sayısı (0-3)
     */
    setStars(stars) {
        this.stars = Math.min(3, Math.max(0, stars));
    }
}