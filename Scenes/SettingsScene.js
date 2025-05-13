/**
 * SettingsScene.js - Ayarlar sahnesi
 * Oyun ayarlarını düzenleyen sahne
 */
class SettingsScene extends Scene {
    constructor(gameTitle = 'Hyper Game') {
        super('settings');
        
        this.gameTitle = gameTitle;
        
        // Olay işleyicileri
        this.onBack = null;
        this.onSave = null;
        
        // Ayarlar
        this.settings = {
            soundVolume: 1.0,
            musicVolume: 0.5,
            vibration: true,
            showFps: false,
            quality: 'high', // low, medium, high
            language: 'en', // en, tr, es, etc.
            controlType: 'touch' // touch, joystick, tilt
        };
    }
    
    /**
     * Sahne yüklendiğinde çağrılır
     */
    load() {
        super.load();
        
        // Ayarları yükle
        this._loadSettings();
        
        // Ana panel
        const screenWidth = this.game.engine.canvas.width;
        const screenHeight = this.game.engine.canvas.height;
        
        const settingsPanel = new Panel({
            x: screenWidth / 2 - 250,
            y: screenHeight / 2 - 250,
            width: 500,
            height: 500,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            cornerRadius: 20
        });
        
        // Ayarlar başlığı
        const titleText = new Text({
            text: 'Settings',
            x: 250,
            y: 40,
            font: '36px Arial',
            color: '#FFFFFF',
            align: 'center'
        });
        
        // Geri düğmesi
        const backButton = new Button({
            x: 20,
            y: 20,
            width: 80,
            height: 40,
            text: 'Back',
            backgroundColor: '#F44336',
            hoverBackgroundColor: '#EF5350',
            pressedBackgroundColor: '#D32F2F',
            onClick: () => {
                if (this.onBack) {
                    this.onBack();
                }
            }
        });
        
        // Kaydet düğmesi
        const saveButton = new Button({
            x: 150,
            y: 430,
            width: 200,
            height: 50,
            text: 'SAVE',
            backgroundColor: '#4CAF50',
            hoverBackgroundColor: '#66BB6A',
            pressedBackgroundColor: '#388E3C',
            onClick: () => {
                this._saveSettings();
                
                if (this.onSave) {
                    this.onSave(this.settings);
                }
            }
        });
        
        // Ses efekti seviyesi
        const soundLabel = new Text({
            text: 'Sound Effects:',
            x: 150,
            y: 100,
            font: '20px Arial',
            color: '#FFFFFF',
            align: 'left'
        });
        
        const soundSlider = new Slider({
            x: 250,
            y: 100,
            width: 200,
            height: 30,
            value: this.settings.soundVolume * 100,
            onChange: (value) => {
                this.settings.soundVolume = value / 100;
                const audio = Audio.getInstance();
                audio.setSoundVolume(this.settings.soundVolume);
            }
        });
        
        // Müzik seviyesi
        const musicLabel = new Text({
            text: 'Music:',
            x: 150,
            y: 150,
            font: '20px Arial',
            color: '#FFFFFF',
            align: 'left'
        });
        
        const musicSlider = new Slider({
            x: 250,
            y: 150,
            width: 200,
            height: 30,
            value: this.settings.musicVolume * 100,
            onChange: (value) => {
                this.settings.musicVolume = value / 100;
                const audio = Audio.getInstance();
                audio.setMusicVolume(this.settings.musicVolume);
            }
        });
        
        // Titreşim
        const vibrationLabel = new Text({
            text: 'Vibration:',
            x: 150,
            y: 200,
            font: '20px Arial',
            color: '#FFFFFF',
            align: 'left'
        });
        
        const vibrationButton = new Button({
            x: 250,
            y: 200,
            width: 100,
            height: 40,
            text: this.settings.vibration ? 'ON' : 'OFF',
            backgroundColor: this.settings.vibration ? '#4CAF50' : '#F44336',
            onClick: () => {
                this.settings.vibration = !this.settings.vibration;
                vibrationButton.setText(this.settings.vibration ? 'ON' : 'OFF');
                vibrationButton.backgroundColor = this.settings.vibration ? '#4CAF50' : '#F44336';
            }
        });
        
        // FPS gösterimi
        const fpsLabel = new Text({
            text: 'Show FPS:',
            x: 150,
            y: 250,
            font: '20px Arial',
            color: '#FFFFFF',
            align: 'left'
        });
        
        const fpsButton = new Button({
            x: 250,
            y: 250,
            width: 100,
            height: 40,
            text: this.settings.showFps ? 'ON' : 'OFF',
            backgroundColor: this.settings.showFps ? '#4CAF50' : '#F44336',
            onClick: () => {
                this.settings.showFps = !this.settings.showFps;
                fpsButton.setText(this.settings.showFps ? 'ON' : 'OFF');
                fpsButton.backgroundColor = this.settings.showFps ? '#4CAF50' : '#F44336';
            }
        });
        
        // Grafik kalitesi
        const qualityLabel = new Text({
            text: 'Quality:',
            x: 150,
            y: 300,
            font: '20px Arial',
            color: '#FFFFFF',
            align: 'left'
        });
        
        const qualityButton = new Button({
            x: 250,
            y: 300,
            width: 100,
            height: 40,
            text: this.settings.quality.toUpperCase(),
            backgroundColor: '#2196F3',
            onClick: () => {
                // Kalite döngüsü: low -> medium -> high -> low
                if (this.settings.quality === 'low') {
                    this.settings.quality = 'medium';
                } else if (this.settings.quality === 'medium') {
                    this.settings.quality = 'high';
                } else {
                    this.settings.quality = 'low';
                }
                
                qualityButton.setText(this.settings.quality.toUpperCase());
            }
        });
        
        // Kontrol tipi
        const controlLabel = new Text({
            text: 'Controls:',
            x: 150,
            y: 350,
            font: '20px Arial',
            color: '#FFFFFF',
            align: 'left'
        });
        
        const controlButton = new Button({
            x: 250,
            y: 350,
            width: 200,
            height: 40,
            text: this._getControlTypeName(this.settings.controlType),
            backgroundColor: '#9C27B0',
            onClick: () => {
                // Kontrol döngüsü: touch -> joystick -> tilt -> touch
                if (this.settings.controlType === 'touch') {
                    this.settings.controlType = 'joystick';
                } else if (this.settings.controlType === 'joystick') {
                    this.settings.controlType = 'tilt';
                } else {
                    this.settings.controlType = 'touch';
                }
                
                controlButton.setText(this._getControlTypeName(this.settings.controlType));
            }
        });
        
        // Bileşenleri panele ekle
        settingsPanel.addChild(titleText);
        settingsPanel.addChild(backButton);
        settingsPanel.addChild(saveButton);
        settingsPanel.addChild(soundLabel);
        settingsPanel.addChild(soundSlider);
        settingsPanel.addChild(musicLabel);
        settingsPanel.addChild(musicSlider);
        settingsPanel.addChild(vibrationLabel);
        settingsPanel.addChild(vibrationButton);
        settingsPanel.addChild(fpsLabel);
        settingsPanel.addChild(fpsButton);
        settingsPanel.addChild(qualityLabel);
        settingsPanel.addChild(qualityButton);
        settingsPanel.addChild(controlLabel);
        settingsPanel.addChild(controlButton);
        
        // Paneli UI'a ekle
        this.ui.addComponent(settingsPanel);
        
        // Arkaplan oluştur
        this._createBackground();
    }
    
    /**
     * Kontrol tipi adını döndürür
     * @param {String} controlType - Kontrol tipi
     * @return {String} Kontrol tipi adı
     */
    _getControlTypeName(controlType) {
        switch (controlType) {
            case 'touch':
                return 'TOUCH';
            case 'joystick':
                return 'JOYSTICK';
            case 'tilt':
                return 'TILT / GYRO';
            default:
                return 'TOUCH';
        }
    }
    
    /**
     * Ayarları yükler
     */
    _loadSettings() {
        try {
            const savedSettings = localStorage.getItem('hyperGameSettings');
            
            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }
    
    /**
     * Ayarları kaydeder
     */
    _saveSettings() {
        try {
            localStorage.setItem('hyperGameSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
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
            gradient.addColorStop(0, '#512DA8');
            gradient.addColorStop(1, '#311B92');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Parçacıklar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            for (let i = 0; i < 100; i++) {
                const size = Math.random() * 3;
                const x = Math.random() * width;
                const y = Math.random() * height;
                const alpha = Math.random() * 0.5 + 0.1;
                
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.globalAlpha = 1;
        };
        
        // Sahneye ekle
        this.addGameObject(bg);
    }
}