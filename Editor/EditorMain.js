/**
 * EditorMain.js - Editor ana sınıfı
 * Oyun düzenleyicisinin ana bileşeni
 */
class EditorMain {
    constructor(config = {}) {
        // Yapılandırma
        this.config = Object.assign({
            containerId: 'editor-container',
            width: 1280,
            height: 720,
            theme: 'dark', // 'light', 'dark'
            showToolbar: true,
            showInspector: true,
            showProjectManager: true,
            showSceneView: true,
            showGameView: true,
            snapToGrid: true,
            gridSize: 16,
            showStats: true,
            autosave: true,
            autosaveInterval: 300, // saniye
        }, config);
        
        // Editor bileşenleri
        this.toolbar = null;
        this.inspector = null;
        this.projectManager = null;
        this.sceneEditor = null;
        this.assetBrowser = null;
        
        // Proje bilgileri
        this.currentProject = null;
        this.currentScene = null;
        this.isProjectModified = false;
        
        // Geçmiş (Undo/Redo)
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 100;
        
        // Seçim
        this.selectedObjects = [];
        
        // Otomatik kaydetme
        this.autosaveTimer = null;
        
        // DOM elementleri
        this.container = null;
        this.editorElements = {};
        
        // Editor durumu
        this.isRunning = false;
        this.editMode = 'select'; // 'select', 'move', 'rotate', 'scale', 'draw'
        
        // Singleton instance
        if (EditorMain.instance) {
            return EditorMain.instance;
        }
        EditorMain.instance = this;
        
        // Başlat
        this._initialize();
    }
    
    /**
     * Editor'ü başlatır
     */
    _initialize() {
        // Ana konteyner
        this.container = document.getElementById(this.config.containerId);
        
        if (!this.container) {
            console.error(`Editor container not found: #${this.config.containerId}`);
            return;
        }
        
        // Ana düzen oluştur
        this._createLayout();
        
        // Bileşenleri oluştur
        this._createComponents();
        
        // Olay dinleyicileri
        this._setupEventListeners();
        
        // Otomatik kaydetme
        if (this.config.autosave) {
            this._setupAutosave();
        }
        
        console.log("HyperGame Editor initialized!");
    }
    
    /**
     * Editor düzenini oluşturur
     */
    _createLayout() {
        // Ana konteyner stil ayarları
        this.container.classList.add('editor-container');
        this.container.style.width = `${this.config.width}px`;
        this.container.style.height = `${this.config.height}px`;
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        this.container.style.backgroundColor = this.config.theme === 'dark' ? '#1e1e1e' : '#f5f5f5';
        
        // Tema sınıfı
        this.container.classList.add(`theme-${this.config.theme}`);
        
        // Araç çubuğu
        if (this.config.showToolbar) {
            const toolbar = document.createElement('div');
            toolbar.id = 'editor-toolbar';
            toolbar.className = 'editor-toolbar';
            this.container.appendChild(toolbar);
            this.editorElements.toolbar = toolbar;
        }
        
        // Ana içerik
        const content = document.createElement('div');
        content.id = 'editor-content';
        content.className = 'editor-content';
        this.container.appendChild(content);
        this.editorElements.content = content;
        
        // Proje yöneticisi
        if (this.config.showProjectManager) {
            const projectManager = document.createElement('div');
            projectManager.id = 'editor-project-manager';
            projectManager.className = 'editor-panel editor-project-manager';
            content.appendChild(projectManager);
            this.editorElements.projectManager = projectManager;
        }
        
        // Sahne görünümü
        if (this.config.showSceneView) {
            const sceneView = document.createElement('div');
            sceneView.id = 'editor-scene-view';
            sceneView.className = 'editor-panel editor-scene-view';
            content.appendChild(sceneView);
            this.editorElements.sceneView = sceneView;
        }
        
        // Oyun görünümü
        if (this.config.showGameView) {
            const gameView = document.createElement('div');
            gameView.id = 'editor-game-view';
            gameView.className = 'editor-panel editor-game-view';
            content.appendChild(gameView);
            this.editorElements.gameView = gameView;
        }
        
        // Denetleyici (Inspector)
        if (this.config.showInspector) {
            const inspector = document.createElement('div');
            inspector.id = 'editor-inspector';
            inspector.className = 'editor-panel editor-inspector';
            content.appendChild(inspector);
            this.editorElements.inspector = inspector;
        }
        
        // Durum çubuğu
        const statusBar = document.createElement('div');
        statusBar.id = 'editor-status-bar';
        statusBar.className = 'editor-status-bar';
        this.container.appendChild(statusBar);
        this.editorElements.statusBar = statusBar;
    }
    
