/**
 * PluginManager.js - Eklenti yönetimi
 * Oyun motoruna eklenti entegrasyonunu sağlar
 */
class PluginManager {
    constructor(config = {}) {
        // Eklenti yönetimi yapılandırması
        this.config = Object.assign({
            autoLoad: true, // Otomatik yükleme
            pluginPath: 'plugins/', // Eklenti yolu
            debug: false // Debug modu
        }, config);
        
        // Kayıtlı eklentiler
        this.plugins = {};
        
        // Kategori bazında eklentiler
        this.categories = {};
        
        // Yüklü eklentiler
        this.loaded = {};
        
        // Aktif eklentiler
        this.active = {};
        
        // Olaylar
        this.onPluginLoaded = null;
        this.onPluginUnloaded = null;
        this.onPluginActivated = null;
        this.onPluginDeactivated = null;
        this.onError = null;
        
        // Singleton instance
        if (PluginManager.instance) {
            return PluginManager.instance;
        }
        PluginManager.instance = this;
    }
    
    /**
     * Eklenti kaydeder
     * @param {Object} plugin - Eklenti objesi
     * @return {Boolean} Kayıt başarılı mı
     */
    register(plugin) {
        if (!plugin || !plugin.id) {
            this._logError('Invalid plugin: missing ID');
            return false;
        }
        
        // Gerekli alanları kontrol et
        if (!plugin.name) plugin.name = plugin.id;
        if (!plugin.version) plugin.version = '1.0.0';
        if (!plugin.author) plugin.author = 'Unknown';
        if (!plugin.category) plugin.category = 'misc';
        if (!plugin.description) plugin.description = '';
        
        // Gerekli fonksiyonları kontrol et
        if (typeof plugin.init !== 'function') {
            this._logError(`Plugin ${plugin.id} does not have an init function`);
            return false;
        }
        
        // Eklentiyi kaydet
        this.plugins[plugin.id] = plugin;
        
        // Kategori bazında takip
        if (!this.categories[plugin.category]) {
            this.categories[plugin.category] = [];
        }
        this.categories[plugin.category].push(plugin.id);
        
        this._log(`Plugin registered: ${plugin.id} (${plugin.version})`);
        
        // Otomatik yükleme
        if (this.config.autoLoad) {
            this.load(plugin.id);
        }
        
        return true;
    }
    
    /**
     * Eklenti yükler
     * @param {String} id - Eklenti ID'si
     * @param {Object} options - Yükleme seçenekleri
     * @return {Promise} Yükleme sözü
     */
    load(id, options = {}) {
        return new Promise((resolve, reject) => {
            // Eklenti kaydedilmiş mi
            if (!this.plugins[id]) {
                const error = new Error(`Plugin not registered: ${id}`);
                this._logError(error.message);
                if (this.onError) this.onError(error);
                reject(error);
                return;
            }
            
            // Zaten yüklenmiş mi
            if (this.loaded[id]) {
                resolve(this.plugins[id]);
                return;
            }
            
            const plugin = this.plugins[id];
            
            // Bağımlılıkları kontrol et
            if (plugin.dependencies && Array.isArray(plugin.dependencies)) {
                const missingDependencies = plugin.dependencies.filter(dep => !this.loaded[dep]);
                
                if (missingDependencies.length > 0) {
                    const error = new Error(`Missing dependencies for plugin ${id}: ${missingDependencies.join(', ')}`);
                    this._logError(error.message);
                    if (this.onError) this.onError(error);
                    reject(error);
                    return;
                }
            }
            
            try {
                // Init fonksiyonunu çağır
                const result = plugin.init(options);
                
                // Promise kontrolü
                if (result instanceof Promise) {
                    result
                        .then(() => {
                            this._onPluginLoaded(plugin);
                            resolve(plugin);
                        })
                        .catch(error => {
                            this._logError(`Failed to initialize plugin ${id}: ${error.message}`);
                            if (this.onError) this.onError(error);
                            reject(error);
                        });
                } else {
                    // Senkron init
                    this._onPluginLoaded(plugin);
                    resolve(plugin);
                }
            } catch (error) {
                this._logError(`Error initializing plugin ${id}: ${error.message}`);
                if (this.onError) this.onError(error);
                reject(error);
            }
        });
    }
    
