/**
 * IAP.js - Uygulama içi satın alma yönetimi
 * Farklı platform mağazalarından uygulama içi satın almaları yönetir
 */
class IAP {
    constructor(config = {}) {
        // IAP yapılandırması
        this.config = Object.assign({
            platform: 'auto', // 'auto', 'ios', 'android', 'amazon', 'web'
            testMode: false,  // Test modu
            products: [],     // Ürün tanımları
            validateReceipts: true, // Makbuz doğrulama
            serverUrl: '',    // Sunucu doğrulaması için URL
            autoFinish: true, // Satın almaları otomatik tamamla
            logging: false    // Debug log
        }, config);
        
        // Ürün detayları
        this.products = {};
        
        // Satın alma durumu
        this.isReady = false;
        this.isInitializing = false;
        this.canMakePayments = false;
        
        // Olaylar (event listeners)
        this.onReady = null;
        this.onError = null;
        this.onPurchaseSuccess = null;
        this.onPurchaseFailed = null;
        this.onReceiptValidationSuccess = null;
        this.onReceiptValidationFailed = null;
        this.onRestore = null;
        
        // Platformu otomatik tespit et
        if (this.config.platform === 'auto') {
            this._detectPlatform();
        }
        
        // Singleton instance
        if (IAP.instance) {
            return IAP.instance;
        }
        IAP.instance = this;
    }
    
    /**
     * Platformu otomatik tespit eder
     */
    _detectPlatform() {
        const userAgent = navigator.userAgent || '';
        
        if (/iPhone|iPad|iPod/i.test(userAgent)) {
            this.config.platform = 'ios';
        } else if (/Android/i.test(userAgent)) {
            this.config.platform = 'android';
            
            // Amazon cihazlarını kontrol et
            if (/Amazon|Kindle|Silk/i.test(userAgent)) {
                this.config.platform = 'amazon';
            }
        } else {
            this.config.platform = 'web';
        }
        
        if (this.config.logging) {
            console.log(`IAP platform detected: ${this.config.platform}`);
        }
    }
    
    /**
     * IAP sistemini başlatır
     * @return {Promise} Başlatma sözü
     */
    initialize() {
        if (this.isInitializing) {
            return Promise.reject(new Error('IAP initialization already in progress'));
        }
        
        if (this.isReady) {
            return Promise.resolve();
        }
        
        this.isInitializing = true;
        
        return new Promise((resolve, reject) => {
            if (this.config.logging) {
                console.log(`Initializing IAP for platform: ${this.config.platform}`);
            }
            
            // Platform bazlı başlatma
            switch (this.config.platform) {
                case 'ios':
                    this._initializeAppleIAP()
                        .then(resolve)
                        .catch(reject);
                    break;
                    
                case 'android':
                    this._initializeGoogleIAP()
                        .then(resolve)
                        .catch(reject);
                    break;
                    
                case 'amazon':
                    this._initializeAmazonIAP()
                        .then(resolve)
                        .catch(reject);
                    break;
                    
                case 'web':
                    this._initializeWebIAP()
                        .then(resolve)
                        .catch(reject);
                    break;
                    
                default:
                    const error = new Error(`Unsupported IAP platform: ${this.config.platform}`);
                    if (this.onError) this.onError(error);
                    reject(error);
                    this.isInitializing = false;
            }
        });
    }
    
