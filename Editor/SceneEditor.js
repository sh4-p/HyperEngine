/**
 * SceneEditor.js - Sahne düzenleme aracı
 * Editor'da sahne düzenleme işlemlerini yönetir
 */
class SceneEditor {
    constructor(config = {}) {
        // Yapılandırma
        this.config = Object.assign({
            container: null,
            editor: null,
            width: 800,
            height: 600,
            gridSize: 16,
            showGrid: true,
            snapToGrid: true,
            backgroundColor: '#222222',
            selectionColor: '#4CAF50',
            selectionLineWidth: 2
        }, config);
        
        // Sahne verileri
        this.sceneName = '';
        this.objects = [];
        this.selectedObjects = [];
        
        // Editor durumu
        this.isPlaying = false;
        this.isPaused = false;
        this.editMode = 'select'; // 'select', 'move', 'rotate', 'scale'
        this.viewMode = 'editor'; // 'editor', 'game'
        this.zoomLevel = 1;
        this.cameraOffset = { x: 0, y: 0 };
        
        // Mouse durumu
        this.mousePosition = { x: 0, y: 0 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragObject = null;
        
        // Canvas
        this.canvas = null;
        this.context = null;
        
        // Game instance
        this.game = null;
        this.gameCanvas = null;
        
        // DOM elementleri
        this.container = null;
        this.toolbarElement = null;
        
        // Singleton instance
        if (SceneEditor.instance) {
            return SceneEditor.instance;
        }
        SceneEditor.instance = this;
        
        // Başlat
        this._initialize();
    }
    
    /**
     * SceneEditor'ı başlatır
     */
    _initialize() {
        // Konteyner
        if (typeof this.config.container === 'string') {
            this.container = document.querySelector(this.config.container);
        } else {
            this.container = this.config.container;
        }
        
        if (!this.container) {
            console.error("Scene editor container not found");
            return;
        }
        
        // Temel düzeni oluştur
        this._createLayout();
        
        // Olayları ayarla
        this._setupEventListeners();
        
        // Render döngüsünü başlat
        this._startRenderLoop();
    }
    
    /**
     * SceneEditor düzenini oluşturur
     */
    _createLayout() {
        // Konteyner stili
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        this.container.innerHTML = '';
        
        // Araç çubuğu
        this.toolbarElement = document.createElement('div');
        this.toolbarElement.className = 'scene-editor-toolbar';
        this._createToolbar();
        this.container.appendChild(this.toolbarElement);
        
        // Canvas konteyner
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'scene-editor-canvas-container';
        canvasContainer.style.position = 'relative';
        canvasContainer.style.width = '100%';
        canvasContainer.style.height = `${this.config.height}px`;
        canvasContainer.style.overflow = 'hidden';
        
        // Editor canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
        this.canvas.className = 'scene-editor-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        canvasContainer.appendChild(this.canvas);
        
        // Game canvas (oyun önizlemesi için)
        this.gameCanvas = document.createElement('canvas');
        this.gameCanvas.width = this.config.width;
        this.gameCanvas.height = this.config.height;
        this.gameCanvas.className = 'scene-editor-game-canvas';
        this.gameCanvas.style.position = 'absolute';
        this.gameCanvas.style.top = '0';
        this.gameCanvas.style.left = '0';
        this.gameCanvas.style.width = '100%';
        this.gameCanvas.style.height = '100%';
        this.gameCanvas.style.display = 'none';
        canvasContainer.appendChild(this.gameCanvas);
        
        this.container.appendChild(canvasContainer);
        
        // Context al
        this.context = this.canvas.getContext('2d');
    }
    
    /**
     * Araç çubuğunu oluşturur
     */
    _createToolbar() {
        // Mod seçimi
        const modeGroup = document.createElement('div');
        modeGroup.className = 'toolbar-group';
        
        const selectBtn = this._createToolbarButton('Select', 'select-icon', 'select');
        const moveBtn = this._createToolbarButton('Move', 'move-icon', 'move');
        const rotateBtn = this._createToolbarButton('Rotate', 'rotate-icon', 'rotate');
        const scaleBtn = this._createToolbarButton('Scale', 'scale-icon', 'scale');
        
        modeGroup.appendChild(selectBtn);
        modeGroup.appendChild(moveBtn);
        modeGroup.appendChild(rotateBtn);
        modeGroup.appendChild(scaleBtn);
        
        // Görünüm seçenekleri
        const viewGroup = document.createElement('div');
        viewGroup.className = 'toolbar-group';
        
        const gridBtn = this._createToolbarButton('Grid', 'grid-icon', 'grid', true);
        const snapBtn = this._createToolbarButton('Snap', 'snap-icon', 'snap', true);
        const zoomInBtn = this._createToolbarButton('Zoom In', 'zoom-in-icon', 'zoom-in');
        const zoomOutBtn = this._createToolbarButton('Zoom Out', 'zoom-out-icon', 'zoom-out');
        
        viewGroup.appendChild(gridBtn);
        viewGroup.appendChild(snapBtn);
        viewGroup.appendChild(zoomInBtn);
        viewGroup.appendChild(zoomOutBtn);
        
        // Oyun kontrolleri
        const playGroup = document.createElement('div');
        playGroup.className = 'toolbar-group';
        
        const playBtn = this._createToolbarButton('Play', 'play-icon', 'play');
        const pauseBtn = this._createToolbarButton('Pause', 'pause-icon', 'pause');
        const stopBtn = this._createToolbarButton('Stop', 'stop-icon', 'stop');
        
        playGroup.appendChild(playBtn);
        playGroup.appendChild(pauseBtn);
        playGroup.appendChild(stopBtn);
        
        // Araç çubuğuna ekle
        this.toolbarElement.appendChild(modeGroup);
        this.toolbarElement.appendChild(viewGroup);
        this.toolbarElement.appendChild(playGroup);
    }
    
    /**
     * Araç çubuğu butonu oluşturur
     * @param {String} title - Buton başlığı
     * @param {String} iconClass - İkon sınıfı
     * @param {String} action - Buton aksiyonu
     * @param {Boolean} isToggle - Toggle butonu mu
     * @return {HTMLElement} Buton elementi
     */
    _createToolbarButton(title, iconClass, action, isToggle = false) {
        const button = document.createElement('button');
        button.className = 'toolbar-button';
        button.title = title;
        button.setAttribute('data-action', action);
        
        // Toggle butonları için
        if (isToggle) {
            button.classList.add('toggle-button');
            
            if ((action === 'grid' && this.config.showGrid) || 
                (action === 'snap' && this.config.snapToGrid)) {
                button.classList.add('active');
            }
        }
        
        // İkon
        const icon = document.createElement('span');
        icon.className = `toolbar-icon ${iconClass}`;
        
        // İkon içeriği (gerçek uygulamada görsel ikon kullanılacak)
        switch (action) {
            case 'select': icon.textContent = '◻️'; break;
            case 'move': icon.textContent = '✥'; break;
            case 'rotate': icon.textContent = '↺'; break;
            case 'scale': icon.textContent = '⤢'; break;
            case 'grid': icon.textContent = '⊞'; break;
            case 'snap': icon.textContent = '⊛'; break;
            case 'zoom-in': icon.textContent = '🔍+'; break;
            case 'zoom-out': icon.textContent = '🔍-'; break;
            case 'play': icon.textContent = '▶️'; break;
            case 'pause': icon.textContent = '⏸️'; break;
            case 'stop': icon.textContent = '⏹️'; break;
            default: icon.textContent = '?';
        }
        
        button.appendChild(icon);
        
        // Tıklama olayı
        button.addEventListener('click', () => {
            this._handleToolbarAction(action, button);
        });
        
        return button;
    }
    
    /**
     * Araç çubuğu aksiyonunu işler
     * @param {String} action - Aksiyon adı
     * @param {HTMLElement} button - Buton elementi
     */
    _handleToolbarAction(action, button) {
        switch (action) {
            case 'select':
            case 'move':
            case 'rotate':
            case 'scale':
                this.editMode = action;
                
                // Aktif sınıfını ekle/kaldır
                this.toolbarElement.querySelectorAll('.toolbar-button[data-action="select"], .toolbar-button[data-action="move"], .toolbar-button[data-action="rotate"], .toolbar-button[data-action="scale"]').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                break;
                
            case 'grid':
                this.config.showGrid = !this.config.showGrid;
                button.classList.toggle('active');
                break;
                
            case 'snap':
                this.config.snapToGrid = !this.config.snapToGrid;
                button.classList.toggle('active');
                break;
                
            case 'zoom-in':
                this.zoomLevel = Math.min(2, this.zoomLevel + 0.1);
                break;
                
            case 'zoom-out':
                this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.1);
                break;
                
            case 'play':
                this.play();
                break;
                
            case 'pause':
                this.pause();
                break;
                
            case 'stop':
                this.stop();
                break;
        }
    }
    
