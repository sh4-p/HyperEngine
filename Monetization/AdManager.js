/**
 * AdManager.js - Reklam yönetimi
 * Google Ads ve diğer reklam platformlarını entegre eder
 */
class AdManager {
    constructor(config = {}) {
        // Reklam yapılandırması
        this.config = Object.assign({
            platform: 'admob',   // admob, unity, applovin, vungle, ironsource
            testMode: true,      // Test modu
            bannerAdUnitId: '',  // Banner reklam birimi ID
            interstitialAdUnitId: '', // Geçiş reklamı birimi ID
            rewardedAdUnitId: '',     // Ödüllü reklam birimi ID
            autoLoadAds: true,       // Reklamları otomatik yükle
            consentRequired: false,  // GDPR onayı gerekli mi
            tagForChildDirectedTreatment: false,  // Çocuklara yönelik
            tagForUnderAgeOfConsent: false,       // 16 yaş altı için
        }, config);
        
        // Reklam durumları
        this.isInitialized = false;
        this.isConsentGiven = false;
        this.isBannerLoaded = false;
        this.isInterstitialLoaded = false;
        this.isRewardedLoaded = false;
        
        // Bekleyen ödül geri çağırımları
        this.pendingRewardCallback = null;
        
        // Event listeners
        this.onInitializeSuccess = null;
        this.onInitializeFail = null;
        this.onBannerLoad = null;
        this.onBannerShow = null;
        this.onBannerHide = null;
        this.onBannerFail = null;
        this.onInterstitialLoad = null;
        this.onInterstitialShow = null;
        this.onInterstitialClose = null;
        this.onInterstitialFail = null;
        this.onRewardedLoad = null;
        this.onRewardedShow = null;
        this.onRewardedReward = null;
        this.onRewardedClose = null;
        this.onRewardedFail = null;
        
        // Singleton instance
        if (AdManager.instance) {
            return AdManager.instance;
        }
        AdManager.instance = this;
        
        // Reklam SDK'larını yükle
        this._loadAdSDKs();
    }
    
    /**
     * Reklam SDK'larını yükler
     */
    _loadAdSDKs() {
        switch (this.config.platform) {
            case 'admob':
                this._loadAdMobSDK();
                break;
            case 'unity':
                this._loadUnityAdsSDK();
                break;
            case 'applovin':
                this._loadAppLovinSDK();
                break;
            case 'vungle':
                this._loadVungleSDK();
                break;
            case 'ironsource':
                this._loadIronSourceSDK();
                break;
            default:
                console.warn(`Unsupported ad platform: ${this.config.platform}`);
        }
    }
    
    /**
     * AdMob SDK'yı yükler
     */
    _loadAdMobSDK() {
        // Test modundaki varsayılan reklam birimleri
        if (this.config.testMode) {
            this.config.bannerAdUnitId = this.config.bannerAdUnitId || 'ca-app-pub-3940256099942544/6300978111';
            this.config.interstitialAdUnitId = this.config.interstitialAdUnitId || 'ca-app-pub-3940256099942544/1033173712';
            this.config.rewardedAdUnitId = this.config.rewardedAdUnitId || 'ca-app-pub-3940256099942544/5224354917';
        }
        
        // SDK'yı dinamik olarak yükle
        const script = document.createElement('script');
        script.src = 'https://www.googletagservices.com/tag/js/gpt.js';
        script.async = true;
        script.onload = () => {
            // SDK yüklendi, başlat
            this._initializeAdMob();
        };
        script.onerror = () => {
            console.error("Failed to load AdMob SDK");
            if (this.onInitializeFail) this.onInitializeFail();
        };
        document.head.appendChild(script);
    }
    
