/**
 * GameObject.js - Temel oyun nesnesi sınıfı
 * Tüm oyun nesneleri için temel sınıf
 */
class GameObject {
    constructor(name = "GameObject") {
        this.id = GameObject._generateId();
        this.name = name;
        this.active = true;
        this.tag = "";
        this.layer = 0;
        
        // Bileşen yönetimi
        this.components = [];
        this.componentsByType = {};
        
        // Dönüşüm bileşeni (her oyun nesnesinin sahip olması gereken)
        this.transform = new Transform();
        this.addComponent(this.transform);
        
        // Ebeveyn-çocuk ilişkisi
        this.parent = null;
        this.children = [];
        
        // Sahne referansı
        this.scene = null;
    }
    
    /**
     * Game Object'i günceller
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        if (!this.active) return;
        
        // Tüm bileşenleri güncelle
        for (const component of this.components) {
            if (component.active) {
                component.update(deltaTime);
            }
        }
        
        // Tüm çocukları güncelle
        for (const child of this.children) {
            child.update(deltaTime);
        }
    }
    
    /**
     * Game Object'i render eder
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        if (!this.active) return;
        
        // Tüm bileşenleri render et
        for (const component of this.components) {
            if (component.active) {
                component.render(renderer);
            }
        }
        
        // Tüm çocukları render et
        for (const child of this.children) {
            child.render(renderer);
        }
    }
    
    /**
     * Bileşen ekler
     * @param {Component} component - Eklenecek bileşen
     * @return {Component} Eklenen bileşen
     */
    addComponent(component) {
        if (!(component instanceof Component)) {
            console.error("Eklenecek nesne bir Component olmalı");
            return null;
        }
        
        // Bileşeni nesneye bağla
        component.gameObject = this;
        
        // Bileşeni dizilere ekle
        this.components.push(component);
        
        // Türüne göre kaydet
        const type = component.constructor.name;
        if (!this.componentsByType[type]) {
            this.componentsByType[type] = [];
        }
        this.componentsByType[type].push(component);
        
        // Bileşen başlatma
        component.start();
        
        return component;
    }
    
    /**
     * Bileşen kaldırır
     * @param {Component} component - Kaldırılacak bileşen
     */
    removeComponent(component) {
        const index = this.components.indexOf(component);
        if (index !== -1) {
            // Bileşeni diziden kaldır
            this.components.splice(index, 1);
            
            // Türüne göre diziden kaldır
            const type = component.constructor.name;
            if (this.componentsByType[type]) {
                const typeIndex = this.componentsByType[type].indexOf(component);
                if (typeIndex !== -1) {
                    this.componentsByType[type].splice(typeIndex, 1);
                }
            }
            
            // Bileşenin bağlantısını kaldır
            component.gameObject = null;
        }
    }
    
    /**
     * Belirtilen türdeki ilk bileşeni bulur
     * @param {String} type - Bileşen türü
     * @return {Component} Bulunan bileşen veya null
     */
    getComponent(type) {
        if (this.componentsByType[type] && this.componentsByType[type].length > 0) {
            return this.componentsByType[type][0];
        }
        return null;
    }
    
    /**
     * Belirtilen türdeki tüm bileşenleri bulur
     * @param {String} type - Bileşen türü
     * @return {Array} Bileşen dizisi
     */
    getComponents(type) {
        if (this.componentsByType[type]) {
            return [...this.componentsByType[type]];
        }
        return [];
    }
    
    /**
     * Çocuk ekler
     * @param {GameObject} child - Eklenecek çocuk
     */
    addChild(child) {
        if (!(child instanceof GameObject)) {
            console.error("Eklenecek nesne bir GameObject olmalı");
            return;
        }
        
        // Önceki ebeveynden kaldır
        if (child.parent) {
            child.parent.removeChild(child);
        }
        
        // Ebeveyn-çocuk ilişkisini kur
        child.parent = this;
        this.children.push(child);
        
        // Sahneyi çocuğa bildir
        if (this.scene) {
            child.setScene(this.scene);
        }
    }
    
    /**
     * Çocuk kaldırır
     * @param {GameObject} child - Kaldırılacak çocuk
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            child.parent = null;
            this.children.splice(index, 1);
        }
    }
    
    /**
     * Sahneyi ayarlar (iç kullanım için)
     * @param {Scene} scene - Sahne referansı
     */
    setScene(scene) {
        this.scene = scene;
        
        // Tüm çocuklara sahneyi bildir
        for (const child of this.children) {
            child.setScene(scene);
        }
    }
    
    /**
     * Nesneyi etkinleştirir/devre dışı bırakır
     * @param {Boolean} value - Etkin olup olmadığı
     */
    setActive(value) {
        this.active = value;
    }
    
    /**
     * Benzersiz ID üretir
     * @return {String} Benzersiz ID
     */
    static _generateId() {
        return 'go_' + Math.random().toString(36).substr(2, 9);
    }
}