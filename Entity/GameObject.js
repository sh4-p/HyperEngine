/**
 * GameObject.js - Temel oyun nesnesi
 * Oyun içindeki her nesnenin temel sınıfı
 */
class GameObject {
    constructor(name = "GameObject") {
        this.id = GameObject._generateId();
        this.name = name;
        this.tag = "";
        this.layer = 0;
        this.active = true;
        
        // Bileşenler
        this.components = [];
        this.transform = new Transform();
        this.addComponent(this.transform);
        
        // Hiyerarşi
        this.parent = null;
        this.children = [];
        
        // Sahne referansı
        this.scene = null;
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        // Nesne aktif değilse güncelleme
        if (!this.active) return;
        
        // Tüm bileşenleri güncelle
        for (const component of this.components) {
            if (component.active && component.update) {
                component.update(deltaTime);
            }
        }
        
        // Alt nesneleri güncelle
        for (const child of this.children) {
            child.update(deltaTime);
        }
    }
    
    /**
     * Render işlemi sırasında çağrılır
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        // Nesne aktif değilse render etme
        if (!this.active) return;
        
        // Tüm bileşenleri render et
        for (const component of this.components) {
            if (component.active && component.render) {
                component.render(renderer);
            }
        }
        
        // Alt nesneleri render et
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
        
        // Bileşen zaten ekli mi kontrol et
        if (this.components.includes(component)) {
            return component;
        }
        
        // Bileşeni diziye ekle
        this.components.push(component);
        
        // Bileşene game object'i bildir
        component.gameObject = this;
        
        // Transform değilse scene'i bildir
        if (!(component instanceof Transform) && this.scene) {
            component.scene = this.scene;
        }
        
        // Start metodunu çağır (bileşen eklendikten sonra)
        if (component.start) {
            component.start();
        }
        
        return component;
    }
    
    /**
     * Bileşen kaldırır
     * @param {Component} component - Kaldırılacak bileşen
     */
    removeComponent(component) {
        // Transform bileşeni kaldırılamaz
        if (component === this.transform) {
            console.error("Transform bileşeni kaldırılamaz");
            return;
        }
        
        const index = this.components.indexOf(component);
        
        if (index !== -1) {
            // OnDestroy metodunu çağır (bileşen kaldırılmadan önce)
            if (component.onDestroy) {
                component.onDestroy();
            }
            
            // Bileşeni diziden kaldır
            this.components.splice(index, 1);
            
            // Bileşenden game object referansını kaldır
            component.gameObject = null;
            component.scene = null;
        }
    }
    
    /**
     * Bileşen tipine göre bileşen bulur
     * @param {String} type - Bileşen tipi (sınıf adı)
     * @return {Component} Bulunan bileşen veya null
     */
    getComponent(type) {
        // "Transform" şeklinde string veya Transform sınıfı şeklinde referans olabilir
        const typeName = typeof type === 'string' ? type : type.name;
        
        for (const component of this.components) {
            // Constructor.name kullanarak sınıf adını kontrol et
            if (component.constructor.name === typeName) {
                return component;
            }
        }
        
        return null;
    }
    
    /**
     * Bileşen tipine göre tüm bileşenleri bulur
     * @param {String} type - Bileşen tipi (sınıf adı)
     * @return {Array} Bulunan bileşenler dizisi
     */
    getComponents(type) {
        const typeName = typeof type === 'string' ? type : type.name;
        
        return this.components.filter(component => 
            component.constructor.name === typeName
        );
    }
    
    /**
     * Alt nesne ekler
     * @param {GameObject} child - Eklenecek alt nesne
     */
    addChild(child) {
        if (!(child instanceof GameObject)) {
            console.error("Eklenecek nesne bir GameObject olmalı");
            return;
        }
        
        // Kendi kendine alt nesne olamaz
        if (child === this) {
            console.error("Bir GameObject kendisinin alt nesnesi olamaz");
            return;
        }
        
        // Döngüsel bağımlılık kontrolü
        if (this.isChildOf(child)) {
            console.error("Döngüsel bağımlılık: Bir GameObject kendi atasının alt nesnesi olamaz");
            return;
        }
        
        // Mevcut ebeveynden kaldır
        if (child.parent) {
            child.parent.removeChild(child);
        }
        
        // Alt nesneyi ekle
        this.children.push(child);
        child.parent = this;
        
        // Transform'u güncelle
        child.transform.setParent(this.transform);
        
        // Sahne referansını güncelle
        if (this.scene) {
            child.setScene(this.scene);
        }
    }
    