    /**
     * AdMob'u başlatır
     */
    _initializeAdMob() {
        // window.admob yoksa simüle et
        if (!window.admob) {
            console.warn("AdMob SDK not available, using mock implementation");
            
            // Mock implementation for testing
            window.admob = {
                banner: {
                    show: () => {
                        console.log("AdMob banner show (mock)");
                        this.isBannerLoaded = true;
                        if (this.onBannerShow) this.onBannerShow();
                    },
                    hide: () => {
                        console.log("AdMob banner hide (mock)");
                        if (this.onBannerHide) this.onBannerHide();
                    },
                    prepare: () => {
                        console.log("AdMob banner prepare (mock)");
                        setTimeout(() => {
                            this.isBannerLoaded = true;
                            if (this.onBannerLoad) this.onBannerLoad();
                        }, 1000);
                    }
                },
                interstitial: {
                    show: () => {
                        console.log("AdMob interstitial show (mock)");
                        setTimeout(() => {
                            this.isInterstitialLoaded = false;
                            if (this.onInterstitialClose) this.onInterstitialClose();
                            this.loadInterstitial();
                        }, 2000);
                        
                        if (this.onInterstitialShow) this.onInterstitialShow();
                    },
                    prepare: () => {
                        console.log("AdMob interstitial prepare (mock)");
                        setTimeout(() => {
                            this.isInterstitialLoaded = true;
                            if (this.onInterstitialLoad) this.onInterstitialLoad();
                        }, 1000);
                    }
                },
                rewarded: {
                    show: () => {
                        console.log("AdMob rewarded show (mock)");
                        
                        if (this.onRewardedShow) this.onRewardedShow();
                        
                        // Simüle edilmiş ödül
                        setTimeout(() => {
                            if (this.onRewardedReward) {
                                this.onRewardedReward({
                                    type: 'coins',
                                    amount: 10
                                });
                            }
                            
                            if (this.pendingRewardCallback) {
                                this.pendingRewardCallback(true);
                                this.pendingRewardCallback = null;
                            }
                            
                            this.isRewardedLoaded = false;
                            if (this.onRewardedClose) this.onRewardedClose();
                            this.loadRewarded();
                        }, 3000);
                    },
                    prepare: () => {
                        console.log("AdMob rewarded prepare (mock)");
                        setTimeout(() => {
                            this.isRewardedLoaded = true;
                            if (this.onRewardedLoad) this.onRewardedLoad();
                        }, 1000);
                    }
                }
            };
        }
        
        // Başlatıldı kabul et
        this.isInitialized = true;
        
        // Başarılı başlatma olayını çağır
        if (this.onInitializeSuccess) {
            this.onInitializeSuccess();
        }
        
        // Otomatik yükleme etkinse reklamları yükle
        if (this.config.autoLoadAds) {
            this.loadBanner();
            this.loadInterstitial();
            this.loadRewarded();
        }
    }
    
    /**
     * Unity Ads SDK'yı yükler
     */
    _loadUnityAdsSDK() {
        // Unity Ads için mock implementation
        console.warn("Unity Ads not fully implemented, using mock implementation");
        
        this.isInitialized = true;
        
        if (this.onInitializeSuccess) {
            this.onInitializeSuccess();
        }
        
        if (this.config.autoLoadAds) {
            this.loadBanner();
            this.loadInterstitial();
            this.loadRewarded();
        }
    }
    
    /**
     * AppLovin SDK'yı yükler
     */
    _loadAppLovinSDK() {
        // AppLovin için mock implementation
        console.warn("AppLovin not fully implemented, using mock implementation");
        
        this.isInitialized = true;
        
        if (this.onInitializeSuccess) {
            this.onInitializeSuccess();
        }
        
        if (this.config.autoLoadAds) {
            this.loadBanner();
            this.loadInterstitial();
            this.loadRewarded();
        }
    }
    
    /**
     * Vungle SDK'yı yükler
     */
    _loadVungleSDK() {
        // Vungle için mock implementation
        console.warn("Vungle not fully implemented, using mock implementation");
        
        this.isInitialized = true;
        
        if (this.onInitializeSuccess) {
            this.onInitializeSuccess();
        }
        
        if (this.config.autoLoadAds) {
            this.loadBanner();
            this.loadInterstitial();
            this.loadRewarded();
        }
    }
    
    /**
     * IronSource SDK'yı yükler
     */
    _loadIronSourceSDK() {
        // IronSource için mock implementation
        console.warn("IronSource not fully implemented, using mock implementation");
        
        this.isInitialized = true;
        
        if (this.onInitializeSuccess) {
            this.onInitializeSuccess();
        }
        
        if (this.config.autoLoadAds) {
            this.loadBanner();
            this.loadInterstitial();
            this.loadRewarded();
        }
    }
    
    /**
     * Banner reklamı yükler
     */
    loadBanner() {
        if (!this.isInitialized) {
            console.warn("Ad manager not initialized");
            return;
        }
        
        if (this.isBannerLoaded) {
            console.warn("Banner already loaded");
            return;
        }
        
        switch (this.config.platform) {
            case 'admob':
                try {
                    window.admob.banner.prepare();
                } catch (e) {
                    console.error("Error loading banner ad", e);
                    if (this.onBannerFail) this.onBannerFail(e);
                }
                break;
            // Diğer platformlar için benzer implementasyon
        }
    }
    
