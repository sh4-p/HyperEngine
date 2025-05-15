/**
 * Inspector.js - Nesne özelliklerini düzenleme aracı
 * Editor'da seçilen nesnelerin özelliklerini gösterir ve düzenleme imkanı sağlar
 */
class Inspector {
    constructor(config = {}) {
        // Yapılandırma
        this.config = Object.assign({
            container: null,
            editor: null
        }, config);
        
        // Seçili nesne
        this.selectedObject = null;
        
        // DOM elementleri
        this.container = null;
        this.inspectorElements = {};
        
        // Bileşen tipleri
        this.componentTypes = [
            { name: 'Transform', class: Transform },
            { name: 'Collider', class: Collider },
            { name: 'Rigidbody', class: Rigidbody },
            { name: 'SpriteRenderer', class: SpriteRenderer },
            { name: 'AudioSource', class: AudioSource },
            { name: 'Animator', class: Animator }
            // Diğer bileşen tipleri
        ];
        
        // Başlat
        this._initialize();
    }
    
    /**
     * Inspector'ı başlatır
     */
    _initialize() {
        // Konteyner
        if (typeof this.config.container === 'string') {
            this.container = document.querySelector(this.config.container);
        } else {
            this.container = this.config.container;
        }
        
        if (!this.container) {
            console.error("Inspector container not found");
            return;
        }
        
        // Temel düzeni oluştur
        this._createLayout();
    }
    
    /**
     * Inspector düzenini oluşturur
     */
    _createLayout() {
        // Ana konteyner
        this.container.innerHTML = '';
        this.container.classList.add('inspector-container');
        
        // Başlık
        const header = document.createElement('div');
        header.className = 'inspector-header';
        header.innerHTML = '<h2>Inspector</h2>';
        this.container.appendChild(header);
        
        // İçerik
        const content = document.createElement('div');
        content.className = 'inspector-content';
        this.container.appendChild(content);
        this.inspectorElements.content = content;
        
        // Bileşen ekle butonu
        const addComponentBtn = document.createElement('button');
        addComponentBtn.className = 'inspector-add-component-btn';
        addComponentBtn.textContent = 'Add Component';
        addComponentBtn.addEventListener('click', () => this._showAddComponentMenu());
        this.container.appendChild(addComponentBtn);
        this.inspectorElements.addComponentBtn = addComponentBtn;
        
        // Temizle
        this.clearInspector();
    }
    
    /**
     * Inspector'ı temizler
     */
    clearInspector() {
        this.selectedObject = null;
        
        if (this.inspectorElements.content) {
            this.inspectorElements.content.innerHTML = '<div class="inspector-no-selection">Nesne seçilmedi</div>';
        }
        
        if (this.inspectorElements.addComponentBtn) {
            this.inspectorElements.addComponentBtn.style.display = 'none';
        }
    }
    
    /**
     * Nesneyi inceler
     * @param {GameObject} object - İncelenecek nesne
     */
    inspectObject(object) {
        if (!object) {
            this.clearInspector();
            return;
        }
        
        this.selectedObject = object;
        
        // İçeriği temizle
        if (this.inspectorElements.content) {
            this.inspectorElements.content.innerHTML = '';
            
            // Nesne genel bilgileri
            this._createObjectInfo(object);
            
            // Bileşenleri listele
            for (const component of object.components) {
                this._createComponentPanel(component);
            }
        }
        
        // Bileşen ekle butonunu göster
        if (this.inspectorElements.addComponentBtn) {
            this.inspectorElements.addComponentBtn.style.display = 'block';
        }
    }
    