    /**
     * Apple IAP başlatma
     * @return {Promise} Başlatma sözü
     */
    _initializeAppleIAP() {
        return new Promise((resolve, reject) => {
            if (!window.storekit) {
                if (this.config.logging) {
                    console.log('StoreKit plugin not found, using mock implementation');
                }
                
                // Simülasyon için mock IAP
                this._initializeMockIAP()
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            // StoreKit'i başlat
            window.storekit.init({
                debug: this.config.testMode,
                autoFinish: this.config.autoFinish,
                
                ready: () => {
                    this._loadProducts()
                        .then(() => {
                            this.isReady = true;
                            this.isInitializing = false;
                            this.canMakePayments = window.storekit.canMakePayments;
                            
                            if (this.onReady) this.onReady();
                            resolve();
                        })
                        .catch(reject);
                },
                
                purchase: (transactionId, productId, receipt) => {
                    const product = this.products[productId];
                    
                    if (this.config.logging) {
                        console.log(`Purchase success: ${productId}`);
                    }
                    
                    // Makbuz doğrulaması
                    if (this.config.validateReceipts && this.config.serverUrl) {
                        this._validateReceipt(productId, receipt, 'ios')
                            .then(validationResult => {
                                if (this.onPurchaseSuccess) {
                                    this.onPurchaseSuccess(product, transactionId, receipt, validationResult);
                                }
                            })
                            .catch(error => {
                                if (this.onReceiptValidationFailed) {
                                    this.onReceiptValidationFailed(error, product, receipt);
                                }
                            });
                    } else {
                        if (this.onPurchaseSuccess) {
                            this.onPurchaseSuccess(product, transactionId, receipt);
                        }
                    }
                },
                
                error: (errorCode, errorMessage) => {
                    const error = new Error(errorMessage);
                    error.code = errorCode;
                    
                    if (this.config.logging) {
                        console.error(`IAP error: ${errorMessage} (${errorCode})`);
                    }
                    
                    if (this.onPurchaseFailed) {
                        this.onPurchaseFailed(error);
                    }
                },
                
                restore: (transactionId, productId) => {
                    const product = this.products[productId];
                    
                    if (this.config.logging) {
                        console.log(`Restored purchase: ${productId}`);
                    }
                    
                    if (this.onRestore) {
                        this.onRestore(product, transactionId);
                    }
                }
            });
        });
    }
    
    /**
     * Google IAP başlatma
     * @return {Promise} Başlatma sözü
     */
    _initializeGoogleIAP() {
        return new Promise((resolve, reject) => {
            if (!window.inappbilling) {
                if (this.config.logging) {
                    console.log('Google Billing plugin not found, using mock implementation');
                }
                
                // Simülasyon için mock IAP
                this._initializeMockIAP()
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            // Google Play Billing'i başlat
            window.inappbilling.init(
                this.config.autoFinish,
                () => {
                    this._loadProducts()
                        .then(() => {
                            this.isReady = true;
                            this.isInitializing = false;
                            this.canMakePayments = true;
                            
                            if (this.onReady) this.onReady();
                            resolve();
                        })
                        .catch(reject);
                },
                error => {
                    const err = new Error(`Failed to initialize Google IAP: ${error}`);
                    if (this.onError) this.onError(err);
                    this.isInitializing = false;
                    reject(err);
                }
            );
        });
    }
    
    /**
     * Amazon IAP başlatma
     * @return {Promise} Başlatma sözü
     */
    _initializeAmazonIAP() {
        return new Promise((resolve, reject) => {
            if (!window.AmazonIAP) {
                if (this.config.logging) {
                    console.log('Amazon IAP plugin not found, using mock implementation');
                }
                
                // Simülasyon için mock IAP
                this._initializeMockIAP()
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            // Amazon IAP'yi başlat
            try {
                window.AmazonIAP.registerObserver({
                    onSdkAvailable: isAvailable => {
                        if (isAvailable) {
                            this._loadProducts()
                                .then(() => {
                                    this.isReady = true;
                                    this.isInitializing = false;
                                    this.canMakePayments = true;
                                    
                                    if (this.onReady) this.onReady();
                                    resolve();
                                })
                                .catch(reject);
                        } else {
                            const error = new Error('Amazon IAP SDK not available');
                            if (this.onError) this.onError(error);
                            this.isInitializing = false;
                            reject(error);
                        }
                    },
                    
                    onPurchaseResponse: response => {
                        const purchaseData = response.purchaseResponse;
                        
                        if (purchaseData.purchaseRequestStatus === 'SUCCESSFUL') {
                            const productId = purchaseData.receipt.sku;
                            const product = this.products[productId];
                            const receipt = purchaseData.receipt;
                            
                            if (this.config.logging) {
                                console.log(`Amazon purchase success: ${productId}`);
                            }
                            
                            if (this.config.validateReceipts && this.config.serverUrl) {
                                this._validateReceipt(productId, receipt, 'amazon')
                                    .then(validationResult => {
                                        if (this.onPurchaseSuccess) {
                                            this.onPurchaseSuccess(product, receipt.receiptId, receipt, validationResult);
                                        }
                                    })
                                    .catch(error => {
                                        if (this.onReceiptValidationFailed) {
                                            this.onReceiptValidationFailed(error, product, receipt);
                                        }
                                    });
                            } else {
                                if (this.onPurchaseSuccess) {
                                    this.onPurchaseSuccess(product, receipt.receiptId, receipt);
                                }
                            }
                        } else {
                            const errorMessage = purchaseData.purchaseRequestStatus;
                            const error = new Error(`Amazon purchase failed: ${errorMessage}`);
                            
                            if (this.config.logging) {
                                console.error(`Amazon IAP error: ${errorMessage}`);
                            }
                            
                            if (this.onPurchaseFailed) {
                                this.onPurchaseFailed(error);
                            }
                        }
                    }
                });
            } catch (error) {
                if (this.onError) this.onError(error);
                this.isInitializing = false;
                reject(error);
            }
        });
    }
    
    /**
     * Web IAP başlatma (simülasyon)
     * @return {Promise} Başlatma sözü
     */
    _initializeWebIAP() {
        return this._initializeMockIAP();
    }
    
    /**
     * Mock IAP başlatma (test ve simülasyon için)
     * @return {Promise} Başlatma sözü
     */
    _initializeMockIAP() {
        return new Promise(resolve => {
            if (this.config.logging) {
                console.log('Initializing mock IAP system');
            }
            
            // Mock ürünleri oluştur
            setTimeout(() => {
                this._loadMockProducts()
                    .then(() => {
                        this.isReady = true;
                        this.isInitializing = false;
                        this.canMakePayments = true;
                        
                        if (this.onReady) this.onReady();
                        resolve();
                    });
            }, 1000);
        });
    }
    
    /**
     * Ürünleri yükler
     * @return {Promise} Yükleme sözü
     */
    _loadProducts() {
        return new Promise((resolve, reject) => {
            if (!this.config.products || this.config.products.length === 0) {
                resolve();
                return;
            }
            
            const productIds = this.config.products.map(p => p.id);
            
            if (this.config.logging) {
                console.log(`Loading ${productIds.length} products`);
            }
            
            switch (this.config.platform) {
                case 'ios':
                    window.storekit.load(productIds, products => {
                        this._processLoadedProducts(products);
                        resolve();
                    }, error => {
                        reject(new Error(`Failed to load products: ${error}`));
                    });
                    break;
                    
                case 'android':
                    window.inappbilling.getProductDetails(productIds, products => {
                        this._processLoadedProducts(products);
                        resolve();
                    }, error => {
                        reject(new Error(`Failed to load products: ${error}`));
                    });
                    break;
                    
                case 'amazon':
                    window.AmazonIAP.getProductData(productIds, response => {
                        if (response.status === 'SUCCESSFUL') {
                            this._processLoadedProducts(response.productData);
                            resolve();
                        } else {
                            reject(new Error(`Failed to load Amazon products: ${response.status}`));
                        }
                    });
                    break;
                    
                default:
                    // Mock ürünleri için
                    this._loadMockProducts().then(resolve);
                    break;
            }
        });
    }
    
    /**
     * Mock ürünleri yükler
     * @return {Promise} Yükleme sözü
     */
    _loadMockProducts() {
        return new Promise(resolve => {
            const mockProducts = {};
            
            this.config.products.forEach(productConfig => {
                const product = {
                    id: productConfig.id,
                    alias: productConfig.alias || productConfig.id,
                    type: productConfig.type || 'consumable',
                    title: productConfig.title || `Product ${productConfig.id}`,
                    description: productConfig.description || 'Mock product description',
                    price: productConfig.price || '$0.99',
                    priceAsDecimal: productConfig.priceAsDecimal || 0.99,
                    currency: productConfig.currency || 'USD',
                    localizedPrice: productConfig.localizedPrice || '$0.99'
                };
                
                mockProducts[product.id] = product;
            });
            
            this.products = mockProducts;
            
            if (this.config.logging) {
                console.log(`Loaded ${Object.keys(mockProducts).length} mock products`);
            }
            
            resolve();
        });
    }
    
    /**
     * Yüklenen ürünleri işler
     * @param {Array|Object} products - Yüklenen ürünler
     */
    _processLoadedProducts(products) {
        if (Array.isArray(products)) {
            // Array formatındaki ürünleri işle
            products.forEach(product => {
                this.products[product.productId] = {
                    id: product.productId,
                    alias: this._getProductAlias(product.productId),
                    type: this._getProductType(product.productId),
                    title: product.title || product.name,
                    description: product.description,
                    price: product.price,
                    priceAsDecimal: this._extractPriceAsDecimal(product.price),
                    currency: product.currency || this._extractCurrency(product.price),
                    localizedPrice: product.price
                };
            });
        } else {
            // Object formatındaki ürünleri işle
            for (const productId in products) {
                const product = products[productId];
                
                this.products[productId] = {
                    id: productId,
                    alias: this._getProductAlias(productId),
                    type: this._getProductType(productId),
                    title: product.title || product.name,
                    description: product.description,
                    price: product.price,
                    priceAsDecimal: this._extractPriceAsDecimal(product.price),
                    currency: product.currency || this._extractCurrency(product.price),
                    localizedPrice: product.price
                };
            }
        }
        
        if (this.config.logging) {
            console.log(`Loaded ${Object.keys(this.products).length} products`);
        }
    }
    
    /**
     * Ürün tipini alır
     * @param {String} productId - Ürün ID'si
     * @return {String} Ürün tipi ('consumable', 'non-consumable', 'subscription')
     */
    _getProductType(productId) {
        const product = this.config.products.find(p => p.id === productId);
        return product ? product.type || 'consumable' : 'consumable';
    }
    
    /**
     * Ürün takma adını alır
     * @param {String} productId - Ürün ID'si
     * @return {String} Ürün takma adı
     */
    _getProductAlias(productId) {
        const product = this.config.products.find(p => p.id === productId);
        return product ? product.alias || productId : productId;
    }
    
    /**
     * Fiyattan ondalık değeri çıkarır
     * @param {String} price - Fiyat metni (örn: "$0.99")
     * @return {Number} Ondalık fiyat
     */
    _extractPriceAsDecimal(price) {
        if (!price) return 0;
        
        // Sadece sayıları ve noktayı al
        const match = price.match(/([0-9]*[.])?[0-9]+/);
        return match ? parseFloat(match[0]) : 0;
    }
    
    /**
     * Fiyattan para birimini çıkarır
     * @param {String} price - Fiyat metni (örn: "$0.99")
     * @return {String} Para birimi
     */
    _extractCurrency(price) {
        if (!price) return 'USD';
        
        // Para birimi sembollerini kontrol et
        if (price.includes('$')) return 'USD';
        if (price.includes('€')) return 'EUR';
        if (price.includes('£')) return 'GBP';
        if (price.includes('¥')) return 'JPY';
        
        return 'USD'; // Varsayılan
    }
    
    /**
     * Ürün makbuzunu doğrular
     * @param {String} productId - Ürün ID'si
     * @param {String|Object} receipt - Satın alma makbuzu
     * @param {String} platform - Platform ('ios', 'android', 'amazon')
     * @return {Promise<Object>} Doğrulama sonucu
     */
    _validateReceipt(productId, receipt, platform) {
        return new Promise((resolve, reject) => {
            if (!this.config.serverUrl) {
                reject(new Error('Server URL not specified for receipt validation'));
                return;
            }
            
            // Makbuz doğrulama isteği gönder
            fetch(this.config.serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId,
                    receipt,
                    platform,
                    test: this.config.testMode
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Receipt validation failed with status ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    if (this.onReceiptValidationSuccess) {
                        this.onReceiptValidationSuccess(productId, data);
                    }
                    resolve(data);
                } else {
                    const error = new Error(data.message || 'Receipt validation failed');
                    error.data = data;
                    
                    if (this.onReceiptValidationFailed) {
                        this.onReceiptValidationFailed(error, productId, receipt);
                    }
                    
                    reject(error);
                }
            })
            .catch(error => {
                if (this.onReceiptValidationFailed) {
                    this.onReceiptValidationFailed(error, productId, receipt);
                }
                reject(error);
            });
        });
    }
    
    /**
     * Ürün satın alma işlemi
     * @param {String} productId - Ürün ID'si
     * @return {Promise} Satın alma sözü
     */
    purchase(productId) {
        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                const error = new Error('IAP not ready');
                if (this.onError) this.onError(error);
                reject(error);
                return;
            }
            
            if (!this.products[productId]) {
                const error = new Error(`Product not found: ${productId}`);
                if (this.onError) this.onError(error);
                reject(error);
                return;
            }
            
            if (this.config.logging) {
                console.log(`Purchasing product: ${productId}`);
            }
            
            switch (this.config.platform) {
                case 'ios':
                    window.storekit.purchase(productId, 1, (transactionId, productId, receipt) => {
                        const product = this.products[productId];
                        resolve({ product, transactionId, receipt });
                    }, error => {
                        reject(new Error(error));
                    });
                    break;
                    
                case 'android':
                    window.inappbilling.purchase(productId, (purchase) => {
                        const product = this.products[productId];
                        resolve({ product, transactionId: purchase.orderId, receipt: purchase });
                    }, error => {
                        reject(new Error(error));
                    });
                    break;
                    
                case 'amazon':
                    window.AmazonIAP.purchase(productId, response => {
                        if (response.status === 'SUCCESSFUL') {
                            const product = this.products[productId];
                            resolve({ product, transactionId: response.receipt.receiptId, receipt: response.receipt });
                        } else {
                            reject(new Error(`Amazon purchase failed: ${response.status}`));
                        }
                    });
                    break;
                    
                default:
                    // Mock satın alma
                    this._mockPurchase(productId)
                        .then(resolve)
                        .catch(reject);
                    break;
            }
        });
    }
    
    /**
     * Mock satın alma (test ve simülasyon için)
     * @param {String} productId - Ürün ID'si
     * @return {Promise} Satın alma sözü
     */
    _mockPurchase(productId) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // %90 başarı oranı
                    const product = this.products[productId];
                    const transactionId = `mock_transaction_${Date.now()}`;
                    const receipt = {
                        productId,
                        transactionId,
                        timestamp: new Date().toISOString(),
                        purchaseToken: `mock_token_${Math.random().toString(36).substring(2)}`
                    };
                    
                    if (this.config.logging) {
                        console.log(`Mock purchase success: ${productId}`);
                    }
                    
                    if (this.onPurchaseSuccess) {
                        this.onPurchaseSuccess(product, transactionId, receipt);
                    }
                    
                    resolve({ product, transactionId, receipt });
                } else {
                    // Satın alma hatası simüle et
                    const error = new Error('Mock purchase failure');
                    
                    if (this.config.logging) {
                        console.error(`Mock purchase failed: ${productId}`);
                    }
                    
                    if (this.onPurchaseFailed) {
                        this.onPurchaseFailed(error);
                    }
                    
                    reject(error);
                }
            }, 1000);
        });
    }
    
    /**
     * Satın almaları geri yükler
     * @return {Promise} Geri yükleme sözü
     */
    restore() {
        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                const error = new Error('IAP not ready');
                if (this.onError) this.onError(error);
                reject(error);
                return;
            }
            
            if (this.config.logging) {
                console.log('Restoring purchases');
            }
            
            switch (this.config.platform) {
                case 'ios':
                    window.storekit.restore(() => {
                        resolve();
                    }, error => {
                        reject(new Error(error));
                    });
                    break;
                    
                case 'android':
                    window.inappbilling.restorePurchases(purchases => {
                        if (purchases && purchases.length > 0) {
                            for (const purchase of purchases) {
                                const product = this.products[purchase.productId];
                                
                                if (product && this.onRestore) {
                                    this.onRestore(product, purchase.orderId);
                                }
                            }
                        }
                        
                        resolve(purchases || []);
                    }, error => {
                        reject(new Error(error));
                    });
                    break;
                    
                case 'amazon':
                    window.AmazonIAP.getPurchaseUpdates(false, response => {
                        if (response.status === 'SUCCESSFUL') {
                            if (response.receipts && response.receipts.length > 0) {
                                for (const receipt of response.receipts) {
                                    const product = this.products[receipt.sku];
                                    
                                    if (product && this.onRestore) {
                                        this.onRestore(product, receipt.receiptId);
                                    }
                                }
                            }
                            
                            resolve(response.receipts || []);
                        } else {
                            reject(new Error(`Amazon restore failed: ${response.status}`));
                        }
                    });
                    break;
                    
                default:
                    // Mock geri yükleme
                    this._mockRestore()
                        .then(resolve)
                        .catch(reject);
                    break;
            }
        });
    }
    
    /**
     * Mock geri yükleme (test ve simülasyon için)
     * @return {Promise} Geri yükleme sözü
     */
    _mockRestore() {
        return new Promise(resolve => {
            setTimeout(() => {
                const mockPurchases = [];
                
                // Mock satın almaları oluştur (özellikle non-consumable ve abonelikler için)
                const nonConsumables = Object.values(this.products).filter(
                    p => p.type === 'non-consumable' || p.type === 'subscription'
                );
                
                // Bazı ürünleri rastgele geri yükle
                nonConsumables.forEach(product => {
                    if (Math.random() > 0.5) { // %50 olasılık
                        const purchase = {
                            productId: product.id,
                            orderId: `mock_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                            purchaseTime: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000) // Son 30 gün içinde
                        };
                        
                        mockPurchases.push(purchase);
                        
                        if (this.onRestore) {
                            this.onRestore(product, purchase.orderId);
                        }
                    }
                });
                
                if (this.config.logging) {
                    console.log(`Mock restore: ${mockPurchases.length} purchases restored`);
                }
                
                resolve(mockPurchases);
            }, 1000);
        });
    }
    
    /**
     * Kullanıcının satın alma yapıp yapamayacağını kontrol eder
     * @return {Boolean} Kullanıcı satın alma yapabilir mi
     */
    canPurchase() {
        return this.isReady && this.canMakePayments;
    }
    
    /**
     * Ürün detaylarını alır
     * @param {String} productId - Ürün ID'si
     * @return {Object|null} Ürün detayları veya null (bulunamazsa)
     */
    getProduct(productId) {
        return this.products[productId] || null;
    }
    
    /**
     * Ürün detaylarını takma ada göre alır
     * @param {String} alias - Ürün takma adı
     * @return {Object|null} Ürün detayları veya null (bulunamazsa)
     */
    getProductByAlias(alias) {
        return Object.values(this.products).find(p => p.alias === alias) || null;
    }
    
    /**
     * Tüm ürün detaylarını alır
     * @return {Object} Ürün detayları
     */
    getAllProducts() {
        return this.products;
    }
    
    /**
     * Ürün detaylarını tipe göre filtreler
     * @param {String} type - Ürün tipi ('consumable', 'non-consumable', 'subscription')
     * @return {Array} Ürün listesi
     */
    getProductsByType(type) {
        return Object.values(this.products).filter(p => p.type === type);
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!IAP.instance) {
            new IAP();
        }
        return IAP.instance;
    }
}

// Singleton instance
IAP.instance = null;