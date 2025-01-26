// main.js

const MOVEMENT_SPEED = 200; // Reduced from default
const JUMP_FORCE = 250;

let camera, scene, renderer;
let controls;
let objects = [];
let raycaster;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let velocity, direction, prevTime;
let animationFrameId;

function initializeVariables() {
    velocity = new THREE.Vector3();
    direction = new THREE.Vector3();
    prevTime = performance.now();
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 1.5; // Set initial camera height
    controls = new THREE.PointerLockControls(camera, document.body);
}

function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
        return false;
    }
}

function createPlatform(width, height, depth, x, y, z, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const platform = new THREE.Mesh(geometry, material);
    platform.position.set(x, y, z);
    platform.receiveShadow = true;
    platform.castShadow = true;
    return platform;
}

function createRamp(width, height, depth, x, y, z, rotation) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const ramp = new THREE.Mesh(geometry, material);
    ramp.position.set(x, y, z);
    ramp.rotation.x = rotation;
    ramp.receiveShadow = true;
    ramp.castShadow = true;
    return ramp;
}

function createObstacles() {
    // Main platform
    const mainPlatform = createPlatform(10, 1, 10, 0, 0.5, 0, 0xffffff);
    scene.add(mainPlatform);
    objects.push(mainPlatform);

    // Secondary platforms
    const platforms = [
        createPlatform(8, 1, 8, 15, 2, 0, 0x66cc66),
        createPlatform(8, 1, 8, -15, 3, 0, 0x6666cc),
        createPlatform(8, 1, 8, 0, 4, 15, 0xcc6666)
    ];

    // Ramps
    const ramps = [
        createRamp(10, 1, 8, 7.5, 1.25, 0, Math.PI * 0.1),
        createRamp(10, 1, 8, -7.5, 1.75, 0, -Math.PI * 0.1),
        createRamp(8, 1, 10, 0, 2, 7.5, Math.PI * 0.1)
    ];

    // Add all elements to scene and collision objects
    [...platforms, ...ramps].forEach(element => {
        scene.add(element);
        objects.push(element);
    });
}

function init() {
    try {
        // WebGL support check
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
        
        if (!gl) {
            throw new Error('WebGL is not supported in your browser');
        }

        // Get or create canvas
        let canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'gameCanvas';
            const container = document.getElementById('game-container');
            if (!container) {
                throw new Error('Game container not found');
            }
            container.appendChild(canvas);
        }

        // Initialize scene once
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xcce0ff);

        // Initialize renderer once
        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (camera && renderer) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
        });

        // Add lights
        const light = new THREE.HemisphereLight(0xffffff, 0x444444);
        light.position.set(0, 20, 0);
        scene.add(light);

        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(-10, 20, 10);
        scene.add(directionalLight);

        // Add PointerLockControls
        scene.add(controls.getObject());

        // Create the ground
        const floorGeometry = new THREE.PlaneGeometry(200, 200);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
        objects.push(floor);

        // Create obstacles after floor creation
        createObstacles();

        // Raycaster for collision detection
        raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 1.5);

        // Add event listeners for keyboard input
        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);

        // Start the animation loop
        animate();
    } catch (error) {
        console.error('Initialization failed:', error);
        const errorDisplay = document.getElementById('game-container') || document.body;
        const errorMessage = document.createElement('div');
        errorMessage.style.color = 'red';
        errorMessage.innerHTML = `Error: ${error.message}`;
        errorDisplay.appendChild(errorMessage);
        return false;
    }
    return true;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;

        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;

        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;

        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;

        case 'Space':
            if (canJump === true) velocity.y += 15; // Adjusted jump strength for 3 blocks height
            canJump = false;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;

        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;

        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;

        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (controls.isLocked === true) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000; // Convert to seconds

        // Apply damping (friction)
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 10.0 * delta; // Adjusted gravity

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // Ensures consistent movement in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * MOVEMENT_SPEED * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * MOVEMENT_SPEED * delta;

        // Raycasting for collision detection
        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 1.5;

        const intersections = raycaster.intersectObjects(objects, false);
        const onObject = intersections.length > 0;

        if (onObject) {
            velocity.y = Math.max(0, velocity.y);
            canJump = true;
        }

        // Adjust player position based on collisions
        const displacement = velocity.clone().multiplyScalar(delta);
        controls.getObject().position.add(displacement);

        // Check for collisions
        checkCollisions();

        prevTime = time;
    }

    renderer.render(scene, camera);
}