    /**
     * Nesne genel bilgilerini oluşturur
     * @param {GameObject} object - Nesne
     */
    _createObjectInfo(object) {
        const objectPanel = document.createElement('div');
        objectPanel.className = 'inspector-panel';
        
        // Başlık
        const header = document.createElement('div');
        header.className = 'inspector-panel-header';
        header.textContent = 'GameObject';
        objectPanel.appendChild(header);
        
        // İçerik
        const content = document.createElement('div');
        content.className = 'inspector-panel-content';
        
        // İsim alanı
        const nameGroup = this._createPropertyGroup('Name', 'text', object.name, (value) => {
            this._setObjectProperty(object, 'name', value);
        });
        
        // Tag alanı
        const tagGroup = this._createPropertyGroup('Tag', 'text', object.tag, (value) => {
            this._setObjectProperty(object, 'tag', value);
        });
        
        // Layer alanı
        const layerGroup = this._createPropertyGroup('Layer', 'number', object.layer, (value) => {
            this._setObjectProperty(object, 'layer', parseInt(value));
        });
        
        // Aktif checkbox
        const activeGroup = this._createPropertyGroup('Active', 'checkbox', object.active, (value) => {
            this._setObjectProperty(object, 'active', value);
        });
        
        content.appendChild(nameGroup);
        content.appendChild(tagGroup);
        content.appendChild(layerGroup);
        content.appendChild(activeGroup);
        
        objectPanel.appendChild(content);
        
        this.inspectorElements.content.appendChild(objectPanel);
    }
    
    /**
     * Bileşen paneli oluşturur
     * @param {Component} component - Bileşen
     */
    _createComponentPanel(component) {
        const componentPanel = document.createElement('div');
        componentPanel.className = 'inspector-panel';
        
        // Bileşen tipi
        const componentType = component.constructor.name;
        
        // Başlık
        const header = document.createElement('div');
        header.className = 'inspector-panel-header';
        
        // Başlık içeriği
        const titleSpan = document.createElement('span');
        titleSpan.textContent = componentType;
        header.appendChild(titleSpan);
        
        // Aktif/pasif toggle
        if (component !== this.selectedObject.transform) {
            const activeToggle = document.createElement('input');
            activeToggle.type = 'checkbox';
            activeToggle.checked = component.active;
            activeToggle.addEventListener('change', (e) => {
                component.active = e.target.checked;
            });
            header.appendChild(activeToggle);
            
            // Kaldır butonu
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X';
            removeBtn.className = 'inspector-remove-component-btn';
            removeBtn.addEventListener('click', () => {
                this._removeComponent(component);
            });
            header.appendChild(removeBtn);
        }
        
        componentPanel.appendChild(header);
        
        // İçerik
        const content = document.createElement('div');
        content.className = 'inspector-panel-content';
        
        // Bileşen tipine göre özellik alanları
        switch (componentType) {
            case 'Transform':
                this._createTransformProperties(component, content);
                break;
            case 'Collider':
                this._createColliderProperties(component, content);
                break;
            case 'Rigidbody':
                this._createRigidbodyProperties(component, content);
                break;
            case 'SpriteRenderer':
                this._createSpriteRendererProperties(component, content);
                break;
            case 'AudioSource':
                this._createAudioSourceProperties(component, content);
                break;
            case 'Animator':
                this._createAnimatorProperties(component, content);
                break;
            default:
                // Genel bileşen özellikleri
                content.innerHTML = '<div class="inspector-no-properties">Bu bileşen için özellik düzenleyici bulunamadı.</div>';
        }
        
        componentPanel.appendChild(content);
        
        this.inspectorElements.content.appendChild(componentPanel);
    }
    
