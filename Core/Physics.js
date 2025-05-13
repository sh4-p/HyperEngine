/**
 * Physics.js - Basit fizik motoru
 * Çarpışma algılama ve fizik simülasyonu
 */
class Physics {
    constructor() {
        this.gravity = { x: 0, y: 9.8 };
        this.colliders = [];
        this.rigidbodies = [];
        this.collisionPairs = [];
        
        // Singleton instance
        if (Physics.instance) {
            return Physics.instance;
        }
        Physics.instance = this;
    }
    
    /**
     * Collider ekler
     * @param {Collider} collider - Eklenecek collider
     */
    addCollider(collider) {
        if (this.colliders.indexOf(collider) === -1) {
            this.colliders.push(collider);
        }
    }
    
    /**
     * Collider kaldırır
     * @param {Collider} collider - Kaldırılacak collider
     */
    removeCollider(collider) {
        const index = this.colliders.indexOf(collider);
        if (index !== -1) {
            this.colliders.splice(index, 1);
        }
    }
    
    /**
     * Rigidbody ekler
     * @param {Rigidbody} rigidbody - Eklenecek rigidbody
     */
    addRigidbody(rigidbody) {
        if (this.rigidbodies.indexOf(rigidbody) === -1) {
            this.rigidbodies.push(rigidbody);
        }
    }
    
    /**
     * Rigidbody kaldırır
     * @param {Rigidbody} rigidbody - Kaldırılacak rigidbody
     */
    removeRigidbody(rigidbody) {
        const index = this.rigidbodies.indexOf(rigidbody);
        if (index !== -1) {
            this.rigidbodies.splice(index, 1);
        }
    }
    
    /**
     * Fizik sistemini günceller
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        // Rigidbody'leri güncelle
        for (const rb of this.rigidbodies) {
            if (!rb.active || !rb.gameObject.active) continue;
            
            // Gravite uygula
            if (rb.useGravity) {
                rb.velocity.x += this.gravity.x * deltaTime;
                rb.velocity.y += this.gravity.y * deltaTime;
            }
            
            // Sürtünme uygula
            rb.velocity.x *= (1 - rb.drag * deltaTime);
            rb.velocity.y *= (1 - rb.drag * deltaTime);
            
            // Hız sınırlaması uygula
            const speed = Math.sqrt(rb.velocity.x * rb.velocity.x + rb.velocity.y * rb.velocity.y);
            if (speed > rb.maxSpeed && rb.maxSpeed > 0) {
                rb.velocity.x = (rb.velocity.x / speed) * rb.maxSpeed;
                rb.velocity.y = (rb.velocity.y / speed) * rb.maxSpeed;
            }
            
            // Pozisyonu güncelle
            rb.transform.position.x += rb.velocity.x * deltaTime;
            rb.transform.position.y += rb.velocity.y * deltaTime;
        }
        
        // Çarpışmaları algıla
        this._detectCollisions();
        
        // Çarpışma tepkilerini hesapla
        this._resolveCollisions();
        
        // Çarpışma olaylarını tetikle
        this._triggerCollisionEvents();
    }
    
    /**
     * Çarpışmaları algılar
     */
    _detectCollisions() {
        // Çarpışma çiftlerini temizle
        this.collisionPairs = [];
        
        // Tüm collider çiftlerini kontrol et
        for (let i = 0; i < this.colliders.length; i++) {
            const colliderA = this.colliders[i];
            
            if (!colliderA.active || !colliderA.gameObject.active) continue;
            
            for (let j = i + 1; j < this.colliders.length; j++) {
                const colliderB = this.colliders[j];
                
                if (!colliderB.active || !colliderB.gameObject.active) continue;
                
                // Aynı game object'e ait collider'ları atla
                if (colliderA.gameObject === colliderB.gameObject) continue;
                
                // Çarpışma katmanlarını kontrol et
                if (!this._checkLayerCollision(colliderA.layer, colliderB.layer)) continue;
                
                // Çarpışma algılama
                const collision = this._checkCollision(colliderA, colliderB);
                
                if (collision) {
                    this.collisionPairs.push({
                        a: colliderA,
                        b: colliderB,
                        collision: collision
                    });
                }
            }
        }
    }
    
    /**
     * İki collider arasında çarpışma kontrolü yapar
     * @param {Collider} a - İlk collider
     * @param {Collider} b - İkinci collider
     * @return {Object|null} Çarpışma bilgisi veya null
     */
    _checkCollision(a, b) {
        // Farklı collider tiplerine göre çarpışma kontrolü
        if (a.type === 'circle' && b.type === 'circle') {
            return this._checkCircleCircleCollision(a, b);
        } else if (a.type === 'box' && b.type === 'box') {
            return this._checkBoxBoxCollision(a, b);
        } else if (a.type === 'circle' && b.type === 'box') {
            return this._checkCircleBoxCollision(a, b);
        } else if (a.type === 'box' && b.type === 'circle') {
            const result = this._checkCircleBoxCollision(b, a);
            if (result) {
                // Çarpışma yönünü tersine çevir
                result.normal.x *= -1;
                result.normal.y *= -1;
                return result;
            }
            return null;
        }
        
        return null;
    }
    