    /**
     * Editor bileşenlerini oluşturur
     */
    _createComponents() {
        // Araç çubuğu
        if (this.config.showToolbar) {
            this.toolbar = new Toolbar({
                container: this.editorElements.toolbar,
                editor: this
            });
        }
        
        // Denetleyici (Inspector)
        if (this.config.showInspector) {
            this.inspector = new Inspector({
                container: this.editorElements.inspector,
                editor: this
            });
        }
        
        // Proje yöneticisi
        if (this.config.showProjectManager) {
            this.projectManager = new ProjectManager({
                container: this.editorElements.projectManager,
                editor: this
            });
        }
        
        // Sahne editörü
        if (this.config.showSceneView) {
            this.sceneEditor = new SceneEditor({
                container: this.editorElements.sceneView,
                editor: this,
                width: this.config.width * 0.6,
                height: this.config.height * 0.7
            });
        }
        
        // Varlık tarayıcısı
        this.assetBrowser = new AssetBrowser({
            container: this.editorElements.projectManager,
            assetRoot: 'assets/',
            editor: this
        });
    }
    
    /**
     * Olay dinleyicileri ayarlar
     */
    _setupEventListeners() {
        // Pencere olay dinleyicileri
        window.addEventListener('resize', () => this._handleResize());
        
        // Kısayol tuşları
        document.addEventListener('keydown', (e) => this._handleKeyDown(e));
        
        // Araç çubuğu olayları
        if (this.toolbar) {
            this.toolbar.on('newProject', () => this.newProject());
            this.toolbar.on('openProject', () => this.openProject());
            this.toolbar.on('saveProject', () => this.saveProject());
            this.toolbar.on('play', () => this.playGame());
            this.toolbar.on('pause', () => this.pauseGame());
            this.toolbar.on('stop', () => this.stopGame());
        }
    }
    
    /**
     * Otomatik kaydetme zamanlayıcısını ayarlar
     */
    _setupAutosave() {
        // Önceki zamanlayıcıyı temizle
        if (this.autosaveTimer) {
            clearInterval(this.autosaveTimer);
        }
        
        // Yeni zamanlayıcı oluştur
        this.autosaveTimer = setInterval(() => {
            if (this.isProjectModified && this.currentProject) {
                this.saveProject(true); // Otomatik kaydet
            }
        }, this.config.autosaveInterval * 1000);
    }
    
    /**
     * Pencere yeniden boyutlandırmayı işler
     */
    _handleResize() {
        // Bileşenlerin boyutlarını güncelle
        if (this.sceneEditor) {
            this.sceneEditor.resize();
        }
    }
    
    /**
     * Klavye kısayollarını işler
     * @param {KeyboardEvent} e - Klavye olayı
     */
    _handleKeyDown(e) {
        // Ctrl + S: Kaydet
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.saveProject();
        }
        
