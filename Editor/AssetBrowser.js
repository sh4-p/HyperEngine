/**
 * AssetBrowser.js - Varlık tarayıcısı
 * Oyun varlıklarını görüntüleme, düzenleme ve yönetme arayüzü
 */
class AssetBrowser {
    constructor(config = {}) {
        // Yapılandırma
        this.config = Object.assign({
            container: null,          // Tarayıcının yerleştirileceği konteyner
            assetRoot: 'assets/',     // Varlık klasörü kök yolu
            thumbnailSize: 64,        // Küçük resim boyutu
            listView: false,          // Liste görünümü (false: grid görünümü)
            allowDragDrop: true,      // Sürükle-bırak desteği
            allowUpload: true,        // Dosya yükleme desteği
            allowDelete: true,        // Dosya silme desteği
            allowRename: true,        // Dosya yeniden adlandırma desteği
            allowFolders: true,       // Klasör desteği
            acceptedTypes: {          // Kabul edilen dosya türleri
                images: ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
                audio: ['.mp3', '.wav', '.ogg'],
                data: ['.json', '.xml', '.csv', '.txt'],
                fonts: ['.ttf', '.otf', '.woff', '.woff2'],
                scripts: ['.js'],
                shaders: ['.glsl', '.frag', '.vert'],
                spritesheets: ['.atlas', '.spritesheet']
            },
            showExtensions: true,     // Dosya uzantılarını göster
            showHiddenFiles: false,   // Gizli dosyaları göster
            sortBy: 'name',           // Sıralama alanı ('name', 'type', 'size', 'date')
            sortDirection: 'asc',     // Sıralama yönü ('asc', 'desc')
            showContextMenu: true,    // Sağ tık bağlam menüsü
            typeColors: {             // Dosya türü renkleri
                image: '#3498db',
                audio: '#9b59b6',
                data: '#e67e22',
                font: '#1abc9c',
                script: '#f1c40f',
                shader: '#e74c3c',
                spritesheet: '#2ecc71',
                folder: '#7f8c8d'
            }
        }, config);
        
        // İç durumlar
        this.currentPath = '';             // Geçerli klasör yolu
        this.selectedAssets = [];          // Seçili varlıklar
        this.clipboardAssets = [];         // Panodaki varlıklar
        this.clipboardOperation = null;    // Pano işlemi ('copy', 'cut')
        this.filterText = '';              // Filtreleme metni
        this.history = [];                 // Gezinme geçmişi
        this.historyIndex = -1;            // Geçerli geçmiş indeksi
        this.loading = false;              // Yükleme durumu
        this.draggedAsset = null;          // Sürüklenen varlık
        
        // UI Elementleri
        this.ui = {
            container: null,
            toolbar: null,
            breadcrumbs: null,
            sidebar: null,
            contentArea: null,
            statusBar: null,
            contextMenu: null
        };
        
        // Varlık yöneticisi referansı
        this.assetManager = AssetManager.getInstance();
        
        // Olay işleyicileri
        this.events = {
            onSelect: null,
            onOpen: null,
            onUpload: null,
            onChange: null,
            onDelete: null,
            onRename: null,
            onError: null,
            onDragStart: null,
            onDragEnd: null,
            onDrop: null
        };
        
        // Başlat
        this._initialize();
    }
    
    /**
     * AssetBrowser'ı başlatır
     * @private
     */
    _initialize() {
        // Konteyner kontrolü
        if (typeof this.config.container === 'string') {
            this.config.container = document.querySelector(this.config.container);
        }
        
        if (!this.config.container) {
            console.error('AssetBrowser: Container element is not defined');
            return;
        }
        
        // UI elementlerini oluştur
        this._createUI();
        
        // Olayları ayarla
        this._setupEvents();
        
        // İlk içeriği yükle
        this.navigate('');
    }
    
    /**
     * UI elementlerini oluşturur
     * @private
     */
    _createUI() {
        const container = this.config.container;
        
        // Ana konteyner
        this.ui.container = document.createElement('div');
        this.ui.container.className = 'asset-browser';
        
        // Araç çubuğu
        this.ui.toolbar = document.createElement('div');
        this.ui.toolbar.className = 'asset-browser-toolbar';
        this._createToolbar();
        
        // Ekmek kırıntıları
        this.ui.breadcrumbs = document.createElement('div');
        this.ui.breadcrumbs.className = 'asset-browser-breadcrumbs';
        
        // Yan panel
        this.ui.sidebar = document.createElement('div');
        this.ui.sidebar.className = 'asset-browser-sidebar';
        this._createSidebar();
        
        // İçerik alanı
        this.ui.contentArea = document.createElement('div');
        this.ui.contentArea.className = 'asset-browser-content';
        
        // Durum çubuğu
        this.ui.statusBar = document.createElement('div');
        this.ui.statusBar.className = 'asset-browser-statusbar';
        
        // Elementleri birleştir
        this.ui.container.appendChild(this.ui.toolbar);
        this.ui.container.appendChild(this.ui.breadcrumbs);
        this.ui.container.appendChild(this.ui.sidebar);
        this.ui.container.appendChild(this.ui.contentArea);
        this.ui.container.appendChild(this.ui.statusBar);
        
        // Konteyner'a ekle
        container.appendChild(this.ui.container);
        
        // Bağlam menüsü
        if (this.config.showContextMenu) {
            this._createContextMenu();
        }
    }
    