    /**
     * İki daire arasında çarpışma kontrolü
     * @param {Collider} a - İlk daire collider
     * @param {Collider} b - İkinci daire collider
     * @return {Object|null} Çarpışma bilgisi veya null
     */
    _checkCircleCircleCollision(a, b) {
        const posA = a.getWorldPosition();
        const posB = b.getWorldPosition();
        
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const radiusA = a.radius * Math.max(a.transform.getWorldScale().x, a.transform.getWorldScale().y);
        const radiusB = b.radius * Math.max(b.transform.getWorldScale().x, b.transform.getWorldScale().y);
        
        if (distance < radiusA + radiusB) {
            // Çarpışma var
            const overlap = radiusA + radiusB - distance;
            
            // Çarpışma normali
            let normalX = 0;
            let normalY = 0;
            
            if (distance > 0) {
                normalX = dx / distance;
                normalY = dy / distance;
            } else {
                // Aynı pozisyondalar, rastgele bir yön seç
                normalX = 1;
                normalY = 0;
            }
            
            return {
                normal: { x: normalX, y: normalY },
                depth: overlap,
                point: {
                    x: posA.x + normalX * radiusA,
                    y: posA.y + normalY * radiusA
                }
            };
        }
        
        return null;
    }
    
    /**
     * İki kutu arasında çarpışma kontrolü
     * @param {Collider} a - İlk kutu collider
     * @param {Collider} b - İkinci kutu collider
     * @return {Object|null} Çarpışma bilgisi veya null
     */
    _checkBoxBoxCollision(a, b) {
        const posA = a.getWorldPosition();
        const posB = b.getWorldPosition();
        
        const scaleA = a.transform.getWorldScale();
        const scaleB = b.transform.getWorldScale();
        
        const halfWidthA = a.width * scaleA.x / 2;
        const halfHeightA = a.height * scaleA.y / 2;
        
        const halfWidthB = b.width * scaleB.x / 2;
        const halfHeightB = b.height * scaleB.y / 2;
        
        // A kutusunun kenarları
        const leftA = posA.x - halfWidthA;
        const rightA = posA.x + halfWidthA;
        const topA = posA.y - halfHeightA;
        const bottomA = posA.y + halfHeightA;
        
        // B kutusunun kenarları
        const leftB = posB.x - halfWidthB;
        const rightB = posB.x + halfWidthB;
        const topB = posB.y - halfHeightB;
        const bottomB = posB.y + halfHeightB;
        
        // Çarpışma kontrolü
        if (rightA > leftB && leftA < rightB && bottomA > topB && topA < bottomB) {
            // Çarpışma var, minimum çakışma mesafesini bul
            const overlapX = Math.min(rightA - leftB, rightB - leftA);
            const overlapY = Math.min(bottomA - topB, bottomB - topA);
            
            // En küçük çakışma mesafesine göre normal belirle
            let normalX = 0;
            let normalY = 0;
            
            if (overlapX < overlapY) {
                normalX = posA.x < posB.x ? -1 : 1;
            } else {
                normalY = posA.y < posB.y ? -1 : 1;
            }
            
            return {
                normal: { x: normalX, y: normalY },
                depth: normalX !== 0 ? overlapX : overlapY,
                point: {
                    x: posB.x - normalX * halfWidthB,
                    y: posB.y - normalY * halfHeightB
                }
            };
        }
        
        return null;
    }
    
    /**
     * Daire ve kutu arasında çarpışma kontrolü
     * @param {Collider} circle - Daire collider
     * @param {Collider} box - Kutu collider
     * @return {Object|null} Çarpışma bilgisi veya null
     */
    _checkCircleBoxCollision(circle, box) {
        const circlePos = circle.getWorldPosition();
        const boxPos = box.getWorldPosition();
        
        const circleScale = circle.transform.getWorldScale();
        const boxScale = box.transform.getWorldScale();
        
        const radius = circle.radius * Math.max(circleScale.x, circleScale.y);
        const halfWidth = box.width * boxScale.x / 2;
        const halfHeight = box.height * boxScale.y / 2;
        
        // En yakın noktayı bul
        const closestX = Math.max(boxPos.x - halfWidth, Math.min(circlePos.x, boxPos.x + halfWidth));
        const closestY = Math.max(boxPos.y - halfHeight, Math.min(circlePos.y, boxPos.y + halfHeight));
        
        // En yakın nokta ile daire merkezi arasındaki mesafeyi hesapla
        const dx = closestX - circlePos.x;
        const dy = closestY - circlePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius) {
            // Çarpışma var
            const overlap = radius - distance;
            
            // Çarpışma normali
            let normalX = 0;
            let normalY = 0;
            
            if (distance > 0) {
                normalX = dx / distance;
                normalY = dy / distance;
            } else {
                // Aynı pozisyondalar, kutudan uzaklaştıran bir yön seç
                if (circlePos.x < boxPos.x) normalX = -1;
                else if (circlePos.x > boxPos.x) normalX = 1;
                else if (circlePos.y < boxPos.y) normalY = -1;
                else normalY = 1;
            }
            
            return {
                normal: { x: normalX, y: normalY },
                depth: overlap,
                point: {
                    x: circlePos.x + normalX * radius,
                    y: circlePos.y + normalY * radius
                }
            };
        }
        