    /**
     * Banner reklamı gösterir
     * @param {Object} options - Gösterim seçenekleri
     */
    showBanner(options = {}) {
        if (!this.isInitialized) {
            console.warn("Ad manager not initialized");
            return;
        }
        
        if (!this.isBannerLoaded) {
            console.warn("Banner not loaded yet");
            this.loadBanner();
            return;
        }
        
        switch (this.config.platform) {
            case 'admob':
                try {
                    window.admob.banner.show();
                } catch (e) {
                    console.error("Error showing banner ad", e);
                }
                break;
            // Diğer platformlar için benzer implementasyon
        }
    }
    
    /**
     * Banner reklamı gizler
     */
    hideBanner() {
        if (!this.isInitialized) {
            console.warn("Ad manager not initialized");
            return;
        }
        
        switch (this.config.platform) {
            case 'admob':
                try {
                    window.admob.banner.hide();
                } catch (e) {
                    console.error("Error hiding banner ad", e);
                }
                break;
            // Diğer platformlar için benzer implementasyon
        }
    }
    
    /**
     * Geçiş reklamı yükler
     */
    loadInterstitial() {
        if (!this.isInitialized) {
            console.warn("Ad manager not initialized");
            return;
        }
        
        if (this.isInterstitialLoaded) {
            console.warn("Interstitial already loaded");
            return;
        }
        
        switch (this.config.platform) {
            case 'admob':
                try {
                    window.admob.interstitial.prepare();
                } catch (e) {
                    console.error("Error loading interstitial ad", e);
                    if (this.onInterstitialFail) this.onInterstitialFail(e);
                }
                break;
            // Diğer platformlar için benzer implementasyon
        }
    }
    
    /**
     * Geçiş reklamı gösterir
     * @return {Boolean} Gösterim başarılı mı
     */
    showInterstitial() {
        if (!this.isInitialized) {
            console.warn("Ad manager not initialized");
            return false;
        }
        
        if (!this.isInterstitialLoaded) {
            console.warn("Interstitial not loaded yet");
            this.loadInterstitial();
            return false;
        }
        
        switch (this.config.platform) {
            case 'admob':
                try {
                    window.admob.interstitial.show();
                    return true;
                } catch (e) {
                    console.error("Error showing interstitial ad", e);
                    return false;
                }
            // Diğer platformlar için benzer implementasyon
            default:
                return false;
        }
    }
    
    /**
     * Ödüllü reklam yükler
     */
    loadRewarded() {
        if (!this.isInitialized) {
            console.warn("Ad manager not initialized");
            return;
        }
        
        if (this.isRewardedLoaded) {
            console.warn("Rewarded ad already loaded");
            return;
        }
        
        switch (this.config.platform) {
            case 'admob':
                try {
                    window.admob.rewarded.prepare();
                } catch (e) {
                    console.error("Error loading rewarded ad", e);
                    if (this.onRewardedFail) this.onRewardedFail(e);
                }
                break;
            // Diğer platformlar için benzer implementasyon
        }
    }
    
    /**
     * Ödüllü reklam gösterir
     * @param {Function} callback - Ödül callback'i (ödül verildiyse true, verilmediyse false)
     * @return {Boolean} Gösterim başarılı mı
     */
    showRewarded(callback) {
        if (!this.isInitialized) {
            console.warn("Ad manager not initialized");
            if (callback) callback(false);
            return false;
        }
        
        if (!this.isRewardedLoaded) {
            console.warn("Rewarded ad not loaded yet");
            this.loadRewarded();
            if (callback) callback(false);
            return false;
        }
        
        // Ödül callback'i kaydet
        this.pendingRewardCallback = callback;
        
        switch (this.config.platform) {
            case 'admob':
                try {
                    window.admob.rewarded.show();
                    return true;
                } catch (e) {
                    console.error("Error showing rewarded ad", e);
                    if (callback) callback(false);
                    return false;
                }
            // Diğer platformlar için benzer implementasyon
            default:
                if (callback) callback(false);
                return false;
        }
    }
    
    /**
     * GDPR onayını ayarlar
     * @param {Boolean} consent - Onay verildi mi
     */
    setConsent(consent) {
        this.isConsentGiven = consent;
        
        // Platforma özgü onay ayarları
        switch (this.config.platform) {
            case 'admob':
                // AdMob/Google için GDPR
                if (window.admob && window.admob.setConsent) {
                    window.admob.setConsent(consent);
                }
                break;
            // Diğer platformlar için benzer implementasyon
        }
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!AdManager.instance) {
            new AdManager();
        }
        return AdManager.instance;
    }
}

// Singleton instance
AdManager.instance = null;