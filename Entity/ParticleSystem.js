/**
 * ParticleSystem.js - Parçacık sistemi
 * Görsel efektler için parçacık simülasyonu
 */
class ParticleSystem extends GameObject {
    constructor(params = {}) {
        super('ParticleSystem');
        
        // Sistem özellikleri
        this.x = params.x || 0;
        this.y = params.y || 0;
        this.emitterShape = params.emitterShape || 'point'; // 'point', 'circle', 'rectangle', 'line'
        this.emitterSize = params.emitterSize || 0; // Sadece circle, rectangle ve line için
        this.emitterWidth = params.emitterWidth || 0; // Sadece rectangle için
        this.emitterHeight = params.emitterHeight || 0; // Sadece rectangle için
        this.emitterAngle = params.emitterAngle || 0; // Sadece line için
        this.emitterSpread = params.emitterSpread || 0; // Sadece line için
        
        // Parçacık üretim özellikleri
        this.count = params.count || 10; // Toplam parçacık sayısı
        this.emitRate = params.emitRate || 0; // Saniyede oluşturulacak parçacık (0 = hepsini hemen üret)
        this.burstMode = params.burstMode !== undefined ? params.burstMode : true; // true = hepsini aynı anda oluştur
        this.continuous = params.continuous || false; // Sürekli parçacık üretimi
        this.duration = params.duration || 0; // Saniye cinsinden sistem süresi (0 = sınırsız)
        this.autoDestroy = params.autoDestroy !== undefined ? params.autoDestroy : true; // Parçacıklar bitince otomatik yok olsun mu
        
        // Parçacık özellikleri
        this.particleImage = params.particleImage || null; // Parçacık resmi (null = form)
        this.particleForm = params.particleForm || 'circle'; // 'circle', 'square', 'triangle', 'star', 'custom'
        this.customPath = params.customPath || null; // Özel path fonksiyonu
        this.size = params.size || 5; // Parçacık boyutu
        this.sizeVariation = params.sizeVariation || 0.2; // Boyut varyasyonu (0-1)
        this.minSize = params.minSize || 1; // Minimum parçacık boyutu
        this.maxSize = params.maxSize || 10; // Maksimum parçacık boyutu
        this.colors = params.colors || ['#FFFFFF']; // Parçacık renkleri
        this.colorMode = params.colorMode || 'random'; // 'random', 'sequence', 'gradient'
        this.opacity = params.opacity !== undefined ? params.opacity : 1; // Başlangıç opaklığı
        this.opacityStart = params.opacityStart !== undefined ? params.opacityStart : this.opacity;
        this.opacityEnd = params.opacityEnd !== undefined ? params.opacityEnd : 0;
        this.blendMode = params.blendMode || 'source-over'; // Canvas globalCompositeOperation
        
        // Hareket özellikleri
        this.speed = params.speed || 100; // Piksel/saniye
        this.speedVariation = params.speedVariation || 0.2; // Hız varyasyonu (0-1)
        this.minSpeed = params.minSpeed || 10; // Minimum hız
        this.maxSpeed = params.maxSpeed || 200; // Maksimum hız
        this.directionMin = params.directionMin || 0; // Minimum yön açısı (derece)
        this.directionMax = params.directionMax || 360; // Maksimum yön açısı (derece)
        this.gravity = params.gravity || 0; // Yerçekimi etkisi
        this.gravityDirection = params.gravityDirection || Math.PI / 2; // Yerçekimi yönü (radyan)
        this.affectedByWind = params.affectedByWind || false; // Rüzgardan etkilensin mi
        this.windForce = params.windForce || 0; // Rüzgar gücü
        this.windDirection = params.windDirection || 0; // Rüzgar yönü (radyan)
        this.turbulence = params.turbulence || 0; // Türbülans etkisi
        this.turbulenceFrequency = params.turbulenceFrequency || 1; // Türbülans frekansı
        this.usePhysics = params.usePhysics || false; // Physics motorunu kullansın mı
        
        // Ömür özellikleri
        this.lifetime = params.lifetime || 1; // Parçacık ömrü (saniye)
        this.lifetimeVariation = params.lifetimeVariation || 0.2; // Ömür varyasyonu (0-1)
        this.minLifetime = params.minLifetime || 0.5; // Minimum ömür
        this.maxLifetime = params.maxLifetime || 2; // Maksimum ömür
        
        // Dönüş özellikleri
        this.rotation = params.rotation || 0; // Başlangıç dönüşü (radyan)
        this.rotationSpeed = params.rotationSpeed || 0; // Dönüş hızı (radyan/saniye)
        this.rotationVariation = params.rotationVariation || 0.2; // Dönüş varyasyonu (0-1)
        this.rotationSpeedMin = params.rotationSpeedMin || -2; // Minimum dönüş hızı
        this.rotationSpeedMax = params.rotationSpeedMax || 2; // Maksimum dönüş hızı
        this.rotateToDirection = params.rotateToDirection || false; // Hareket yönüne doğru dönsün mü
        
        // Ölçek özellikleri
        this.scaleStart = params.scaleStart !== undefined ? params.scaleStart : 1; // Başlangıç ölçeği
        this.scaleEnd = params.scaleEnd !== undefined ? params.scaleEnd : 1; // Bitiş ölçeği
        this.scaleVariation = params.scaleVariation || 0.2; // Ölçek varyasyonu (0-1)
        
        // Efekt özellikleri
        this.additive = params.additive || false; // Additif blend modu
        this.trailEffect = params.trailEffect || false; // İz bırakma efekti
        this.trailLength = params.trailLength || 5; // İz uzunluğu
        this.trailWidth = params.trailWidth || 2; // İz genişliği
        this.glowEffect = params.glowEffect || false; // Parıltı efekti
        this.glowSize = params.glowSize || 10; // Parıltı boyutu
        this.glowColor = params.glowColor || 'rgba(255, 255, 255, 0.5)'; // Parıltı rengi
        
        // Zamanlayıcılar
        this.systemAge = 0; // Sistem yaşı (saniye)
        this.emitCounter = 0; // Emisyon sayacı
        
        // Parçacık havuzu
        this.particles = [];
        this.activeParticles = 0;
        
        // Sistem durumu
        this.isActive = true;
        this.isEmitting = true;
        
        // Özel çizim fonksiyonu
        this.drawFunction = params.drawFunction || null;
        
        // Parçacık havuzunu oluştur
        if (this.burstMode) {
            this._initParticles();
        }
    }
    