    /**
     * Araç çubuğunu oluşturur
     * @private
     */
    _createToolbar() {
        // Geri butonu
        const backBtn = document.createElement('button');
        backBtn.className = 'toolbar-button';
        backBtn.innerHTML = '&larr;';
        backBtn.title = 'Geri';
        backBtn.disabled = true;
        backBtn.addEventListener('click', () => this._navigateBack());
        
        // İleri butonu
        const forwardBtn = document.createElement('button');
        forwardBtn.className = 'toolbar-button';
        forwardBtn.innerHTML = '&rarr;';
        forwardBtn.title = 'İleri';
        forwardBtn.disabled = true;
        forwardBtn.addEventListener('click', () => this._navigateForward());
        
        // Üst klasöre git butonu
        const upBtn = document.createElement('button');
        upBtn.className = 'toolbar-button';
        upBtn.innerHTML = '&uarr;';
        upBtn.title = 'Üst Klasör';
        upBtn.addEventListener('click', () => this._navigateUp());
        
        // Ana klasöre git butonu
        const homeBtn = document.createElement('button');
        homeBtn.className = 'toolbar-button';
        homeBtn.innerHTML = '&#127968;';
        homeBtn.title = 'Ana Klasör';
        homeBtn.addEventListener('click', () => this.navigate(''));
        
        // Yenile butonu
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'toolbar-button';
        refreshBtn.innerHTML = '&#x21bb;';
        refreshBtn.title = 'Yenile';
        refreshBtn.addEventListener('click', () => this.refresh());
        
        // Yeni klasör butonu
        const newFolderBtn = document.createElement('button');
        newFolderBtn.className = 'toolbar-button';
        newFolderBtn.innerHTML = '&#128193;+';
        newFolderBtn.title = 'Yeni Klasör';
        newFolderBtn.addEventListener('click', () => this._createNewFolder());
        
        if (!this.config.allowFolders) {
            newFolderBtn.style.display = 'none';
        }
        
        // Dosya yükleme butonu
        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'toolbar-button';
        uploadBtn.innerHTML = '&#x2B06;';
        uploadBtn.title = 'Dosya Yükle';
        uploadBtn.addEventListener('click', () => this._uploadFiles());
        
        if (!this.config.allowUpload) {
            uploadBtn.style.display = 'none';
        }
        
        // Görünüm değiştirme butonu
        const viewBtn = document.createElement('button');
        viewBtn.className = 'toolbar-button';
        viewBtn.innerHTML = this.config.listView ? '&#x2630;' : '&#x25A6;';
        viewBtn.title = this.config.listView ? 'Grid Görünümü' : 'Liste Görünümü';
        viewBtn.addEventListener('click', () => this._toggleView());
        
        // Arama kutusu
        const searchBox = document.createElement('input');
        searchBox.type = 'text';
        searchBox.className = 'search-box';
        searchBox.placeholder = 'Ara...';
        searchBox.addEventListener('input', (e) => this._onSearch(e.target.value));
        
        // Araç çubuğuna ekle
        this.ui.toolbar.appendChild(backBtn);
        this.ui.toolbar.appendChild(forwardBtn);
        this.ui.toolbar.appendChild(upBtn);
        this.ui.toolbar.appendChild(homeBtn);
        this.ui.toolbar.appendChild(refreshBtn);
        this.ui.toolbar.appendChild(newFolderBtn);
        this.ui.toolbar.appendChild(uploadBtn);
        this.ui.toolbar.appendChild(viewBtn);
        this.ui.toolbar.appendChild(searchBox);
        
        // Referansları sakla
        this.ui.backBtn = backBtn;
        this.ui.forwardBtn = forwardBtn;
        this.ui.upBtn = upBtn;
        this.ui.homeBtn = homeBtn;
        this.ui.refreshBtn = refreshBtn;
        this.ui.newFolderBtn = newFolderBtn;
        this.ui.uploadBtn = uploadBtn;
        this.ui.viewBtn = viewBtn;
        this.ui.searchBox = searchBox;
    }
    
    /**
     * Yan paneli oluşturur
     * @private
     */
    _createSidebar() {
        // Klasör ağacı
        const folderTree = document.createElement('div');
        folderTree.className = 'folder-tree';
        
        // Filtreleme bölümü
        const filterSection = document.createElement('div');
        filterSection.className = 'filter-section';
        
        const filterTitle = document.createElement('h3');
        filterTitle.textContent = 'Filtreler';
        filterSection.appendChild(filterTitle);
        
        // Dosya türleri için filtreler
        const filterTypes = ['Hepsi', 'Resimler', 'Sesler', 'Veriler', 'Yazı Tipleri', 'Kodlar', 'Shader\'lar', 'Sprite Sheet\'ler'];
        
        const filterList = document.createElement('ul');
        filterList.className = 'filter-list';
        
        filterTypes.forEach((type, index) => {
            const item = document.createElement('li');
            item.textContent = type;
            item.setAttribute('data-filter', index === 0 ? 'all' : type.toLowerCase());
            item.className = index === 0 ? 'selected' : '';
            
            item.addEventListener('click', (e) => {
                // Tüm seçimleri kaldır
                const items = filterList.querySelectorAll('li');
                items.forEach(i => i.className = '');
                
                // Bu öğeyi seç
                e.target.className = 'selected';
                
                // Filtrelemeyi uygula
                this._applyTypeFilter(e.target.getAttribute('data-filter'));
            });
            
            filterList.appendChild(item);
        });
        
        filterSection.appendChild(filterList);
        
        // Yan panele ekle
        this.ui.sidebar.appendChild(folderTree);
        this.ui.sidebar.appendChild(filterSection);
        
        // Referansları sakla
        this.ui.folderTree = folderTree;
        this.ui.filterSection = filterSection;
    }
    