    /**
     * Transform özellikleri oluşturur
     * @param {Transform} transform - Transform bileşeni
     * @param {HTMLElement} container - Konteyner element
     */
    _createTransformProperties(transform, container) {
        // Pozisyon
        const posGroup = document.createElement('div');
        posGroup.className = 'inspector-property-group';
        
        const posLabel = document.createElement('div');
        posLabel.className = 'inspector-property-label';
        posLabel.textContent = 'Position';
        posGroup.appendChild(posLabel);
        
        const posFields = document.createElement('div');
        posFields.className = 'inspector-property-fields inspector-vector2-fields';
        
        // X değeri
        const xInput = document.createElement('input');
        xInput.type = 'number';
        xInput.value = transform.position.x;
        xInput.step = 'any';
        xInput.addEventListener('change', (e) => {
            transform.position.x = parseFloat(e.target.value);
        });
        
        const xLabel = document.createElement('span');
        xLabel.textContent = 'X';
        
        // Y değeri
        const yInput = document.createElement('input');
        yInput.type = 'number';
        yInput.value = transform.position.y;
        yInput.step = 'any';
        yInput.addEventListener('change', (e) => {
            transform.position.y = parseFloat(e.target.value);
        });
        
        const yLabel = document.createElement('span');
        yLabel.textContent = 'Y';
        
        posFields.appendChild(xLabel);
        posFields.appendChild(xInput);
        posFields.appendChild(yLabel);
        posFields.appendChild(yInput);
        
        posGroup.appendChild(posFields);
        container.appendChild(posGroup);
        
        // Rotasyon
        const rotGroup = this._createPropertyGroup('Rotation', 'number', transform.rotation * (180 / Math.PI), (value) => {
            transform.rotation = parseFloat(value) * (Math.PI / 180);
        }, 'step="any"');
        container.appendChild(rotGroup);
        
        // Ölçek
        const scaleGroup = document.createElement('div');
        scaleGroup.className = 'inspector-property-group';
        
        const scaleLabel = document.createElement('div');
        scaleLabel.className = 'inspector-property-label';
        scaleLabel.textContent = 'Scale';
        scaleGroup.appendChild(scaleLabel);
        
        const scaleFields = document.createElement('div');
        scaleFields.className = 'inspector-property-fields inspector-vector2-fields';
        
        // X değeri
        const scaleXInput = document.createElement('input');
        scaleXInput.type = 'number';
        scaleXInput.value = transform.scale.x;
        scaleXInput.step = 'any';
        scaleXInput.addEventListener('change', (e) => {
            transform.scale.x = parseFloat(e.target.value);
        });
        
        const scaleXLabel = document.createElement('span');
        scaleXLabel.textContent = 'X';
        
        // Y değeri
        const scaleYInput = document.createElement('input');
        scaleYInput.type = 'number';
        scaleYInput.value = transform.scale.y;
        scaleYInput.step = 'any';
        scaleYInput.addEventListener('change', (e) => {
            transform.scale.y = parseFloat(e.target.value);
        });
        
        const scaleYLabel = document.createElement('span');
        scaleYLabel.textContent = 'Y';
        
        scaleFields.appendChild(scaleXLabel);
        scaleFields.appendChild(scaleXInput);
        scaleFields.appendChild(scaleYLabel);
        scaleFields.appendChild(scaleYInput);
        
        scaleGroup.appendChild(scaleFields);
        container.appendChild(scaleGroup);
    }
    
