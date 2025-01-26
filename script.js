let camera, scene, renderer, controls;
const objects = [];

// Add raycaster
const raycaster = new THREE.Raycaster();
const rayDirection = new THREE.Vector3();
const playerHeight = 2;
const playerRadius = 0.4; // Reduced for smoother collision
const slopeThreshold = 60; // Increased for better slope handling

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;

// Modify speed and add jump variables
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const speed = 25.0; // Reduced for smoother movement
const jumpForce = 30; // Increased from 15
const gravity = 20; // Reduced for better air control
let yVelocity = 0;
const groundCheckDistance = playerHeight + 0.2; // Increased buffer

init();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create platform (center)
    const platformGeometry = new THREE.BoxGeometry(20, 1, 20);
    const platformMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -1;
    scene.add(platform);
    objects.push(platform);

    // Create ramps with 45-degree angle
    const rampLength = 14.14; // Length of ramp (20/√2)
    const rampGeometry = new THREE.BoxGeometry(20, 1, rampLength);
    const rampMaterial = new THREE.MeshPhongMaterial({ color: 0x707070 });

    // North ramp (facing outward)
    const northRamp = new THREE.Mesh(rampGeometry, rampMaterial);
    northRamp.position.set(0, 4.5, -17);
    northRamp.rotation.x = Math.PI / 4;
    scene.add(northRamp);
    objects.push(northRamp);

    // South ramp (facing outward)
    const southRamp = new THREE.Mesh(rampGeometry, rampMaterial);
    southRamp.position.set(0, 4.5, 17);
    southRamp.rotation.x = -Math.PI / 4;
    scene.add(southRamp);
    objects.push(southRamp);

    // East ramp (facing outward)
    const eastRampGeometry = new THREE.BoxGeometry(rampLength, 1, 20);
    const eastRamp = new THREE.Mesh(eastRampGeometry, rampMaterial);
    eastRamp.position.set(17, 4.5, 0);
    eastRamp.rotation.z = Math.PI / 4;
    scene.add(eastRamp);
    objects.push(eastRamp);

    // West ramp (facing outward)
    const westRamp = new THREE.Mesh(eastRampGeometry, rampMaterial);
    westRamp.position.set(-17, 4.5, 0);
    westRamp.rotation.z = -Math.PI / 4;
    scene.add(westRamp);
    objects.push(westRamp);

    // Add corner and middle platforms
    const blockGeometry = new THREE.BoxGeometry(20, 1, 20);
    const blockMaterial = new THREE.MeshPhongMaterial({ color: 0x505050 });

    // Corner blocks
    const neBlock = new THREE.Mesh(blockGeometry, blockMaterial);
    neBlock.position.set(20, 10, -20);
    scene.add(neBlock);
    objects.push(neBlock);

    const nwBlock = new THREE.Mesh(blockGeometry, blockMaterial);
    nwBlock.position.set(-20, 10, -20);
    scene.add(nwBlock);
    objects.push(nwBlock);

    const seBlock = new THREE.Mesh(blockGeometry, blockMaterial);
    seBlock.position.set(20, 10, 20);
    scene.add(seBlock);
    objects.push(seBlock);

    const swBlock = new THREE.Mesh(blockGeometry, blockMaterial);
    swBlock.position.set(-20, 10, 20);
    scene.add(swBlock);
    objects.push(swBlock);

    // Middle blocks between corners
    const northBlock = new THREE.Mesh(blockGeometry, blockMaterial);
    northBlock.position.set(0, 10, -20);
    scene.add(northBlock);
    objects.push(northBlock);

    const southBlock = new THREE.Mesh(blockGeometry, blockMaterial);
    southBlock.position.set(0, 10, 20);
    scene.add(southBlock);
    objects.push(southBlock);

    const eastBlock = new THREE.Mesh(blockGeometry, blockMaterial);
    eastBlock.position.set(20, 10, 0);
    scene.add(eastBlock);
    objects.push(eastBlock);

    const westBlock = new THREE.Mesh(blockGeometry, blockMaterial);
    westBlock.position.set(-20, 10, 0);
    scene.add(westBlock);
    objects.push(westBlock);

    // Lighting
    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    scene.add(light);

    // Controls
    controls = new THREE.PointerLockControls(camera, document.body);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');
    const menu = document.getElementById('menu');
    const playButton = document.getElementById('playButton');

    playButton.addEventListener('click', function() {
        controls.lock();
        menu.style.display = 'none';
    });

    controls.addEventListener('lock', function() {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });

    controls.addEventListener('unlock', function() {
        blocker.style.display = 'block';
        instructions.style.display = 'flex';
        // Remove this line to prevent menu reappearing
        // menu.style.display = 'flex';
    });

    instructions.addEventListener('click', function() {
        controls.lock();
    });

    camera.position.y = 2;

    // Event listeners for movement
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Add bounding boxes to all objects
    objects.forEach(obj => {
        obj.geometry.computeBoundingBox();
    });

    animate();
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump) {
                yVelocity = jumpForce;
                canJump = false;
            }
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function checkCollision(position, direction) {
    raycaster.ray.origin.copy(position);
    raycaster.ray.direction.copy(direction);
    
    // Multiple raycasts for better collision detection
    const rays = [
        direction,
        direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 8),
        direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 8)
    ];
    
    for (const ray of rays) {
        raycaster.ray.direction.copy(ray);
        const intersects = raycaster.intersectObjects(objects);
        
        if (intersects.length > 0) {
            const normal = intersects[0].face.normal;
            const angle = THREE.MathUtils.radToDeg(Math.acos(normal.dot(new THREE.Vector3(0, 1, 0))));
            
            if (angle <= slopeThreshold && intersects[0].distance < playerRadius * 2) {
                return true;
            }
            if (intersects[0].distance < playerRadius) {
                return true;
            }
        }
    }
    return false;
}