    /**
     * Bağlam menüsünü oluşturur
     * @private
     */
    _createContextMenu() {
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.style.display = 'none';
        
        // Menü öğeleri
        const menuItems = [
            { id: 'open', label: 'Aç', icon: '&#128065;' },
            { id: 'rename', label: 'Yeniden Adlandır', icon: '&#9998;' },
            { id: 'delete', label: 'Sil', icon: '&#128465;' },
            { id: 'separator1', type: 'separator' },
            { id: 'cut', label: 'Kes', icon: '&#9986;' },
            { id: 'copy', label: 'Kopyala', icon: '&#128203;' },
            { id: 'paste', label: 'Yapıştır', icon: '&#128203;' },
            { id: 'separator2', type: 'separator' },
            { id: 'newFolder', label: 'Yeni Klasör', icon: '&#128193;' },
            { id: 'upload', label: 'Dosya Yükle', icon: '&#8613;' },
            { id: 'separator3', type: 'separator' },
            { id: 'properties', label: 'Özellikler', icon: '&#8505;' }
        ];
        
        menuItems.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'separator';
                contextMenu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.setAttribute('data-action', item.id);
                
                const iconSpan = document.createElement('span');
                iconSpan.className = 'menu-icon';
                iconSpan.innerHTML = item.icon;
                
                const labelSpan = document.createElement('span');
                labelSpan.className = 'menu-label';
                labelSpan.textContent = item.label;
                
                menuItem.appendChild(iconSpan);
                menuItem.appendChild(labelSpan);
                
                menuItem.addEventListener('click', () => this._handleContextMenuAction(item.id));
                
                contextMenu.appendChild(menuItem);
            }
        });
        
        // Belgeye ekle
        document.body.appendChild(contextMenu);
        
        // Referansları sakla
        this.ui.contextMenu = contextMenu;
    }
    
    /**
     * Olayları ayarlar
     * @private
     */
    _setupEvents() {
        // Belge tıklaması (bağlam menüsünü kapat)
        document.addEventListener('click', (e) => {
            if (this.ui.contextMenu) {
                this.ui.contextMenu.style.display = 'none';
            }
        });
        
        // Sağ tık bağlam menüsü
        this.ui.contentArea.addEventListener('contextmenu', (e) => {
            if (!this.config.showContextMenu) return;
            
            e.preventDefault();
            
            const target = e.target.closest('.asset-item');
            const isOnAsset = !!target;
            
            // Menü öğelerini güncelle
            this._updateContextMenu(isOnAsset, target);
            
            // Menüyü konumlandır
            this.ui.contextMenu.style.display = 'block';
            this.ui.contextMenu.style.left = e.pageX + 'px';
            this.ui.contextMenu.style.top = e.pageY + 'px';
        });
        
        // Sürükle-bırak olayları
        if (this.config.allowDragDrop) {
            // Dosya bırakma alanı
            this.ui.contentArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                this.ui.contentArea.classList.add('drag-over');
            });
            
            this.ui.contentArea.addEventListener('dragleave', () => {
                this.ui.contentArea.classList.remove('drag-over');
            });
            
            this.ui.contentArea.addEventListener('drop', (e) => {
                e.preventDefault();
                this.ui.contentArea.classList.remove('drag-over');
                
                if (e.dataTransfer.files.length > 0) {
                    this._handleFileDrop(e.dataTransfer.files);
                }
            });
        }
    }
    
    /**
     * Bağlam menüsü eylemini işler
     * @private
     * @param {String} action - Eylem adı
     */
    _handleContextMenuAction(action) {
        switch (action) {
            case 'open':
                this._openSelected();
                break;
                
            case 'rename':
                this._renameSelected();
                break;
                
            case 'delete':
                this._deleteSelected();
                break;
                
            case 'cut':
                this._cutSelected();
                break;
                
            case 'copy':
                this._copySelected();
                break;
                
            case 'paste':
                this._paste();
                break;
                
            case 'newFolder':
                this._createNewFolder();
                break;
                
            case 'upload':
                this._uploadFiles();
                break;
                
            case 'properties':
                this._showProperties();
                break;
        }
        
        // Bağlam menüsünü kapat
        if (this.ui.contextMenu) {
            this.ui.contextMenu.style.display = 'none';
        }
    }
    
    /**
     * Bağlam menüsünü günceller
     * @private
     * @param {Boolean} isOnAsset - Varlık üzerinde mi
     * @param {HTMLElement} assetElement - Varlık elementi
     */
    _updateContextMenu(isOnAsset, assetElement) {
        if (!this.ui.contextMenu) return;
        
        // Menü öğelerini güncelle
        const menuItems = this.ui.contextMenu.querySelectorAll('.menu-item');
        
        for (const item of menuItems) {
            const action = item.getAttribute('data-action');
            
            // Varlık seçili değilse bazı öğeleri devre dışı bırak
            if (['open', 'rename', 'delete', 'cut', 'copy'].includes(action)) {
                item.classList.toggle('disabled', !isOnAsset);
            }
            
            // Pano boşsa yapıştır öğesini devre dışı bırak
            if (action === 'paste') {
                item.classList.toggle('disabled', this.clipboardAssets.length === 0);
            }
            
            // Klasör oluşturma izni yoksa gizle
            if (action === 'newFolder') {
                item.style.display = this.config.allowFolders ? 'flex' : 'none';
            }
            
            // Dosya yükleme izni yoksa gizle
            if (action === 'upload') {
                item.style.display = this.config.allowUpload ? 'flex' : 'none';
            }
        }
    }
    
    /**
     * Gezinme geçmişini günceller
     * @private
     * @param {String} path - Yeni yol
     */
    _updateHistory(path) {
        // Geçerli konumdan sonraki tüm geçmişi temizle
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Yeni yolu ekle
        this.history.push(path);
        this.historyIndex = this.history.length - 1;
        
        // Gezinme butonlarını güncelle
        this._updateNavigationButtons();
    }
    
    /**
     * Gezinme butonlarını günceller
     * @private
     */
    _updateNavigationButtons() {
        if (this.ui.backBtn) {
            this.ui.backBtn.disabled = this.historyIndex <= 0;
        }
        
        if (this.ui.forwardBtn) {
            this.ui.forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
    }
    
    /**
     * Geri düğmesine tıklamayı işler
     * @private
     */
    _navigateBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.navigate(this.history[this.historyIndex], false);
        }
    }
    
    /**
     * İleri düğmesine tıklamayı işler
     * @private
     */
    _navigateForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.navigate(this.history[this.historyIndex], false);
        }
    }
    
    /**
     * Üst klasöre gitmeyi işler
     * @private
     */
    _navigateUp() {
        if (this.currentPath === '') return;
        
        const parts = this.currentPath.split('/');
        parts.pop(); // Son klasörü kaldır
        const parentPath = parts.join('/');
        
        this.navigate(parentPath);
    }
    
    /**
     * Ekmek kırıntılarını günceller
     * @private
     */
    _updateBreadcrumbs() {
        if (!this.ui.breadcrumbs) return;
        
        // Eski içeriği temizle
        this.ui.breadcrumbs.innerHTML = '';
        
        // Ana klasör
        const homeItem = document.createElement('span');
        homeItem.className = 'breadcrumb-item';
        homeItem.innerHTML = '&#127968;';
        homeItem.title = 'Ana Klasör';
        homeItem.addEventListener('click', () => this.navigate(''));
        
        this.ui.breadcrumbs.appendChild(homeItem);
        
        // Ayırıcı
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '/';
        this.ui.breadcrumbs.appendChild(separator.cloneNode(true));
        
        // Eğer kök klasördeyse sadece ev simgesini göster
        if (this.currentPath === '') return;
        
        // Yol parçalarını ekle
        const parts = this.currentPath.split('/');
        let currentPath = '';
        
        parts.forEach((part, index) => {
            if (part === '') return;
            
            currentPath += part;
            
            const item = document.createElement('span');
            item.className = 'breadcrumb-item';
            item.textContent = part;
            item.title = currentPath;
            
            item.addEventListener('click', () => {
                this.navigate(currentPath);
            });
            
            this.ui.breadcrumbs.appendChild(item);
            
            // Ayırıcı (son öğe değilse)
            if (index < parts.length - 1) {
                this.ui.breadcrumbs.appendChild(separator.cloneNode(true));
                currentPath += '/';
            }
        });
    }
    
    /**
     * Klasör ağacını günceller
     * @private
     */
    _updateFolderTree() {
        if (!this.ui.folderTree) return;
        
        // Eski içeriği temizle
        this.ui.folderTree.innerHTML = '';
        
        // Ana klasör öğesi
        const rootItem = document.createElement('div');
        rootItem.className = 'folder-tree-item';
        rootItem.innerHTML = '<span class="folder-icon">&#128193;</span> Ana Klasör';
        rootItem.setAttribute('data-path', '');
        
        if (this.currentPath === '') {
            rootItem.classList.add('selected');
        }
        
        rootItem.addEventListener('click', () => {
            this.navigate('');
        });
        
        this.ui.folderTree.appendChild(rootItem);
        
        // Klasör yapısını oluştur (burada gerçek bir klasör yapısı almamız gerekir)
        // Bu örnek için basitleştirilmiş bir yapı kullanıyoruz
        const folders = [
            { path: 'images', name: 'Resimler' },
            { path: 'audio', name: 'Sesler' },
            { path: 'data', name: 'Veriler' },
            { path: 'scripts', name: 'Kodlar' },
            { path: 'fonts', name: 'Yazı Tipleri' }
        ];
        
        folders.forEach(folder => {
            const item = document.createElement('div');
            item.className = 'folder-tree-item';
            item.innerHTML = `<span class="folder-icon">&#128193;</span> ${folder.name}`;
            item.setAttribute('data-path', folder.path);
            
            if (this.currentPath === folder.path) {
                item.classList.add('selected');
            }
            
            item.addEventListener('click', () => {
                this.navigate(folder.path);
            });
            
            this.ui.folderTree.appendChild(item);
        });
    }
    
    /**
     * Durum çubuğunu günceller
     * @private
     * @param {Array} assets - Varlık listesi
     */
    _updateStatusBar(assets) {
        if (!this.ui.statusBar) return;
        
        const totalAssets = assets.length;
        const selectedCount = this.selectedAssets.length;
        
        let statusText = `${totalAssets} öğe`;
        
        if (selectedCount > 0) {
            statusText += `, ${selectedCount} seçili`;
        }
        
        this.ui.statusBar.textContent = statusText;
    }
    
    /**
     * Görünüm modunu değiştirir (liste/grid)
     * @private
     */
    _toggleView() {
        this.config.listView = !this.config.listView;
        
        // Görünüm butonunu güncelle
        if (this.ui.viewBtn) {
            this.ui.viewBtn.innerHTML = this.config.listView ? '&#x25A6;' : '&#x2630;';
            this.ui.viewBtn.title = this.config.listView ? 'Grid Görünümü' : 'Liste Görünümü';
        }
        
        // İçerik alanını güncelle
        if (this.ui.contentArea) {
            this.ui.contentArea.className = 'asset-browser-content' + (this.config.listView ? ' list-view' : ' grid-view');
        }
        
        // İçeriği yeniden yükle
        this.refresh();
    }
    
    /**
     * Arama kutusundaki değişiklikleri işler
     * @private
     * @param {String} text - Arama metni
     */
    _onSearch(text) {
        this.filterText = text;
        this.refresh();
    }
    
    /**
     * Belirli bir türe göre filtreler
     * @private
     * @param {String} type - Filtre türü
     */
    _applyTypeFilter(type) {
        // İçerik alanını güncelle
        if (type === 'all') {
            // Tüm öğeleri göster
            const items = this.ui.contentArea.querySelectorAll('.asset-item');
            items.forEach(item => {
                item.style.display = '';
            });
        } else {
            // Sadece belirli türdeki öğeleri göster
            const items = this.ui.contentArea.querySelectorAll('.asset-item');
            
            items.forEach(item => {
                const itemType = item.getAttribute('data-type');
                item.style.display = (itemType === type) ? '' : 'none';
            });
        }
        
        // Durum çubuğunu güncelle
        const visibleItems = this.ui.contentArea.querySelectorAll('.asset-item:not([style*="display: none"])');
        this._updateStatusBar(Array.from(visibleItems));
    }
    
    /**
     * Varlık türünü belirler
     * @private
     * @param {String} filename - Dosya adı
     * @return {String} Varlık türü
     */
    _getAssetType(filename) {
        if (!filename) return 'unknown';
        
        const extension = filename.split('.').pop().toLowerCase();
        
        // Uzantıya göre türü belirle
        for (const [type, extensions] of Object.entries(this.config.acceptedTypes)) {
            if (extensions.includes('.' + extension)) {
                return type === 'images' ? 'image' :
                       type === 'audio' ? 'audio' :
                       type === 'data' ? 'data' :
                       type === 'fonts' ? 'font' :
                       type === 'scripts' ? 'script' :
                       type === 'shaders' ? 'shader' :
                       type === 'spritesheets' ? 'spritesheet' :
                       'unknown';
            }
        }
        
        return 'unknown';
    }
    
    /**
     * Varlık öğesi oluşturur
     * @private
     * @param {Object} asset - Varlık
     * @return {HTMLElement} Varlık öğesi
     */
    _createAssetItem(asset) {
        const item = document.createElement('div');
        item.className = 'asset-item';
        item.setAttribute('data-path', asset.path);
        item.setAttribute('data-type', asset.type);
        
        // İkon
        const icon = document.createElement('div');
        icon.className = 'asset-icon';
        
        if (asset.type === 'folder') {
            icon.innerHTML = '&#128193;';
        } else if (asset.type === 'image') {
            // Resim için önizleme
            if (asset.previewUrl) {
                icon.style.backgroundImage = `url('${asset.previewUrl}')`;
                icon.classList.add('image-preview');
            } else {
                icon.innerHTML = '&#128247;';
            }
        } else if (asset.type === 'audio') {
            icon.innerHTML = '&#127925;';
        } else if (asset.type === 'data') {
            icon.innerHTML = '&#128196;';
        } else if (asset.type === 'font') {
            icon.innerHTML = '&#128394;';
        } else if (asset.type === 'script') {
            icon.innerHTML = '&#128187;';
        } else if (asset.type === 'shader') {
            icon.innerHTML = '&#9729;';
        } else if (asset.type === 'spritesheet') {
            icon.innerHTML = '&#127922;';
        } else {
            icon.innerHTML = '&#128196;';
        }
        
        // Renkli arka plan
        if (this.config.typeColors[asset.type]) {
            icon.style.backgroundColor = this.config.typeColors[asset.type];
        }
        
        // İsim
        const name = document.createElement('div');
        name.className = 'asset-name';
        name.textContent = asset.name;
        
        // Öğeyi oluştur
        item.appendChild(icon);
        item.appendChild(name);
        
        // Liste görünümü için ek bilgiler
        if (this.config.listView) {
            // Boyut
            const size = document.createElement('div');
            size.className = 'asset-size';
            
            if (asset.type !== 'folder' && asset.size !== undefined) {
                size.textContent = this._formatSize(asset.size);
            } else {
                size.textContent = '';
            }
            
            // Tür
            const type = document.createElement('div');
            type.className = 'asset-type';
            type.textContent = asset.type.charAt(0).toUpperCase() + asset.type.slice(1);
            
            // Değiştirilme tarihi
            const date = document.createElement('div');
            date.className = 'asset-date';
            
            if (asset.modifiedDate) {
                date.textContent = this._formatDate(asset.modifiedDate);
            } else {
                date.textContent = '';
            }
            
            // Liste görünümü için ek sütunlar
            item.appendChild(type);
            item.appendChild(size);
            item.appendChild(date);
        }
        
        // Olaylar
        item.addEventListener('click', (e) => {
            this._onItemClick(e, item);
        });
        
        item.addEventListener('dblclick', () => {
            this._onItemDoubleClick(item);
        });
        
        // Sürükle-bırak desteği
        if (this.config.allowDragDrop) {
            item.setAttribute('draggable', 'true');
            
            item.addEventListener('dragstart', (e) => {
                this._onItemDragStart(e, item);
            });
            
            item.addEventListener('dragend', () => {
                this._onItemDragEnd();
            });
        }
        
        return item;
    }
    
    /**
     * Klasöre git
     * @param {String} path - Klasör yolu
     * @param {Boolean} addToHistory - Geçmişe ekle
     */
    navigate(path, addToHistory = true) {
        // Önceki seçimleri temizle
        this.selectedAssets = [];
        
        // Yolu ayarla
        this.currentPath = path;
        
        // Geçmişe ekle
        if (addToHistory) {
            this._updateHistory(path);
        }
        
        // Ekmek kırıntılarını güncelle
        this._updateBreadcrumbs();
        
        // Klasör ağacını güncelle
        this._updateFolderTree();
        
        // İçeriği yükle
        this._loadContent();
    }
    
    /**
     * İçeriği yeniden yükler
     */
    refresh() {
        this._loadContent();
    }
    
    /**
     * İçeriği yükler
     * @private
     */
    _loadContent() {
        this.loading = true;
        
        // Yükleme göstergesi
        this.ui.contentArea.innerHTML = '<div class="loading-indicator">Yükleniyor...</div>';
        
        // Asenkron yükleme simülasyonu
        setTimeout(() => {
            // Gerçek uygulamada burada asıl içeriği yükleriz
            // Bu örnek için simüle edilmiş içerik
            
            // Varlıkları al
            let assets = this._getAssetsForPath(this.currentPath);
            
            // Filtreleme
            if (this.filterText) {
                const filter = this.filterText.toLowerCase();
                assets = assets.filter(asset => asset.name.toLowerCase().includes(filter));
            }
            
            // Sıralama
            assets = this._sortAssets(assets);
            
            // İçeriği temizle
            this.ui.contentArea.innerHTML = '';
            
            // Grid veya liste görünümünü ayarla
            this.ui.contentArea.className = 'asset-browser-content' + (this.config.listView ? ' list-view' : ' grid-view');
            
            // Başlık satırı (liste görünümünde)
            if (this.config.listView) {
                const header = document.createElement('div');
                header.className = 'asset-list-header';
                
                const nameHeader = document.createElement('div');
                nameHeader.className = 'asset-header-name';
                nameHeader.textContent = 'İsim';
                
                const typeHeader = document.createElement('div');
                typeHeader.className = 'asset-header-type';
                typeHeader.textContent = 'Tür';
                
                const sizeHeader = document.createElement('div');
                sizeHeader.className = 'asset-header-size';
                sizeHeader.textContent = 'Boyut';
                
                const dateHeader = document.createElement('div');
                dateHeader.className = 'asset-header-date';
                dateHeader.textContent = 'Tarih';
                
                header.appendChild(nameHeader);
                header.appendChild(typeHeader);
                header.appendChild(sizeHeader);
                header.appendChild(dateHeader);
                
                this.ui.contentArea.appendChild(header);
            }
            
            // Öğeleri ekle
            if (assets.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-message';
                emptyMessage.textContent = 'Bu klasör boş';
                
                this.ui.contentArea.appendChild(emptyMessage);
            } else {
                assets.forEach(asset => {
                    const item = this._createAssetItem(asset);
                    this.ui.contentArea.appendChild(item);
                });
            }
            
            // Durum çubuğunu güncelle
            this._updateStatusBar(assets);
            
            this.loading = false;
        }, 300);
    }
    
    /**
     * Varlıkları sıralar
     * @private
     * @param {Array} assets - Varlık listesi
     * @return {Array} Sıralanmış varlık listesi
     */
    _sortAssets(assets) {
        const { sortBy, sortDirection } = this.config;
        
        // Önce klasörleri ayır
        const folders = assets.filter(asset => asset.type === 'folder');
        const files = assets.filter(asset => asset.type !== 'folder');
        
        // Sıralama fonksiyonu
        const sortFunc = (a, b) => {
            let result = 0;
            
            if (sortBy === 'name') {
                result = a.name.localeCompare(b.name);
            } else if (sortBy === 'type') {
                result = a.type.localeCompare(b.type);
            } else if (sortBy === 'size') {
                result = (a.size || 0) - (b.size || 0);
            } else if (sortBy === 'date') {
                const dateA = a.modifiedDate ? new Date(a.modifiedDate) : new Date(0);
                const dateB = b.modifiedDate ? new Date(b.modifiedDate) : new Date(0);
                result = dateA - dateB;
            }
            
            return sortDirection === 'asc' ? result : -result;
        };
        
        // Klasörleri ve dosyaları ayrı ayrı sırala
        const sortedFolders = folders.sort(sortFunc);
        const sortedFiles = files.sort(sortFunc);
        
        // Önce klasörler, sonra dosyalar
        return [...sortedFolders, ...sortedFiles];
    }
    
    /**
     * Varlık öğesine tıklamayı işler
     * @private
     * @param {Event} e - Olay
     * @param {HTMLElement} item - Varlık öğesi
     */
    _onItemClick(e, item) {
        // Ctrl veya Shift tuşu ile çoklu seçim
        const isCtrlPressed = e.ctrlKey || e.metaKey;
        const isShiftPressed = e.shiftKey;
        
        if (!isCtrlPressed && !isShiftPressed) {
            // Normal tıklama - diğer seçimleri temizle
            this.ui.contentArea.querySelectorAll('.asset-item.selected').forEach(el => {
                el.classList.remove('selected');
            });
            
            this.selectedAssets = [];
            item.classList.add('selected');
            this.selectedAssets.push(item.getAttribute('data-path'));
        } else if (isCtrlPressed) {
            // Ctrl tuşu - tek öğe ekle/çıkar
            if (item.classList.contains('selected')) {
                item.classList.remove('selected');
                this.selectedAssets = this.selectedAssets.filter(path => path !== item.getAttribute('data-path'));
            } else {
                item.classList.add('selected');
                this.selectedAssets.push(item.getAttribute('data-path'));
            }
        } else if (isShiftPressed && this.selectedAssets.length > 0) {
            // Shift tuşu - aralık seç
            const items = Array.from(this.ui.contentArea.querySelectorAll('.asset-item'));
            const firstSelected = this.ui.contentArea.querySelector(`.asset-item[data-path="${this.selectedAssets[0]}"]`);
            
            if (!firstSelected) return;
            
            const firstIndex = items.indexOf(firstSelected);
            const currentIndex = items.indexOf(item);
            
            // Seçimleri temizle
            this.ui.contentArea.querySelectorAll('.asset-item.selected').forEach(el => {
                el.classList.remove('selected');
            });
            
            this.selectedAssets = [];
            
            // Min ve max indeks
            const minIndex = Math.min(firstIndex, currentIndex);
            const maxIndex = Math.max(firstIndex, currentIndex);
            
            // Aralıktaki tüm öğeleri seç
            for (let i = minIndex; i <= maxIndex; i++) {
                items[i].classList.add('selected');
                this.selectedAssets.push(items[i].getAttribute('data-path'));
            }
        }
        
        // Seçim olayını çağır
        if (this.events.onSelect) {
            this.events.onSelect(this.selectedAssets);
        }
        
        // Durum çubuğunu güncelle
        this._updateStatusBar(this._getAssetsForPath(this.currentPath));
    }
    
    /**
     * Varlık öğesine çift tıklamayı işler
     * @private
     * @param {HTMLElement} item - Varlık öğesi
     */
    _onItemDoubleClick(item) {
        const type = item.getAttribute('data-type');
        const path = item.getAttribute('data-path');
        
        if (type === 'folder') {
            // Klasöre git
            this.navigate(path);
        } else {
            // Dosyayı aç
            if (this.events.onOpen) {
                this.events.onOpen(path, type);
            }
        }
    }
    
    /**
     * Varlık sürükleme başlangıcını işler
     * @private
     * @param {Event} e - DragEvent
     * @param {HTMLElement} item - Varlık öğesi
     */
    _onItemDragStart(e, item) {
        this.draggedAsset = item.getAttribute('data-path');
        
        // Veriyi ayarla
        e.dataTransfer.setData('text/plain', item.getAttribute('data-path'));
        e.dataTransfer.effectAllowed = 'move';
        
        // Özel bir sürükleme görüntüsü ayarla
        const ghost = item.cloneNode(true);
        ghost.style.opacity = '0.7';
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        
        // Biraz gecikmeyle kaldır
        setTimeout(() => {
            document.body.removeChild(ghost);
        }, 0);
        
        // Olayı çağır
        if (this.events.onDragStart) {
            this.events.onDragStart(this.draggedAsset);
        }
    }
    
    /**
     * Varlık sürükleme bitişini işler
     * @private
     */
    _onItemDragEnd() {
        this.draggedAsset = null;
        
        // Olayı çağır
        if (this.events.onDragEnd) {
            this.events.onDragEnd();
        }
    }
    
    /**
     * Dosya bırakmayı işler
     * @private
     * @param {FileList} files - Dosya listesi
     */
    _handleFileDrop(files) {
        if (!this.config.allowUpload) return;
        
        // Dosyaları hedef klasöre yükle
        if (this.events.onUpload) {
            this.events.onUpload(files, this.currentPath);
        }
    }
    
    /**
     * Yeni klasör oluştur
     * @private
     */
    _createNewFolder() {
        if (!this.config.allowFolders) return;
        
        const folderName = prompt('Yeni klasör adı:', 'Yeni Klasör');
        
        if (folderName) {
            // Klasör oluşturma işlemini yap
            // Gerçek uygulamada burada asıl işlem yapılmalı
            console.log(`Creating folder: ${this.currentPath}/${folderName}`);
            
            // Değişiklik olayını çağır
            if (this.events.onChange) {
                this.events.onChange('create', 'folder', `${this.currentPath}/${folderName}`);
            }
            
            // İçeriği yenile
            this.refresh();
        }
    }
    
    /**
     * Dosya yükle
     * @private
     */
    _uploadFiles() {
        if (!this.config.allowUpload) return;
        
        // Dosya seçiciyi oluştur
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        
        // Kabul edilen dosya türlerini ayarla
        const acceptedExtensions = [];
        
        for (const extensions of Object.values(this.config.acceptedTypes)) {
            acceptedExtensions.push(...extensions);
        }
        
        input.accept = acceptedExtensions.join(',');
        
        // Değişiklik olayı
        input.addEventListener('change', () => {
            if (input.files.length > 0) {
                // Dosyaları hedef klasöre yükle
                if (this.events.onUpload) {
                    this.events.onUpload(input.files, this.currentPath);
                }
            }
        });
        
        // Dosya seçiciyi aç
        input.click();
    }
    
    /**
     * Seçili varlıkları sil
     * @private
     */
    _deleteSelected() {
        if (!this.config.allowDelete || this.selectedAssets.length === 0) return;
        
        const confirmMessage = this.selectedAssets.length === 1
            ? `"${this.selectedAssets[0].split('/').pop()}" öğesini silmek istediğinizden emin misiniz?`
            : `${this.selectedAssets.length} öğeyi silmek istediğinizden emin misiniz?`;
        
        if (confirm(confirmMessage)) {
            // Silme işlemini yap
            // Gerçek uygulamada burada asıl işlem yapılmalı
            console.log(`Deleting: ${this.selectedAssets.join(', ')}`);
            
            // Değişiklik olayını çağır
            if (this.events.onDelete) {
                this.events.onDelete(this.selectedAssets);
            }
            
            // İçeriği yenile
            this.refresh();
        }
    }
    
    /**
     * Seçili varlıkları yeniden adlandır
     * @private
     */
    _renameSelected() {
        if (!this.config.allowRename || this.selectedAssets.length !== 1) return;
        
        const assetPath = this.selectedAssets[0];
        const oldName = assetPath.split('/').pop();
        
        const newName = prompt('Yeni ad:', oldName);
        
        if (newName && newName !== oldName) {
            // Yeniden adlandırma işlemini yap
            // Gerçek uygulamada burada asıl işlem yapılmalı
            console.log(`Renaming: ${assetPath} to ${newName}`);
            
            // Değişiklik olayını çağır
            if (this.events.onRename) {
                this.events.onRename(assetPath, newName);
            }
            
            // İçeriği yenile
            this.refresh();
        }
    }
    
    /**
     * Seçili varlıkları kes
     * @private
     */
    _cutSelected() {
        if (this.selectedAssets.length === 0) return;
        
        this.clipboardAssets = [...this.selectedAssets];
        this.clipboardOperation = 'cut';
    }
    
    /**
     * Seçili varlıkları kopyala
     * @private
     */
    _copySelected() {
        if (this.selectedAssets.length === 0) return;
        
        this.clipboardAssets = [...this.selectedAssets];
        this.clipboardOperation = 'copy';
    }
    
    /**
     * Panodaki varlıkları yapıştır
     * @private
     */
    _paste() {
        if (this.clipboardAssets.length === 0 || !this.clipboardOperation) return;
        
        // Yapıştırma işlemini yap
        // Gerçek uygulamada burada asıl işlem yapılmalı
        console.log(`${this.clipboardOperation.charAt(0).toUpperCase() + this.clipboardOperation.slice(1)}ing ${this.clipboardAssets.join(', ')} to ${this.currentPath}`);
        
        // Değişiklik olayını çağır
        if (this.events.onChange) {
            this.events.onChange(this.clipboardOperation, 'multiple', this.clipboardAssets, this.currentPath);
        }
        
        // Kes işlemi ise panoyu temizle
        if (this.clipboardOperation === 'cut') {
            this.clipboardAssets = [];
            this.clipboardOperation = null;
        }
        
        // İçeriği yenile
        this.refresh();
    }
    
    /**
     * Seçili varlıkları aç
     * @private
     */
    _openSelected() {
        if (this.selectedAssets.length !== 1) return;
        
        const assetPath = this.selectedAssets[0];
        const assetType = this._getAssetTypeFromPath(assetPath);
        
        if (assetType === 'folder') {
            // Klasöre git
            this.navigate(assetPath);
        } else {
            // Dosyayı aç
            if (this.events.onOpen) {
                this.events.onOpen(assetPath, assetType);
            }
        }
    }
    
    /**
     * Varlık özelliklerini göster
     * @private
     */
    _showProperties() {
        if (this.selectedAssets.length !== 1) return;
        
        const assetPath = this.selectedAssets[0];
        
        // Varlık bilgilerini al
        // Gerçek uygulamada burada asıl bilgiler alınmalı
        const asset = this._getAssetByPath(assetPath);
        
        if (!asset) return;
        
        // Özellikler diyaloğu
        const properties = `
            İsim: ${asset.name}
            Yol: ${asset.path}
            Tür: ${asset.type}
            Boyut: ${asset.size ? this._formatSize(asset.size) : 'N/A'}
            Değiştirilme Tarihi: ${asset.modifiedDate ? this._formatDate(asset.modifiedDate) : 'N/A'}
        `;
        
        alert(properties);
    }
    
    /**
     * Belirli bir yol için varlıkları alır
     * @private
     * @param {String} path - Klasör yolu
     * @return {Array} Varlık listesi
     */
    _getAssetsForPath(path) {
        // Gerçek uygulamada burada asıl varlıklar alınmalı
        // Bu örnek için simüle edilmiş varlıklar
        
        // Kök klasör için
        if (path === '') {
            return [
                { name: 'images', path: 'images', type: 'folder' },
                { name: 'audio', path: 'audio', type: 'folder' },
                { name: 'data', path: 'data', type: 'folder' },
                { name: 'scripts', path: 'scripts', type: 'folder' },
                { name: 'fonts', path: 'fonts', type: 'folder' },
                { name: 'config.json', path: 'config.json', type: 'data', size: 2048, modifiedDate: '2023-04-15T14:30:00Z' },
                { name: 'game.js', path: 'game.js', type: 'script', size: 15360, modifiedDate: '2023-04-20T11:15:00Z' }
            ];
        }
        
        // Alt klasörler için
        if (path === 'images') {
            return [
                { name: 'backgrounds', path: 'images/backgrounds', type: 'folder' },
                { name: 'sprites', path: 'images/sprites', type: 'folder' },
                { name: 'ui', path: 'images/ui', type: 'folder' },
                { name: 'logo.png', path: 'images/logo.png', type: 'image', size: 24576, modifiedDate: '2023-03-10T09:45:00Z' },
                { name: 'player.png', path: 'images/player.png', type: 'image', size: 12288, modifiedDate: '2023-03-12T16:20:00Z' },
                { name: 'enemy.png', path: 'images/enemy.png', type: 'image', size: 10240, modifiedDate: '2023-03-14T13:10:00Z' }
            ];
        }
        
        if (path === 'audio') {
            return [
                { name: 'music', path: 'audio/music', type: 'folder' },
                { name: 'sfx', path: 'audio/sfx', type: 'folder' },
                { name: 'background.mp3', path: 'audio/background.mp3', type: 'audio', size: 2097152, modifiedDate: '2023-03-20T10:30:00Z' },
                { name: 'click.wav', path: 'audio/click.wav', type: 'audio', size: 32768, modifiedDate: '2023-03-22T15:45:00Z' }
            ];
        }
        
        if (path === 'data') {
            return [
                { name: 'levels', path: 'data/levels', type: 'folder' },
                { name: 'characters.json', path: 'data/characters.json', type: 'data', size: 4096, modifiedDate: '2023-04-01T11:20:00Z' },
                { name: 'items.json', path: 'data/items.json', type: 'data', size: 8192, modifiedDate: '2023-04-03T14:15:00Z' }
            ];
        }
        
        if (path === 'scripts') {
            return [
                { name: 'components', path: 'scripts/components', type: 'folder' },
                { name: 'utils', path: 'scripts/utils', type: 'folder' },
                { name: 'main.js', path: 'scripts/main.js', type: 'script', size: 5120, modifiedDate: '2023-04-10T09:30:00Z' },
                { name: 'player.js', path: 'scripts/player.js', type: 'script', size: 3072, modifiedDate: '2023-04-12T11:45:00Z' }
            ];
        }
        
        if (path === 'fonts') {
            return [
                { name: 'arial.ttf', path: 'fonts/arial.ttf', type: 'font', size: 102400, modifiedDate: '2023-02-15T10:00:00Z' },
                { name: 'roboto.ttf', path: 'fonts/roboto.ttf', type: 'font', size: 86016, modifiedDate: '2023-02-16T14:20:00Z' }
            ];
        }
        
        // Alt klasörler için
        if (path === 'images/backgrounds') {
            return [
                { name: 'forest.png', path: 'images/backgrounds/forest.png', type: 'image', size: 204800, modifiedDate: '2023-03-05T11:30:00Z' },
                { name: 'city.png', path: 'images/backgrounds/city.png', type: 'image', size: 307200, modifiedDate: '2023-03-06T14:45:00Z' }
            ];
        }
        
        // Varsayılan olarak boş dizi
        return [];
    }
    
    /**
     * Yoldan varlık türünü alır
     * @private
     * @param {String} path - Varlık yolu
     * @return {String} Varlık türü
     */
    _getAssetTypeFromPath(path) {
        // Klasör kontrolü
        const assets = this._getAssetsForPath(this.currentPath);
        const asset = assets.find(a => a.path === path);
        
        if (asset) {
            return asset.type;
        }
        
        // Uzantıya göre türü tahmin et
        return this._getAssetType(path);
    }
    
    /**
     * Yoldan varlık bilgisini alır
     * @private
     * @param {String} path - Varlık yolu
     * @return {Object} Varlık bilgisi
     */
    _getAssetByPath(path) {
        const assets = this._getAssetsForPath(this.currentPath);
        return assets.find(a => a.path === path);
    }
    
    /**
     * Boyutu formatlar
     * @private
     * @param {Number} bytes - Bayt cinsinden boyut
     * @return {String} Formatlanmış boyut
     */
    _formatSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Tarihi formatlar
     * @private
     * @param {String} dateString - ISO tarih dizgisi
     * @return {String} Formatlanmış tarih
     */
    _formatDate(dateString) {
        const date = new Date(dateString);
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }
    
    /**
     * Olay işleyicisini ayarlar
     * @param {String} event - Olay adı
     * @param {Function} callback - Geri çağırım fonksiyonu
     */
    on(event, callback) {
        if (this.events.hasOwnProperty(event)) {
            this.events[event] = callback;
        }
    }
}

module.exports = AssetBrowser;