        // Ctrl + Z: Geri al
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }
        
        // Ctrl + Y veya Ctrl + Shift + Z: Yinele
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            this.redo();
        }
        
        // Delete: Seçili nesneleri sil
        if (e.key === 'Delete') {
            e.preventDefault();
            this.deleteSelectedObjects();
        }
        
        // Escape: Seçimi temizle
        if (e.key === 'Escape') {
            e.preventDefault();
            this.clearSelection();
        }
    }
    
    /**
     * Yeni proje oluşturur
     */
    newProject() {
        // Kullanıcıya kaydetmediği değişiklikler için sor
        if (this.isProjectModified) {
            const confirmResult = confirm('Kaydedilmemiş değişiklikler var. Devam etmek istiyor musunuz?');
            if (!confirmResult) return;
        }
        
        // Yeni proje bilgileri
        const projectName = prompt('Proje adı:', 'YeniProje');
        if (!projectName) return;
        
        // Yeni proje oluştur
        this.currentProject = {
            name: projectName,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            scenes: [],
            assets: [],
            config: {}
        };
        
        // Varsayılan sahne oluştur
        this.createNewScene('MainScene');
        
        // Proje durumunu güncelle
        this.isProjectModified = false;
        
        // UI'ı güncelle
        this._updateUI();
        
        console.log(`New project created: ${projectName}`);
    }
    
    /**
     * Projeyi açar
     */
    openProject() {
        // Kullanıcıya kaydetmediği değişiklikler için sor
        if (this.isProjectModified) {
            const confirmResult = confirm('Kaydedilmemiş değişiklikler var. Devam etmek istiyor musunuz?');
            if (!confirmResult) return;
        }
        
        // Gerçek bir uygulamada, dosya sistemi API'si ile proje dosyası seçtirme işlemi yapılır
        // Bu örnekte simüle ediyoruz
        const projectName = prompt('Açılacak proje adı:', 'MevcutProje');
        if (!projectName) return;
        
        // Proje verilerini yükle
        this._loadProjectData(projectName);
    }
    
    /**
     * Proje verilerini yükler
     * @param {String} projectName - Proje adı
     */
    _loadProjectData(projectName) {
        // Gerçek bir uygulamada, dosya sistemi API'si veya veritabanı ile proje verileri yüklenir
        // Bu örnekte simüle ediyoruz
        
        // Simüle edilmiş proje verisi
        this.currentProject = {
            name: projectName,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            scenes: ['MainScene', 'GameScene', 'SettingsScene'],
            assets: [],
            config: {}
        };
        
        // İlk sahneyi yükle
        this.loadScene(this.currentProject.scenes[0]);
        
        // Proje durumunu güncelle
        this.isProjectModified = false;
        
        // UI'ı güncelle
        this._updateUI();
        
        console.log(`Project loaded: ${projectName}`);
    }
    
    /**
     * Projeyi kaydeder
     * @param {Boolean} isAutosave - Otomatik kayıt mı
     */
    saveProject(isAutosave = false) {
        if (!this.currentProject) return;
        
        // Proje güncelleme zamanını ayarla
        this.currentProject.lastModified = new Date().toISOString();
        
        // Gerçek bir uygulamada, dosya sistemi API'si veya veritabanı ile proje verilerini kaydeder
        // Bu örnekte simüle ediyoruz
        
        // Proje durumunu güncelle
        this.isProjectModified = false;
        
        // UI'ı güncelle
        this._updateUI();
        
        console.log(`Project saved${isAutosave ? ' (autosave)' : ''}: ${this.currentProject.name}`);
    }
    
    /**
     * Yeni sahne oluşturur
     * @param {String} sceneName - Sahne adı
     */
    createNewScene(sceneName) {
        if (!this.currentProject) return;
        
        // Zaten bu isimde bir sahne var mı kontrol et
        if (this.currentProject.scenes.includes(sceneName)) {
            alert(`"${sceneName}" adında bir sahne zaten mevcut.`);
            return;
        }
        
        // Sahneyi projeye ekle
        this.currentProject.scenes.push(sceneName);
        
        // Yeni sahne oluştur
        const scene = new Scene(sceneName);
        
        // Sahneyi yükle
        this.loadScene(sceneName);
        
        // Proje durumunu güncelle
        this.isProjectModified = true;
        
        // UI'ı güncelle
        this._updateUI();
        
        console.log(`New scene created: ${sceneName}`);
    }
    
    /**
     * Sahne yükler
     * @param {String} sceneName - Sahne adı
     */
    loadScene(sceneName) {
        if (!this.currentProject) return;
        
        // Sahne mevcut mu kontrol et
        if (!this.currentProject.scenes.includes(sceneName)) {
            alert(`"${sceneName}" adında bir sahne bulunamadı.`);
            return;
        }
        
        // Mevcut sahneyi kaydet
        if (this.currentScene) {
            // Gerçek bir uygulamada, mevcut sahneyi kaydetme işlemi yapılır
        }
        
        // Yeni sahneyi yükle
        this.currentScene = sceneName;
        
        // Sahne editörünü güncelle
        if (this.sceneEditor) {
            this.sceneEditor.loadScene(sceneName);
        }
        
        // UI'ı güncelle
        this._updateUI();
        
        console.log(`Scene loaded: ${sceneName}`);
    }
    
    /**
     * Oyunu çalıştırır
     */
    playGame() {
        if (!this.currentProject || !this.currentScene) return;
        
        // Oyunu başlat
        this.isRunning = true;
        
        // SceneEditor'a bildir
        if (this.sceneEditor) {
            this.sceneEditor.play();
        }
        
        // UI'ı güncelle
        this._updateUI();
        
        console.log('Game started');
    }
    
    /**
     * Oyunu duraklatır
     */
    pauseGame() {
        if (!this.isRunning) return;
        
        // Oyunu duraklat
        this.isRunning = false;
        
        // SceneEditor'a bildir
        if (this.sceneEditor) {
            this.sceneEditor.pause();
        }
        
        // UI'ı güncelle
        this._updateUI();
        
        console.log('Game paused');
    }
    
    /**
     * Oyunu durdurur
     */
    stopGame() {
        if (!this.isRunning) return;
        
        // Oyunu durdur
        this.isRunning = false;
        
        // SceneEditor'a bildir
        if (this.sceneEditor) {
            this.sceneEditor.stop();
        }
        
        // UI'ı güncelle
        this._updateUI();
        
        console.log('Game stopped');
    }
    
    /**
     * Son işlemi geri alır
     */
    undo() {
        if (this.historyIndex <= 0) return;
        
        this.historyIndex--;
        const historyItem = this.history[this.historyIndex];
        
        // İşlemi geri al
        this._applyHistoryItem(historyItem, true);
        
        // Proje durumunu güncelle
        this.isProjectModified = true;
        
        // UI'ı güncelle
        this._updateUI();
        
        console.log(`Undo: ${historyItem.action}`);
    }
    
    /**
     * Son geri alınan işlemi yineler
     */
    redo() {
        if (this.historyIndex >= this.history.length - 1) return;
        
        this.historyIndex++;
        const historyItem = this.history[this.historyIndex];
        
        // İşlemi yinele
        this._applyHistoryItem(historyItem, false);
        
        // Proje durumunu güncelle
        this.isProjectModified = true;
        
        // UI'ı güncelle
        this._updateUI();
        
        console.log(`Redo: ${historyItem.action}`);
    }
    
    /**
     * Geçmiş öğesini uygular
     * @param {Object} historyItem - Geçmiş öğesi
     * @param {Boolean} isUndo - Geri alma işlemi mi
     */
    _applyHistoryItem(historyItem, isUndo) {
        // Geçmiş öğesinin tipine göre işlem yap
        switch (historyItem.action) {
            case 'addObject':
                if (isUndo) {
                    // Nesneyi sahneden kaldır
                    this.sceneEditor.removeObject(historyItem.object.id);
                } else {
                    // Nesneyi sahneye ekle
                    this.sceneEditor.addObject(historyItem.object);
                }
                break;
                
            case 'removeObject':
                if (isUndo) {
                    // Nesneyi sahneye geri ekle
                    this.sceneEditor.addObject(historyItem.object);
                } else {
                    // Nesneyi sahneden kaldır
                    this.sceneEditor.removeObject(historyItem.object.id);
                }
                break;
                
            case 'modifyObject':
                // Nesne özelliklerini değiştir
                const targetObject = this.sceneEditor.getObjectById(historyItem.objectId);
                if (targetObject) {
                    const properties = isUndo ? historyItem.oldProperties : historyItem.newProperties;
                    Object.assign(targetObject, properties);
                }
                break;
                
            // Diğer işlem türleri...
        }
    }
    
    /**
     * Geçmişe işlem ekler
     * @param {Object} action - İşlem bilgisi
     */
    addToHistory(action) {
        // Geçerli konumdan sonraki tüm geçmişi temizle (undo yaptıktan sonra yeni işlem yapıldığında)
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Geçmişe ekle
        this.history.push(action);
        this.historyIndex = this.history.length - 1;
        
        // Maksimum geçmiş boyutunu aşarsa en eski öğeyi kaldır
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
        
        // Proje durumunu güncelle
        this.isProjectModified = true;
    }
    
    /**
     * Seçili nesneleri siler
     */
    deleteSelectedObjects() {
        if (!this.selectedObjects.length) return;
        
        // Geçmişe işlem ekle
        this.addToHistory({
            action: 'removeObjects',
            objects: [...this.selectedObjects]
        });
        
        // Nesneleri kaldır
        for (const object of this.selectedObjects) {
            this.sceneEditor.removeObject(object.id);
        }
        
        // Seçimi temizle
        this.clearSelection();
        
        // UI'ı güncelle
        this._updateUI();
    }
    
    /**
     * Seçimi temizler
     */
    clearSelection() {
        this.selectedObjects = [];
        
        // SceneEditor'a bildir
        if (this.sceneEditor) {
            this.sceneEditor.clearSelection();
        }
        
        // Inspector'a bildir
        if (this.inspector) {
            this.inspector.clearInspector();
        }
        
        // UI'ı güncelle
        this._updateUI();
    }
    
    /**
     * Nesne seçer
     * @param {GameObject} object - Seçilecek nesne
     * @param {Boolean} addToSelection - Mevcut seçime ekle
     */
    selectObject(object, addToSelection = false) {
        if (!object) return;
        
        // Mevcut seçimi temizle (çoklu seçim değilse)
        if (!addToSelection) {
            this.clearSelection();
        }
        
        // Nesne zaten seçili mi kontrol et
        const isAlreadySelected = this.selectedObjects.some(obj => obj.id === object.id);
        
        if (!isAlreadySelected) {
            // Seçime ekle
            this.selectedObjects.push(object);
            
            // SceneEditor'a bildir
            if (this.sceneEditor) {
                this.sceneEditor.selectObject(object.id, true);
            }
        }
        
        // Inspector'a bildir
        if (this.inspector && this.selectedObjects.length === 1) {
            this.inspector.inspectObject(this.selectedObjects[0]);
        }
        
        // UI'ı güncelle
        this._updateUI();
    }
    
    /**
     * UI'ı günceller
     */
    _updateUI() {
        // Toolbar durumunu güncelle
        if (this.toolbar) {
            this.toolbar.update({
                projectName: this.currentProject ? this.currentProject.name : '',
                sceneName: this.currentScene || '',
                isProjectModified: this.isProjectModified,
                isRunning: this.isRunning,
                hasSelection: this.selectedObjects.length > 0,
                canUndo: this.historyIndex > 0,
                canRedo: this.historyIndex < this.history.length - 1
            });
        }
        
        // Durum çubuğunu güncelle
        if (this.editorElements.statusBar) {
            const statusInfo = [];
            
            if (this.currentProject) {
                statusInfo.push(`Project: ${this.currentProject.name}`);
            }
            
            if (this.currentScene) {
                statusInfo.push(`Scene: ${this.currentScene}`);
            }
            
            if (this.selectedObjects.length > 0) {
                statusInfo.push(`Selected: ${this.selectedObjects.length} object(s)`);
            }
            
            this.editorElements.statusBar.textContent = statusInfo.join(' | ');
        }
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!EditorMain.instance) {
            new EditorMain();
        }
        return EditorMain.instance;
    }
}

// Singleton instance
EditorMain.instance = null;