    /**
     * Parçacık havuzunu oluşturur
     */
    _initParticles() {
        this.particles = [];
        
        // Burst modda tüm parçacıkları hemen oluştur
        if (this.burstMode) {
            for (let i = 0; i < this.count; i++) {
                const particle = this._createParticle();
                this.particles.push(particle);
                this.activeParticles++;
            }
        } else {
            // Havuz oluştur ama aktifleştirme
            for (let i = 0; i < this.count; i++) {
                const particle = this._createParticle(false);
                this.particles.push(particle);
            }
        }
    }
    
    /**
     * Yeni parçacık oluşturur
     * @param {Boolean} activate - Parçacığı aktifleştir
     * @return {Object} Parçacık nesnesi
     */
    _createParticle(activate = true) {
        // Rastgele boyut
        const sizeFactor = 1 - this.sizeVariation / 2 + Math.random() * this.sizeVariation;
        const size = Utils.clamp(this.size * sizeFactor, this.minSize, this.maxSize);
        
        // Rastgele ömür
        const lifetimeFactor = 1 - this.lifetimeVariation / 2 + Math.random() * this.lifetimeVariation;
        const lifetime = Utils.clamp(this.lifetime * lifetimeFactor, this.minLifetime, this.maxLifetime);
        
        // Rastgele hız
        const speedFactor = 1 - this.speedVariation / 2 + Math.random() * this.speedVariation;
        const speed = Utils.clamp(this.speed * speedFactor, this.minSpeed, this.maxSpeed);
        
        // Rastgele yön (derece cinsinden)
        const dirRange = this.directionMax - this.directionMin;
        const directionDeg = this.directionMin + Math.random() * dirRange;
        const direction = Utils.degToRad(directionDeg);
        
        // Rastgele dönüş hızı
        const rotSpeedFactor = 1 - this.rotationVariation / 2 + Math.random() * this.rotationVariation;
        const rotationSpeed = Utils.clamp(
            this.rotationSpeed * rotSpeedFactor,
            this.rotationSpeedMin,
            this.rotationSpeedMax
        );
        
        // Başlangıç ölçeği
        const scaleFactor = 1 - this.scaleVariation / 2 + Math.random() * this.scaleVariation;
        const scaleStart = this.scaleStart * scaleFactor;
        
        // Renk seçimi
        let color;
        if (this.colorMode === 'random') {
            color = Utils.randomItem(this.colors);
        } else if (this.colorMode === 'sequence') {
            const index = this.activeParticles % this.colors.length;
            color = this.colors[index];
        } else {
            // Gradient için başlangıç rengi
            color = this.colors[0];
        }
        
        // Emisyon pozisyonu (yayıcı şekline göre)
        let emitX = this.x;
        let emitY = this.y;
        
        if (this.emitterShape === 'circle') {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.emitterSize;
            emitX += Math.cos(angle) * radius;
            emitY += Math.sin(angle) * radius;
        } else if (this.emitterShape === 'rectangle') {
            emitX += (Math.random() - 0.5) * this.emitterWidth;
            emitY += (Math.random() - 0.5) * this.emitterHeight;
        } else if (this.emitterShape === 'line') {
            const t = Math.random();
            const angle = this.emitterAngle;
            const spread = Utils.degToRad(this.emitterSpread);
            const spreadAngle = angle + (Math.random() - 0.5) * spread * 2;
            
            emitX += Math.cos(spreadAngle) * this.emitterSize * t;
            emitY += Math.sin(spreadAngle) * this.emitterSize * t;
        }
        
        // Parçacık nesnesi
        const particle = {
            x: emitX,
            y: emitY,
            vx: Math.cos(direction) * speed,
            vy: Math.sin(direction) * speed,
            ax: 0, // İvme X
            ay: 0, // İvme Y
            size: size,
            color: color,
            startColor: color,
            endColor: this.colors.length > 1 ? this.colors[this.colors.length - 1] : color,
            rotation: this.rotation,
            rotationSpeed: rotationSpeed,
            lifetime: lifetime,
            age: 0,
            scale: scaleStart,
            startScale: scaleStart,
            endScale: this.scaleEnd,
            opacity: this.opacityStart,
            startOpacity: this.opacityStart,
            endOpacity: this.opacityEnd,
            active: activate,
            // İz efekti için
            trail: this.trailEffect ? [] : null
        };
        
        return particle;
    }
    
