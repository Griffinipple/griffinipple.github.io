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

// Add to top with other constants
const projectiles = [];
const projectileSpeed = 50;
const projectileLifetime = 2000; // milliseconds

init();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create first spawn area (original)
    createSpawnArea(0, 0);

    // Create second spawn area (north)
    createSpawnArea(0, -200);

    // Create connecting bridge
    const bridgeGeometry = new THREE.BoxGeometry(20, 1, 120);
    const bridgeMaterial = new THREE.MeshPhongMaterial({ color: 0x505050 });
    const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(0, 10, -100);
    scene.add(bridge);
    objects.push(bridge);

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

    // Add after other event listeners in init()
    document.addEventListener('click', function() {
        if (controls.isLocked) {
            const projectileGeometry = new THREE.SphereGeometry(0.15);
            const projectileMaterial = new THREE.MeshBasicMaterial({color: 0x808080});
            const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

            projectile.position.copy(camera.position);

            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            projectile.velocity = direction.multiplyScalar(projectileSpeed);
            projectile.timestamp = Date.now();

            scene.add(projectile);
            projectiles.push(projectile);
        }
    });

    // Add bounding boxes to all objects
    objects.forEach(obj => {
        obj.geometry.computeBoundingBox();
    });

    animate();
}

function createSpawnArea(offsetX, offsetZ) {
    // Center platform
    const platformGeometry = new THREE.BoxGeometry(20, 1, 20);
    const platformMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(offsetX, -1, offsetZ);
    scene.add(platform);
    objects.push(platform);

    // Four ramps
    const rampLength = 25;
    const rampGeometry = new THREE.BoxGeometry(20, 1, rampLength);
    const rampMaterial = new THREE.MeshPhongMaterial({ color: 0x707070 });

    // Ramps (adjusted for offset)
    const ramps = [
        { pos: [0, -20], rot: Math.PI / 7, axis: 'x' },
        { pos: [0, 20], rot: -Math.PI / 7, axis: 'x' },
        { pos: [20, 0], rot: Math.PI / 7, axis: 'z' },
        { pos: [-20, 0], rot: -Math.PI / 7, axis: 'z' }
    ];

    ramps.forEach(ramp => {
        const rampMesh = new THREE.Mesh(
            ramp.axis === 'x' ? rampGeometry : new THREE.BoxGeometry(rampLength, 1, 20),
            rampMaterial
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
        scene.add(rampMesh);
        objects.push(rampMesh);
    });

    // Surrounding platforms
    const blockGeometry = new THREE.BoxGeometry(20, 10, 20);
    const blockMaterial = new THREE.MeshPhongMaterial({ color: 0x505050 });

    const positions = [
        [-40, -40], [-20, -40], [0, -40], [20, -40], [40, -40],
        [-40, -20], [-20, -20], [20, -20], [40, -20],
        [-40, 0], [40, 0],
        [-40, 20], [-20, 20], [20, 20], [40, 20],
        [-40, 40], [-20, 40], [0, 40], [20, 40], [40, 40]
    ];

    positions.forEach(pos => {
        const block = new THREE.Mesh(blockGeometry, blockMaterial);
        block.position.set(
            offsetX + pos[0],
            5,
            offsetZ + pos[1]
        );
        scene.add(block);
        objects.push(block);
    });
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

        // Apply movement relative to camera direction, but only horizontally
        if (velocity.x !== 0 || velocity.z !== 0) {
            let moveVector = new THREE.Vector3(velocity.x, 0, velocity.z);
            moveVector.normalize();
            moveVector.multiplyScalar(speed * delta);

            // Get camera's forward direction and project it onto XZ plane
            let cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            cameraDirection.y = 0;
            cameraDirection.normalize();

            // Create rotation quaternion from flattened camera direction
            let rotationMatrix = new THREE.Matrix4();
            rotationMatrix.lookAt(new THREE.Vector3(), cameraDirection, new THREE.Vector3(0, 1, 0));
            let rotationQuaternion = new THREE.Quaternion();
            rotationQuaternion.setFromRotationMatrix(rotationMatrix);

            // Apply horizontal rotation to movement
            moveVector.applyQuaternion(rotationQuaternion);

            // Check collision before moving
            if (!checkCollision(camera.position, moveVector)) {
                camera.position.add(moveVector);
            }
        }

        // Add to animate() function before renderer.render
        // Update projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            projectile.position.add(projectile.velocity.clone().multiplyScalar(delta));

            // Check lifetime
            if (Date.now() - projectile.timestamp > projectileLifetime) {
                scene.remove(projectile);
                projectiles.splice(i, 1);
                continue;
            }

            // Check collisions
            const ray = new THREE.Raycaster(projectile.position, projectile.velocity.clone().normalize());
            const intersects = ray.intersectObjects(objects);

            if (intersects.length > 0 && intersects[0].distance < projectile.velocity.length() * delta) {
                scene.remove(projectile);
                projectiles.splice(i, 1);
            }
        }
    }

    renderer.render(scene, camera);
}
