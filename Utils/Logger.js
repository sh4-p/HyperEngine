/**
 * Logger.js - Loglama sistemi
 * Oyun içi olayları ve hataları loglar
 */
class Logger {
    constructor(config = {}) {
        // Loglama yapılandırması
        this.config = Object.assign({
            enabled: true,
            level: 'info', // 'debug', 'info', 'warn', 'error', 'none'
            logToConsole: true,
            logToMemory: true,
            logToFile: false,
            logToServer: false,
            maxLogEntries: 1000,
            formatOutput: true,
            showTimestamp: true,
            showLevel: true,
            timestampFormat: 'HH:mm:ss.SSS',
            groupSimilar: true,
            serverUrl: null,
            serverBatchSize: 50,
            serverBatchInterval: 30000, // 30 saniye
            filePrefix: 'game-log',
            showSource: false,
            autoLogPerformance: false,
            performanceInterval: 60000, // 60 saniye
            performanceMetrics: ['fps', 'memory', 'network'],
            automaticBreadcrumbs: true,
            breadcrumbsLimit: 100,
            filterFunctions: []
        }, config);
        
        // Log seviyeleri
        this.LEVELS = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            none: 4
        };
        
        // Log geçmişi
        this.logs = [];
        this.breadcrumbs = [];
        
        // Gruplandırılmış loglar için
        this.groupedLogs = {};
        this.recentGroupedLogs = {};
        
        // Sunucu loglama kuyruğu
        this.serverQueue = [];
        this.sendingToServer = false;
        
        // Performans loglama zamanlayıcısı
        this.performanceTimer = null;
        
        // Singleton instance
        if (Logger.instance) {
            return Logger.instance;
        }
        Logger.instance = this;
        
        // Otomatik performans loglamasını başlat
        if (this.config.autoLogPerformance) {
            this._startPerformanceLogging();
        }
        
        // Hata yakalama
        this._setupErrorHandling();
        
        // Sunucu loglaması için zamanlayıcı
        if (this.config.logToServer && this.config.serverUrl) {
            this._setupServerLogging();
        }
        