    /**
     * Collider özellikleri oluşturur
     * @param {Collider} collider - Collider bileşeni
     * @param {HTMLElement} container - Konteyner element
     */
    _createColliderProperties(collider, container) {
        // Tür
        const typeOptions = [
            { value: 'box', text: 'Box' },
            { value: 'circle', text: 'Circle' }
        ];
        
        const typeGroup = this._createPropertyGroup('Type', 'select', collider.type, (value) => {
            collider.type = value;
            // Yeniden çiz
            this.inspectObject(this.selectedObject);
        }, '', typeOptions);
        container.appendChild(typeGroup);
        
        // Box özellikleri
        if (collider.type === 'box') {
            const widthGroup = this._createPropertyGroup('Width', 'number', collider.width, (value) => {
                collider.width = parseFloat(value);
            }, 'step="any" min="0"');
            container.appendChild(widthGroup);
            
            const heightGroup = this._createPropertyGroup('Height', 'number', collider.height, (value) => {
                collider.height = parseFloat(value);
            }, 'step="any" min="0"');
            container.appendChild(heightGroup);
        }
        // Circle özellikleri
        else if (collider.type === 'circle') {
            const radiusGroup = this._createPropertyGroup('Radius', 'number', collider.radius, (value) => {
                collider.radius = parseFloat(value);
            }, 'step="any" min="0"');
            container.appendChild(radiusGroup);
        }
        
        // Offset
        const offsetGroup = document.createElement('div');
        offsetGroup.className = 'inspector-property-group';
        
        const offsetLabel = document.createElement('div');
        offsetLabel.className = 'inspector-property-label';
        offsetLabel.textContent = 'Offset';
        offsetGroup.appendChild(offsetLabel);
        
        const offsetFields = document.createElement('div');
        offsetFields.className = 'inspector-property-fields inspector-vector2-fields';
        
        // X değeri
        const offsetXInput = document.createElement('input');
        offsetXInput.type = 'number';
        offsetXInput.value = collider.offset.x;
        offsetXInput.step = 'any';
        offsetXInput.addEventListener('change', (e) => {
            collider.offset.x = parseFloat(e.target.value);
        });
        
        const offsetXLabel = document.createElement('span');
        offsetXLabel.textContent = 'X';
        
        // Y değeri
        const offsetYInput = document.createElement('input');
        offsetYInput.type = 'number';
        offsetYInput.value = collider.offset.y;
        offsetYInput.step = 'any';
        offsetYInput.addEventListener('change', (e) => {
            collider.offset.y = parseFloat(e.target.value);
        });
        
        const offsetYLabel = document.createElement('span');
        offsetYLabel.textContent = 'Y';
        
        offsetFields.appendChild(offsetXLabel);
        offsetFields.appendChild(offsetXInput);
        offsetFields.appendChild(offsetYLabel);
        offsetFields.appendChild(offsetYInput);
        
        offsetGroup.appendChild(offsetFields);
        container.appendChild(offsetGroup);
        
        // Trigger
        const triggerGroup = this._createPropertyGroup('Is Trigger', 'checkbox', collider.isTrigger, (value) => {
            collider.isTrigger = value;
        });
        container.appendChild(triggerGroup);
        
        // Layer
        const layerGroup = this._createPropertyGroup('Layer', 'number', collider.layer, (value) => {
            collider.layer = parseInt(value);
        });
        container.appendChild(layerGroup);
    }
    
    /**
     * Rigidbody özellikleri oluşturur
     * @param {Rigidbody} rigidbody - Rigidbody bileşeni
     * @param {HTMLElement} container - Konteyner element
     */
    _createRigidbodyProperties(rigidbody, container) {
        // Kütle
        const massGroup = this._createPropertyGroup('Mass', 'number', rigidbody.mass, (value) => {
            rigidbody.mass = parseFloat(value);
        }, 'step="any" min="0.001"');
        container.appendChild(massGroup);
        
        // Drag
        const dragGroup = this._createPropertyGroup('Drag', 'number', rigidbody.drag, (value) => {
            rigidbody.drag = parseFloat(value);
        }, 'step="any" min="0"');
        container.appendChild(dragGroup);
        
        // Angular Drag
        const angularDragGroup = this._createPropertyGroup('Angular Drag', 'number', rigidbody.angularDrag, (value) => {
            rigidbody.angularDrag = parseFloat(value);
        }, 'step="any" min="0"');
        container.appendChild(angularDragGroup);
        
        // Gravity
        const gravityGroup = this._createPropertyGroup('Use Gravity', 'checkbox', rigidbody.useGravity, (value) => {
            rigidbody.useGravity = value;
        });
        container.appendChild(gravityGroup);
        
        // Kinematic
        const kinematicGroup = this._createPropertyGroup('Is Kinematic', 'checkbox', rigidbody.isKinematic, (value) => {
            rigidbody.isKinematic = value;
        });
        container.appendChild(kinematicGroup);
        
        // Freeze Rotation
        const freezeRotGroup = this._createPropertyGroup('Freeze Rotation', 'checkbox', rigidbody.freezeRotation, (value) => {
            rigidbody.freezeRotation = value;
        });
        container.appendChild(freezeRotGroup);
        
        // Bounciness
        const bouncinessGroup = this._createPropertyGroup('Bounciness', 'number', rigidbody.bounciness, (value) => {
            rigidbody.bounciness = parseFloat(value);
        }, 'step="0.01" min="0" max="1"');
        container.appendChild(bouncinessGroup);
    }
    
