/**
 * Toolbar.js - Araç çubuğu bileşeni
 * Editor için araç çubuğu ve düğmeler sağlar
 */
class Toolbar {
    constructor(params = {}) {
        // Parametreler
        this.container = params.container || null;
        this.editor = params.editor || null;
        
        // Butonlar ve gruplar
        this.buttons = {};
        this.groups = {};
        
        // Durum değişkenleri
        this.isEnabled = true;
        
        // Olay dinleyicileri
        this.eventListeners = {};
        
        // Arayüzü oluştur
        this._createUI();
    }
    
    /**
     * Araç çubuğu arayüzünü oluşturur
     */
    _createUI() {
        if (!this.container) return;
        
        // Konteyner sınıfını ayarla
        this.container.classList.add('editor-toolbar');
        
        // Grupları oluştur
        this._createFileGroup();
        this._createEditGroup();
        this._createViewGroup();
        this._createPlayGroup();
        this._createHelpGroup();
    }
    
    /**
     * Dosya grubu butonlarını oluşturur
     */
    _createFileGroup() {
        const fileGroup = this._createButtonGroup('file', 'Dosya');
        
        // Yeni proje butonu
        this._createButton(fileGroup, {
            id: 'newProject',
            icon: '📄',
            tooltip: 'Yeni Proje',
            click: () => this._emit('newProject')
        });
        
        // Proje aç butonu
        this._createButton(fileGroup, {
            id: 'openProject',
            icon: '📂',
            tooltip: 'Proje Aç',
            click: () => this._emit('openProject')
        });
        
        // Kaydet butonu
        this._createButton(fileGroup, {
            id: 'saveProject',
            icon: '💾',
            tooltip: 'Projeyi Kaydet',
            click: () => this._emit('saveProject')
        });
        
        // Dışa aktar butonu
        this._createButton(fileGroup, {
            id: 'exportProject',
            icon: '📤',
            tooltip: 'Dışa Aktar',
            click: () => this._emit('exportProject')
        });
        
        // Ayarlar butonu
        this._createButton(fileGroup, {
            id: 'settings',
            icon: '⚙️',
            tooltip: 'Ayarlar',
            click: () => this._emit('settings')
        });
    }
    
    /**
     * Düzenleme grubu butonlarını oluşturur
     */
    _createEditGroup() {
        const editGroup = this._createButtonGroup('edit', 'Düzenle');
        
        // Geri al butonu
        this._createButton(editGroup, {
            id: 'undo',
            icon: '↩️',
            tooltip: 'Geri Al',
            click: () => this._emit('undo')
        });
        
        // Yinele butonu
        this._createButton(editGroup, {
            id: 'redo',
            icon: '↪️',
            tooltip: 'Yinele',
            click: () => this._emit('redo')
        });
        
        // Kes butonu
        this._createButton(editGroup, {
            id: 'cut',
            icon: '✂️',
            tooltip: 'Kes',
            click: () => this._emit('cut')
        });
        
        // Kopyala butonu
        this._createButton(editGroup, {
            id: 'copy',
            icon: '📋',
            tooltip: 'Kopyala',
            click: () => this._emit('copy')
        });
        
        // Yapıştır butonu
        this._createButton(editGroup, {
            id: 'paste',
            icon: '📌',
            tooltip: 'Yapıştır',
            click: () => this._emit('paste')
        });
        
        // Sil butonu
        this._createButton(editGroup, {
            id: 'delete',
            icon: '🗑️',
            tooltip: 'Sil',
            click: () => this._emit('delete')
        });
    }
    
    /**
     * Görünüm grubu butonlarını oluşturur
     */
    _createViewGroup() {
        const viewGroup = this._createButtonGroup('view', 'Görünüm');
        
        // Izgara butonu
        this._createButton(viewGroup, {
            id: 'grid',
            icon: '⊞',
            tooltip: 'Izgarayı Göster/Gizle',
            toggle: true,
            active: true,
            click: (active) => this._emit('toggleGrid', active)
        });
        
        // Yapıştır butonu
        this._createButton(viewGroup, {
            id: 'snap',
            icon: '⊛',
            tooltip: 'Izgaraya Yapıştır',
            toggle: true,
            active: true,
            click: (active) => this._emit('toggleSnap', active)
        });
        
        // Yakınlaştır butonu
        this._createButton(viewGroup, {
            id: 'zoomIn',
            icon: '🔍+',
            tooltip: 'Yakınlaştır',
            click: () => this._emit('zoomIn')
        });
        
        // Uzaklaştır butonu
        this._createButton(viewGroup, {
            id: 'zoomOut',
            icon: '🔍-',
            tooltip: 'Uzaklaştır',
            click: () => this._emit('zoomOut')
        });
        
        // Ekrana sığdır butonu
        this._createButton(viewGroup, {
            id: 'fitToScreen',
            icon: '🔲',
            tooltip: 'Ekrana Sığdır',
            click: () => this._emit('fitToScreen')
        });
    }
    
