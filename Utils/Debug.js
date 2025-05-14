/**
 * Debug.js - Hata ayıklama ve geliştirme araçları
 * Oyun geliştirme sırasında hata ayıklama ve performans analizi sağlar
 */
class Debug {
    constructor(config = {}) {
        // Hata ayıklama yapılandırması
        this.config = Object.assign({
            enabled: false,
            showFPS: false,
            showStats: false,
            showLogs: false,
            logLevel: 'info', // 'debug', 'info', 'warn', 'error', 'none'
            logHistory: 100, // Tutulacak maksimum log sayısı
            overlayPosition: 'top-left', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
            hotkeys: {
                toggle: 'F8',
                fps: 'F9',
                stats: 'F10',
                logs: 'F11'
            },
            profiling: false,
            monitorPerformance: false,
            breakOnError: false,
            inspectMode: false,
            outlineGameObjects: false,
            variables: {} // Özel değişkenleri izlemek için
        }, config);
        
        // Durumlar
        this.isVisible = false;
        this.isProfiling = false;
        
        // İstatistikler
        this.stats = {
            fps: 0,
            frameTime: 0,
            drawCalls: 0,
            activeObjects: 0,
            memory: 0,
            currentScene: '',
            renderTime: 0,
            updateTime: 0,
            physicTime: 0,
            collisions: 0
        };
        
        // Log geçmişi
        this.logs = [];
        
        // Profiler göstergeleri
        this.profiles = {};
        
        // Performans izleme
        this.performanceHistory = {
            fps: [],
            frameTime: [],
            memory: [],
            drawCalls: []
        };
        
        // DOM elementleri
        this.elements = {
            container: null,
            fpsCounter: null,
            statsPanel: null,
            logsPanel: null,
            variablesPanel: null
        };
        
        // Singleton instance
        if (Debug.instance) {
            return Debug.instance;
        }
        Debug.instance = this;
        
        // Başlatma
        this._init();
    }
    
    /**
     * Hata ayıklayıcıyı başlatır
     */
    _init() {
        // Görüntüleme panelini oluştur
        this._createDebugOverlay();
        
        // Olay dinleyicilerini ekle
        this._setupEventListeners();
        
        // Performans izleme başlat
        if (this.config.monitorPerformance) {
            this._startPerformanceMonitoring();
        }
        
        // FPS sayacını başlat
        this._initFpsCounter();
        
        // Hata yakalama
        this._setupErrorHandler();
        
        // Başlangıç durumuna göre görünürlüğü ayarla
        this.isVisible = this.config.enabled;
        this._updateVisibility();
        
        console.log('Debug system initialized');
    }
    
    /**
     * FPS sayacını başlatır
     */
    _initFpsCounter() {
        let lastTime = performance.now();
        let frames = 0;
        
        const updateFPS = () => {
            const now = performance.now();
            frames++;
            
            // Her saniyede bir FPS hesapla
            if (now >= lastTime + 1000) {
                this.stats.fps = Math.round(frames * 1000 / (now - lastTime));
                this.stats.frameTime = now - lastTime > 0 ? (now - lastTime) / frames : 0;
                
                // Performans geçmişini güncelle
                if (this.config.monitorPerformance) {
                    this.performanceHistory.fps.push(this.stats.fps);
                    this.performanceHistory.frameTime.push(this.stats.frameTime);
                    
                    // Maksimum veri noktası sayısını sınırla
                    const maxPoints = 100;
                    if (this.performanceHistory.fps.length > maxPoints) {
                        this.performanceHistory.fps.shift();
                        this.performanceHistory.frameTime.shift();
                    }
                }
                
                // FPS sayacını güncelle
                if (this.elements.fpsCounter) {
                    this.elements.fpsCounter.textContent = `FPS: ${this.stats.fps}`;
                    
                    // Renk kodlaması
                    if (this.stats.fps < 30) {
                        this.elements.fpsCounter.style.color = 'red';
                    } else if (this.stats.fps < 50) {
                        this.elements.fpsCounter.style.color = 'orange';
                    } else {
                        this.elements.fpsCounter.style.color = 'lime';
                    }
                }
                
                frames = 0;
                lastTime = now;
            }
            
            // İstatistik panelini güncelle
            if (this.config.showStats && this.isVisible) {
                this._updateStatsPanel();
            }
            
            requestAnimationFrame(updateFPS);
        };
        
        updateFPS();
    }
    