    /**
     * SpriteRenderer özellikleri oluşturur
     * @param {SpriteRenderer} renderer - SpriteRenderer bileşeni
     * @param {HTMLElement} container - Konteyner element
     */
    _createSpriteRendererProperties(renderer, container) {
        // Sprite
        const spriteGroup = document.createElement('div');
        spriteGroup.className = 'inspector-property-group';
        
        const spriteLabel = document.createElement('div');
        spriteLabel.className = 'inspector-property-label';
        spriteLabel.textContent = 'Sprite';
        spriteGroup.appendChild(spriteLabel);
        
        const spriteField = document.createElement('div');
        spriteField.className = 'inspector-property-fields';
        
        // Sprite önizleme
        const spritePreview = document.createElement('div');
        spritePreview.className = 'inspector-sprite-preview';
        
        if (renderer.sprite) {
            spritePreview.style.backgroundImage = `url('${renderer.sprite.src}')`;
        }
        
        // Sprite seçim butonu
        const selectSpriteBtn = document.createElement('button');
        selectSpriteBtn.textContent = 'Select Sprite';
        selectSpriteBtn.addEventListener('click', () => {
            this._showSpriteSelector(renderer);
        });
        
        spriteField.appendChild(spritePreview);
        spriteField.appendChild(selectSpriteBtn);
        
        spriteGroup.appendChild(spriteField);
        container.appendChild(spriteGroup);
        
        // Renk
        const colorGroup = this._createPropertyGroup('Color', 'color', renderer.color, (value) => {
            renderer.color = value;
        });
        container.appendChild(colorGroup);
        
        // Flip X
        const flipXGroup = this._createPropertyGroup('Flip X', 'checkbox', renderer.flipX, (value) => {
            renderer.flipX = value;
        });
        container.appendChild(flipXGroup);
        
        // Flip Y
        const flipYGroup = this._createPropertyGroup('Flip Y', 'checkbox', renderer.flipY, (value) => {
            renderer.flipY = value;
        });
        container.appendChild(flipYGroup);
        
        // Layer
        const layerGroup = this._createPropertyGroup('Layer', 'number', renderer.layer, (value) => {
            renderer.layer = parseInt(value);
        });
        container.appendChild(layerGroup);
    }
    
    /**
     * AudioSource özellikleri oluşturur
     * @param {AudioSource} audio - AudioSource bileşeni
     * @param {HTMLElement} container - Konteyner element
     */
    _createAudioSourceProperties(audio, container) {
        // Clip
        const clipGroup = document.createElement('div');
        clipGroup.className = 'inspector-property-group';
        
        const clipLabel = document.createElement('div');
        clipLabel.className = 'inspector-property-label';
        clipLabel.textContent = 'Audio Clip';
        clipGroup.appendChild(clipLabel);
        
        const clipField = document.createElement('div');
        clipField.className = 'inspector-property-fields';
        
        // Clip adı
        const clipName = document.createElement('span');
        clipName.className = 'inspector-audio-clip-name';
        clipName.textContent = audio.clip ? audio.clip.split('/').pop() : 'No clip selected';
        
        // Clip seçim butonu
        const selectClipBtn = document.createElement('button');
        selectClipBtn.textContent = 'Select Clip';
        selectClipBtn.addEventListener('click', () => {
            this._showAudioSelector(audio);
        });
        
        clipField.appendChild(clipName);
        clipField.appendChild(selectClipBtn);
        
        clipGroup.appendChild(clipField);
        container.appendChild(clipGroup);
        
        // Volume
        const volumeGroup = this._createPropertyGroup('Volume', 'range', audio.volume, (value) => {
            audio.volume = parseFloat(value);
        }, 'min="0" max="1" step="0.01"');
        container.appendChild(volumeGroup);
        
        // Pitch
        const pitchGroup = this._createPropertyGroup('Pitch', 'range', audio.pitch, (value) => {
            audio.pitch = parseFloat(value);
        }, 'min="0.5" max="2" step="0.01"');
        container.appendChild(pitchGroup);
        
        // Loop
        const loopGroup = this._createPropertyGroup('Loop', 'checkbox', audio.loop, (value) => {
            audio.loop = value;
        });
        container.appendChild(loopGroup);
        
        // Play on Awake
        const playOnAwakeGroup = this._createPropertyGroup('Play On Awake', 'checkbox', audio.playOnAwake, (value) => {
            audio.playOnAwake = value;
        });
        container.appendChild(playOnAwakeGroup);
    }
    
