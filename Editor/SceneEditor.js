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
                    if (this.selectedObjects.length === 1) {
                        this.config.editor.selectObject(this.selectedObjects[0]);
                    } else if (this.selectedObjects.length === 0) {
                        this.config.editor.clearSelection();
                    }
                }
                break;
                
            case 'move':
                // Nesne taşıma
                if (this.selectedObjects.length > 0) {
                    this.dragObject = this.selectedObjects[0];
                    this.dragStart = { 
                        x: this.dragObject.transform.position.x, 
                        y: this.dragObject.transform.position.y 
                    };
                }
                break;
                
            case 'rotate':
                // Nesne döndürme
                if (this.selectedObjects.length > 0) {
                    this.dragObject = this.selectedObjects[0];
                    this.dragStart = {
                        rotation: this.dragObject.transform.rotation,
                        x: this.dragObject.transform.position.x,
                        y: this.dragObject.transform.position.y
                    };
                }
                break;
                
            case 'scale':
                // Nesne ölçeklendirme
                if (this.selectedObjects.length > 0) {
                    this.dragObject = this.selectedObjects[0];
                    this.dragStart = {
                        scaleX: this.dragObject.transform.scale.x,
                        scaleY: this.dragObject.transform.scale.y,
                        x: this.dragObject.transform.position.x,
                        y: this.dragObject.transform.position.y
                    };
                }
                break;
        }
    }
    
    /**
     * Mouse move olayını işler
     * @param {MouseEvent} e - Mouse olayı
     */
    _handleMouseMove(e) {
        // Mouse pozisyonunu hesapla
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        // Dünya koordinatlarına çevir
        const worldPos = this._screenToWorld(x, y);
        
        // Mouse pozisyonunu güncelle
        this.mousePosition = { x: worldPos.x, y: worldPos.y };
        
        // Sürükleme işlemi
        if (this.isDragging && this.dragObject) {
            const dx = worldPos.x - this.dragStart.x;
            const dy = worldPos.y - this.dragStart.y;
            
            switch (this.editMode) {
                case 'move':
                    // Nesneleri taşı
                    for (const obj of this.selectedObjects) {
                        // Yeni pozisyon
                        const newX = this.dragStart.x + dx;
                        const newY = this.dragStart.y + dy;
                        
                        // Izgara yapışma
                        if (this.config.snapToGrid) {
                            obj.transform.position.x = Math.round(newX / this.config.gridSize) * this.config.gridSize;
                            obj.transform.position.y = Math.round(newY / this.config.gridSize) * this.config.gridSize;
                        } else {
                            obj.transform.position.x = newX;
                            obj.transform.position.y = newY;
                        }
                    }
                    break;
                    
                case 'rotate':
                    // Nesneleri döndür
                    for (const obj of this.selectedObjects) {
                        // Nesne merkezi ile fare arasındaki açıyı hesapla
                        const angleToMouse = Math.atan2(
                            worldPos.y - obj.transform.position.y,
                            worldPos.x - obj.transform.position.x
                        );
                        
                        // Başlangıç açısına ekle
                        obj.transform.rotation = angleToMouse;
                        
                        // Izgara yapışma (15 derecelik artışlar)
                        if (this.config.snapToGrid) {
                            const snapAngle = Math.PI / 12; // 15 derece
                            obj.transform.rotation = Math.round(obj.transform.rotation / snapAngle) * snapAngle;
                        }
                    }
                    break;
                    
                case 'scale':
                    // Nesneleri ölçeklendir
                    for (const obj of this.selectedObjects) {
                        // Nesne merkezi ile fare arasındaki mesafeyi hesapla
                        const distance = Math.sqrt(
                            Math.pow(worldPos.x - obj.transform.position.x, 2) +
                            Math.pow(worldPos.y - obj.transform.position.y, 2)
                        );
                        
                        // Başlangıç mesafesi
                        const startDistance = Math.sqrt(
                            Math.pow(this.dragStart.x - obj.transform.position.x, 2) +
                            Math.pow(this.dragStart.y - obj.transform.position.y, 2)
                        );
                        
                        // Ölçek faktörü
                        const scaleFactor = distance / startDistance;
                        
                        // Yeni ölçek
                        obj.transform.scale.x = this.dragStart.scaleX * scaleFactor;
                        obj.transform.scale.y = this.dragStart.scaleY * scaleFactor;
                        
                        // Izgara yapışma
                        if (this.config.snapToGrid) {
                            obj.transform.scale.x = Math.round(obj.transform.scale.x * 10) / 10;
                            obj.transform.scale.y = Math.round(obj.transform.scale.y * 10) / 10;
                        }
                        
                        // Minimum ölçek kontrolü
                        if (obj.transform.scale.x < 0.1) obj.transform.scale.x = 0.1;
                        if (obj.transform.scale.y < 0.1) obj.transform.scale.y = 0.1;
                    }
                    break;
            }
        }
    }
    
    /**
     * Mouse up olayını işler
     * @param {MouseEvent} e - Mouse olayı
     */
    _handleMouseUp(e) {
        this.isDragging = false;
        this.dragObject = null;
    }
    
    /**
     * Mouse wheel olayını işler
     * @param {WheelEvent} e - Wheel olayı
     */
    _handleMouseWheel(e) {
        e.preventDefault();
        
        // Zoom faktörü
        const zoomFactor = 0.1;
        const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
        
        // Yeni zoom değeri
        const newZoom = Math.max(0.1, Math.min(5, this.zoomLevel + delta));
        
        // Mouse pozisyonu (ekran koordinatları)
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        // Zoom'dan önceki dünya koordinatları
        const worldBefore = this._screenToWorld(mouseX, mouseY);
        
        // Zoom'u değiştir
        this.zoomLevel = newZoom;
        
        // Zoom'dan sonraki dünya koordinatları
        const worldAfter = this._screenToWorld(mouseX, mouseY);
        
        // Kamera kaydırma
        this.cameraOffset.x += worldBefore.x - worldAfter.x;
        this.cameraOffset.y += worldBefore.y - worldAfter.y;
    }
    
    /**
     * Klavye olayını işler
     * @param {KeyboardEvent} e - Klavye olayı
     */
    _handleKeyDown(e) {
        // Delete: Seçili nesneleri sil
        if (e.key === 'Delete') {
            this.deleteSelectedObjects();
        }
        
        // Ok tuşları: Seçili nesneleri taşı
        if (this.selectedObjects.length > 0) {
            let dx = 0;
            let dy = 0;
            
            switch (e.key) {
                case 'ArrowLeft': dx = -1; break;
                case 'ArrowRight': dx = 1; break;
                case 'ArrowUp': dy = -1; break;
                case 'ArrowDown': dy = 1; break;
            }
            
            if (dx !== 0 || dy !== 0) {
                e.preventDefault();
                
                // Grid boyutu ile çarp
                if (e.shiftKey) {
                    // Shift tuşu: Daha hızlı hareket
                    dx *= this.config.gridSize * 5;
                    dy *= this.config.gridSize * 5;
                } else {
                    dx *= this.config.gridSize;
                    dy *= this.config.gridSize;
                }
                
                // Nesneleri taşı
                for (const obj of this.selectedObjects) {
                    obj.transform.position.x += dx;
                    obj.transform.position.y += dy;
                }
            }
        }
    }
    
    /**
     * Ekran koordinatlarını dünya koordinatlarına dönüştürür
     * @param {Number} screenX - Ekran X koordinatı
     * @param {Number} screenY - Ekran Y koordinatı
     * @return {Object} Dünya koordinatları
     */
    _screenToWorld(screenX, screenY) {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Ekran merkezine göre normalize et
        const normalizedX = screenX - canvasWidth / 2;
        const normalizedY = screenY - canvasHeight / 2;
        
        // Zoom ve camera offset uygula
        const worldX = normalizedX / this.zoomLevel + this.cameraOffset.x;
        const worldY = normalizedY / this.zoomLevel + this.cameraOffset.y;
        
        return { x: worldX, y: worldY };
    }
    
    /**
     * Dünya koordinatlarını ekran koordinatlarına dönüştürür
     * @param {Number} worldX - Dünya X koordinatı
     * @param {Number} worldY - Dünya Y koordinatı
     * @return {Object} Ekran koordinatları
     */
    _worldToScreen(worldX, worldY) {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Zoom ve camera offset uygula
        const normalizedX = (worldX - this.cameraOffset.x) * this.zoomLevel;
        const normalizedY = (worldY - this.cameraOffset.y) * this.zoomLevel;
        
        // Ekran merkezine göre normalize et
        const screenX = normalizedX + canvasWidth / 2;
        const screenY = normalizedY + canvasHeight / 2;
        
        return { x: screenX, y: screenY };
    }
    
    /**
     * Belirli bir konumdaki nesneyi bulur
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     * @return {GameObject} Bulunan nesne veya null
     */
    _getObjectAtPosition(x, y) {
        // Nesneleri tersine sıralayarak kontrol et (üstteki nesneler önce)
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const object = this.objects[i];
            
            // Nesne aktif değilse atla
            if (!object.active) continue;
            
            // Çarpışma algılama
            const collider = object.getComponent('Collider');
            
            if (collider) {
                // Collider'ın pozisyonu
                const colliderPos = collider.getWorldPosition();
                
                // Collider türüne göre çarpışma kontrolü
                if (collider.type === 'box') {
                    // Kutu collider
                    const scale = object.transform.getWorldScale();
                    const halfWidth = collider.width * scale.x / 2;
                    const halfHeight = collider.height * scale.y / 2;
                    
                    if (x >= colliderPos.x - halfWidth && x <= colliderPos.x + halfWidth &&
                        y >= colliderPos.y - halfHeight && y <= colliderPos.y + halfHeight) {
                        return object;
                    }
                } else if (collider.type === 'circle') {
                    // Daire collider
                    const scale = object.transform.getWorldScale();
                    const radius = collider.radius * Math.max(scale.x, scale.y);
                    
                    const distance = Math.sqrt(
                        Math.pow(x - colliderPos.x, 2) +
                        Math.pow(y - colliderPos.y, 2)
                    );
                    
                    if (distance <= radius) {
                        return object;
                    }
                }
            } else {
                // Collider yoksa transform'a göre kontrol et
                const position = object.transform.getWorldPosition();
                const scale = object.transform.getWorldScale();
                
                // Varsayılan boyut
                const defaultSize = 50;
                const halfWidth = defaultSize * scale.x / 2;
                const halfHeight = defaultSize * scale.y / 2;
                
                if (x >= position.x - halfWidth && x <= position.x + halfWidth &&
                    y >= position.y - halfHeight && y <= position.y + halfHeight) {
                    return object;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Render döngüsünü başlatır
     */
    _startRenderLoop() {
        const loop = () => {
            this._render();
            requestAnimationFrame(loop);
        };
        
        loop();
    }
    
    /**
     * Sahneyi render eder
     */
    _render() {
        // Hangi canvas kullanılacak
        const canvas = this.viewMode === 'editor' ? this.canvas : this.gameCanvas;
        const ctx = canvas.getContext('2d');
        
        // Canvas'ı temizle
        ctx.fillStyle = this.config.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Izgara
        if (this.config.showGrid && this.viewMode === 'editor') {
            this._drawGrid(ctx);
        }
        
        // Nesneleri render et
        for (const object of this.objects) {
            if (object.active) {
                this._renderObject(ctx, object);
            }
        }
        
        // Seçim çerçevesi
        if (this.viewMode === 'editor' && this.selectedObjects.length > 0) {
            for (const obj of this.selectedObjects) {
                this._drawSelectionRect(ctx, obj);
            }
        }
    }
    
    /**
     * Izgarayı çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    _drawGrid(ctx) {
        const gridSize = this.config.gridSize * this.zoomLevel;
        const offsetX = (-this.cameraOffset.x * this.zoomLevel) % gridSize;
        const offsetY = (-this.cameraOffset.y * this.zoomLevel) % gridSize;
        
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1;
        
        // Yatay çizgiler
        for (let y = offsetY; y < canvasHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
            ctx.stroke();
        }
        
        // Dikey çizgiler
        for (let x = offsetX; x < canvasWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
            ctx.stroke();
        }
        
        // Merkez çizgileri
        const centerX = canvasWidth / 2 - (this.cameraOffset.x * this.zoomLevel);
        const centerY = canvasHeight / 2 - (this.cameraOffset.y * this.zoomLevel);
        
        ctx.strokeStyle = 'rgba(200, 50, 50, 0.5)';
        ctx.lineWidth = 1;
        
        // X ekseni
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvasWidth, centerY);
        ctx.stroke();
        
        // Y ekseni
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, canvasHeight);
        ctx.stroke();
    }
    
    /**
     * Nesneyi render eder
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {GameObject} object - Game object
     */
    _renderObject(ctx, object) {
        // Nesne pozisyonu, ölçeği ve rotasyonu
        const position = object.transform.getWorldPosition();
        const scale = object.transform.getWorldScale();
        const rotation = object.transform.getWorldRotation();
        
        // Ekran koordinatlarına dönüştür
        const screenPos = this._worldToScreen(position.x, position.y);
        
        // Context durumunu kaydet
        ctx.save();
        
        // Dönüşümleri uygula
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(rotation);
        ctx.scale(scale.x * this.zoomLevel, scale.y * this.zoomLevel);
        
        // Sprite var mı kontrol et
        const sprite = object.getComponent('Sprite');
        
        if (sprite && sprite.image && sprite.isLoaded) {
            // Sprite çiz
            const width = sprite.width || sprite.image.width;
            const height = sprite.height || sprite.image.height;
            
            ctx.drawImage(
                sprite.image,
                -width / 2,
                -height / 2,
                width,
                height
            );
        } else {
            // Varsayılan şekil (placeholder)
            ctx.fillStyle = 'rgba(100, 150, 250, 0.5)';
            
            const collider = object.getComponent('Collider');
            
            if (collider) {
                // Collider şeklini çiz
                if (collider.type === 'box') {
                    const width = collider.width;
                    const height = collider.height;
                    
                    ctx.fillRect(-width / 2, -height / 2, width, height);
                    
                    // Kenarlık
                    ctx.strokeStyle = 'rgba(50, 100, 200, 0.8)';
                    ctx.lineWidth = 2 / this.zoomLevel;
                    ctx.strokeRect(-width / 2, -height / 2, width, height);
                } else if (collider.type === 'circle') {
                    const radius = collider.radius;
                    
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Kenarlık
                    ctx.strokeStyle = 'rgba(50, 100, 200, 0.8)';
                    ctx.lineWidth = 2 / this.zoomLevel;
                    ctx.stroke();
                }
            } else {
                // Varsayılan kare
                const defaultSize = 50;
                
                ctx.fillRect(-defaultSize / 2, -defaultSize / 2, defaultSize, defaultSize);
                
                // Kenarlık
                ctx.strokeStyle = 'rgba(50, 100, 200, 0.8)';
                ctx.lineWidth = 2 / this.zoomLevel;
                ctx.strokeRect(-defaultSize / 2, -defaultSize / 2, defaultSize, defaultSize);
            }
        }
        
        // Context durumunu geri yükle
        ctx.restore();
    }
    
    /**
     * Seçim çerçevesini çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {GameObject} object - Game object
     */
    _drawSelectionRect(ctx, object) {
        // Nesne pozisyonu, ölçeği ve rotasyonu
        const position = object.transform.getWorldPosition();
        const scale = object.transform.getWorldScale();
        const rotation = object.transform.getWorldRotation();
        
        // Ekran koordinatlarına dönüştür
        const screenPos = this._worldToScreen(position.x, position.y);
        
        // Context durumunu kaydet
        ctx.save();
        
        // Dönüşümleri uygula
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(rotation);
        
        // Seçim çerçevesi boyutunu hesapla
        let width, height;
        
        // Collider boyutlarına göre çerçeve
        const collider = object.getComponent('Collider');
        
        if (collider) {
            if (collider.type === 'box') {
                width = collider.width * scale.x * this.zoomLevel;
                height = collider.height * scale.y * this.zoomLevel;
            } else if (collider.type === 'circle') {
                width = collider.radius * 2 * scale.x * this.zoomLevel;
                height = collider.radius * 2 * scale.y * this.zoomLevel;
            }
        } else {
            // Varsayılan boyut
            const defaultSize = 50;
            width = defaultSize * scale.x * this.zoomLevel;
            height = defaultSize * scale.y * this.zoomLevel;
        }
        
        // Seçim çerçevesini çiz
        ctx.strokeStyle = this.config.selectionColor;
        ctx.lineWidth = this.config.selectionLineWidth;
        ctx.setLineDash([5, 5]);
        
        ctx.strokeRect(-width / 2, -height / 2, width, height);
        
        // Kontrol noktaları
        if (this.editMode === 'scale' || this.editMode === 'rotate') {
            // Kontrol noktaları için değişkenler
            const size = 8;
            ctx.fillStyle = this.config.selectionColor;
            
            // Kenar noktaları
            const points = [
                { x: 0, y: -height / 2 }, // Üst orta
                { x: width / 2, y: 0 }, // Sağ orta
                { x: 0, y: height / 2 }, // Alt orta
                { x: -width / 2, y: 0 }  // Sol orta
            ];
            
            // Döndürme noktası (üst orta noktanın üstünde)
            if (this.editMode === 'rotate') {
                const rotationHandleDistance = 30;
                
                // Rotasyon noktası
                ctx.beginPath();
                ctx.arc(0, -height / 2 - rotationHandleDistance, size / 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Rotasyon çizgisi
                ctx.beginPath();
                ctx.moveTo(0, -height / 2);
                ctx.lineTo(0, -height / 2 - rotationHandleDistance);
                ctx.stroke();
            }
            
            // Ölçeklendirme kontrol noktaları
            if (this.editMode === 'scale') {
                for (const point of points) {
                    ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
                }
            }
        }
        
        // Context durumunu geri yükle
        ctx.restore();
    }
    
    /**
     * Nesne ekler
     * @param {GameObject} object - Eklenecek nesne
     */
    addObject(object) {
        if (!object) return;
        
        // Nesneyi diziye ekle
        this.objects.push(object);
        
        // Sahne referansını ayarla
        object.scene = this.scene;
        
        // Nesneyi başlat
        if (object.start) {
            object.start();
        }
    }
    
    /**
     * Nesne kaldırır
     * @param {String} id - Kaldırılacak nesne ID'si
     */
    removeObject(id) {
        const index = this.objects.findIndex(obj => obj.id === id);
        
        if (index !== -1) {
            const object = this.objects[index];
            
            // Nesneyi diziden kaldır
            this.objects.splice(index, 1);
            
            // Seçimden kaldır
            this.selectedObjects = this.selectedObjects.filter(obj => obj.id !== id);
            
            // Nesneyi kaldır
            if (object.onDestroy) {
                object.onDestroy();
            }
            
            // Editor'a bildir
            if (this.config.editor) {
                this.config.editor.selectedObjects = [...this.selectedObjects];
            }
        }
    }
    
    /**
     * ID'ye göre nesne bulur
     * @param {String} id - Nesne ID'si
     * @return {GameObject} Bulunan nesne veya null
     */
    getObjectById(id) {
        return this.objects.find(obj => obj.id === id) || null;
    }
    
    /**
     * Seçimi temizler
     */
    clearSelection() {
        this.selectedObjects = [];
        
        // Editor'a bildir
        if (this.config.editor) {
            this.config.editor.selectedObjects = [];
        }
    }
    
    /**
     * Nesneyi seçer
     * @param {String} id - Nesne ID'si
     * @param {Boolean} addToSelection - Mevcut seçime ekle
     */
    selectObject(id, addToSelection = false) {
        const object = this.getObjectById(id);
        
        if (!object) return;
        
        // Seçime ekle/çıkar
        if (!addToSelection) {
            this.selectedObjects = [object];
        } else {
            if (!this.selectedObjects.includes(object)) {
                this.selectedObjects.push(object);
            }
        }
        
        // Editor'a bildir
        if (this.config.editor) {
            this.config.editor.selectedObjects = [...this.selectedObjects];
        }
    }
    
    /**
     * Seçili nesneleri siler
     */
    deleteSelectedObjects() {
        if (this.selectedObjects.length === 0) return;
        
        // Nesneleri kaldır
        for (const object of [...this.selectedObjects]) {
            this.removeObject(object.id);
        }
        
        // Seçimi temizle
        this.clearSelection();
    }
    
    /**
     * Sahneyi yükler
     * @param {String} sceneName - Sahne adı
     */
    loadScene(sceneName) {
        // Mevcut sahneyi temizle
        this.clearScene();
        
        // Sahne adını ayarla
        this.sceneName = sceneName;
        
        // Sahneyi yükle
        // Gerçek bir uygulamada sahne verilerini yükleme işlemi yapılır
        
        console.log(`Scene loaded: ${sceneName}`);
    }
    
    /**
     * Sahneyi temizler
     */
    clearScene() {
        // Tüm nesneleri temizle
        for (const object of [...this.objects]) {
            if (object.onDestroy) {
                object.onDestroy();
            }
        }
        
        this.objects = [];
        this.selectedObjects = [];
        
        // Editor'a bildir
        if (this.config.editor) {
            this.config.editor.selectedObjects = [];
        }
    }
    
    /**
     * Sahneyi oynatır
     */
    play() {
        if (this.isPlaying) return;
        
        // Oyun moduna geç
        this.viewMode = 'game';
        this.canvas.style.display = 'none';
        this.gameCanvas.style.display = 'block';
        
        // Game instance oluştur
        this.game = new Game({
            canvasId: this.gameCanvas.id,
            width: this.config.width,
            height: this.config.height
        });
        
        // Nesneleri oyuna aktar
        // Gerçek bir uygulamada, nesneleri oyun nesnelerine dönüştürme işlemi yapılır
        
        // Oyunu başlat
        this.game.start();
        
        this.isPlaying = true;
        this.isPaused = false;
    }
    
    /**
     * Sahneyi duraklatır
     */
    pause() {
        if (!this.isPlaying || this.isPaused) return;
        
        // Oyunu duraklat
        if (this.game) {
            this.game.pause();
        }
        
        this.isPaused = true;
    }
    
    /**
     * Sahneyi durdurur
     */
    stop() {
        if (!this.isPlaying) return;
        
        // Oyunu durdur
        if (this.game) {
            this.game.stop();
            this.game = null;
        }
        
        // Editor moduna geri dön
        this.viewMode = 'editor';
        this.canvas.style.display = 'block';
        this.gameCanvas.style.display = 'none';
        
        this.isPlaying = false;
        this.isPaused = false;
    }
    
    /**
     * Boyutları yeniden ayarlar
     */
    resize() {
        // Konteyner boyutunu al
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        
        // Canvas boyutlarını ayarla
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
        
        // Canvas stillerini ayarla
        const canvasContainer = this.canvas.parentElement;
        if (canvasContainer) {
            canvasContainer.style.width = `${containerWidth}px`;
            canvasContainer.style.height = `${containerHeight - this.toolbarElement.offsetHeight}px`;
        }
    }
}

// Singleton instance
SceneEditor.instance = null;