        return null;
    }
    
    /**
     * Katmanların çarpışıp çarpışmadığını kontrol eder
     * @param {Number} layerA - İlk katman
     * @param {Number} layerB - İkinci katman
     * @return {Boolean} Çarpışma var mı
     */
    _checkLayerCollision(layerA, layerB) {
        // Tüm katmanlar çarpışır (alt sınıflarda özelleştirilebilir)
        return true;
    }
    
    /**
     * Çarpışma tepkilerini hesaplar ve uygular
     */
    _resolveCollisions() {
        for (const pair of this.collisionPairs) {
            const a = pair.a;
            const b = pair.b;
            
            // Her iki collider da rigidbody içeriyorsa tepki hesapla
            const rbA = a.gameObject.getComponent('Rigidbody');
            const rbB = b.gameObject.getComponent('Rigidbody');
            
            if (rbA && rbB) {
                // Her ikisi de dinamik
                if (rbA.isKinematic && rbB.isKinematic) {
                    continue; // İkisi de kinematik ise tepki hesaplama
                }
                
                const collision = pair.collision;
                
                if (rbA.isKinematic) {
                    // A kinematik, B dinamik
                    this._resolveCollisionOneWay(b, a, collision, rbB, true);
                } else if (rbB.isKinematic) {
                    // A dinamik, B kinematik
                    this._resolveCollisionOneWay(a, b, collision, rbA, false);
                } else {
                    // Her ikisi de dinamik
                    this._resolveCollisionTwoWay(a, b, collision, rbA, rbB);
                }
            } else if (rbA) {
                // Sadece A rigidbody içeriyor
                this._resolveCollisionOneWay(a, b, pair.collision, rbA, false);
            } else if (rbB) {
                // Sadece B rigidbody içeriyor
                this._resolveCollisionOneWay(b, a, pair.collision, rbB, true);
            }
        }
    }
    
    /**
     * Tek yönlü çarpışma tepkisi (sadece bir nesne hareket eder)
     * @param {Collider} dynamic - Dinamik collider
     * @param {Collider} static - Statik collider
     * @param {Object} collision - Çarpışma bilgisi
     * @param {Rigidbody} rb - Dinamik collider'ın rigidbody'si
     * @param {Boolean} flipNormal - Normal yönünü tersine çevir
     */
    _resolveCollisionOneWay(dynamic, staticCol, collision, rb, flipNormal) {
        // Pozisyon düzelt
        const normal = collision.normal;
        const depth = collision.depth;
        
        // Yönü tersine çevir
        const normalX = flipNormal ? -normal.x : normal.x;
        const normalY = flipNormal ? -normal.y : normal.y;
        
        // Pozisyonu düzelt
        rb.transform.position.x += normalX * depth;
        rb.transform.position.y += normalY * depth;
        
        // Hızı yansıt
        const dot = rb.velocity.x * normalX + rb.velocity.y * normalY;
        
        if (dot < 0) {
            const bounceFactor = rb.bounciness;
            
            rb.velocity.x = rb.velocity.x - (1 + bounceFactor) * dot * normalX;
            rb.velocity.y = rb.velocity.y - (1 + bounceFactor) * dot * normalY;
        }
    }
    
    /**
     * İki yönlü çarpışma tepkisi (her iki nesne de hareket eder)
     * @param {Collider} a - İlk collider
     * @param {Collider} b - İkinci collider
     * @param {Object} collision - Çarpışma bilgisi
     * @param {Rigidbody} rbA - İlk collider'ın rigidbody'si
     * @param {Rigidbody} rbB - İkinci collider'ın rigidbody'si
     */
    _resolveCollisionTwoWay(a, b, collision, rbA, rbB) {
        const normal = collision.normal;
        const depth = collision.depth;
        
        // Kütle oranları
        const totalMass = rbA.mass + rbB.mass;
        const ratioA = rbB.mass / totalMass;
        const ratioB = rbA.mass / totalMass;
        
        // Pozisyonları düzelt
        rbA.transform.position.x -= normal.x * depth * ratioA;
        rbA.transform.position.y -= normal.y * depth * ratioA;
        
        rbB.transform.position.x += normal.x * depth * ratioB;
        rbB.transform.position.y += normal.y * depth * ratioB;
        
        // Hızları yansıt
        const relVelX = rbB.velocity.x - rbA.velocity.x;
        const relVelY = rbB.velocity.y - rbA.velocity.y;
        
        const dotProduct = relVelX * normal.x + relVelY * normal.y;
        
        // Nesneler birbirinden uzaklaşıyorsa tepki hesaplama
        if (dotProduct > 0) return;
        
        // Tepki kuvveti
        const bounceFactor = (rbA.bounciness + rbB.bounciness) / 2;
        const j = -(1 + bounceFactor) * dotProduct;
        const impulseX = j * normal.x;
        const impulseY = j * normal.y;
        
        // İmpulsu uygula
        rbA.velocity.x -= impulseX * ratioA;
        rbA.velocity.y -= impulseY * ratioA;
        
        rbB.velocity.x += impulseX * ratioB;
        rbB.velocity.y += impulseY * ratioB;
    }
    
    /**
     * Çarpışma olaylarını tetikler
     */
    _triggerCollisionEvents() {
        // Geçen çarpışma çiftleri
        const lastCollisionPairs = this._lastCollisionPairs || [];
        
        // Yeni çarpışma çiftleri
        const currentCollisionPairs = this.collisionPairs;
        
        // Devam eden çarpışmalar
        const continuingPairs = [];
        
        // Yeni çarpışmalar için onCollisionEnter
        for (const pair of currentCollisionPairs) {
            // Önceki çarpışmalar arasında bu çifti ara
            const found = lastCollisionPairs.find(p => 
                (p.a === pair.a && p.b === pair.b) || (p.a === pair.b && p.b === pair.a)
            );
            
            if (!found) {
                // Yeni çarpışma
                this._triggerCollisionEnter(pair.a, pair.b, pair.collision);
            } else {
                // Devam eden çarpışma
                continuingPairs.push(pair);
                this._triggerCollisionStay(pair.a, pair.b, pair.collision);
            }
        }
        
        // Sona eren çarpışmalar için onCollisionExit
        for (const pair of lastCollisionPairs) {
            const found = currentCollisionPairs.find(p => 
                (p.a === pair.a && p.b === pair.b) || (p.a === pair.b && p.b === pair.a)
            );
            
            if (!found) {
                // Sona eren çarpışma
                this._triggerCollisionExit(pair.a, pair.b, pair.collision);
            }
        }
        
        // Çarpışma çiftlerini kaydet
        this._lastCollisionPairs = currentCollisionPairs;
    }
    
    /**
     * onCollisionEnter olayını tetikler
     * @param {Collider} a - İlk collider
     * @param {Collider} b - İkinci collider
     * @param {Object} collision - Çarpışma bilgisi
     */
    _triggerCollisionEnter(a, b, collision) {
        // Game object'lerdeki tüm bileşenlere bildir
        for (const component of a.gameObject.components) {
            if (component.active && component.onCollisionEnter) {
                component.onCollisionEnter(b);
            }
        }
        
        for (const component of b.gameObject.components) {
            if (component.active && component.onCollisionEnter) {
                component.onCollisionEnter(a);
            }
        }
    }
    
    /**
     * onCollisionStay olayını tetikler
     * @param {Collider} a - İlk collider
     * @param {Collider} b - İkinci collider
     * @param {Object} collision - Çarpışma bilgisi
     */
    _triggerCollisionStay(a, b, collision) {
        // Game object'lerdeki tüm bileşenlere bildir
        for (const component of a.gameObject.components) {
            if (component.active && component.onCollisionStay) {
                component.onCollisionStay(b);
            }
        }
        
        for (const component of b.gameObject.components) {
            if (component.active && component.onCollisionStay) {
                component.onCollisionStay(a);
            }
        }
    }
    
    /**
     * onCollisionExit olayını tetikler
     * @param {Collider} a - İlk collider
     * @param {Collider} b - İkinci collider
     * @param {Object} collision - Çarpışma bilgisi
     */
    _triggerCollisionExit(a, b, collision) {
        // Game object'lerdeki tüm bileşenlere bildir
        for (const component of a.gameObject.components) {
            if (component.active && component.onCollisionExit) {
                component.onCollisionExit(b);
            }
        }
        
        for (const component of b.gameObject.components) {
            if (component.active && component.onCollisionExit) {
                component.onCollisionExit(a);
            }
        }
    }
    
    /**
     * Singleton erişimi
     */
    static getInstance() {
        if (!Physics.instance) {
            new Physics();
        }
        return Physics.instance;
    }
}

// Singleton instance
Physics.instance = null;