        // Filtre fonksiyonları
        this._setupFilters();
    }
    
    /**
     * Filtre fonksiyonlarını ayarlar
     */
    _setupFilters() {
        // Varsayılan filtreler
        const defaultFilters = [
            // Hassas bilgileri maskele
            log => {
                if (typeof log.message === 'string') {
                    // Kredi kartı numaralarını maskele
                    log.message = log.message.replace(/\b(?:\d{4}[ -]?){3}(?:\d{4})\b/g, '****-****-****-****');
                    
                    // E-posta adreslerini maskele
                    log.message = log.message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]');
                    
                    // Token'ları maskele
                    log.message = log.message.replace(/\b(api[-_]?key|token|secret|password|pwd)[:=]\s*["']?([^"']+)["']?/gi, '$1: [REDACTED]');
                }
                return log;
            }
        ];
        
        // Varsayılan filtreleri ekle
        this.config.filterFunctions = [...defaultFilters, ...this.config.filterFunctions];
    }
    
    /**
     * Hata yakalama kurulumu
     */
    _setupErrorHandling() {
        // Yakalanmamış hataları dinle
        window.addEventListener('error', (event) => {
            const { message, filename, lineno, colno, error } = event;
            this.error('Uncaught error', {
                message,
                source: filename,
                line: lineno,
                column: colno,
                stack: error ? error.stack : null
            });
        });
        
        // Yakalanmamış söz hataları
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled promise rejection', {
                reason: event.reason
            });
        });
    }
    
    /**
     * Sunucu loglaması kurulumu
     */
    _setupServerLogging() {
        // Periyodik olarak logları sunucuya gönder
        setInterval(() => {
            this._sendLogsToServer();
        }, this.config.serverBatchInterval);
    }
    
    /**
     * Timestamp formatlar
     * @param {Date} date - Tarih
     * @return {String} Formatlanmış timestamp
     */
    _formatTimestamp(date) {
        const format = this.config.timestampFormat;
        
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return format
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds)
            .replace('SSS', milliseconds)
            .replace('DD', day)
            .replace('MM', month)
            .replace('YYYY', year);
    }
    
    /**
     * Log seviyesini kontrol eder
     * @param {String} level - Kontrol edilecek seviye
     * @return {Boolean} Loglama yapılmalı mı
     */
    _shouldLog(level) {
        return this.config.enabled && this.LEVELS[level] >= this.LEVELS[this.config.level];
    }
    
    /**
     * Otomatik performans loglamasını başlatır
     */
    _startPerformanceLogging() {
        if (this.performanceTimer) {
            clearInterval(this.performanceTimer);
        }
        
        this.performanceTimer = setInterval(() => {
            const metrics = {};
            
            if (this.config.performanceMetrics.includes('fps') && window.performance) {
                // FPS hesapla
                const fpsSamples = [];
                let lastTime = performance.now();
                let frame = 0;
                
                const calculateFps = () => {
                    const now = performance.now();
                    frame++;
                    
                    if (now > lastTime + 1000) {
                        const fps = Math.round((frame * 1000) / (now - lastTime));
                        fpsSamples.push(fps);
                        lastTime = now;
                        frame = 0;
                        
                        if (fpsSamples.length >= 10) {
                            const avgFps = Math.round(fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length);
                            metrics.fps = avgFps;
                            this.info('Performance: FPS', { fps: avgFps });
                            window.cancelAnimationFrame(rafId);
                        } else {
                            rafId = window.requestAnimationFrame(calculateFps);
                        }
                    } else {
                        rafId = window.requestAnimationFrame(calculateFps);
                    }
                };
                
                let rafId = window.requestAnimationFrame(calculateFps);
            }
            
            if (this.config.performanceMetrics.includes('memory') && window.performance && window.performance.memory) {
                metrics.memory = {
                    usedJSHeapSize: Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)),
                    totalJSHeapSize: Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024)),
                    jsHeapSizeLimit: Math.round(window.performance.memory.jsHeapSizeLimit / (1024 * 1024))
                };
                
                this.info('Performance: Memory', metrics.memory);
            }
            
            if (this.config.performanceMetrics.includes('network') && navigator.connection) {
                metrics.network = {
                    downlink: navigator.connection.downlink,
                    effectiveType: navigator.connection.effectiveType,
                    rtt: navigator.connection.rtt,
                    saveData: navigator.connection.saveData
                };
                
                this.info('Performance: Network', metrics.network);
            }
        }, this.config.performanceInterval);
    }
    
    /**
     * Tek bir log kaydı oluşturur
     * @param {String} level - Log seviyesi
     * @param {String} message - Log mesajı
     * @param {Object} data - İlave log verileri
     * @return {Object} Log kaydı
     */
    _createLogEntry(level, message, data = {}) {
        const timestamp = new Date();
        
        // Mesajı formatla
        let formattedMessage = message;
        
        // Nesne veya dizi ise stringe dönüştür
        if (typeof message === 'object' && message !== null) {
            try {
                formattedMessage = JSON.stringify(message);
            } catch (e) {
                formattedMessage = String(message);
            }
        }
        
        // Log kaydı oluştur
        let logEntry = {
            level,
            message: formattedMessage,
            timestamp,
            data
        };
        
        // Kaynak bilgisini ekle
        if (this.config.showSource) {
            const stackTrace = this._getStackTrace();
            if (stackTrace.length > 2) {
                const caller = stackTrace[2]; // [0] Error, [1] _createLogEntry, [2] asıl çağıran
                
                if (caller) {
                    logEntry.source = {
                        file: caller.fileName,
                        line: caller.lineNumber,
                        column: caller.columnNumber,
                        function: caller.functionName || '(anonymous)'
                    };
                }
            }
        }
        
        // Filtrelerden geçir
        for (const filter of this.config.filterFunctions) {
            logEntry = filter(logEntry) || logEntry;
        }
        
        return logEntry;
    }
    
    /**
     * Stack trace alır
     * @return {Array} Stack trace dizisi
     */
    _getStackTrace() {
        try {
            throw new Error();
        } catch (e) {
            // stack trace'i parse et
            const stackLines = e.stack.split('\n');
            const stackInfo = [];
            
            for (let i = 1; i < stackLines.length; i++) {
                const line = stackLines[i].trim();
                const matches = line.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) ||
                               line.match(/at\s+(.*):(\d+):(\d+)/) ||
                               line.match(/at\s+(.*)/);
                
                if (matches) {
                    if (matches.length === 5) {
                        stackInfo.push({
                            functionName: matches[1],
                            fileName: matches[2],
                            lineNumber: parseInt(matches[3], 10),
                            columnNumber: parseInt(matches[4], 10)
                        });
                    } else if (matches.length === 4) {
                        stackInfo.push({
                            functionName: null, // Anonim fonksiyon
                            fileName: matches[1],
                            lineNumber: parseInt(matches[2], 10),
                            columnNumber: parseInt(matches[3], 10)
                        });
                    } else {
                        stackInfo.push({
                            functionName: matches[1],
                            fileName: null,
                            lineNumber: null,
                            columnNumber: null
                        });
                    }
                }
            }
            
            return stackInfo;
        }
    }
    
    /**
     * Log kaydını işler
     * @param {Object} logEntry - Log kaydı
     */
    _processLogEntry(logEntry) {
        // Konsola yazdır
        if (this.config.logToConsole) {
            this._writeToConsole(logEntry);
        }
        
        // Belleğe kaydet
        if (this.config.logToMemory) {
            this._writeToMemory(logEntry);
        }
        
        // Dosyaya kaydet
        if (this.config.logToFile) {
            this._writeToFile(logEntry);
        }
        
        // Sunucuya gönder
        if (this.config.logToServer && this.config.serverUrl) {
            this._addToServerQueue(logEntry);
        }
    }
    
    /**
     * Log kaydını konsola yazdırır
     * @param {Object} logEntry - Log kaydı
     */
    _writeToConsole(logEntry) {
        if (!this.config.formatOutput) {
            // Basit çıktı
            console[logEntry.level](logEntry.message, logEntry.data);
            return;
        }
        
        // Biçimlendirilmiş çıktı
        let prefix = '';
        
        // Timestamp ekle
        if (this.config.showTimestamp) {
            prefix += `[${this._formatTimestamp(logEntry.timestamp)}] `;
        }
        
        // Seviye ekle
        if (this.config.showLevel) {
            const levelMap = {
                debug: '🐛 DEBUG',
                info: 'ℹ️ INFO',
                warn: '⚠️ WARN',
                error: '🔴 ERROR'
            };
            
            prefix += `[${levelMap[logEntry.level] || logEntry.level.toUpperCase()}] `;
        }
        
        // Mesajı ekle
        const message = prefix + logEntry.message;
        
        // İlave veriler
        const data = Object.keys(logEntry.data).length > 0 ? logEntry.data : null;
        
        // Konsola yazdır
        switch (logEntry.level) {
            case 'debug':
                console.debug(message, data);
                break;
            case 'info':
                console.info(message, data);
                break;
            case 'warn':
                console.warn(message, data);
                break;
            case 'error':
                console.error(message, data);
                break;
            default:
                console.log(message, data);
        }
    }
    
    /**
     * Log kaydını belleğe kaydeder
     * @param {Object} logEntry - Log kaydı
     */
    _writeToMemory(logEntry) {
        // Benzer logları grupla
        if (this.config.groupSimilar) {
            const key = `${logEntry.level}:${logEntry.message}`;
            
            if (this.groupedLogs[key]) {
                // Bu log daha önce görülmüş
                this.groupedLogs[key].count++;
                this.groupedLogs[key].lastTimestamp = logEntry.timestamp;
                
                // Son veriyi güncelle
                if (Object.keys(logEntry.data).length > 0) {
                    this.groupedLogs[key].data = logEntry.data;
                }
                
                // Son görülen zamanı güncelle
                this.recentGroupedLogs[key] = true;
                return;
            }
            
            // Yeni gruplanmış log
            this.groupedLogs[key] = {
                level: logEntry.level,
                message: logEntry.message,
                firstTimestamp: logEntry.timestamp,
                lastTimestamp: logEntry.timestamp,
                count: 1,
                data: logEntry.data
            };
            
            this.recentGroupedLogs[key] = true;
        }
        
        // Belleğe kaydet
        this.logs.push(logEntry);
        
        // Maksimum log sayısını aşarsa, en eskisini sil
        if (this.logs.length > this.config.maxLogEntries) {
            this.logs.shift();
        }
    }
    
    /**
     * Log kaydını dosyaya kaydeder
     * @param {Object} logEntry - Log kaydı
     */
    _writeToFile(logEntry) {
        // HTML5 File API veya Cordova File eklentisi yoksa
        if (typeof cordova === 'undefined' || !cordova.file) {
            this.warn('File logging is enabled but File API is not available');
            return;
        }
        
        try {
            // Log dosyası adı
            const date = new Date();
            const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            const fileName = `${this.config.filePrefix}-${dateStr}.log`;
            
            // Log satırı oluştur
            let logLine = '';
            
            if (this.config.showTimestamp) {
                logLine += `[${this._formatTimestamp(logEntry.timestamp)}] `;
            }
            
            if (this.config.showLevel) {
                logLine += `[${logEntry.level.toUpperCase()}] `;
            }
            
            logLine += logEntry.message;
            
            if (Object.keys(logEntry.data).length > 0) {
                logLine += ` ${JSON.stringify(logEntry.data)}`;
            }
            
            logLine += '\n';
            
            // Dosyaya ekle
            cordova.file.writeFile(
                cordova.file.dataDirectory,
                fileName,
                logLine,
                { append: true },
                () => {}, // Başarı callback'i
                error => this.warn('Failed to write to log file', { error })
            );
        } catch (error) {
            this.warn('Error writing to log file', { error });
        }
    }
    
    /**
     * Log kaydını sunucu kuyruğuna ekler
     * @param {Object} logEntry - Log kaydı
     */
    _addToServerQueue(logEntry) {
        this.serverQueue.push(logEntry);
        
        // Kuyruk maksimum boyuta ulaştıysa, hemen gönder
        if (this.serverQueue.length >= this.config.serverBatchSize) {
            this._sendLogsToServer();
        }
    }
    
    /**
     * Sunucu kuyruğundaki logları sunucuya gönderir
     */
    _sendLogsToServer() {
        // Gönderim devam ediyorsa veya kuyruk boşsa
        if (this.sendingToServer || this.serverQueue.length === 0) {
            return;
        }
        
        this.sendingToServer = true;
        
        // Kuyruktaki logları al
        const logs = this.serverQueue.splice(0, this.config.serverBatchSize);
        
        // Sunucuya gönder
        fetch(this.config.serverUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                logs,
                timestamp: new Date().toISOString(),
                appVersion: this._getAppVersion()
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server response: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            this.warn('Failed to send logs to server', { error });
            
            // Başarısız logları tekrar kuyruğa ekle
            this.serverQueue.unshift(...logs);
        })
        .finally(() => {
            this.sendingToServer = false;
        });
    }
    
    /**
     * Uygulama versiyonunu alır
     * @return {String} Uygulama versiyonu
     */
    _getAppVersion() {
        // Eğer meta etiketi mevcutsa
        const metaVersion = document.querySelector('meta[name="app-version"]');
        if (metaVersion) {
            return metaVersion.getAttribute('content');
        }
        
        // Game sınıfı mevcutsa
        if (typeof Game !== 'undefined' && Game.getInstance && Game.getInstance().config) {
            return Game.getInstance().config.version || '1.0.0';
        }
        
        return '1.0.0';
    }
    
    /**
     * Ekmek kırıntısı (breadcrumb) ekler
     * @param {String} category - Kategori
     * @param {String} message - Mesaj
     * @param {Object} data - İlave veriler
     */
    addBreadcrumb(category, message, data = {}) {
        if (!this.config.automaticBreadcrumbs) {
            return;
        }
        
        const breadcrumb = {
            category,
            message,
            timestamp: new Date(),
            data
        };
        
        this.breadcrumbs.push(breadcrumb);
        
        // Maksimum sayıyı aşarsa, en eskisini sil
        if (this.breadcrumbs.length > this.config.breadcrumbsLimit) {
            this.breadcrumbs.shift();
        }
    }
    
    /**
     * Debug seviyesinde loglama yapar
     * @param {String} message - Log mesajı
     * @param {Object} data - İlave log verileri
     */
    debug(message, data = {}) {
        if (!this._shouldLog('debug')) {
            return;
        }
        
        const logEntry = this._createLogEntry('debug', message, data);
        this._processLogEntry(logEntry);
    }
    
    /**
     * Info seviyesinde loglama yapar
     * @param {String} message - Log mesajı
     * @param {Object} data - İlave log verileri
     */
    info(message, data = {}) {
        if (!this._shouldLog('info')) {
            return;
        }
        
        const logEntry = this._createLogEntry('info', message, data);
        this._processLogEntry(logEntry);
    }
    
    /**
     * Warn seviyesinde loglama yapar
     * @param {String} message - Log mesajı
     * @param {Object} data - İlave log verileri
     */
    warn(message, data = {}) {
        if (!this._shouldLog('warn')) {
            return;
        }
        
        const logEntry = this._createLogEntry('warn', message, data);
        this._processLogEntry(logEntry);
    }
    
    /**
     * Error seviyesinde loglama yapar
     * @param {String} message - Log mesajı
     * @param {Object} data - İlave log verileri
     */
    error(message, data = {}) {
        if (!this._shouldLog('error')) {
            return;
        }
        
        const logEntry = this._createLogEntry('error', message, data);
        this._processLogEntry(logEntry);
    }
    
    /**
     * Log geçmişini alır
     * @param {String} level - Belirli bir seviyeye göre filtrele (isteğe bağlı)
     * @param {Number} limit - Maksimum log sayısı (isteğe bağlı)
     * @return {Array} Log geçmişi
     */
    getLogs(level = null, limit = null) {
        let logs = [...this.logs];
        
        // Seviyeye göre filtrele
        if (level) {
            logs = logs.filter(log => log.level === level);
        }
        
        // Sınırlı sayıda log döndür
        if (limit) {
            logs = logs.slice(-limit);
        }
        
        return logs;
    }
    
    /**
     * Gruplandırılmış logları alır
     * @return {Array} Gruplandırılmış loglar
     */
    getGroupedLogs() {
        return Object.values(this.groupedLogs);
    }
    
    /**
     * Log geçmişini temizler
     */
    clearLogs() {
        this.logs = [];
        this.groupedLogs = {};
        this.recentGroupedLogs = {};
        this.breadcrumbs = [];
    }
    
    /**
     * Ekmek kırıntılarını alır
     * @return {Array} Ekmek kırıntıları
     */
    getBreadcrumbs() {
        return [...this.breadcrumbs];
    }
    
    /**
     * Logları JSON formatında dışa aktarır
     * @return {String} JSON formatında loglar
     */
    exportLogsAsJson() {
        return JSON.stringify({
            logs: this.logs,
            groupedLogs: this.groupedLogs,
            breadcrumbs: this.breadcrumbs,
            timestamp: new Date().toISOString(),
            appVersion: this._getAppVersion()
        }, null, 2);
    }
    
    /**
     * Logları dosyaya kaydeder
     * @param {String} filename - Dosya adı
     */
    saveLogsToFile(filename = 'game-logs.json') {
        const json = this.exportLogsAsJson();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Profil ölçümü başlatır
     * @param {String} name - Profil adı
     */
    startProfiler(name) {
        if (!window.performance || !window.performance.now) {
            return;
        }
        
        this.debug(`Profiler started: ${name}`);
        return { name, startTime: performance.now() };
    }
    
    /**
     * Profil ölçümünü bitirir
     * @param {Object} profiler - Profil objesi
     */
    endProfiler(profiler) {
        if (!window.performance || !window.performance.now || !profiler) {
            return;
        }
        
        const endTime = performance.now();
        const duration = endTime - profiler.startTime;
        
        this.debug(`Profiler ended: ${profiler.name}`, { duration: `${duration.toFixed(2)}ms` });
        return duration;
    }
    
    /**
     * Log seviyesini değiştirir
     * @param {String} level - Yeni log seviyesi
     */
    setLevel(level) {
        if (this.LEVELS[level] !== undefined) {
            this.config.level = level;
            this.info(`Log level set to ${level}`);
        } else {
            this.warn(`Invalid log level: ${level}`);
        }
    }
    
    /**
     * Logger'ı etkinleştirir/devre dışı bırakır
     * @param {Boolean} enabled - Etkin mi
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        
        if (enabled) {
            this.info('Logger enabled');
        }
    }
    
    /**
     * Konsol loglamasını etkinleştirir/devre dışı bırakır
     * @param {Boolean} enabled - Etkin mi
     */
    setConsoleLogging(enabled) {
        this.config.logToConsole = enabled;
        this.info(`Console logging ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!Logger.instance) {
            new Logger();
        }
        return Logger.instance;
    }
}

// Singleton instance
Logger.instance = null;