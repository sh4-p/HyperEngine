/**
 * SocialShare.js - Sosyal medya paylaşım yönetimi
 * Oyun içeriğini çeşitli sosyal platformlarda paylaşma işlevselliği sağlar
 */
class SocialShare {
    constructor(config = {}) {
        // Sosyal paylaşım yapılandırması
        this.config = Object.assign({
            appName: 'HyperGame',
            appId: '',
            gameUrl: window.location.href,
            twitterHandle: '',
            facebookAppId: '',
            allowedPlatforms: ['facebook', 'twitter', 'whatsapp', 'email', 'clipboard', 'native'],
            defaultMessage: 'Check out this awesome game!',
            imageUrl: '',
            hashtags: ['hypergame', 'game'],
            useNativeSharing: true,
            useWebShare: true,
            useScreenshots: true,
            debug: false
        }, config);
        
        // Kullanılabilir paylaşım platformları
        this.availablePlatforms = this._detectAvailablePlatforms();
        
        // Olaylar
        this.onShareSuccess = null;
        this.onShareFail = null;
        this.onScreenshotTaken = null;
        
        // Singleton instance
        if (SocialShare.instance) {
            return SocialShare.instance;
        }
        SocialShare.instance = this;
        
        // Web Share API desteğini kontrol et
        this.hasWebShare = (typeof navigator !== 'undefined' && navigator.share);
        
        // Canvas ekran görüntüsü için referans
        this.gameCanvas = null;
        
        // Yerel bileşenleri başlat
        this._initComponents();
    }
    
    /**
     * Yerel bileşenleri başlatır
     */
    _initComponents() {
        // Facebook SDK
        if (this.config.allowedPlatforms.includes('facebook') && this.config.facebookAppId) {
            this._initFacebookSDK();
        }
        
        // Canvas referansını al
        if (this.config.useScreenshots) {
            this.gameCanvas = document.getElementById('game-canvas');
            
            if (!this.gameCanvas && document.querySelector('canvas')) {
                this.gameCanvas = document.querySelector('canvas');
            }
            
            if (!this.gameCanvas && this.config.debug) {
                console.warn('Game canvas not found. Screenshots will not be available.');
            }
        }
    }
    
    /**
     * Kullanılabilir platformları tespit eder
     * @return {Array} Kullanılabilir platform listesi
     */
    _detectAvailablePlatforms() {
        const available = [];
        const allowed = this.config.allowedPlatforms;
        
        // İzin verilen tüm platformları kontrol et
        if (allowed.includes('facebook')) available.push('facebook');
        if (allowed.includes('twitter')) available.push('twitter');
        if (allowed.includes('whatsapp') && this._isMobileDevice()) available.push('whatsapp');
        if (allowed.includes('email')) available.push('email');
        if (allowed.includes('clipboard')) available.push('clipboard');
        
        // Yerel paylaşım özelliklerini kontrol et
        if (allowed.includes('native')) {
            if (this.config.useNativeSharing) {
                // Cordova Social Sharing eklentisi
                if (window.plugins && window.plugins.socialsharing) {
                    available.push('native');
                }
                
                // Web Share API
                if (this.config.useWebShare && typeof navigator !== 'undefined' && navigator.share) {
                    available.push('webshare');
                }
            }
        }
        
        if (this.config.debug) {
            console.log('Available sharing platforms:', available);
        }
        
        return available;
    }
    
    /**
     * Facebook SDK'yı başlatır
     */
    _initFacebookSDK() {
        if (window.FB) return;
        
        // Facebook SDK'yı yükle
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
        
        // SDK başladığında yapılandır
        window.fbAsyncInit = () => {
            FB.init({
                appId: this.config.facebookAppId,
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v12.0'
            });
        };
    }
    
    /**
     * Paylaşım seçeneklerini hazırlar
     * @param {Object} options - Paylaşım seçenekleri
     * @return {Object} Hazırlanmış seçenekler
     */
    _prepareShareOptions(options = {}) {
        // Varsayılan seçenekler
        return Object.assign({
            message: this.config.defaultMessage,
            title: this.config.appName,
            url: this.config.gameUrl,
            imageUrl: this.config.imageUrl,
            hashtags: this.config.hashtags,
            screenshot: this.config.useScreenshots,
            subject: `Check out ${this.config.appName}!`,
            via: this.config.twitterHandle
        }, options);
    }
    
