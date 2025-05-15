/**
 * ProjectManager.js - Proje yönetimi
 * Oyun projelerini yönetir ve düzenler
 */
class ProjectManager {
    constructor(config = {}) {
        // Yapılandırma
        this.config = Object.assign({
            container: null,
            editor: null,
            rootPath: '',
            autosave: true,
            recentProjectCount: 5
        }, config);
        
        // Proje bilgileri
        this.currentProject = null;
        this.recentProjects = [];
        this.projectTemplates = [
            { id: 'empty', name: 'Empty Project', description: 'Boş bir proje oluşturur' },
            { id: '2d-platformer', name: '2D Platform Oyunu', description: 'Platform oyunu şablonu' },
            { id: 'hyper-casual', name: 'Hyper Casual Oyun', description: 'Basit hyper casual oyun şablonu' }
        ];
        
        // DOM elementleri
        this.container = null;
        this.projectElements = {};
        
        // Başlat
        this._initialize();
    }
    
    /**
     * ProjectManager'ı başlatır
     */
    _initialize() {
        // Konteyner
        if (typeof this.config.container === 'string') {
            this.container = document.querySelector(this.config.container);
        } else {
            this.container = this.config.container;
        }
        
        if (!this.container) {
            console.error("Project manager container not found");
            return;
        }
        
        // Son projeleri yükle
        this._loadRecentProjects();
        
        // Temel düzeni oluştur
        this._createLayout();
    }
    
    /**
     * ProjectManager düzenini oluşturur
     */
    _createLayout() {
        // Ana konteyner
        this.container.innerHTML = '';
        this.container.classList.add('project-manager-container');
        
        // Başlık
        const header = document.createElement('div');
        header.className = 'project-manager-header';
        header.innerHTML = '<h2>Project Manager</h2>';
        this.container.appendChild(header);
        
        // Sekmeler
        const tabs = document.createElement('div');
        tabs.className = 'project-manager-tabs';
        
        const projectsTab = document.createElement('div');
        projectsTab.className = 'project-manager-tab active';
        projectsTab.setAttribute('data-tab', 'projects');
        projectsTab.textContent = 'Projects';
        projectsTab.addEventListener('click', () => this._switchTab('projects'));
        
        const assetsTab = document.createElement('div');
        assetsTab.className = 'project-manager-tab';
        assetsTab.setAttribute('data-tab', 'assets');
        assetsTab.textContent = 'Assets';
        assetsTab.addEventListener('click', () => this._switchTab('assets'));
        
        const settingsTab = document.createElement('div');
        settingsTab.className = 'project-manager-tab';
        settingsTab.setAttribute('data-tab', 'settings');
        settingsTab.textContent = 'Settings';
        settingsTab.addEventListener('click', () => this._switchTab('settings'));
        
        tabs.appendChild(projectsTab);
        tabs.appendChild(assetsTab);
        tabs.appendChild(settingsTab);
        
        this.container.appendChild(tabs);
        this.projectElements.tabs = tabs;
        
        // İçerik
        const content = document.createElement('div');
        content.className = 'project-manager-content';
        this.container.appendChild(content);
        this.projectElements.content = content;
        
        // İlk sekmeyi göster
        this._showProjectsPanel();
    }
    
    /**
     * Sekme değiştirir
     * @param {String} tabName - Sekme adı
     */
    _switchTab(tabName) {
        // Sekme sınıflarını güncelle
        const tabs = this.projectElements.tabs.querySelectorAll('.project-manager-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
        });
        
        // İçeriği temizle
        this.projectElements.content.innerHTML = '';
        