    /**
     * Animator özellikleri oluşturur
     * @param {Animator} animator - Animator bileşeni
     * @param {HTMLElement} container - Konteyner element
     */
    _createAnimatorProperties(animator, container) {
        // Animasyon kontrolcüsü
        const controllerGroup = document.createElement('div');
        controllerGroup.className = 'inspector-property-group';
        
        const controllerLabel = document.createElement('div');
        controllerLabel.className = 'inspector-property-label';
        controllerLabel.textContent = 'Controller';
        controllerGroup.appendChild(controllerLabel);
        
        const controllerField = document.createElement('div');
        controllerField.className = 'inspector-property-fields';
        
        // Controller adı
        const controllerName = document.createElement('span');
        controllerName.className = 'inspector-animator-controller-name';
        controllerName.textContent = animator.controller ? animator.controller : 'No controller selected';
        
        // Controller seçim butonu
        const selectControllerBtn = document.createElement('button');
        selectControllerBtn.textContent = 'Select Controller';
        selectControllerBtn.addEventListener('click', () => {
            this._showAnimatorSelector(animator);
        });
        
        controllerField.appendChild(controllerName);
        controllerField.appendChild(selectControllerBtn);
        
        controllerGroup.appendChild(controllerField);
        container.appendChild(controllerGroup);
        
        // Speed
        const speedGroup = this._createPropertyGroup('Speed', 'number', animator.speed, (value) => {
            animator.speed = parseFloat(value);
        }, 'step="0.01" min="0"');
        container.appendChild(speedGroup);
        
        // Current State
        const stateLabel = document.createElement('div');
        stateLabel.className = 'inspector-property-label';
        stateLabel.textContent = 'Current State:';
        
        const stateValue = document.createElement('div');
        stateValue.className = 'inspector-property-readonly-value';
        stateValue.textContent = animator.currentState || 'None';
        
        const stateGroup = document.createElement('div');
        stateGroup.className = 'inspector-property-group';
        stateGroup.appendChild(stateLabel);
        stateGroup.appendChild(stateValue);
        
        container.appendChild(stateGroup);
    }
    