    /**
     * Oynatma grubu butonlarını oluşturur
     */
    _createPlayGroup() {
        const playGroup = this._createButtonGroup('play', 'Oynat');
        
        // Oynat butonu
        this._createButton(playGroup, {
            id: 'play',
            icon: '▶️',
            tooltip: 'Oynat',
            click: () => this._emit('play')
        });
        
        // Duraklat butonu
        this._createButton(playGroup, {
            id: 'pause',
            icon: '⏸️',
            tooltip: 'Duraklat',
            click: () => this._emit('pause')
        });
        
        // Durdur butonu
        this._createButton(playGroup, {
            id: 'stop',
            icon: '⏹️',
            tooltip: 'Durdur',
            click: () => this._emit('stop')
        });
    }
    
    /**
     * Yardım grubu butonlarını oluşturur
     */
    _createHelpGroup() {
        const helpGroup = this._createButtonGroup('help', 'Yardım');
        
        // Dokümantasyon butonu
        this._createButton(helpGroup, {
            id: 'docs',
            icon: '📚',
            tooltip: 'Dokümantasyon',
            click: () => this._emit('showDocs')
        });
        
        // Hakkında butonu
        this._createButton(helpGroup, {
            id: 'about',
            icon: 'ℹ️',
            tooltip: 'Hakkında',
            click: () => this._emit('showAbout')
        });
    }
    
    /**
     * Buton grubu oluşturur
     * @param {String} id - Grup ID
     * @param {String} title - Grup başlığı
     * @return {HTMLElement} Grup elementi
     */
    _createButtonGroup(id, title) {
        const group = document.createElement('div');
        group.className = 'toolbar-group';
        group.setAttribute('data-group', id);
        group.setAttribute('title', title);
        
        this.container.appendChild(group);
        this.groups[id] = group;
        
        return group;
    }
    
    /**
     * Buton oluşturur
     * @param {HTMLElement} group - Butonun ekleneceği grup
     * @param {Object} options - Buton seçenekleri
     * @return {HTMLElement} Buton elementi
     */
    _createButton(group, options) {
        const button = document.createElement('button');
        button.className = 'toolbar-button';
        button.setAttribute('data-action', options.id);
        button.setAttribute('title', options.tooltip || '');
        
        // İkon
        const icon = document.createElement('span');
        icon.className = 'toolbar-icon';
        icon.textContent = options.icon || '';
        button.appendChild(icon);
        
        // Etiket (isteğe bağlı)
        if (options.label) {
            const label = document.createElement('span');
            label.className = 'toolbar-label';
            label.textContent = options.label;
            button.appendChild(label);
        }
        
        // Toggle modu
        if (options.toggle) {
            button.classList.add('toggle-button');
            
            if (options.active) {
                button.classList.add('active');
            }
            
            button.addEventListener('click', () => {
                button.classList.toggle('active');
                
                if (options.click) {
                    options.click(button.classList.contains('active'));
                }
            });
        } else {
            button.addEventListener('click', options.click);
        }
        
        group.appendChild(button);
        this.buttons[options.id] = button;
        
        return button;
    }
    
    /**
     * Olay dinleyicisi ekler
     * @param {String} event - Olay adı
     * @param {Function} callback - Geri çağırma fonksiyonu
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        
        this.eventListeners[event].push(callback);
    }
    
    /**
     * Olay dinleyicisini kaldırır
     * @param {String} event - Olay adı
     * @param {Function} callback - Geri çağırma fonksiyonu
     */
    off(event, callback) {
        if (!this.eventListeners[event]) return;
        
        if (callback) {
            const index = this.eventListeners[event].indexOf(callback);
            
            if (index !== -1) {
                this.eventListeners[event].splice(index, 1);
            }
        } else {
            // Tüm dinleyicileri kaldır
            this.eventListeners[event] = [];
        }
    }
    
    /**
     * Olay tetikler
     * @param {String} event - Olay adı
     * @param {*} args - Olay argümanları
     */
    _emit(event, ...args) {
        if (!this.eventListeners[event]) return;
        
        for (const callback of this.eventListeners[event]) {
            callback(...args);
        }
    }
    
    /**
     * Araç çubuğunu günceller
     * @param {Object} state - Editor durumu
     */
    update(state = {}) {
        // Butonları etkinleştir/devre dışı bırak
        this._enableButton('undo', state.canUndo);
        this._enableButton('redo', state.canRedo);
        
        // Play ve pause butonlarını duruma göre güncelle
        this._enableButton('play', !state.isRunning);
        this._enableButton('pause', state.isRunning);
        this._enableButton('stop', state.isRunning);
        
        // Proje durumuna göre butonları güncelle
        this._enableButton('saveProject', state.projectName);
        
        // Seçim durumuna göre butonları güncelle
        this._enableButton('delete', state.hasSelection);
        this._enableButton('cut', state.hasSelection);
        this._enableButton('copy', state.hasSelection);
    }
    
    /**
     * Butonu etkinleştirir/devre dışı bırakır
     * @param {String} id - Buton ID
     * @param {Boolean} enabled - Etkin mi
     */
    _enableButton(id, enabled) {
        const button = this.buttons[id];
        
        if (button) {
            button.disabled = !enabled;
            
            if (enabled) {
                button.classList.remove('disabled');
            } else {
                button.classList.add('disabled');
            }
        }
    }
}