// Constants and configurations
const CONFIG = {
    PLAYER: {
        HEIGHT: 2,
        RADIUS: 0.4,
        SPEED: 25.0,
        JUMP_FORCE: 30,
        GRAVITY: 32,
        ACCELERATION: 150.0,
        FRICTION: 10.0,
        AIR_CONTROL: 0.3
    },
    SLOPE: {
        THRESHOLD: 60
    },
    PROJECTILE: {
        RADIUS: 0.2,
        SPEED: 50,
        DISTANCE_LIMIT: 115,
        COLOR: 0x808080
    }
};

class GameController {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.objects = [];
        this.ballProjectiles = [];
        
        this.moveState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            canJump: true,
            grounded: false,
            sliding: false,
            velocity: new THREE.Vector3(),
            yVelocity: 0
        };

        this.raycaster = new THREE.Raycaster();
        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupControls();
        this.createEnvironment();
        this.setupEventListeners();
        this.animate();
    }

    setupRenderer() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.createCrosshair();
        document.body.style.backgroundColor = 'blue';
    }

    createCrosshair() {
        const crosshair = document.createElement('div');
        crosshair.id = 'crosshair';
        Object.assign(crosshair.style, {
            position: 'absolute',
            width: '20px',
            height: '20px',
            backgroundColor: 'transparent',
            border: '2px solid white',
            borderTop: 'none',
            borderLeft: 'none',
            transform: 'rotate(45deg)',
            top: '50%',
            left: '50%',
            marginTop: '-10px',
            marginLeft: '-10px'
        });
        document.body.appendChild(crosshair);
    }

    setupControls() {
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        this.camera.position.y = CONFIG.PLAYER.HEIGHT;
        
        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');
        const menu = document.getElementById('menu');
        const playButton = document.getElementById('playButton');

        playButton.addEventListener('click', () => {
            this.controls.lock();
            menu.style.display = 'none';
        });

        this.controls.addEventListener('lock', () => {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
        });

        this.controls.addEventListener('unlock', () => {
            blocker.style.display = 'block';
            instructions.style.display = 'flex';
        });

        instructions.addEventListener('click', () => this.controls.lock());
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        document.addEventListener('mousedown', (event) => this.onMouseDown(event));
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveState.forward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveState.backward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveState.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveState.right = true;
                break;
            case 'Space':
                if (this.moveState.canJump) {
                    this.moveState.yVelocity = CONFIG.PLAYER.JUMP_FORCE;
                    this.moveState.canJump = false;
                }
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveState.forward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveState.backward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveState.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveState.right = false;
                break;
        }
    }

    onMouseDown(event) {
        if (event.button === 0) {
            this.launchProjectile();
        }
    }

    createEnvironment() {
        const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
        this.scene.add(light);
        this.createSpawnArea(0, 0);
        this.createSpawnArea(0, -200);
        this.createBridge();
    }

    createSpawnArea(offsetX, offsetZ) {
        // Center platform
        const platform = new THREE.Mesh(
            new THREE.BoxGeometry(20, 1, 20),
            new THREE.MeshPhongMaterial({ color: 0x808080 })
        );
        platform.position.set(offsetX, -1, offsetZ);
        this.scene.add(platform);
        this.objects.push(platform);

        // Ramps
        const rampLength = 22.4;
        const ramps = [
            { pos: [0, -20], rot: Math.PI / 6.3, axis: 'x' },
            { pos: [0, 20], rot: -Math.PI / 6.3, axis: 'x' },
            { pos: [20, 0], rot: Math.PI / 6.3, axis: 'z' },
            { pos: [-20, 0], rot: -Math.PI / 6.3, axis: 'z' }
        ];

        ramps.forEach(ramp => {
            const rampMesh = new THREE.Mesh(
                ramp.axis === 'x' ? 
                    new THREE.BoxGeometry(20, 1, rampLength) : 
                    new THREE.BoxGeometry(rampLength, 1, 20),
                new THREE.MeshPhongMaterial({ color: 0x707070 })
            );
            rampMesh.position.set(
                offsetX + ramp.pos[0],
                4.5,
                offsetZ + ramp.pos[1]
            );
            if (ramp.axis === 'x') {
                rampMesh.rotation.x = ramp.rot;
            } else {
                rampMesh.rotation.z = ramp.rot;
            }
            this.scene.add(rampMesh);
            this.objects.push(rampMesh);
        });

        // Surrounding platforms
        const positions = [
            [-40, -40], [-20, -40], [0, -40], [20, -40], [40, -40],
            [-40, -20], [-20, -20], [20, -20], [40, -20],
            [-40, 0], [40, 0],
            [-40, 20], [-20, 20], [20, 20], [40, 20],
            [-40, 40], [-20, 40], [0, 40], [20, 40], [40, 40]
        ];

        positions.forEach(pos => {
            const block = new THREE.Mesh(
                new THREE.BoxGeometry(20, 10, 20),
                new THREE.MeshPhongMaterial({ color: 0x505050 })
            );
            block.position.set(
                offsetX + pos[0],
                5,
                offsetZ + pos[1]
            );
            this.scene.add(block);
            this.objects.push(block);
        });
    }

    createBridge() {
        const bridge = new THREE.Mesh(
            new THREE.BoxGeometry(60, 1, 120),
            new THREE.MeshPhongMaterial({ color: 0x505050 })
        );
        bridge.position.set(0, 9, -100);
        this.scene.add(bridge);
        this.objects.push(bridge);
    }

    checkCollision(position, direction) {
        this.raycaster.ray.origin.copy(position);
        this.raycaster.ray.direction.copy(direction);
        const intersects = this.raycaster.intersectObjects(this.objects);
        
        if (intersects.length > 0) {
            const normal = intersects[0].face.normal;
            const angle = THREE.MathUtils.radToDeg(
                Math.acos(normal.dot(new THREE.Vector3(0, 1, 0)))
            );
            
            if (angle <= CONFIG.SLOPE.THRESHOLD && intersects[0].distance < CONFIG.PLAYER.RADIUS * 1.5) {
                return true;
            }
            return intersects[0].distance < CONFIG.PLAYER.RADIUS;
        }
        return false;
    }

    checkGround(position) {
        this.raycaster.ray.origin.copy(position);
        this.raycaster.ray.direction.set(0, -1, 0);
        const intersects = this.raycaster.intersectObjects(this.objects);
        
        const groundCheckDistance = CONFIG.PLAYER.HEIGHT + 0.1;
        
        if (intersects.length > 0 && intersects[0].distance < groundCheckDistance) {
            const normal = intersects[0].face.normal;
            const angle = THREE.MathUtils.radToDeg(
                Math.acos(normal.dot(new THREE.Vector3(0, 1, 0)))
            );
            
            if (angle <= CONFIG.SLOPE.THRESHOLD) {
                this.camera.position.y = intersects[0].point.y + CONFIG.PLAYER.HEIGHT;
                return true;
            }
        }
        return false;
    }

    updateMovement(delta) {
        const onGround = this.checkGround(this.camera.position);
        
        if (onGround) {
            this.moveState.canJump = true;
            if (this.moveState.yVelocity < 0) this.moveState.yVelocity = 0;
        } else {
            this.moveState.yVelocity -= CONFIG.PLAYER.GRAVITY * delta;
        }
        
        this.camera.position.y += this.moveState.yVelocity * delta;

        // Calculate movement vector
        const velocity = new THREE.Vector3();
        if (this.moveState.forward) velocity.z -= CONFIG.PLAYER.SPEED;
        if (this.moveState.backward) velocity.z += CONFIG.PLAYER.SPEED;
        if (this.moveState.left) velocity.x -= CONFIG.PLAYER.SPEED;
        if (this.moveState.right) velocity.x += CONFIG.PLAYER.SPEED;

        // Apply movement relative to camera direction
        if (velocity.length() !== 0) {
            let moveVector = new THREE.Vector3(velocity.x, 0, velocity.z);
            moveVector.normalize();
            moveVector.multiplyScalar(CONFIG.PLAYER.SPEED * delta);
            
            let cameraDirection = new THREE.Vector3();
            this.camera.getWorldDirection(cameraDirection);
            cameraDirection.y = 0;
            cameraDirection.normalize();
            
            let rotationMatrix = new THREE.Matrix4();
            rotationMatrix.lookAt(
                new THREE.Vector3(),
                cameraDirection,
                new THREE.Vector3(0, 1, 0)
            );
            let rotationQuaternion = new THREE.Quaternion();
            rotationQuaternion.setFromRotationMatrix(rotationMatrix);
            
            moveVector.applyQuaternion(rotationQuaternion);
            
            if (!this.checkCollision(this.camera.position, moveVector)) {
                this.camera.position.add(moveVector);
            }
        }
    }

    launchProjectile() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        const position = this.camera.position.clone()
            .add(direction.clone().multiplyScalar(CONFIG.PLAYER.RADIUS + CONFIG.PROJECTILE.RADIUS));
        
        const ball = new THREE.Mesh(
            new THREE.SphereGeometry(CONFIG.PROJECTILE.RADIUS, 32, 32),
            new THREE.MeshBasicMaterial({ color: CONFIG.PROJECTILE.COLOR })
        );
        
        ball.position.copy(position);
        ball.velocity = direction.multiplyScalar(CONFIG.PROJECTILE.SPEED);
        ball.travelDistance = 0;
        
        this.scene.add(ball);
        this.ballProjectiles.push(ball);
    }

    handleProjectiles(delta) {
        for (let i = this.ballProjectiles.length - 1; i >= 0; i--) {
            const ball = this.ballProjectiles[i];
            const travelStep = ball.velocity.clone().multiplyScalar(delta);
            ball.position.add(travelStep);
            ball.travelDistance += travelStep.length();

            if (ball.travelDistance > CONFIG.PROJECTILE.DISTANCE_LIMIT || 
                this.checkCollision(ball.position, ball.velocity)) {
                this.scene.remove(ball);
                this.ballProjectiles.splice(i, 1);
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls.isLocked) {
            const delta = 0.016;
            this.updateMovement(delta);
            this.handleProjectiles(delta);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game
const game = new GameController();