    /**
     * Eklenti başarıyla yüklendiğinde çağrılır
     * @param {Object} plugin - Eklenti objesi
     */
    _onPluginLoaded(plugin) {
        this.loaded[plugin.id] = true;
        
        // Otomatik aktifleştirme
        if (plugin.autoActivate !== false) {
            this.activate(plugin.id);
        }
        
        this._log(`Plugin loaded: ${plugin.id}`);
        
        // Olayı tetikle
        if (this.onPluginLoaded) {
            this.onPluginLoaded(plugin);
        }
    }
    
    /**
     * Eklenti kaldırır
     * @param {String} id - Eklenti ID'si
     * @return {Boolean} Kaldırma başarılı mı
     */
    unload(id) {
        // Eklenti yüklü mü
        if (!this.loaded[id]) {
            this._log(`Plugin not loaded: ${id}`);
            return false;
        }
        
        const plugin = this.plugins[id];
        
        // Önce devre dışı bırak
        if (this.active[id]) {
            this.deactivate(id);
        }
        
        // Unload fonksiyonu varsa çağır
        if (typeof plugin.unload === 'function') {
            try {
                plugin.unload();
            } catch (error) {
                this._logError(`Error unloading plugin ${id}: ${error.message}`);
                if (this.onError) this.onError(error);
                return false;
            }
        }
        
        // Yüklü listesinden kaldır
        delete this.loaded[id];
        
        this._log(`Plugin unloaded: ${id}`);
        
        // Olayı tetikle
        if (this.onPluginUnloaded) {
            this.onPluginUnloaded(plugin);
        }
        
        return true;
    }
    
    /**
     * Eklenti aktifleştirir
     * @param {String} id - Eklenti ID'si
     * @param {Object} options - Aktifleştirme seçenekleri
     * @return {Boolean} Aktifleştirme başarılı mı
     */
    activate(id, options = {}) {
        // Eklenti yüklü mü
        if (!this.loaded[id]) {
            this._logError(`Cannot activate plugin ${id}: not loaded`);
            return false;
        }
        
        // Zaten aktif mi
        if (this.active[id]) {
            return true;
        }
        
        const plugin = this.plugins[id];
        
        // Activate fonksiyonu varsa çağır
        if (typeof plugin.activate === 'function') {
            try {
                plugin.activate(options);
            } catch (error) {
                this._logError(`Error activating plugin ${id}: ${error.message}`);
                if (this.onError) this.onError(error);
                return false;
            }
        }
        
        // Aktif listesine ekle
        this.active[id] = true;
        
        this._log(`Plugin activated: ${id}`);
        
        // Olayı tetikle
        if (this.onPluginActivated) {
            this.onPluginActivated(plugin);
        }
        
        return true;
    }
    
    /**
     * Eklenti devre dışı bırakır
     * @param {String} id - Eklenti ID'si
     * @return {Boolean} Devre dışı bırakma başarılı mı
     */
    deactivate(id) {
        // Eklenti aktif mi
        if (!this.active[id]) {
            return true;
        }
        
        const plugin = this.plugins[id];
        
        // Deactivate fonksiyonu varsa çağır
        if (typeof plugin.deactivate === 'function') {
            try {
                plugin.deactivate();
            } catch (error) {
                this._logError(`Error deactivating plugin ${id}: ${error.message}`);
                if (this.onError) this.onError(error);
                return false;
            }
        }
        
        // Aktif listesinden kaldır
        delete this.active[id];
        
        this._log(`Plugin deactivated: ${id}`);
        
        // Olayı tetikle
        if (this.onPluginDeactivated) {
            this.onPluginDeactivated(plugin);
        }
        
        return true;
    }
    