function checkCollisions() {
    // Downward collision detection
    raycaster.set(controls.getObject().position, new THREE.Vector3(0, -1, 0));
    let intersections = raycaster.intersectObjects(objects, false);
    if (intersections.length > 0) {
        const distance = intersections[0].distance;
        if (distance > 1.5) {
            // Apply gravity
            velocity.y -= 9.8 * 10.0; // Adjusted gravity
        } else {
            // Adjust position and velocity on collision
            controls.getObject().position.y = intersections[0].point.y + 1.5;
            velocity.y = 0;
            canJump = true;
        }
    } else {
        // Apply gravity
        velocity.y -= 9.8 * 10.0; // Adjusted gravity
    }

    // Forward collision detection
    raycaster.set(controls.getObject().position, new THREE.Vector3(0, 0, -1));
    intersections = raycaster.intersectObjects(objects, false);
    if (intersections.length > 0) {
        const distance = intersections[0].distance;
        if (distance < 1.5) {
            velocity.z = 0;
            controls.getObject().position.z = intersections[0].point.z + 1.5;
        }
    }

    // Backward collision detection
    raycaster.set(controls.getObject().position, new THREE.Vector3(0, 0, 1));
    intersections = raycaster.intersectObjects(objects, false);
    if (intersections.length > 0) {
        const distance = intersections[0].distance;
        if (distance < 1.5) {
            velocity.z = 0;
            controls.getObject().position.z = intersections[0].point.z - 1.5;
        }
    }

    // Left collision detection
    raycaster.set(controls.getObject().position, new THREE.Vector3(-1, 0, 0));
    intersections = raycaster.intersectObjects(objects, false);
    if (intersections.length > 0) {
        const distance = intersections[0].distance;
        if (distance < 1.5) {
            velocity.x = 0;
            controls.getObject().position.x = intersections[0].point.x + 1.5;
        }
    }

    // Right collision detection
    raycaster.set(controls.getObject().position, new THREE.Vector3(1, 0, 0));
    intersections = raycaster.intersectObjects(objects, false);
    if (intersections.length > 0) {
        const distance = intersections[0].distance;
        if (distance < 1.5) {
            velocity.x = 0;
            controls.getObject().position.x = intersections[0].point.x - 1.5;
        }
    }

    // Upward collision detection to handle ramps
    raycaster.set(controls.getObject().position, new THREE.Vector3(0, 1, 0));
    intersections = raycaster.intersectObjects(objects, false);
    if (intersections.length > 0) {
        const distance = intersections[0].distance;
        if (distance < 1.5) {
            velocity.y = 0;
            controls.getObject().position.y = intersections[0].point.y - 1.5;
        }
    }
}

// Add cleanup for animation frame
function stopAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

// Update event listeners
document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('play-button');
    if (playButton) {
        playButton.addEventListener('click', init);
    }
});

// Wait for the DOM to fully load before initializing the game
window.addEventListener('DOMContentLoaded', () => {
    initializeVariables();
    const playButton = document.getElementById('play-button');
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    if (playButton && blocker && instructions) {
        playButton.addEventListener('click', () => {
            playButton.style.display = 'none';
            blocker.style.display = 'block';
            instructions.style.display = 'block';
            try {
                init();
            } catch(e) {
                console.error('Failed to start game:', e);
            }
        });

        controls.addEventListener('lock', () => {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
        });

        controls.addEventListener('unlock', () => {
            blocker.style.display = 'block';
            instructions.style.display = '';
        });

        instructions.addEventListener('click', () => {
            controls.lock();
        });
    }
});

window.addEventListener('unload', () => {
    try {
        if (renderer) {
            renderer.dispose();
            renderer.domElement.remove();
        }
        if (scene) {
            scene.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            scene.clear();
        }
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        if (controls) {
            controls.dispose();
        }
        stopAnimation();
    } catch(e) {
        console.error('Error during cleanup:', e);
    }
});