    /**
     * Her karede çağrılır
     * @param {Number} deltaTime - Geçen süre (saniye)
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Sistem kapalıysa işlem yapma
        if (!this.isActive) return;
        
        // Sistem yaşını artır
        this.systemAge += deltaTime;
        
        // Süreye göre emisyonu kontrolü
        if (this.duration > 0 && this.systemAge >= this.duration) {
            this.isEmitting = false;
        }
        
        // Parçacık üretimi (burst modda değilse ve emisyon devam ediyorsa)
        if (!this.burstMode && this.isEmitting && this.emitRate > 0) {
            this.emitCounter += deltaTime;
            
            const emitInterval = 1 / this.emitRate;
            
            while (this.emitCounter >= emitInterval) {
                this.emitCounter -= emitInterval;
                
                // Yeni parçacık aktifleştir
                this._activateParticle();
            }
        }
        
        // Tüm parçacıkları güncelle
        let activeCount = 0;
        
        for (const particle of this.particles) {
            if (particle.active) {
                // Yaşı güncelle
                particle.age += deltaTime;
                
                // Ömrü dolmuşsa deaktifleştir
                if (particle.age >= particle.lifetime) {
                    particle.active = false;
                    continue;
                }
                
                // Gelişim faktörü (0-1)
                const t = particle.age / particle.lifetime;
                
                // Yerçekimi ve rüzgar etkisi
                if (this.gravity > 0) {
                    particle.vy += Math.sin(this.gravityDirection) * this.gravity * deltaTime;
                    particle.vx += Math.cos(this.gravityDirection) * this.gravity * deltaTime;
                }
                
                if (this.affectedByWind && this.windForce > 0) {
                    particle.vx += Math.cos(this.windDirection) * this.windForce * deltaTime;
                    particle.vy += Math.sin(this.windDirection) * this.windForce * deltaTime;
                }
                
                // Türbülans
                if (this.turbulence > 0) {
                    const noiseX = Math.sin(t * this.turbulenceFrequency * 10 + particle.x * 0.01);
                    const noiseY = Math.cos(t * this.turbulenceFrequency * 10 + particle.y * 0.01);
                    
                    particle.vx += noiseX * this.turbulence * deltaTime;
                    particle.vy += noiseY * this.turbulence * deltaTime;
                }
                
                // İvmeyi hıza ekle
                particle.vx += particle.ax * deltaTime;
                particle.vy += particle.ay * deltaTime;
                
                // İz efekti için önceki pozisyonu kaydet
                if (this.trailEffect && particle.trail) {
                    particle.trail.push({
                        x: particle.x,
                        y: particle.y,
                        size: particle.size * particle.scale,
                        opacity: particle.opacity * 0.5
                    });
                    
                    // İz uzunluğunu sınırla
                    if (particle.trail.length > this.trailLength) {
                        particle.trail.shift();
                    }
                }
                
                // Pozisyonu güncelle
                particle.x += particle.vx * deltaTime;
                particle.y += particle.vy * deltaTime;
                
                // Dönüşü güncelle
                if (this.rotateToDirection) {
                    particle.rotation = Math.atan2(particle.vy, particle.vx);
                } else {
                    particle.rotation += particle.rotationSpeed * deltaTime;
                }
                
                // Ölçeği interpolasyon ile güncelle
                particle.scale = Utils.lerp(particle.startScale, particle.endScale, t);
                
                // Opaklığı interpolasyon ile güncelle
                particle.opacity = Utils.lerp(particle.startOpacity, particle.endOpacity, t);
                
                // Gradient renk interpolasyonu
                if (this.colorMode === 'gradient' && this.colors.length > 1) {
                    // İki renk arasında geçiş yap
                    const colorIndex = Math.min(
                        Math.floor(t * this.colors.length),
                        this.colors.length - 2
                    );
                    
                    const color1 = this.colors[colorIndex];
                    const color2 = this.colors[colorIndex + 1];
                    
                    const tBetweenColors = (t * this.colors.length) % 1;
                    
                    // Renkleri RGB'ye çevir
                    const rgb1 = this._hexToRgb(color1);
                    const rgb2 = this._hexToRgb(color2);
                    
                    // Aradeğerleme
                    const r = Math.floor(Utils.lerp(rgb1.r, rgb2.r, tBetweenColors));
                    const g = Math.floor(Utils.lerp(rgb1.g, rgb2.g, tBetweenColors));
                    const b = Math.floor(Utils.lerp(rgb1.b, rgb2.b, tBetweenColors));
                    
                    particle.color = `rgb(${r}, ${g}, ${b})`;
                }
                
                activeCount++;
            }
        }
        
        this.activeParticles = activeCount;
        
        // Tüm parçacıklar deaktifse ve sistem aktif değilse ve otomatik yok olma açıksa
        if (this.autoDestroy && !this.isEmitting && activeCount === 0) {
            // Sahne varsa, game object'i kaldır
            if (this.scene) {
                this.scene.removeGameObject(this);
            }
        }
    }
    
    /**
     * Render işlemi sırasında çağrılır
     * @param {Renderer} renderer - Renderer nesnesi
     */
    render(renderer) {
        // Sistem kapalıysa işlem yapma
        if (!this.isActive) return;
        
        const ctx = renderer.context;
        
        // Render ayarları
        ctx.save();
        
        // Blend modu
        if (this.additive) {
            ctx.globalCompositeOperation = 'lighter';
        } else {
            ctx.globalCompositeOperation = this.blendMode;
        }
        
        // Tüm parçacıkları çiz
        for (const particle of this.particles) {
            if (particle.active && particle.opacity > 0) {
                // İz efekti çiz
                if (this.trailEffect && particle.trail && particle.trail.length > 0) {
                    this._drawTrail(ctx, particle);
                }
                
                // Parçacık konumunu ayarla
                ctx.globalAlpha = particle.opacity;
                
                if (this.glowEffect) {
                    ctx.shadowColor = this.glowColor;
                    ctx.shadowBlur = this.glowSize;
                }
                
                // Dönüşüm uygula
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                ctx.scale(particle.scale, particle.scale);
                
                if (this.drawFunction) {
                    // Özel çizim fonksiyonu
                    this.drawFunction(ctx, particle);
                } else {
                    // Standart çizim
                    if (this.particleImage && this.particleImage.isLoaded) {
                        // Resim çiz
                        const size = particle.size;
                        ctx.drawImage(
                            this.particleImage,
                            -size / 2, -size / 2,
                            size, size
                        );
                    } else {
                        // Form çiz
                        ctx.fillStyle = particle.color;
                        
                        if (this.particleForm === 'circle') {
                            this._drawCircle(ctx, particle);
                        } else if (this.particleForm === 'square') {
                            this._drawSquare(ctx, particle);
                        } else if (this.particleForm === 'triangle') {
                            this._drawTriangle(ctx, particle);
                        } else if (this.particleForm === 'star') {
                            this._drawStar(ctx, particle);
                        } else if (this.particleForm === 'custom' && this.customPath) {
                            this.customPath(ctx, particle);
                        } else {
                            // Varsayılan olarak daire
                            this._drawCircle(ctx, particle);
                        }
                    }
                }
                
                // Dönüşümü sıfırla
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                
                // Glow efektini kapat
                if (this.glowEffect) {
                    ctx.shadowColor = 'rgba(0, 0, 0, 0)';
                    ctx.shadowBlur = 0;
                }
            }
        }
        
        // Render ayarlarını geri yükle
        ctx.restore();
    }
    