    /**
     * Tüm eklentileri yükler
     * @param {Object} options - Yükleme seçenekleri
     * @return {Promise} Yükleme sözü
     */
    loadAll(options = {}) {
        const promises = [];
        
        for (const id in this.plugins) {
            if (!this.loaded[id]) {
                promises.push(this.load(id, options));
            }
        }
        
        return Promise.all(promises);
    }
    
    /**
     * Tüm eklentileri kaldırır
     * @return {Boolean} Kaldırma başarılı mı
     */
    unloadAll() {
        let success = true;
        
        for (const id in this.loaded) {
            if (!this.unload(id)) {
                success = false;
            }
        }
        
        return success;
    }
    
    /**
     * Tüm eklentileri aktifleştirir
     * @param {Object} options - Aktifleştirme seçenekleri
     * @return {Boolean} Aktifleştirme başarılı mı
     */
    activateAll(options = {}) {
        let success = true;
        
        for (const id in this.loaded) {
            if (!this.active[id]) {
                if (!this.activate(id, options)) {
                    success = false;
                }
            }
        }
        
        return success;
    }
    
    /**
     * Tüm eklentileri devre dışı bırakır
     * @return {Boolean} Devre dışı bırakma başarılı mı
     */
    deactivateAll() {
        let success = true;
        
        for (const id in this.active) {
            if (!this.deactivate(id)) {
                success = false;
            }
        }
        
        return success;
    }
    
    /**
     * Kategori bazında eklenti listesini alır
     * @param {String} category - Kategori adı
     * @return {Array} Eklenti listesi
     */
    getPluginsByCategory(category) {
        if (!this.categories[category]) {
            return [];
        }
        
        return this.categories[category].map(id => this.plugins[id]);
    }
    
    /**
     * Eklenti detaylarını alır
     * @param {String} id - Eklenti ID'si
     * @return {Object|null} Eklenti detayları
     */
    getPlugin(id) {
        return this.plugins[id] || null;
    }
    
    /**
     * Tüm eklentileri alır
     * @param {Boolean} onlyLoaded - Sadece yüklü eklentileri al
     * @param {Boolean} onlyActive - Sadece aktif eklentileri al
     * @return {Array} Eklenti listesi
     */
    getAllPlugins(onlyLoaded = false, onlyActive = false) {
        const plugins = [];
        
        for (const id in this.plugins) {
            if (onlyLoaded && !this.loaded[id]) continue;
            if (onlyActive && !this.active[id]) continue;
            
            plugins.push(this.plugins[id]);
        }
        
        return plugins;
    }
    