    /**
     * Olayları ayarlar
     */
    _setupEventListeners() {
        // Mouse olayları
        this.canvas.addEventListener('mousedown', (e) => this._handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this._handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this._handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this._handleMouseWheel(e));
        
        // Klavye olayları
        document.addEventListener('keydown', (e) => this._handleKeyDown(e));
        
        // Pencere olayları
        window.addEventListener('resize', () => this.resize());
    }
    
    /**
     * Mouse down olayını işler
     * @param {MouseEvent} e - Mouse olayı
     */
    _handleMouseDown(e) {
        // Editor modunda değilse işlem yapma
        if (this.viewMode !== 'editor') return;
        
        // Mouse pozisyonunu hesapla
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        // Dünya koordinatlarına çevir
        const worldPos = this._screenToWorld(x, y);
        
        this.mousePosition = { x: worldPos.x, y: worldPos.y };
        this.isDragging = true;
        this.dragStart = { x: worldPos.x, y: worldPos.y };
        
        // İşlem tipine göre farklı davran
        switch (this.editMode) {
            case 'select':
                // Nesne seçimi
                this.dragObject = this._getObjectAtPosition(worldPos.x, worldPos.y);
                
                // Control tuşu ile çoklu seçim
                if (!e.ctrlKey && !e.metaKey) {
                    // Control tuşu basılı değilse önceki seçimleri temizle
                    if (this.dragObject && !this.selectedObjects.includes(this.dragObject)) {
                        this.selectedObjects = [this.dragObject];
                    } else if (!this.dragObject) {
                        this.selectedObjects = [];
                    }
                } else {
                    // Control tuşu basılı ise seçime ekle/çıkar
                    if (this.dragObject) {
                        if (this.selectedObjects.includes(this.dragObject)) {
                            // Zaten seçili ise kaldır
                            this.selectedObjects = this.selectedObjects.filter(obj => obj !== this.dragObject);
                        } else {
                            // Seçili değilse ekle
                            this.selectedObjects.push(this.dragObject);
                        }
                    }
                }
                
                // Editor'a bildir
                if (this.config.editor) {
                    this.config.editor.selectedObjects = [...this.selectedObjects];
                    
                    // Inspector güncelleme
                    if (this.selectedObjects.