    /**
     * İz efektini çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} particle - Parçacık nesnesi
     */
    _drawTrail(ctx, particle) {
        if (!particle.trail || particle.trail.length < 2) return;
        
        ctx.globalAlpha = particle.opacity * 0.5;
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = this.trailWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        
        for (let i = 1; i < particle.trail.length; i++) {
            ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
        }
        
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();
    }
    
    /**
     * Daire şeklinde parçacık çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} particle - Parçacık nesnesi
     */
    _drawCircle(ctx, particle) {
        const radius = particle.size / 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Kare şeklinde parçacık çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} particle - Parçacık nesnesi
     */
    _drawSquare(ctx, particle) {
        const size = particle.size;
        const half = size / 2;
        
        ctx.fillRect(-half, -half, size, size);
    }
    
    /**
     * Üçgen şeklinde parçacık çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} particle - Parçacık nesnesi
     */
    _drawTriangle(ctx, particle) {
        const size = particle.size;
        const half = size / 2;
        
        ctx.beginPath();
        ctx.moveTo(0, -half);
        ctx.lineTo(half, half);
        ctx.lineTo(-half, half);
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Yıldız şeklinde parçacık çizer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} particle - Parçacık nesnesi
     */
    _drawStar(ctx, particle) {
        const outerRadius = particle.size / 2;
        const innerRadius = outerRadius / 2;
        const spikes = 5;
        
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(0, -outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(
                Math.cos(rot) * outerRadius,
                Math.sin(rot) * outerRadius
            );
            rot += step;
            
            ctx.lineTo(
                Math.cos(rot) * innerRadius,
                Math.sin(rot) * innerRadius
            );
            rot += step;
        }
        
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Parçacık aktifleştirir (havuzdan)
     */
    _activateParticle() {
        // Aktif parçacık sayısı kontrol et
        if (this.activeParticles >= this.count) return;
        
        // İnaktif parçacık bul
        for (const particle of this.particles) {
            if (!particle.active) {
                // Parçacığı sıfırla ve aktifleştir
                const newParticle = this._createParticle();
                
                // Özellikleri kopyala
                Object.assign(particle, newParticle);
                
                this.activeParticles++;
                break;
            }
        }
    }
    
    /**
     * Hex renk kodunu RGB'ye dönüştürür
     * @param {String} hex - Hex renk kodu
     * @return {Object} RGB değerleri {r, g, b}
     */
    _hexToRgb(hex) {
        // Kısaltılmış hex kodunu uzat (#fff -> #ffffff)
        if (hex.length === 4) {
            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }
        
        return {
            r: parseInt(hex.substring(1, 3), 16),
            g: parseInt(hex.substring(3, 5), 16),
            b: parseInt(hex.substring(5, 7), 16)
        };
    }
    
    /**
     * Sistemi başlatır
     */
    start() {
        this.isActive = true;
        this.isEmitting = true;
        this.systemAge = 0;
        
        if (this.burstMode) {
            this._initParticles();
        }
    }
    
    /**
     * Sistemi durdurur
     */
    stop() {
        this.isEmitting = false;
    }
    
    /**
     * Sistemi tamamen kapatır
     */
    deactivate() {
        this.isActive = false;
        
        // Tüm parçacıkları deaktifleştir
        for (const particle of this.particles) {
            particle.active = false;
        }
        
        this.activeParticles = 0;
    }
    
    /**
     * Sistemi sıfırlar
     */
    reset() {
        this.deactivate();
        this.systemAge = 0;
        this.emitCounter = 0;
    }
    
    /**
     * Pozisyonu değiştirir
     * @param {Number} x - X koordinatı
     * @param {Number} y - Y koordinatı
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Parçacık üretir
     * @param {Number} count - Parçacık sayısı
     */
    emit(count = 1) {
        for (let i = 0; i < count; i++) {
            this._activateParticle();
        }
    }
}