    /**
     * Paylaşım bağlantısını oluşturur
     * @param {String} platform - Platform adı
     * @param {Object} options - Paylaşım seçenekleri
     * @return {String} Paylaşım bağlantısı
     */
    _buildShareLink(platform, options) {
        const encodedMessage = encodeURIComponent(options.message);
        const encodedUrl = encodeURIComponent(options.url);
        const encodedTitle = encodeURIComponent(options.title);
        const encodedHashtags = options.hashtags.join(',');
        
        switch (platform) {
            case 'facebook':
                return `https://www.facebook.com/dialog/share?app_id=${this.config.facebookAppId}&display=popup&href=${encodedUrl}&quote=${encodedMessage}`;
                
            case 'twitter':
                return `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}&hashtags=${encodedHashtags}${options.via ? `&via=${options.via}` : ''}`;
                
            case 'whatsapp':
                return `https://api.whatsapp.com/send?text=${encodedMessage} ${encodedUrl}`;
                
            case 'email':
                return `mailto:?subject=${encodedTitle}&body=${encodedMessage} ${options.url}`;
                
            default:
                return options.url;
        }
    }
    
    /**
     * Ekran görüntüsü alır
     * @return {Promise<String>} Ekran görüntüsü veri URL'si
     */
    takeScreenshot() {
        return new Promise((resolve, reject) => {
            if (!this.gameCanvas) {
                reject(new Error('Game canvas not found'));
                return;
            }
            
            try {
                // Canvas'tan veri URL'si oluştur
                const screenshot = this.gameCanvas.toDataURL('image/png');
                
                if (this.onScreenshotTaken) {
                    this.onScreenshotTaken(screenshot);
                }
                
                resolve(screenshot);
            } catch (error) {
                console.error('Failed to take screenshot', error);
                reject(error);
            }
        });
    }
    
    /**
     * Veri URL'sini dosyaya dönüştürür
     * @param {String} dataUrl - Veri URL'si
     * @return {Blob} Dosya blobu
     */
    _dataUrlToBlob(dataUrl) {
        const parts = dataUrl.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        
        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        
        return new Blob([uInt8Array], { type: contentType });
    }
    
    /**
     * Belirli bir platformda paylaşır
     * @param {String} platform - Platform adı
     * @param {Object} options - Paylaşım seçenekleri
     * @return {Promise} Paylaşım sözü
     */
    share(platform, options = {}) {
        return new Promise(async (resolve, reject) => {
            // Geçersiz platform kontrolü
            if (!this.availablePlatforms.includes(platform) && platform !== 'webshare') {
                const error = new Error(`Platform not available: ${platform}`);
                if (this.onShareFail) this.onShareFail(error, platform);
                reject(error);
                return;
            }
            
            // Paylaşım seçeneklerini hazırla
            const shareOptions = this._prepareShareOptions(options);
            
            // Ekran görüntüsü gerekiyorsa al
            let screenshot = null;
            if (shareOptions.screenshot && this.config.useScreenshots) {
                try {
                    screenshot = await this.takeScreenshot();
                    shareOptions.imageUrl = screenshot;
                } catch (error) {
                    if (this.config.debug) {
                        console.warn('Failed to take screenshot:', error);
                    }
                }
            }
            
            try {
                switch (platform) {
                    case 'facebook':
                        this._shareFacebook(shareOptions);
                        break;
                        
                    case 'twitter':
                        this._shareTwitter(shareOptions);
                        break;
                        
                    case 'whatsapp':
                        this._shareWhatsApp(shareOptions);
                        break;
                        
                    case 'email':
                        this._shareEmail(shareOptions);
                        break;
                        
                    case 'clipboard':
                        await this._copyToClipboard(shareOptions);
                        break;
                        
                    case 'native':
                        await this._shareNative(shareOptions, screenshot);
                        break;
                        
                    case 'webshare':
                        await this._shareWeb(shareOptions, screenshot);
                        break;
                        
                    default:
                        throw new Error(`Unknown platform: ${platform}`);
                }
                
                if (this.onShareSuccess) {
                    this.onShareSuccess(platform, shareOptions);
                }
                
                resolve({ platform, options: shareOptions });
            } catch (error) {
                if (this.onShareFail) {
                    this.onShareFail(error, platform);
                }
                
                reject(error);
            }
        });
    }
    
