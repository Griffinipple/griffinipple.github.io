// main.js

let camera, scene, renderer;
let controls;
let objects = [];
let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let prevTime = performance.now();

function init() {
    // Create a new scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcce0ff);

    // Create a camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

    // Create a renderer and append it to the document
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Add lights
    const light = new THREE.HemisphereLight(0xffffff, 0x444444);
    light.position.set(0, 20, 0);
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(-10, 20, 10);
    scene.add(directionalLight);

    // Add PointerLockControls
    controls = new THREE.PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    // Create the ground
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);

    // Create the platform
    const platformGeometry = new THREE.BoxGeometry(10, 1, 10);
    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.5;
    scene.add(platform);
    objects.push(platform);

    // Create the ramp
    const rampGeometry = new THREE.BoxGeometry(5, 0.5, 2);
    const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.set(2, 0.25, -4);
    ramp.rotation.z = -Math.PI / 6; // Tilt the ramp
    scene.add(ramp);
    objects.push(ramp);

    // Create the block
    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const blockMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.position.set(2, 0.5, -6);
    scene.add(block);
    objects.push(block);

    // Raycaster for collision detection
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 1.5);

    // Add event listeners for keyboard input
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start the animation loop
    animate();
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
    requestAnimationFrame(animate);

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

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

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

// Wait for the DOM to fully load before initializing the game
window.addEventListener('DOMContentLoaded', () => {
    // Get elements and add event listeners
    const playButton = document.getElementById('play-button');
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    if (playButton && blocker && instructions) {
        playButton.addEventListener('click', () => {
            playButton.style.display = 'none';
            blocker.style.display = 'block';
            instructions.style.display = 'block';
            init();
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
