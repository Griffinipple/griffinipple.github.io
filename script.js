// main.js

const MOVEMENT_SPEED = 150; // Reduced speed
const GRAVITY = 5.0; // Reduced from 9.8
const JUMP_FORCE = 200;

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
    const material = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 30
    });
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
        if (!checkWebGLSupport()) {
            throw new Error('WebGL not supported');
        }
        
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb); // Sky blue
        
        // Camera setup first
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1.5, 0); // Reset camera position
        
        // Renderer setup
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);
        
        // Enhanced lighting
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
        scene.add(hemisphereLight);
        
        const ambientLight = new THREE.AmbientLight(0x404040, 1.0); // Increased intensity
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        
        // Floor with visible material
        const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        scene.add(floor);
        objects.push(floor);
        
        // Create obstacles
        createObstacles();
        
        // Controls setup last
        controls = new THREE.PointerLockControls(camera, document.body);
        scene.add(controls.getObject());
        
        // Initialize raycaster
        raycaster = new THREE.Raycaster();
        
        // Debug log
        console.log('Scene initialized with:', {
            objects: objects.length,
            lights: scene.children.filter(child => child.isLight).length,
            camera: camera.position
        });
        
        // Start animation
        animate();
        return true;
    } catch (error) {
        console.error('Init error:', error);
        return false;
    }
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

// Reset movement code in animate()
function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (controls.isLocked === true) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= GRAVITY * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) {
            velocity.z -= direction.z * MOVEMENT_SPEED * delta;
        }
        if (moveLeft || moveRight) {
            velocity.x -= direction.x * MOVEMENT_SPEED * delta;
        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        controls.getObject().position.y += velocity.y * delta;

        // Collision detection remains the same
        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 1.5;

        const intersections = raycaster.intersectObjects(objects, false);
        const onObject = intersections.length > 0;

        if (onObject) {
            velocity.y = Math.max(0, velocity.y);
            canJump = true;
        }

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

// Add keyboard event listeners
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Update DOMContentLoaded listener to proper initialization order
window.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('play-button');
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    if (!playButton || !blocker || !instructions) {
        console.error('Required DOM elements not found');
        return;
    }

    // Initialize variables first
    initializeVariables();

    // Add event listeners for controls
    playButton.addEventListener('click', () => {
        const success = init();
        if (success) {
            playButton.style.display = 'none';
            if (controls) {
                controls.lock();
            } else {
                console.error('Controls not initialized');
            }
        }
    });

    if (controls) {
        controls.addEventListener('lock', () => {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
        });

        controls.addEventListener('unlock', () => {
            blocker.style.display = 'block';
            instructions.style.display = 'block';
        });

        instructions.addEventListener('click', () => {
            controls.lock();
        });
    } else {
        console.error('Controls not initialized properly');
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
