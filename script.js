let camera, scene, renderer, controls;
const objects = [];

// Add raycaster
const raycaster = new THREE.Raycaster();
const rayDirection = new THREE.Vector3();
const playerHeight = 2;
const playerRadius = 0.4; // Updated from 0.6
const slopeThreshold = 60; // Updated from 45

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;

// Modify speed and add jump variables
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const speed = 25.0; // Updated from 35.0
const jumpForce = 30; // Increased from 15
const gravity = 25; // Reduced from 30 for better jump feel
const acceleration = 150.0;
const friction = 10.0;
const airControl = 0.3;
let yVelocity = 0;

let moveState = {
    grounded: false,
    sliding: false,
    velocity: new THREE.Vector3()
};

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
    northRamp.rotation.x = -Math.PI / 4;
    scene.add(northRamp);
    objects.push(northRamp);

    // South ramp (facing outward)
    const southRamp = new THREE.Mesh(rampGeometry, rampMaterial);
    southRamp.position.set(0, 4.5, 17);
    southRamp.rotation.x = Math.PI / 4;
    scene.add(southRamp);
    objects.push(southRamp);

    // East ramp (facing outward)
    const eastRampGeometry = new THREE.BoxGeometry(rampLength, 1, 20);
    const eastRamp = new THREE.Mesh(eastRampGeometry, rampMaterial);
    eastRamp.position.set(17, 4.5, 0);
    eastRamp.rotation.z = -Math.PI / 4;
    scene.add(eastRamp);
    objects.push(eastRamp);

    // West ramp (facing outward)
    const westRamp = new THREE.Mesh(eastRampGeometry, rampMaterial);
    westRamp.position.set(-17, 4.5, 0);
    westRamp.rotation.z = Math.PI / 4;
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

    // Add surrounding platforms near ramps
    const northPlatform = new THREE.Mesh(blockGeometry, blockMaterial);
    northPlatform.position.set(0, -1, -34);
    scene.add(northPlatform);
    objects.push(northPlatform);

    const southPlatform = new THREE.Mesh(blockGeometry, blockMaterial);
    southPlatform.position.set(0, -1, 34);
    scene.add(southPlatform);
    objects.push(southPlatform);

    const eastPlatform = new THREE.Mesh(blockGeometry, blockMaterial);
    eastPlatform.position.set(34, -1, 0);
    scene.add(eastPlatform);
    objects.push(eastPlatform);

    const westPlatform = new THREE.Mesh(blockGeometry, blockMaterial);
    westPlatform.position.set(-34, -1, 0);
    scene.add(westPlatform);
    objects.push(westPlatform);

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
    const intersects = raycaster.intersectObjects(objects);
    
    if (intersects.length > 0) {
        const normal = intersects[0].face.normal;
        const angle = THREE.MathUtils.radToDeg(Math.acos(normal.dot(new THREE.Vector3(0, 1, 0))));
        
        // Allow movement up slopes
        if (angle <= slopeThreshold && intersects[0].distance < playerRadius * 1.5) {
            return true;
        }
        // Regular collision for walls
        return intersects[0].distance < playerRadius;
    }
    return false;
}

function checkGround(position) {
    raycaster.ray.origin.copy(position);
    raycaster.ray.direction.set(0, -1, 0);
    const intersects = raycaster.intersectObjects(objects);
    
    // More generous ground check distance
    const groundCheckDistance = playerHeight + 0.1; // Small buffer added
    
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

function updateMovement(delta) {
    const previousPosition = camera.position.clone();
    moveState.grounded = checkGround(camera.position);

    // Apply friction
    if (moveState.grounded) {
        moveState.velocity.x *= 1.0 - Math.min(friction * delta, 1);
        moveState.velocity.z *= 1.0 - Math.min(friction * delta, 1);
    }

    // Calculate desired movement
    let input = new THREE.Vector3(
        Number(moveRight) - Number(moveLeft),
        0,
        Number(moveForward) - Number(moveBackward)
    ).normalize();

    // Apply movement forces
    if (input.length() > 0) {
        let accel = acceleration;
        if (!moveState.grounded) accel *= airControl;

        input.applyQuaternion(camera.quaternion);
        input.y = 0;
        input.normalize();

        moveState.velocity.x += input.x * accel * delta;
        moveState.velocity.z += input.z * accel * delta;
    }

    // Apply speed limit
    const speedLimit = speed;
    const horizontalVelocity = new THREE.Vector2(moveState.velocity.x, moveState.velocity.z);
    if (horizontalVelocity.length() > speedLimit) {
        horizontalVelocity.normalize().multiplyScalar(speedLimit);
        moveState.velocity.x = horizontalVelocity.x;
        moveState.velocity.z = horizontalVelocity.y;
    }

    // Apply movement with collision check
    const movement = moveState.velocity.clone().multiplyScalar(delta);
    if (!checkCollision(camera.position, movement.normalize())) {
        camera.position.add(movement);
    } else {
        moveState.velocity.multiplyScalar(0.5);
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked === true) {
        const delta = 0.016;

        // Ground check and gravity
        const onGround = checkGround(camera.position);
        if (onGround) {
            canJump = true;
            if (yVelocity < 0) yVelocity = 0;
        } else {
            yVelocity -= gravity * delta;
        }
        
        camera.position.y += yVelocity * delta;

        // Movement
        velocity.x = 0;
        velocity.z = 0;

        if (moveForward) velocity.z -= speed;
        if (moveBackward) velocity.z += speed;
        if (moveLeft) velocity.x -= speed;
        if (moveRight) velocity.x += speed;

        // Apply movement relative to camera direction
        if (velocity.x !== 0 || velocity.z !== 0) {
            let moveVector = new THREE.Vector3(velocity.x, 0, velocity.z);
            moveVector.normalize();
            moveVector.multiplyScalar(speed * delta);
            moveVector.applyQuaternion(camera.quaternion);
            
            // Check collision before moving
            if (!checkCollision(camera.position, moveVector)) {
                camera.position.add(moveVector);
            }
        }
    }

    renderer.render(scene, camera);
}