    /**
     * Dış eklenti dosyasını yükler
     * @param {String} url - Eklenti dosyası URL'si
     * @return {Promise} Yükleme sözü
     */
    loadExternalPlugin(url) {
        return new Promise((resolve, reject) => {
            // JavaScript dosyasını dinamik olarak yükle
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            
            script.onload = () => {
                this._log(`External plugin script loaded: ${url}`);
                resolve();
            };
            
            script.onerror = () => {
                const error = new Error(`Failed to load plugin script: ${url}`);
                this._logError(error.message);
                if (this.onError) this.onError(error);
                reject(error);
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Eklenti düzenleyiciyi açar
     * @param {String} id - Eklenti ID'si (isteğe bağlı)
     */
    openEditor(id = null) {
        if (id) {
            // Belirli bir eklentinin düzenleyicisini aç
            if (!this.plugins[id]) {
                this._logError(`Plugin not found: ${id}`);
                return;
            }
            
            const plugin = this.plugins[id];
            
            if (typeof plugin.openEditor === 'function') {
                plugin.openEditor();
            } else {
                this._log(`Plugin ${id} does not have an editor`);
            }
        } else {
            // Ana eklenti yöneticisi arayüzünü aç
            this._createEditorUI();
        }
    }
    
    /**
     * Eklenti yöneticisi arayüzünü oluşturur
     */
    _createEditorUI() {
        // Bu fonksiyon eklenti yöneticisinin arayüzünü oluşturur
        // Gerçek uygulamada, DOM manipülasyonu veya UI framework'ü kullanarak
        // daha gelişmiş bir arayüz oluşturulabilir
        
        const container = document.createElement('div');
        container.id = 'plugin-manager-ui';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        const panel = document.createElement('div');
        panel.style.cssText = `
            width: 80%;
            height: 80%;
            background: white;
            border-radius: 5px;
            padding: 20px;
            overflow: auto;
        `;
        
        const header = document.createElement('div');
        header.innerHTML = `<h2>Plugin Manager</h2>`;
        panel.appendChild(header);
        
        const pluginList = document.createElement('div');
        pluginList.style.cssText = `
            margin: 20px 0;
        `;
        
        // Eklentileri listele
        for (const id in this.plugins) {
            const plugin = this.plugins[id];
            const isLoaded = this.loaded[id];
            const isActive = this.active[id];
            
            const pluginItem = document.createElement('div');
            pluginItem.style.cssText = `
                padding: 10px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const pluginInfo = document.createElement('div');
            pluginInfo.innerHTML = `
                <h3>${plugin.name} <small>(${plugin.version})</small></h3>
                <p>${plugin.description}</p>
                <div>Author: ${plugin.author} | Category: ${plugin.category}</div>
            `;
            
            const controls = document.createElement('div');
            
            // Yükleme/kaldırma butonu
            const loadBtn = document.createElement('button');
            loadBtn.textContent = isLoaded ? 'Unload' : 'Load';
            loadBtn.onclick = () => {
                if (isLoaded) {
                    this.unload(id);
                } else {
                    this.load(id);
                }
                // Arayüzü yeniden oluştur
                container.remove();
                this._createEditorUI();
            };
            controls.appendChild(loadBtn);
            
            // Aktifleştirme/devre dışı bırakma butonu
            if (isLoaded) {
                const activeBtn = document.createElement('button');
                activeBtn.textContent = isActive ? 'Deactivate' : 'Activate';
                activeBtn.onclick = () => {
                    if (isActive) {
                        this.deactivate(id);
                    } else {
                        this.activate(id);
                    }
                    // Arayüzü yeniden oluştur
                    container.remove();
                    this._createEditorUI();
                };
                controls.appendChild(activeBtn);
            }
            
            // Düzenleyici butonu
            if (typeof plugin.openEditor === 'function') {
                const editorBtn = document.createElement('button');
                editorBtn.textContent = 'Edit';
                editorBtn.onclick = () => {
                    container.remove();
                    plugin.openEditor();
                };
                controls.appendChild(editorBtn);
            }
            
            pluginItem.appendChild(pluginInfo);
            pluginItem.appendChild(controls);
            pluginList.appendChild(pluginItem);
        }
        
        panel.appendChild(pluginList);
        
        // Kapat butonu
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            margin-top: 20px;
            padding: 10px 20px;
        `;
        closeBtn.onclick = () => container.remove();
        panel.appendChild(closeBtn);
        
        container.appendChild(panel);
        document.body.appendChild(container);
    }
    
    /**
     * Debug modu logları
     * @param {String} message - Log mesajı
     */
    _log(message) {
        if (this.config.debug) {
            console.log(`[PluginManager] ${message}`);
        }
    }
    
    /**
     * Hata logları
     * @param {String} message - Hata mesajı
     */
    _logError(message) {
        console.error(`[PluginManager] ${message}`);
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!PluginManager.instance) {
            new PluginManager();
        }
        return PluginManager.instance;
    }
}

// Singleton instance
PluginManager.instance = null;