        // Sekmeye göre içeriği göster
        switch (tabName) {
            case 'projects':
                this._showProjectsPanel();
                break;
            case 'assets':
                this._showAssetsPanel();
                break;
            case 'settings':
                this._showSettingsPanel();
                break;
        }
    }
    
    /**
     * Projeler panelini gösterir
     */
    _showProjectsPanel() {
        const content = this.projectElements.content;
        content.innerHTML = '';
        
        // Yeni proje oluşturma
        const newProjectSection = document.createElement('div');
        newProjectSection.className = 'project-section';
        
        const newProjectTitle = document.createElement('h3');
        newProjectTitle.textContent = 'New Project';
        newProjectSection.appendChild(newProjectTitle);
        
        const newProjectGrid = document.createElement('div');
        newProjectGrid.className = 'project-template-grid';
        
        // Proje şablonları
        for (const template of this.projectTemplates) {
            const templateCard = document.createElement('div');
            templateCard.className = 'project-template-card';
            
            const templateIcon = document.createElement('div');
            templateIcon.className = 'project-template-icon';
            templateIcon.textContent = template.id === 'empty' ? '📄' : (template.id === '2d-platformer' ? '🎮' : '📱');
            
            const templateInfo = document.createElement('div');
            templateInfo.className = 'project-template-info';
            
            const templateName = document.createElement('div');
            templateName.className = 'project-template-name';
            templateName.textContent = template.name;
            
            const templateDesc = document.createElement('div');
            templateDesc.className = 'project-template-description';
            templateDesc.textContent = template.description;
            
            templateInfo.appendChild(templateName);
            templateInfo.appendChild(templateDesc);
            
            templateCard.appendChild(templateIcon);
            templateCard.appendChild(templateInfo);
            
            templateCard.addEventListener('click', () => {
                this._createNewProject(template.id);
            });
            
            newProjectGrid.appendChild(templateCard);
        }
        
        newProjectSection.appendChild(newProjectGrid);
        content.appendChild(newProjectSection);
        
        // Son projeler
        const recentProjectsSection = document.createElement('div');
        recentProjectsSection.className = 'project-section';
        
        const recentProjectsTitle = document.createElement('h3');
        recentProjectsTitle.textContent = 'Recent Projects';
        recentProjectsSection.appendChild(recentProjectsTitle);
        
        const recentProjectsList = document.createElement('div');
        recentProjectsList.className = 'recent-projects-list';
        
        if (this.recentProjects.length === 0) {
            const noProjects = document.createElement('div');
            noProjects.className = 'no-projects-message';
            noProjects.textContent = 'No recent projects';
            recentProjectsList.appendChild(noProjects);
        } else {
            // Son projeler listesi
            for (const project of this.recentProjects) {
                const projectItem = document.createElement('div');
                projectItem.className = 'recent-project-item';
                
                const projectName = document.createElement('div');
                projectName.className = 'recent-project-name';
                projectName.textContent = project.name;
                
                const projectPath = document.createElement('div');
                projectPath.className = 'recent-project-path';
                projectPath.textContent = project.path;
                
                const projectDate = document.createElement('div');
                projectDate.className = 'recent-project-date';
                projectDate.textContent = new Date(project.lastOpened).toLocaleString();
                
                projectItem.appendChild(projectName);
                projectItem.appendChild(projectPath);
                projectItem.appendChild(projectDate);
                
                projectItem.addEventListener('click', () => {
                    this.openProject(project.path);
                });
                
                recentProjectsList.appendChild(projectItem);
            }
        }
        
        recentProjectsSection.appendChild(recentProjectsList);
        content.appendChild(recentProjectsSection);
        
        // Diğer seçenekler
        const otherOptionsSection = document.createElement('div');
        otherOptionsSection.className = 'project-section';
        
        const otherOptionsTitle = document.createElement('h3');
        otherOptionsTitle.textContent = 'Other Options';
        otherOptionsSection.appendChild(otherOptionsTitle);
        
        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid';
        
        // Açma seçeneği
        const openOption = document.createElement('div');
        openOption.className = 'option-card';
        openOption.innerHTML = '<div class="option-icon">📂</div><div class="option-name">Open Project</div>';
        openOption.addEventListener('click', () => {
            this._openProjectDialog();
        });
        
        // İçe aktarma seçeneği
        const importOption = document.createElement('div');
        importOption.className = 'option-card';
        importOption.innerHTML = '<div class="option-icon">📥</div><div class="option-name">Import Project</div>';
        importOption.addEventListener('click', () => {
            this._importProject();
        });
        
        optionsGrid.appendChild(openOption);
        optionsGrid.appendChild(importOption);
        
        otherOptionsSection.appendChild(optionsGrid);
        content.appendChild(otherOptionsSection);
    }
    
    /**
     * Assets panelini gösterir
     */
    _showAssetsPanel() {
        const content = this.projectElements.content;
        content.innerHTML = '';
        
        // Proje açık değilse uyarı göster
        if (!this.currentProject) {
            const noProjectMessage = document.createElement('div');
            noProjectMessage.className = 'no-project-message';
            noProjectMessage.textContent = 'No project open. Please open a project first.';
            content.appendChild(noProjectMessage);
            return;
        }
        
        // Asset tarayıcısını göster
        if (this.config.editor && this.config.editor.assetBrowser) {
            const assetBrowser = this.config.editor.assetBrowser;
            
            // Asset tarayıcısını içerik alanına ekle
            assetBrowser.updateContainer(content);
            
            // Asset klasörünü göster
            assetBrowser.navigate('');
        } else {
            // AssetBrowser yok
            const noAssetBrowser = document.createElement('div');
            noAssetBrowser.className = 'no-asset-browser-message';
            noAssetBrowser.textContent = 'Asset Browser is not available';
            content.appendChild(noAssetBrowser);
        }
    }
    
    /**
     * Ayarlar panelini gösterir
     */
    _showSettingsPanel() {
        const content = this.projectElements.content;
        content.innerHTML = '';
        
        // Ayarlar başlığı
        const settingsTitle = document.createElement('h3');
        settingsTitle.textContent = 'Project Settings';
        content.appendChild(settingsTitle);
        
        // Proje açık değilse uyarı göster
        if (!this.currentProject) {
            const noProjectMessage = document.createElement('div');
            noProjectMessage.className = 'no-project-message';
            noProjectMessage.textContent = 'No project open. Please open a project first.';
            content.appendChild(noProjectMessage);
            return;
        }
        
        // Proje ayarları formu
        const settingsForm = document.createElement('div');
        settingsForm.className = 'settings-form';
        
        // Proje adı
        const nameGroup = document.createElement('div');
        nameGroup.className = 'settings-group';
        
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Project Name';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = this.currentProject.name;
        
        nameGroup.appendChild(nameLabel);
        nameGroup.appendChild(nameInput);
        
        // Açıklama
        const descGroup = document.createElement('div');
        descGroup.className = 'settings-group';
        
        const descLabel = document.createElement('label');
        descLabel.textContent = 'Description';
        
        const descInput = document.createElement('textarea');
        descInput.value = this.currentProject.description || '';
        
        descGroup.appendChild(descLabel);
        descGroup.appendChild(descInput);
        
        // Versiyon
        const versionGroup = document.createElement('div');
        versionGroup.className = 'settings-group';
        
        const versionLabel = document.createElement('label');
        versionLabel.textContent = 'Version';
        
        const versionInput = document.createElement('input');
        versionInput.type = 'text';
        versionInput.value = this.currentProject.version || '1.0.0';
        
        versionGroup.appendChild(versionLabel);
        versionGroup.appendChild(versionInput);
        
        // Kaydetme butonu
        const saveBtn = document.createElement('button');
        saveBtn.className = 'settings-save-btn';
        saveBtn.textContent = 'Save Settings';
        saveBtn.addEventListener('click', () => {
            // Ayarları güncelle
            this.currentProject.name = nameInput.value;
            this.currentProject.description = descInput.value;
            this.currentProject.version = versionInput.value;
            
            // Projeyi kaydet
            this.saveProject();
            
            // Bildirim
            alert('Project settings saved!');
        });
        
        // Formu oluştur
        settingsForm.appendChild(nameGroup);
        settingsForm.appendChild(descGroup);
        settingsForm.appendChild(versionGroup);
        settingsForm.appendChild(saveBtn);
        
        content.appendChild(settingsForm);
        
        // Build ayarları
        const buildTitle = document.createElement('h3');
        buildTitle.textContent = 'Build Settings';
        content.appendChild(buildTitle);
        
        const buildForm = document.createElement('div');
        buildForm.className = 'settings-form';
        
        // Platformlar
        const platformsGroup = document.createElement('div');
        platformsGroup.className = 'settings-group';
        
        const platformsLabel = document.createElement('label');
        platformsLabel.textContent = 'Platforms';
        
        const platformOptions = ['Web', 'Android', 'iOS'];
        
        for (const platform of platformOptions) {
            const checkboxGroup = document.createElement('div');
            checkboxGroup.className = 'checkbox-group';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `platform-${platform.toLowerCase()}`;
            checkbox.checked = this.currentProject.platforms && this.currentProject.platforms.includes(platform.toLowerCase());
            
            const checkboxLabel = document.createElement('label');
            checkboxLabel.textContent = platform;
            checkboxLabel.htmlFor = checkbox.id;
            
            checkboxGroup.appendChild(checkbox);
            checkboxGroup.appendChild(checkboxLabel);
            
            platformsGroup.appendChild(checkboxGroup);
        }
        
        // Build butonları
        const buildBtnsGroup = document.createElement('div');
        buildBtnsGroup.className = 'build-buttons-group';
        
        const buildWebBtn = document.createElement('button');
        buildWebBtn.textContent = 'Build for Web';
        buildWebBtn.addEventListener('click', () => {
            this._buildProject('web');
        });
        
        const buildAndroidBtn = document.createElement('button');
        buildAndroidBtn.textContent = 'Build for Android';
        buildAndroidBtn.addEventListener('click', () => {
            this._buildProject('android');
        });
        
        const buildIOSBtn = document.createElement('button');
        buildIOSBtn.textContent = 'Build for iOS';
        buildIOSBtn.addEventListener('click', () => {
            this._buildProject('ios');
        });
        
        buildBtnsGroup.appendChild(buildWebBtn);
        buildBtnsGroup.appendChild(buildAndroidBtn);
        buildBtnsGroup.appendChild(buildIOSBtn);
        
        // Formu oluştur
        buildForm.appendChild(platformsGroup);
        buildForm.appendChild(buildBtnsGroup);
        
        content.appendChild(buildForm);
    }
    
    /**
     * Yeni proje oluşturur
     * @param {String} templateId - Şablon ID'si
     */
    _createNewProject(templateId) {
        // Proje adı al
        const projectName = prompt('Project Name:', 'New Project');
        if (!projectName) return;
        
        // Proje yolu
        const projectPath = this.config.rootPath + '/' + projectName.replace(/\s+/g, '-').toLowerCase();
        
        // Yeni proje oluştur
        this.currentProject = {
            name: projectName,
            path: projectPath,
            template: templateId,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            scenes: [],
            assets: [],
            platforms: ['web'],
            version: '1.0.0'
        };
        
        // Şablona göre başlangıç içeriği
        switch (templateId) {
            case 'empty':
                // Varsayılan içerik
                this.currentProject.scenes.push('MainScene');
                break;
                
            case '2d-platformer':
                // Platform oyunu içeriği
                this.currentProject.scenes.push('MainMenuScene', 'GameScene', 'LevelSelectScene');
                break;
                
            case 'hyper-casual':
                // Hyper casual oyun içeriği
                this.currentProject.scenes.push('MainScene', 'GameScene', 'ShopScene');
                break;
        }
        
        // Projeyi kaydet
        this.saveProject();
        
        // Son projelere ekle
        this._addToRecentProjects(this.currentProject);
        
        // Editor'a bildir
        if (this.config.editor) {
            this.config.editor.currentProject = this.currentProject;
            this.config.editor.isProjectModified = false;
            this.config.editor._updateUI();
            
            // İlk sahneyi aç
            if (this.currentProject.scenes.length > 0) {
                this.config.editor.loadScene(this.currentProject.scenes[0]);
            }
        }
        
        // Projeleri güncelle
        this._switchTab('projects');
    }
    
    /**
     * Proje açma dialogu gösterir
     */
    _openProjectDialog() {
        // Gerçek bir uygulamada, dosya sistemi API'si ile proje dosyası seçtirme işlemi yapılır
        // Bu örnekte simüle ediyoruz
        const projectPath = prompt('Enter project path:', this.config.rootPath + '/my-project');
        
        if (projectPath) {
            this.openProject(projectPath);
        }
    }
    
    /**
     * Projeyi açar
     * @param {String} projectPath - Proje yolu
     */
    openProject(projectPath) {
        // Gerçek bir uygulamada, dosya sisteminden proje dosyasını okuma işlemi yapılır
        // Bu örnekte simüle ediyoruz
        
        // Proje adını yoldan çıkart
        const projectName = projectPath.split('/').pop();
        
        // Simüle proje verisi
        this.currentProject = {
            name: projectName,
            path: projectPath,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            lastOpened: new Date().toISOString(),
            scenes: ['MainScene', 'GameScene', 'SettingsScene'],
            assets: [],
            platforms: ['web'],
            version: '1.0.0'
        };
        
        // Son projelere ekle
        this._addToRecentProjects(this.currentProject);
        
        // Editor'a bildir
        if (this.config.editor) {
            this.config.editor.currentProject = this.currentProject;
            this.config.editor.isProjectModified = false;
            this.config.editor._updateUI();
            
            // İlk sahneyi aç
            if (this.currentProject.scenes.length > 0) {
                this.config.editor.loadScene(this.currentProject.scenes[0]);
            }
        }
        
        console.log(`Project opened: ${projectPath}`);
    }
    
    /**
     * Projeyi kaydeder
     */
    saveProject() {
        if (!this.currentProject) return;
        
        // Gerçek bir uygulamada, dosya sistemine proje dosyasını yazma işlemi yapılır
        // Bu örnekte simüle ediyoruz
        
        // Son değişiklik zamanını güncelle
        this.currentProject.lastModified = new Date().toISOString();
        
        console.log(`Project saved: ${this.currentProject.path}`);
        
        // Editor'a bildir
        if (this.config.editor) {
            this.config.editor.isProjectModified = false;
            this.config.editor._updateUI();
        }
    }
    
    /**
     * Projeyi build eder
     * @param {String} platform - Platform adı
     */
    _buildProject(platform) {
        if (!this.currentProject) return;
        
        // Platforma göre build yapılandırması
        let buildConfig = {};
        
        switch (platform) {
            case 'web':
                buildConfig = {
                    outputDir: `${this.currentProject.path}/build/web`,
                    minify: true,
                    bundleJs: true,
                    bundleCss: true
                };
                break;
                
            case 'android':
                buildConfig = {
                    outputDir: `${this.currentProject.path}/build/android`,
                    packageName: 'com.hypergame.' + this.currentProject.name.replace(/\s+/g, '').toLowerCase(),
                    versionCode: 1,
                    versionName: this.currentProject.version
                };
                break;
                
            case 'ios':
                buildConfig = {
                    outputDir: `${this.currentProject.path}/build/ios`,
                    bundleIdentifier: 'com.hypergame.' + this.currentProject.name.replace(/\s+/g, '').toLowerCase(),
                    buildVersion: this.currentProject.version,
                    buildNumber: '1'
                };
                break;
        }
        
        // Build işlemi
        console.log(`Building project for ${platform}:`, buildConfig);
        
        // Gerçek bir uygulamada ilgili builder'ı çağırırdık
        if (platform === 'web') {
            const webBuilder = new WebBuilder(buildConfig);
            webBuilder.build();
        } else if (platform === 'android') {
            const androidBuilder = new AndroidBuilder(buildConfig);
            androidBuilder.build();
        } else if (platform === 'ios') {
            const iosBuilder = new IOSBuilder(buildConfig);
            iosBuilder.build();
        }
        
        // Bildirim
        alert(`Project built for ${platform} successfully!`);
    }
    
    /**
     * Projeyi içe aktarır
     */
    _importProject() {
        // Gerçek bir uygulamada, dosya sistemi API'si ile proje dosyası seçtirme işlemi yapılır
        // Bu örnekte simüle ediyoruz
        const projectFile = prompt('Enter project file path:', 'my-project.hyper');
        
        if (projectFile) {
            // İçe aktarma işlemi
            console.log(`Importing project: ${projectFile}`);
            
            // Simüle proje verisi
            const projectName = projectFile.split('.')[0];
            const projectPath = this.config.rootPath + '/' + projectName;
            
            // Proje verisini oluştur
            this.currentProject = {
                name: projectName,
                path: projectPath,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                lastOpened: new Date().toISOString(),
                scenes: ['MainScene'],
                assets: [],
                platforms: ['web'],
                version: '1.0.0'
            };
            
            // Son projelere ekle
            this._addToRecentProjects(this.currentProject);
            
            // Editor'a bildir
            if (this.config.editor) {
                this.config.editor.currentProject = this.currentProject;
                this.config.editor.isProjectModified = false;
                this.config.editor._updateUI();
                
                // İlk sahneyi aç
                if (this.currentProject.scenes.length > 0) {
                    this.config.editor.loadScene(this.currentProject.scenes[0]);
                }
            }
            
            // Bildirim
            alert(`Project ${projectName} imported successfully!`);
        }
    }
    
    /**
     * Son projelere ekler
     * @param {Object} project - Proje verisi
     */
    _addToRecentProjects(project) {
        // Son açılma zamanını güncelle
        project.lastOpened = new Date().toISOString();
        
        // Projeler listesinden aynı yolu içeren projeyi kaldır
        this.recentProjects = this.recentProjects.filter(p => p.path !== project.path);
        
        // Başa ekle
        this.recentProjects.unshift({
            name: project.name,
            path: project.path,
            lastOpened: project.lastOpened
        });
        
        // Maksimum sayıda tut
        if (this.recentProjects.length > this.config.recentProjectCount) {
            this.recentProjects = this.recentProjects.slice(0, this.config.recentProjectCount);
        }
        
        // Son projeleri kaydet
        this._saveRecentProjects();
    }
    
    /**
     * Son projeleri yükler
     */
    _loadRecentProjects() {
        // Gerçek bir uygulamada, localStorage veya dosya sisteminden son projeleri yükleme işlemi yapılır
        // Bu örnekte simüle ediyoruz
        this.recentProjects = [
            {
                name: 'Sample Project',
                path: this.config.rootPath + '/sample-project',
                lastOpened: new Date().toISOString()
            }
        ];
    }
    
    /**
     * Son projeleri kaydeder
     */
    _saveRecentProjects() {
        // Gerçek bir uygulamada, localStorage veya dosya sistemine son projeleri kaydetme işlemi yapılır
        // Bu örnekte simüle ediyoruz
        console.log('Recent projects saved:', this.recentProjects);
    }
}