    /**
     * Facebook'ta paylaşır
     * @param {Object} options - Paylaşım seçenekleri
     */
    _shareFacebook(options) {
        if (window.FB) {
            FB.ui({
                method: 'share',
                href: options.url,
                quote: options.message
            });
        } else {
            // Facebook SDK yüklü değilse bağlantıyı aç
            const shareUrl = this._buildShareLink('facebook', options);
            window.open(shareUrl, '_blank');
        }
    }
    
    /**
     * Twitter'da paylaşır
     * @param {Object} options - Paylaşım seçenekleri
     */
    _shareTwitter(options) {
        const shareUrl = this._buildShareLink('twitter', options);
        window.open(shareUrl, '_blank');
    }
    
    /**
     * WhatsApp'ta paylaşır
     * @param {Object} options - Paylaşım seçenekleri
     */
    _shareWhatsApp(options) {
        const shareUrl = this._buildShareLink('whatsapp', options);
        window.open(shareUrl, '_blank');
    }
    
    /**
     * E-posta ile paylaşır
     * @param {Object} options - Paylaşım seçenekleri
     */
    _shareEmail(options) {
        const shareUrl = this._buildShareLink('email', options);
        window.location.href = shareUrl;
    }
    
    /**
     * Panoya kopyalar
     * @param {Object} options - Paylaşım seçenekleri
     * @return {Promise} Kopyalama sözü
     */
    _copyToClipboard(options) {
        return new Promise((resolve, reject) => {
            const textToCopy = `${options.message} ${options.url}`;
            
            // Modern Navigator Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy)
                    .then(() => {
                        this._showToast('Copied to clipboard!');
                        resolve();
                    })
                    .catch(reject);
            } else {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                
                try {
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textarea);
                    
                    if (successful) {
                        this._showToast('Copied to clipboard!');
                        resolve();
                    } else {
                        throw new Error('Failed to copy');
                    }
                } catch (error) {
                    document.body.removeChild(textarea);
                    reject(error);
                }
            }
        });
    }
    
    /**
     * Yerel paylaşım kullanır (Cordova)
     * @param {Object} options - Paylaşım seçenekleri
     * @param {String} screenshot - Ekran görüntüsü veri URL'si
     * @return {Promise} Paylaşım sözü
     */
    _shareNative(options, screenshot) {
        return new Promise((resolve, reject) => {
            if (!window.plugins || !window.plugins.socialsharing) {
                reject(new Error('Native sharing not available'));
                return;
            }
            
            const files = [];
            
            // Ekran görüntüsü varsa ekle
            if (screenshot) {
                files.push(screenshot);
            } else if (options.imageUrl) {
                files.push(options.imageUrl);
            }
            
            // Social Sharing Plugin
            window.plugins.socialsharing.share(
                options.message,
                options.subject,
                files,
                options.url,
                resolve,
                reject
            );
        });
    }
    
    /**
     * Web Share API ile paylaşır
     * @param {Object} options - Paylaşım seçenekleri
     * @param {String} screenshot - Ekran görüntüsü veri URL'si
     * @return {Promise} Paylaşım sözü
     */
    _shareWeb(options, screenshot) {
        return new Promise(async (resolve, reject) => {
            if (!navigator.share) {
                reject(new Error('Web Share API not available'));
                return;
            }
            
            const shareData = {
                title: options.title,
                text: options.message,
                url: options.url
            };
            
            // Ekran görüntüsü varsa ve API destekliyorsa ekle
            if (screenshot && navigator.canShare) {
                try {
                    const imageBlob = this._dataUrlToBlob(screenshot);
                    const imageFile = new File([imageBlob], 'screenshot.png', { type: 'image/png' });
                    
                    // Dosya paylaşımı için canShare kontrolü
                    if (navigator.canShare({ files: [imageFile] })) {
                        shareData.files = [imageFile];
                    }
                } catch (error) {
                    if (this.config.debug) {
                        console.warn('Failed to prepare screenshot for Web Share API:', error);
                    }
                }
            }
            
            try {
                await navigator.share(shareData);
                resolve();
            } catch (error) {
                if (error.name === 'AbortError') {
                    // Kullanıcı paylaşımı iptal etti
                    resolve();
                } else {
                    reject(error);
                }
            }
        });
    }
    
    /**
     * Bildirim toast'u gösterir
     * @param {String} message - Bildirim mesajı
     */
    _showToast(message) {
        // Basit toast bildirimi
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 10000;
        `;
        
        document.body.appendChild(toast);
        
        // 3 saniye sonra kaldır
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 500);
        }, 3000);
    }
    
    /**
     * Mobil cihaz kontrolü
     * @return {Boolean} Mobil cihaz mı
     */
    _isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Paylaşım arayüzünü gösterir
     * @param {Object} options - Paylaşım seçenekleri
     */
    showShareUI(options = {}) {
        // Paylaşım seçeneklerini hazırla
        const shareOptions = this._prepareShareOptions(options);
        
        // Web Share API kullan (varsa)
        if (this.hasWebShare && this.config.useWebShare) {
            this.share('webshare', shareOptions)
                .catch(error => {
                    if (this.config.debug) {
                        console.warn('Web Share API failed, falling back to custom UI:', error);
                    }
                    this._showCustomShareUI(shareOptions);
                });
            return;
        }
        
        // Özel paylaşım arayüzünü göster
        this._showCustomShareUI(shareOptions);
    }
    
    /**
     * Özel paylaşım arayüzünü gösterir
     * @param {Object} options - Paylaşım seçenekleri
     */
    _showCustomShareUI(options) {
        // Mevcut paylaşım arayüzünü kaldır
        const existingUI = document.getElementById('social-share-ui');
        if (existingUI) {
            existingUI.remove();
        }
        
        // Arayüz konteynerini oluştur
        const container = document.createElement('div');
        container.id = 'social-share-ui';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        // Arayüz panelini oluştur
        const panel = document.createElement('div');
        panel.style.cssText = `
            background-color: white;
            border-radius: 10px;
            padding: 20px;
            max-width: 90%;
            width: 320px;
            text-align: center;
        `;
        
        // Başlık
        const title = document.createElement('h3');
        title.textContent = 'Share';
        title.style.cssText = `
            margin: 0 0 15px 0;
            font-size: 18px;
        `;
        panel.appendChild(title);
        
        // Platformlar için butonları oluştur
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
        `;
        
        // Platform config
        const platforms = [
            { id: 'facebook', name: 'Facebook', color: '#3b5998', icon: '📘' },
            { id: 'twitter', name: 'Twitter', color: '#1da1f2', icon: '🐦' },
            { id: 'whatsapp', name: 'WhatsApp', color: '#25d366', icon: '📱' },
            { id: 'email', name: 'Email', color: '#848484', icon: '✉️' },
            { id: 'clipboard', name: 'Copy', color: '#333333', icon: '📋' }
        ];
        
        // Platformları filtrele ve butonları oluştur
        platforms.filter(p => this.availablePlatforms.includes(p.id)).forEach(platform => {
            const button = document.createElement('button');
            button.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 80px;
                height: 80px;
                border-radius: 10px;
                border: none;
                background-color: ${platform.color};
                color: white;
                cursor: pointer;
                font-size: 12px;
            `;
            
            const icon = document.createElement('div');
            icon.textContent = platform.icon;
            icon.style.cssText = `
                font-size: 24px;
                margin-bottom: 5px;
            `;
            
            const label = document.createElement('div');
            label.textContent = platform.name;
            
            button.appendChild(icon);
            button.appendChild(label);
            button.onclick = () => {
                this.share(platform.id, options);
                container.remove();
            };
            
            buttonContainer.appendChild(button);
        });
        
        panel.appendChild(buttonContainer);
        
        // Kapat butonu
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Cancel';
        closeButton.style.cssText = `
            padding: 10px 20px;
            border: none;
            background-color: #f1f1f1;
            border-radius: 5px;
            cursor: pointer;
        `;
        closeButton.onclick = () => {
            container.remove();
        };
        panel.appendChild(closeButton);
        
        // Arka plana tıklayınca kapat
        container.onclick = (e) => {
            if (e.target === container) {
                container.remove();
            }
        };
        
        container.appendChild(panel);
        document.body.appendChild(container);
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!SocialShare.instance) {
            new SocialShare();
        }
        return SocialShare.instance;
    }
}

// Singleton instance
SocialShare.instance = null;