    /**
     * Özellik grubu oluşturur
     * @param {String} label - Etiket
     * @param {String} type - Input tipi
     * @param {any} value - Değer
     * @param {Function} onChange - Değişim olayı
     * @param {String} attributes - Ek öznitelikler
     * @param {Array} options - Select options
     * @return {HTMLElement} Özellik grubu elementi
     */
    _createPropertyGroup(label, type, value, onChange, attributes = '', options = []) {
        const group = document.createElement('div');
        group.className = 'inspector-property-group';
        
        const labelElement = document.createElement('div');
        labelElement.className = 'inspector-property-label';
        labelElement.textContent = label;
        group.appendChild(labelElement);
        
        const field = document.createElement('div');
        field.className = 'inspector-property-fields';
        
        let input;
        
        // Tip kontrolü
        if (type === 'checkbox') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = value;
            
            input.addEventListener('change', (e) => {
                onChange(e.target.checked);
            });
        }
        else if (type === 'select') {
            input = document.createElement('select');
            
            // Seçenekleri ekle
            for (const option of options) {
                const optElement = document.createElement('option');
                optElement.value = option.value;
                optElement.textContent = option.text;
                input.appendChild(optElement);
            }
            
            input.value = value;
            
            input.addEventListener('change', (e) => {
                onChange(e.target.value);
            });
        }
        else if (type === 'color') {
            input = document.createElement('input');
            input.type = 'color';
            input.value = value;
            
            input.addEventListener('change', (e) => {
                onChange(e.target.value);
            });
        }
        else if (type === 'range') {
            input = document.createElement('input');
            input.type = 'range';
            input.value = value;
            
            if (attributes) {
                const attrs = attributes.split(' ');
                for (const attr of attrs) {
                    if (!attr) continue;
                    
                    const [name, val] = attr.split('=');
                    input.setAttribute(name, val.replace(/"/g, ''));
                }
            }
            
            input.addEventListener('input', (e) => {
                onChange(e.target.value);
            });
            
            // Değer gösterimi
            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'inspector-range-value';
            valueDisplay.textContent = value;
            
            input.addEventListener('input', (e) => {
                valueDisplay.textContent = e.target.value;
            });
            
            field.appendChild(input);
            field.appendChild(valueDisplay);
            
            group.appendChild(labelElement);
            group.appendChild(field);
            
            return group;
        }
        else {
            // Text, number vb.
            input = document.createElement('input');
            input.type = type;
            input.value = value;
            
            if (attributes) {
                const attrs = attributes.split(' ');
                for (const attr of attrs) {
                    if (!attr) continue;
                    
                    const [name, val] = attr.split('=');
                    input.setAttribute(name, val.replace(/"/g, ''));
                }
            }
            
            input.addEventListener('change', (e) => {
                onChange(e.target.value);
            });
        }
        
        field.appendChild(input);
        
        group.appendChild(labelElement);
        group.appendChild(field);
        
        return group;
    }
    
    /**
     * Nesne özelliğini değiştirir
     * @param {GameObject} object - Nesne
     * @param {String} property - Özellik adı
     * @param {any} value - Yeni değer
     */
    _setObjectProperty(object, property, value) {
        // Eski değeri kaydet
        const oldValue = object[property];
        
        // Yeni değeri ayarla
        object[property] = value;
        
        // Geçmişe ekle
        if (this.config.editor) {
            this.config.editor.addToHistory({
                action: 'modifyObject',
                objectId: object.id,
                property: property,
                oldValue: oldValue,
                newValue: value
            });
        }
    }
    
    /**
     * Bileşeni kaldırır
     * @param {Component} component - Kaldırılacak bileşen
     */
    _removeComponent(component) {
        if (this.selectedObject) {
            // Onay iste
            const confirmResult = confirm(`"${component.constructor.name}" bileşenini kaldırmak istediğinize emin misiniz?`);
            
            if (confirmResult) {
                // Bileşeni kaldır
                this.selectedObject.removeComponent(component);
                
                // Inspector'ı güncelle
                this.inspectObject(this.selectedObject);
            }
        }
    }
    
    /**
     * Bileşen ekleme menüsünü gösterir
     */
    _showAddComponentMenu() {
        // Menü var mı kontrol et
        let menu = document.querySelector('.add-component-menu');
        
        // Yoksa oluştur
        if (!menu) {
            menu = document.createElement('div');
            menu.className = 'add-component-menu';
            
            // Menü başlığı
            const header = document.createElement('div');
            header.className = 'add-component-menu-header';
            header.textContent = 'Add Component';
            
            // Arama kutusu
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Search...';
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                
                // Filtreleme
                const items = menu.querySelectorAll('.add-component-menu-item');
                items.forEach(item => {
                    const componentName = item.getAttribute('data-component').toLowerCase();
                    item.style.display = componentName.includes(query) ? 'block' : 'none';
                });
            });
            
            // Kapatma butonu
            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'X';
            closeBtn.className = 'add-component-menu-close';
            closeBtn.addEventListener('click', () => {
                menu.style.display = 'none';
            });
            
            header.appendChild(searchInput);
            header.appendChild(closeBtn);
            menu.appendChild(header);
            
            // Bileşen listesi
            const list = document.createElement('div');
            list.className = 'add-component-menu-list';
            
            // Her bileşen tipi için
            for (const type of this.componentTypes) {
                const item = document.createElement('div');
                item.className = 'add-component-menu-item';
                item.textContent = type.name;
                item.setAttribute('data-component', type.name);
                
                item.addEventListener('click', () => {
                    this._addComponent(type.class);
                    menu.style.display = 'none';
                });
                
                list.appendChild(item);
            }
            
            menu.appendChild(list);
            
            document.body.appendChild(menu);
        }
        
        // Menüyü konumlandır
        const buttonRect = this.inspectorElements.addComponentBtn.getBoundingClientRect();
        menu.style.left = buttonRect.left + 'px';
        menu.style.top = buttonRect.bottom + 'px';
        
        // Menüyü göster
        menu.style.display = 'block';
    }
    
    /**
     * Bileşen ekler
     * @param {Class} componentClass - Eklenecek bileşen sınıfı
     */
    _addComponent(componentClass) {
        if (this.selectedObject) {
            // Bileşen zaten var mı
            const existingComponent = this.selectedObject.getComponent(componentClass.name);
            
            if (existingComponent) {
                alert(`Bu nesne zaten bir "${componentClass.name}" bileşenine sahip.`);
                return;
            }
            
            // Yeni bileşen oluştur ve ekle
            const component = new componentClass();
            this.selectedObject.addComponent(component);
            
            // Inspector'ı güncelle
            this.inspectObject(this.selectedObject);
        }
    }
    
    /**
     * Sprite seçiciyi gösterir
     * @param {SpriteRenderer} renderer - SpriteRenderer bileşeni
     */
    _showSpriteSelector(renderer) {
        // AssetBrowser'ı kullan (varsa)
        if (this.config.editor && this.config.editor.assetBrowser) {
            this.config.editor.assetBrowser.on('select', (assetPath) => {
                if (renderer) {
                    // Resim yükle
                    const img = new Image();
                    img.src = assetPath;
                    img.onload = () => {
                        renderer.sprite = img;
                        // Inspector'ı güncelle
                        this.inspectObject(this.selectedObject);
                    };
                }
            });
            
            // Filter
            this.config.editor.assetBrowser.filter('image');
            
            // AssetBrowser'ı göster
            this.config.editor.assetBrowser.show();
        } else {
            // Yalın dosya seçici
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = (event) => {
                        const img = new Image();
                        img.src = event.target.result;
                        
                        img.onload = () => {
                            renderer.sprite = img;
                            // Inspector'ı güncelle
                            this.inspectObject(this.selectedObject);
                        };
                    };
                    
                    reader.readAsDataURL(file);
                }
            });
            
