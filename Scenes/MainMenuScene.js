/**
 * MainMenuScene.js - Ana menü sahnesi
 * Oyun başlangıç sahnesi
 */
class MainMenuScene extends Scene {
    constructor(gameTitle = 'Hyper Game') {
        super('menu');
        
        this.gameTitle = gameTitle;
        
        // Olay işleyicileri
        this.onStart = null;
        this.onSettings = null;
        this.onShop = null;
        this.onCredits = null;
    }
    
    /**
     * Sahne yüklendiğinde çağrılır
     */
    load() {
        super.load();
        
        // Ana panel
        const screenWidth = this.game.engine.canvas.width;
        const screenHeight = this.game.engine.canvas.height;
        
        const menuPanel = new Panel({
            x: screenWidth / 2 - 200,
            y: screenHeight / 2 - 250,
            width: 400,
            height: 500,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            cornerRadius: 20
        });
        
        // Oyun başlığı
        const titleText = new Text({
            text: this.gameTitle,
            x: 200,
            y: 60,
            font: '36px Arial',
            color: '#FFFFFF',
            align: 'center'
        });
        
        // Başlat düğmesi
        const startButton = new Button({
            x: 100,
            y: 150,
            width: 200,
            height: 60,
            text: 'PLAY',
            backgroundColor: '#4CAF50',
            hoverBackgroundColor: '#66BB6A',
            pressedBackgroundColor: '#388E3C',
            onClick: () => {
                if (this.onStart) {
                    this.onStart();
                }
            }
        });
        
        // Ayarlar düğmesi
        const settingsButton = new Button({
            x: 100,
            y: 230,
            width: 200,
            height: 60,
            text: 'SETTINGS',
            backgroundColor: '#2196F3',
            hoverBackgroundColor: '#42A5F5',
            pressedBackgroundColor: '#1976D2',
            onClick: () => {
                if (this.onSettings) {
                    this.onSettings();
                }
            }
        });
        
        // Mağaza düğmesi
        const shopButton = new Button({
            x: 100,
            y: 310,
            width: 200,
            height: 60,
            text: 'SHOP',
            backgroundColor: '#FFC107',
            hoverBackgroundColor: '#FFCA28',
            pressedBackgroundColor: '#FFA000',
            onClick: () => {
                if (this.onShop) {
                    this.onShop();
                }
            }
        });
        
        // Krediler düğmesi
        const creditsButton = new Button({
            x: 100,
            y: 390,
            width: 200,
            height: 60,
            text: 'CREDITS',
            backgroundColor: '#9C27B0',
            hoverBackgroundColor: '#AB47BC',
            pressedBackgroundColor: '#7B1FA2',
            onClick: () => {
                if (this.onCredits) {
                    this.onCredits();
                }
            }
        });
        
        // Bileşenleri panele ekle
        menuPanel.addChild(titleText);
        menuPanel.addChild(startButton);
        menuPanel.addChild(settingsButton);
        menuPanel.addChild(shopButton);
        menuPanel.addChild(creditsButton);
        
        // Paneli UI'a ekle
        this.ui.addComponent(menuPanel);
        
        // Arkaplan oluştur
        this._createBackground();
        
        // Ses çal
        const audio = Audio.getInstance();
        audio.playMusic('menuMusic');
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
            gradient.addColorStop(0, '#303F9F');
            gradient.addColorStop(1, '#1A237E');
            
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