    /**
     * Hata yakalama kurulumu
     */
    _setupErrorHandler() {
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        const originalConsoleInfo = console.info;
        const originalConsoleLog = console.log;
        
        // Hata yakalama fonksiyonu
        const errorHandler = (event) => {
            const { message, filename, lineno, colno, error } = event;
            this.error(`Uncaught error: ${message}`, { filename, line: lineno, col: colno, stack: error ? error.stack : null });
            
            // Hata durumunda dur
            if (this.config.breakOnError) {
                debugger; // eslint-disable-line no-debugger
            }
            
            return false;
        };
        
        // Beklenmeyen hataları yakala
        window.addEventListener('error', errorHandler);
        
        // Söz hataları
        window.addEventListener('unhandledrejection', (event) => {
            this.error(`Unhandled promise rejection: ${event.reason}`, { reason: event.reason });
            
            if (this.config.breakOnError) {
                debugger; // eslint-disable-line no-debugger
            }
        });
        
        // Console metotlarını override et
        console.error = (...args) => {
            this.error(...args);
            originalConsoleError.apply(console, args);
        };
        
        console.warn = (...args) => {
            this.warn(...args);
            originalConsoleWarn.apply(console, args);
        };
        
        console.info = (...args) => {
            this.info(...args);
            originalConsoleInfo.apply(console, args);
        };
        
        console.log = (...args) => {
            this.log(...args);
            originalConsoleLog.apply(console, args);
        };
    }
    