            input.click();
        }
    }
    
    /**
     * Ses dosyası seçiciyi gösterir
     * @param {AudioSource} audio - AudioSource bileşeni
     */
    _showAudioSelector(audio) {
        // AssetBrowser'ı kullan (varsa)
        if (this.config.editor && this.config.editor.assetBrowser) {
            this.config.editor.assetBrowser.on('select', (assetPath) => {
                if (audio) {
                    audio.clip = assetPath;
                    // Inspector'ı güncelle
                    this.inspectObject(this.selectedObject);
                }
            });
            
            // Filter
            this.config.editor.assetBrowser.filter('audio');
            
            // AssetBrowser'ı göster
            this.config.editor.assetBrowser.show();
        } else {
            // Yalın dosya seçici
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'audio/*';
            
            input.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = (event) => {
                        audio.clip = event.target.result;
                        // Inspector'ı güncelle
                        this.inspectObject(this.selectedObject);
                    };
                    
                    reader.readAsDataURL(file);
                }
            });
            
            input.click();
        }
    }
    
    /**
     * Animator kontrolcüsü seçiciyi gösterir
     * @param {Animator} animator - Animator bileşeni
     */
    _showAnimatorSelector(animator) {
        // AssetBrowser'ı kullan (varsa)
        if (this.config.editor && this.config.editor.assetBrowser) {
            this.config.editor.assetBrowser.on('select', (assetPath) => {
                if (animator) {
                    animator.controller = assetPath;
                    // Inspector'ı güncelle
                    this.inspectObject(this.selectedObject);
                }
            });
            
            // Filter
            this.config.editor.assetBrowser.filter('json');
            
            // AssetBrowser'ı göster
            this.config.editor.assetBrowser.show();
        } else {
            // Yalın dosya seçici
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = (event) => {
                        animator.controller = event.target.result;
                        // Inspector'ı güncelle
                        this.inspectObject(this.selectedObject);
                    };
                    
                    reader.readAsDataURL(file);
                }
            });
            
            input.click();
        }
    }
}