    /**
     * Alt nesne kaldırır
     * @param {GameObject} child - Kaldırılacak alt nesne
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        
        if (index !== -1) {
            // Alt nesneyi kaldır
            this.children.splice(index, 1);
            
            // Bağlantıları temizle
            child.parent = null;
            child.transform.setParent(null);
            
            // Sahne referansını güncelle
            child.setScene(null);
        }
    }
    
    /**
     * Tüm alt nesneleri kaldırır
     */
    removeAllChildren() {
        // Her bir alt nesneyi kaldır
        while (this.children.length > 0) {
            this.removeChild(this.children[0]);
        }
    }
    
    /**
     * Verilen nesnenin alt nesnesi mi kontrol eder
     * @param {GameObject} parent - Kontrol edilecek üst nesne
     * @return {Boolean} Alt nesne mi
     */
    isChildOf(parent) {
        let current = this.parent;
        
        while (current) {
            if (current === parent) {
                return true;
            }
            current = current.parent;
        }
        
        return false;
    }
    
    /**
     * Aktiflik durumunu değiştirir
     * @param {Boolean} active - Aktif mi
     */
    setActive(active) {
        this.active = active;
        
        // Alt nesneleri de güncelle
        for (const child of this.children) {
            child.setActive(active);
        }
    }
    
    /**
     * Sahne referansını ayarlar (Editor tarafından kullanılır)
     * @param {Scene} scene - Sahne referansı
     */
    setScene(scene) {
        this.scene = scene;
        
        // Tüm bileşenlere sahne referansını bildir
        for (const component of this.components) {
            component.scene = scene;
        }
        
        // Alt nesnelere de bildir
        for (const child of this.children) {
            child.setScene(scene);
        }
    }
    
    /**
     * Objeyi klonlar
     * @param {Boolean} recursive - Alt nesneleri de klonla
     * @return {GameObject} Klonlanan nesne
     */
    clone(recursive = true) {
        // Yeni nesne oluştur
        const clone = new GameObject(this.name + " (Clone)");
        clone.tag = this.tag;
        clone.layer = this.layer;
        clone.active = this.active;
        
        // Transform'u kopyala
        clone.transform.position.x = this.transform.position.x;
        clone.transform.position.y = this.transform.position.y;
        clone.transform.rotation = this.transform.rotation;
        clone.transform.scale.x = this.transform.scale.x;
        clone.transform.scale.y = this.transform.scale.y;
        
        // Transform dışındaki bileşenleri kopyala
        for (const component of this.components) {
            if (component !== this.transform && component.clone) {
                const componentClone = component.clone();
                clone.addComponent(componentClone);
            }
        }
        
        // Alt nesneleri kopyala
        if (recursive) {
            for (const child of this.children) {
                const childClone = child.clone(true);
                clone.addChild(childClone);
            }
        }
        
        return clone;
    }
    
    /**
     * Nesneyi yok eder
     */
    destroy() {
        // Sahneyi bildir
        if (this.scene) {
            this.scene.removeGameObject(this);
        }
        
        // Üst nesneden kaldır
        if (this.parent) {
            this.parent.removeChild(this);
        }
        
        // Alt nesneleri yok et
        for (const child of [...this.children]) {
            child.destroy();
        }
        
        // Tüm bileşenleri yok et
        for (const component of [...this.components]) {
            if (component !== this.transform) {
                this.removeComponent(component);
            }
        }
        
        // Transform bileşenini yok et
        if (this.transform.onDestroy) {
            this.transform.onDestroy();
        }
        
        // Referansları temizle
        this.transform = null;
        this.components = [];
        this.children = [];
        this.parent = null;
        this.scene = null;
    }
    
    /**
     * Benzersiz ID üretir
     * @return {String} Benzersiz ID
     */
    static _generateId() {
        return 'go_' + Math.random().toString(36).substr(2, 9);
    }
}