    /**
     * Hata ayıklama arayüzünü oluşturur
     */
    _createDebugOverlay() {
        // Ana konteyner
        const container = document.createElement('div');
        container.id = 'debug-overlay';
        container.style.cssText = `
            position: fixed;
            ${this._getPositionStyle(this.config.overlayPosition)}
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            display: none;
            max-height: 80vh;
            max-width: 80vw;
            overflow: auto;
            user-select: text;
            border: 1px solid #444;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        `;
        
        // Başlık
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #444;
        `;
        
        const title = document.createElement('div');
        title.textContent = 'DEBUG CONSOLE';
        title.style.fontWeight = 'bold';
        
        const buttons = document.createElement('div');
        buttons.style.cssText = `
            display: flex;
            gap: 5px;
        `;
        
        // FPS sayacı
        const fpsCounter = document.createElement('div');
        fpsCounter.id = 'debug-fps';
        fpsCounter.textContent = 'FPS: 0';
        fpsCounter.style.cssText = `
            color: lime;
            margin-bottom: 5px;
            font-weight: bold;
        `;
        
        // İstatistik paneli
        const statsPanel = document.createElement('div');
        statsPanel.id = 'debug-stats';
        statsPanel.style.cssText = `
            margin-bottom: 10px;
            padding: 5px;
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 3px;
            display: ${this.config.showStats ? 'block' : 'none'};
        `;
        
        // Log paneli
        const logsPanel = document.createElement('div');
        logsPanel.id = 'debug-logs';
        logsPanel.style.cssText = `
            max-height: 200px;
            overflow-y: auto;
            padding: 5px;
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 3px;
            margin-bottom: 10px;
            display: ${this.config.showLogs ? 'block' : 'none'};
        `;
        
        // Değişken izleme paneli
        const variablesPanel = document.createElement('div');
        variablesPanel.id = 'debug-variables';
        variablesPanel.style.cssText = `
            padding: 5px;
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 3px;
        `;
        
        // Butonları oluştur
        const createButton = (text, onClick) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.style.cssText = `
                background-color: #333;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 2px 5px;
                cursor: pointer;
                font-size: 10px;
            `;
            button.onclick = onClick;
            return button;
        };
        
        // Butonları ekle
        buttons.appendChild(createButton('FPS', () => this.toggleFPS()));
        buttons.appendChild(createButton('Stats', () => this.toggleStats()));
        buttons.appendChild(createButton('Logs', () => this.toggleLogs()));
        buttons.appendChild(createButton('Clear', () => this.clearLogs()));
        buttons.appendChild(createButton('Close', () => this.toggle(false)));
        
        // Elementleri bir araya getir
        header.appendChild(title);
        header.appendChild(buttons);
        
        container.appendChild(header);
        container.appendChild(fpsCounter);
        container.appendChild(statsPanel);
        container.appendChild(logsPanel);
        container.appendChild(variablesPanel);
        
        document.body.appendChild(container);
        
        // Referansları sakla
        this.elements.container = container;
        this.elements.fpsCounter = fpsCounter;
        this.elements.statsPanel = statsPanel;
        this.elements.logsPanel = logsPanel;
        this.elements.variablesPanel = variablesPanel;
    }
    
    /**
     * Panel konumunu hesaplar
     */
    _getPositionStyle(position) {
        switch (position) {
            case 'top-right':
                return 'top: 10px; right: 10px;';
            case 'bottom-left':
                return 'bottom: 10px; left: 10px;';
            case 'bottom-right':
                return 'bottom: 10px; right: 10px;';
            case 'top-left':
            default:
                return 'top: 10px; left: 10px;';
        }
    }
    
    /**
     * Olay dinleyicilerini kurar
     */
    _setupEventListeners() {
        // Klavye kısayolları
        window.addEventListener('keydown', (e) => {
            const { hotkeys } = this.config;
            
            // Ana toggle
            if (e.key === hotkeys.toggle) {
                this.toggle();
                e.preventDefault();
            }
            
            // FPS toggle
            if (e.key === hotkeys.fps) {
                this.toggleFPS();
                e.preventDefault();
            }
            
            // Stats toggle
            if (e.key === hotkeys.stats) {
                this.toggleStats();
                e.preventDefault();
            }
            
            // Logs toggle
            if (e.key === hotkeys.logs) {
                this.toggleLogs();
                e.preventDefault();
            }
        });
    }
    
    /**
     * Performans izlemeyi başlatır
     */
    _startPerformanceMonitoring() {
        const sampleInterval = 1000; // 1 saniye
        
        setInterval(() => {
            // Bellek kullanımı
            if (window.performance && window.performance.memory) {
                this.stats.memory = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
                this.performanceHistory.memory.push(this.stats.memory);
                
                if (this.performanceHistory.memory.length > 100) {
                    this.performanceHistory.memory.shift();
                }
            }
            
            // Draw calls
            this.performanceHistory.drawCalls.push(this.stats.drawCalls);
            if (this.performanceHistory.drawCalls.length > 100) {
                this.performanceHistory.drawCalls.shift();
            }
        }, sampleInterval);
    }
    
    /**
     * İstatistik panelini günceller
     */
    _updateStatsPanel() {
        if (!this.elements.statsPanel) return;
        
        const stats = [];
        
        // Temel istatistikler
        stats.push(`FPS: ${this.stats.fps}`);
        stats.push(`Frame Time: ${this.stats.frameTime.toFixed(2)} ms`);
        
        // Render istatistikleri
        stats.push(`Draw Calls: ${this.stats.drawCalls}`);
        stats.push(`Render Time: ${this.stats.renderTime.toFixed(2)} ms`);
        stats.push(`Update Time: ${this.stats.updateTime.toFixed(2)} ms`);
        stats.push(`Physics Time: ${this.stats.physicTime.toFixed(2)} ms`);
        
        // Bellek kullanımı
        if (this.stats.memory > 0) {
            stats.push(`Memory: ${this.stats.memory} MB`);
        }
        
        // Oyun istatistikleri
        stats.push(`Active Objects: ${this.stats.activeObjects}`);
        stats.push(`Collisions: ${this.stats.collisions}`);
        
        // Aktif sahne
        if (this.stats.currentScene) {
            stats.push(`Current Scene: ${this.stats.currentScene}`);
        }
        
        this.elements.statsPanel.innerHTML = stats.join('<br>');
    }
    
    /**
     * Değişken izleme panelini günceller
     */
    _updateVariablesPanel() {
        if (!this.elements.variablesPanel) return;
        
        const vars = [];
        
        // Kaydedilen değişkenleri listele
        for (const [key, value] of Object.entries(this.config.variables)) {
            const strValue = this._formatValue(value);
            vars.push(`<b>${key}:</b> ${strValue}`);
        }
        
        this.elements.variablesPanel.innerHTML = vars.length > 0 ? vars.join('<br>') : '<i>No variables to watch</i>';
    }
    
    /**
     * Logları günceller
     */
    _updateLogsPanel() {
        if (!this.elements.logsPanel) return;
        
        // Log HTML'ini oluştur
        const logHTML = this.logs.map(log => {
            const timestamp = log.timestamp.toISOString().split('T')[1].slice(0, -1);
            const levelClass = `log-${log.level}`;
            
            return `<div class="${levelClass}">
                <span class="log-time">[${timestamp}]</span>
                <span class="log-level">[${log.level.toUpperCase()}]</span>
                <span class="log-message">${this._formatLogMessage(log.message)}</span>
            </div>`;
        }).join('');
        
        // Log CSS'i
        const logStyles = `
            <style>
                .log-debug { color: #9e9e9e; }
                .log-info { color: #64b5f6; }
                .log-warn { color: #ffd54f; }
                .log-error { color: #e57373; }
                .log-time { opacity: 0.7; margin-right: 5px; }
                .log-level { font-weight: bold; margin-right: 5px; }
                .log-message { white-space: pre-wrap; word-break: break-word; }
            </style>
        `;
        
        this.elements.logsPanel.innerHTML = logStyles + logHTML;
        
        // Otomatik kaydırma
        this.elements.logsPanel.scrollTop = this.elements.logsPanel.scrollHeight;
    }
    
    /**
     * Değeri formatlar
     * @param {*} value - Formatlanacak değer
     * @return {String} Formatlanmış değer
     */
    _formatValue(value) {
        if (value === null) {
            return '<span style="color: #777;">null</span>';
        }
        
        if (value === undefined) {
            return '<span style="color: #777;">undefined</span>';
        }
        
        if (typeof value === 'number') {
            return `<span style="color: #64b5f6;">${value}</span>`;
        }
        
        if (typeof value === 'boolean') {
            return `<span style="color: #ffd54f;">${value}</span>`;
        }
        
        if (typeof value === 'string') {
            return `<span style="color: #81c784;">"${value}"</span>`;
        }
        
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return '[]';
            }
            
            if (value.length <= 3) {
                return `[${value.map(v => this._formatValue(v)).join(', ')}]`;
            }
            
            return `Array(${value.length})`;
        }
        
        if (typeof value === 'object') {
            // Kısaltılmış nesne gösterimi
            const constructor = value.constructor ? value.constructor.name : 'Object';
            
            if (constructor !== 'Object') {
                return `${constructor}{}`;
            }
            
            const keys = Object.keys(value);
            if (keys.length === 0) {
                return '{}';
            }
            
            if (keys.length <= 3) {
                const props = keys.map(k => `${k}: ${this._formatValue(value[k])}`).join(', ');
                return `{${props}}`;
            }
            
            return `Object{${keys.length} properties}`;
        }
        
        if (typeof value === 'function') {
            return '<span style="color: #9e9e9e;">function</span>';
        }
        
        return String(value);
    }
    
    /**
     * Log mesajını formatlar
     * @param {*} message - Log mesajı
     * @return {String} Formatlanmış mesaj
     */
    _formatLogMessage(message) {
        if (typeof message === 'string') {
            return message;
        }
        
        try {
            return JSON.stringify(message, null, 2);
        } catch (e) {
            return String(message);
        }
    }
    
    /**
     * Görünürlüğü günceller
     */
    _updateVisibility() {
        if (!this.elements.container) return;
        
        this.elements.container.style.display = this.isVisible ? 'block' : 'none';
        
        if (this.isVisible) {
            this._updateStatsPanel();
            this._updateLogsPanel();
            this._updateVariablesPanel();
        }
    }
    
    /**
     * Debug panelini açar/kapatır
     * @param {Boolean} visible - Görünürlük durumu
     */
    toggle(visible = !this.isVisible) {
        this.isVisible = visible;
        this._updateVisibility();
        return this.isVisible;
    }
    
    /**
     * FPS sayacını açar/kapatır
     * @param {Boolean} visible - Görünürlük durumu
     */
    toggleFPS(visible = !this.config.showFPS) {
        this.config.showFPS = visible;
        
        if (this.elements.fpsCounter) {
            this.elements.fpsCounter.style.display = this.config.showFPS ? 'block' : 'none';
        }
        
        return this.config.showFPS;
    }
    
    /**
     * İstatistik panelini açar/kapatır
     * @param {Boolean} visible - Görünürlük durumu
     */
    toggleStats(visible = !this.config.showStats) {
        this.config.showStats = visible;
        
        if (this.elements.statsPanel) {
            this.elements.statsPanel.style.display = this.config.showStats ? 'block' : 'none';
        }
        
        return this.config.showStats;
    }
    
    /**
     * Log panelini açar/kapatır
     * @param {Boolean} visible - Görünürlük durumu
     */
    toggleLogs(visible = !this.config.showLogs) {
        this.config.showLogs = visible;
        
        if (this.elements.logsPanel) {
            this.elements.logsPanel.style.display = this.config.showLogs ? 'block' : 'none';
        }
        
        return this.config.showLogs;
    }
    
    /**
     * Logları temizler
     */
    clearLogs() {
        this.logs = [];
        this._updateLogsPanel();
    }
    
    /**
     * İstatistikleri günceller
     * @param {Object} stats - İstatistik değerleri
     */
    updateStats(stats) {
        Object.assign(this.stats, stats);
        
        if (this.config.showStats && this.isVisible) {
            this._updateStatsPanel();
        }
    }
    
    /**
     * Değişken izlemeyi günceller
     * @param {String} name - Değişken adı
     * @param {*} value - Değişken değeri
     */
    watchVariable(name, value) {
        this.config.variables[name] = value;
        
        if (this.isVisible) {
            this._updateVariablesPanel();
        }
    }
    
    /**
     * Değişken izlemeyi kaldırır
     * @param {String} name - Değişken adı
     */
    unwatchVariable(name) {
        delete this.config.variables[name];
        
        if (this.isVisible) {
            this._updateVariablesPanel();
        }
    }
    
    /**
     * Profil ölçümünü başlatır
     * @param {String} name - Profil adı
     */
    profileStart(name) {
        if (!this.config.profiling) return;
        
        this.profiles[name] = {
            startTime: performance.now(),
            endTime: null,
            duration: 0
        };
    }
    
    /**
     * Profil ölçümünü bitirir
     * @param {String} name - Profil adı
     * @return {Number} Geçen süre (ms)
     */
    profileEnd(name) {
        if (!this.config.profiling || !this.profiles[name]) return 0;
        
        const profile = this.profiles[name];
        profile.endTime = performance.now();
        profile.duration = profile.endTime - profile.startTime;
        
        // Profil durumunu güncelle
        switch (name) {
            case 'render':
                this.stats.renderTime = profile.duration;
                break;
            case 'update':
                this.stats.updateTime = profile.duration;
                break;
            case 'physics':
                this.stats.physicTime = profile.duration;
                break;
        }
        
        return profile.duration;
    }
    
    /**
     * Debug log ekler
     * @param {*} message - Log mesajı
     * @param {Object} context - Log bağlamı
     */
    debug(message, context = {}) {
        this._addLog('debug', message, context);
    }
    
    /**
     * Bilgi logu ekler
     * @param {*} message - Log mesajı
     * @param {Object} context - Log bağlamı
     */
    log(message, context = {}) {
        this._addLog('info', message, context);
    }
    
    /**
     * Bilgi logu ekler
     * @param {*} message - Log mesajı
     * @param {Object} context - Log bağlamı
     */
    info(message, context = {}) {
        this._addLog('info', message, context);
    }
    
    /**
     * Uyarı logu ekler
     * @param {*} message - Log mesajı
     * @param {Object} context - Log bağlamı
     */
    warn(message, context = {}) {
        this._addLog('warn', message, context);
    }
    
    /**
     * Hata logu ekler
     * @param {*} message - Log mesajı
     * @param {Object} context - Log bağlamı
     */
    error(message, context = {}) {
        this._addLog('error', message, context);
    }
    
    /**
     * Log ekler
     * @param {String} level - Log seviyesi
     * @param {*} message - Log mesajı
     * @param {Object} context - Log bağlamı
     */
    _addLog(level, message, context = {}) {
        // Log seviyesi kontrolü
        const logLevels = { debug: 0, info: 1, warn: 2, error: 3, none: 4 };
        if (logLevels[level] < logLevels[this.config.logLevel]) {
            return;
        }
        
        // Mesaj formatı
        let formattedMessage = message;
        
        // Nesne ise JSON formatına dönüştür
        if (typeof message === 'object' && message !== null) {
            try {
                formattedMessage = JSON.stringify(message, null, 2);
            } catch (e) {
                formattedMessage = String(message);
            }
        }
        
        // Kontekst varsa ekle
        if (Object.keys(context).length > 0) {
            if (typeof formattedMessage === 'string') {
                formattedMessage += '\n' + JSON.stringify(context, null, 2);
            }
        }
        
        // Log kaydı
        const log = {
            level,
            message: formattedMessage,
            timestamp: new Date(),
            context
        };
        
        // Loga ekle
        this.logs.push(log);
        
        // Log geçmişi sınırı
        if (this.logs.length > this.config.logHistory) {
            this.logs.shift();
        }
        
        // Log panelini güncelle
        if (this.config.showLogs && this.isVisible) {
            this._updateLogsPanel();
        }
    }
    
    /**
     * Oyun nesnesini vurgular
     * @param {GameObject} gameObject - Vurgulanacak oyun nesnesi
     * @param {Number} duration - Vurgulama süresi (ms)
     */
    highlightGameObject(gameObject, duration = 1000) {
        if (!this.config.outlineGameObjects || !gameObject) return;
        
        // Orijinal değerleri sakla
        const originalAlpha = gameObject.alpha || 1;
        const originalScale = gameObject.scale ? { x: gameObject.scale.x, y: gameObject.scale.y } : { x: 1, y: 1 };
        
        // Vurgulama efekti
        const pulseEffect = () => {
            // Alpha değerini değiştir
            if (gameObject.alpha !== undefined) {
                gameObject.alpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
            }
            
            // Ölçeği değiştir
            if (gameObject.scale) {
                const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
                gameObject.scale.x = originalScale.x * pulse;
                gameObject.scale.y = originalScale.y * pulse;
            }
            
            // Efekt devam ediyor mu
            if (Date.now() < endTime) {
                requestAnimationFrame(pulseEffect);
            } else {
                // Orijinal değerlere geri dön
                if (gameObject.alpha !== undefined) {
                    gameObject.alpha = originalAlpha;
                }
                
                if (gameObject.scale) {
                    gameObject.scale.x = originalScale.x;
                    gameObject.scale.y = originalScale.y;
                }
            }
        };
        
        // Efekt bitiş zamanı
        const endTime = Date.now() + duration;
        
        // Efekti başlat
        pulseEffect();
    }
    
    /**
     * Performans grafiğini gösterir
     * @param {String} type - Grafik tipi ('fps', 'frameTime', 'memory', 'drawCalls')
     */
    showPerformanceGraph(type = 'fps') {
        if (!this.config.monitorPerformance) {
            console.warn('Performance monitoring is disabled');
            return;
        }
        
        // Grafik verisini al
        const data = this.performanceHistory[type];
        if (!data || data.length === 0) {
            console.warn(`No performance data for ${type}`);
            return;
        }
        
        // Mevcut grafiği kaldır
        const existingGraph = document.getElementById('debug-performance-graph');
        if (existingGraph) {
            existingGraph.remove();
        }
        
        // Grafik konteyneri
        const container = document.createElement('div');
        container.id = 'debug-performance-graph';
        container.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            border: 1px solid #444;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
            width: 300px;
            height: 150px;
        `;
        
        // Başlık
        const title = document.createElement('div');
        title.textContent = `${type.toUpperCase()} Graph`;
        title.style.cssText = `
            margin-bottom: 5px;
            font-family: monospace;
            font-size: 12px;
            color: white;
            text-align: center;
        `;
        
        // Grafik tuval
        const canvas = document.createElement('canvas');
        canvas.width = 280;
        canvas.height = 100;
        canvas.style.cssText = `
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 3px;
        `;
        
        // Kapat butonu
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background-color: transparent;
            color: white;
            border: none;
            font-size: 14px;
            cursor: pointer;
        `;
        closeButton.onclick = () => container.remove();
        
        // DOM'a ekle
        container.appendChild(title);
        container.appendChild(canvas);
        container.appendChild(closeButton);
        document.body.appendChild(container);
        
        // Grafiği çiz
        this._drawPerformanceGraph(canvas, data, type);
    }
    
    /**
     * Performans grafiğini çizer
     * @param {HTMLCanvasElement} canvas - Canvas elementi
     * @param {Array} data - Grafik verisi
     * @param {String} type - Grafik tipi
     */
    _drawPerformanceGraph(canvas, data, type) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 5;
        
        // Arkaplanı temizle
        ctx.clearRect(0, 0, width, height);
        
        // Veri yoksa
        if (data.length === 0) return;
        
        // Grafik sınırlarını belirle
        let min = Infinity;
        let max = -Infinity;
        
        for (const value of data) {
            min = Math.min(min, value);
            max = Math.max(max, value);
        }
        
        // Minimum değer 0'dan küçük olmamalı
        min = Math.max(0, min);
        
        // Minimum ve maksimum arasında çok az fark varsa, sınırları ayarla
        if (max - min < 1) {
            min = max - 1;
        }
        
        // Marjin ekle
        const range = max - min;
        min -= range * 0.1;
        max += range * 0.1;
        
        // Çizim alanı
        const drawWidth = width - padding * 2;
        const drawHeight = height - padding * 2;
        
        // Çizgileri çiz
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        
        // Yatay çizgiler
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const y = padding + (drawHeight * i / 4);
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
        }
        ctx.stroke();
        
        // Dikey çizgiler
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const x = padding + (drawWidth * i / 4);
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
        }
        ctx.stroke();
        
        // Değerleri çiz
        ctx.fillStyle = 'white';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        
        for (let i = 0; i < 5; i++) {
            const value = max - (max - min) * i / 4;
            const y = padding + (drawHeight * i / 4);
            ctx.fillText(value.toFixed(1), padding - 2, y + 3);
        }
        
        // Grafik rengi
        let color;
        switch (type) {
            case 'fps':
                color = '#4CAF50'; // Yeşil
                break;
            case 'frameTime':
                color = '#2196F3'; // Mavi
                break;
            case 'memory':
                color = '#F44336'; // Kırmızı
                break;
            case 'drawCalls':
                color = '#FF9800'; // Turuncu
                break;
            default:
                color = '#FFFFFF'; // Beyaz
        }
        
        // Veri çizgisini çiz
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < data.length; i++) {
            const x = padding + (drawWidth * i / (data.length - 1));
            const y = padding + drawHeight - (drawHeight * (data[i] - min) / (max - min));
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!Debug.instance) {
            new Debug();
        }
        return Debug.instance;
    }
}

// Singleton instance
Debug.instance = null;