function checkGround(position) {
    raycaster.ray.origin.copy(position);
    raycaster.ray.direction.set(0, -1, 0);
    const intersects = raycaster.intersectObjects(objects);
    
    // More generous ground check distance
    const groundCheckDistance = playerHeight + 0.2; // Increased buffer
    
    if (intersects.length > 0 && intersects[0].distance < groundCheckDistance) {
        const normal = intersects[0].face.normal;
        const angle = THREE.MathUtils.radToDeg(Math.acos(normal.dot(new THREE.Vector3(0, 1, 0))));
        
        // More lenient slope check for jumping
        if (angle <= slopeThreshold) {
            camera.position.y = intersects[0].point.y + playerHeight;
            return true;
        }
    }
    return false;
}

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        const delta = Math.min(0.016, clock.getDelta());
        const previousPosition = camera.position.clone();
        const onGround = checkGround(camera.position);

        // Smoother velocity changes
        if (onGround) {
            velocity.x *= 0.8; // Ground friction
            velocity.z *= 0.8;
            canJump = true;
            if (yVelocity < 0) yVelocity = 0;
        } else {
            velocity.x *= 0.95; // Air resistance
            velocity.z *= 0.95;
            yVelocity -= gravity * delta;
        }

        // Smooth movement application
        if (moveForward || moveBackward || moveLeft || moveRight) {
            const acceleration = onGround ? speed : speed * 0.3;
            
            if (moveForward || moveBackward) {
                velocity.z += direction.z * acceleration * delta;
            }
            if (moveLeft || moveRight) {
                velocity.x += direction.x * acceleration * delta;
            }
        }

        // Apply movement with collision checks
        const moveVector = new THREE.Vector3(velocity.x, 0, velocity.z).multiplyScalar(delta);
        moveVector.applyQuaternion(camera.quaternion);
        
        if (!checkCollision(camera.position, moveVector.normalize())) {
            controls.moveRight(velocity.x * delta);
            controls.moveForward(velocity.z * delta);
        }

        camera.position.y += yVelocity * delta;
    }

    renderer.render(scene, camera);
}
