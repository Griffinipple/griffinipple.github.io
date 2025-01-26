let camera, scene, renderer, controls;
const objects = [];

// Add raycaster
const raycaster = new THREE.Raycaster();
const rayDirection = new THREE.Vector3();
const playerHeight = 2;
const playerRadius = 0.5;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;

// Modify speed and add jump variables
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const speed = 35.0; // Reduced from 50
const jumpForce = 30; // Increased from 15
const gravity = 30;
let yVelocity = 0;

init();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create platform
    const platformGeometry = new THREE.BoxGeometry(20, 1, 20);
    const platformMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -1;
    scene.add(platform);
    objects.push(platform);

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
    return intersects.length > 0 && intersects[0].distance < playerRadius;
}

function checkGround(position) {
    raycaster.ray.origin.copy(position);
    raycaster.ray.direction.set(0, -1, 0);
    const intersects = raycaster.intersectObjects(objects);
    
    if (intersects.length > 0 && intersects[0].distance < playerHeight) {
        const normal = intersects[0].face.normal;
        const angle = THREE.MathUtils.radToDeg(Math.acos(normal.dot(new THREE.Vector3(0, 1, 0))));
        
        if (angle <= 45) {
            camera.position.y = intersects[0].point.y + playerHeight;
            return true;
        }
    }
    return false;
}

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked === true) {
        const delta = 0.016;

        // Apply gravity
        yVelocity -= gravity * delta;
        
        // Store previous position for collision restoration
        const previousPosition = camera.position.clone();

        // Update Y position
        camera.position.y += yVelocity * delta;

        // Ground check and slope detection
        const onGround = checkGround(camera.position);
        if (onGround) {
            yVelocity = 0;
            canJump = true;
        }

        velocity.x = 0;
        velocity.z = 0;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        // Movement with collision checks
        if (moveForward || moveBackward) {
            const moveDir = new THREE.Vector3(0, 0, direction.z); // Removed negative
            moveDir.applyQuaternion(camera.quaternion);
            moveDir.y = 0;
            moveDir.normalize();
            
            const newPos = camera.position.clone();
            newPos.addScaledVector(moveDir, speed * delta);
            
            if (!checkCollision(camera.position, moveDir)) {
                controls.moveForward(direction.z * speed * delta); // Removed negative
            }
        }

        if (moveLeft || moveRight) {
            const moveDir = new THREE.Vector3(direction.x, 0, 0); // Removed negative
            moveDir.applyQuaternion(camera.quaternion);
            moveDir.y = 0;
            moveDir.normalize();
            
            const newPos = camera.position.clone();
            newPos.addScaledVector(moveDir, speed * delta);
            
            if (!checkCollision(camera.position, moveDir)) {
                controls.moveRight(direction.x * speed * delta); // Removed negative
            }
        }

        // Final collision check
        const finalPosition = camera.position.clone();
        for (const obj of objects) {
            if (obj.geometry.boundingBox === undefined) {
                obj.geometry.computeBoundingBox();
            }
            
            const box = obj.geometry.boundingBox.clone();
            box.applyMatrix4(obj.matrixWorld);
            
            if (box.containsPoint(finalPosition)) {
                camera.position.copy(previousPosition);
                break;
            }
        }
    }

    renderer.render(scene, camera);
}
