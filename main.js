// main.js

// Import Three.js modules
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Import PointerLockControls
import { PointerLockControls } from 'https://threejs.org/examples/jsm/controls/PointerLockControls.js';

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
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    // Setting up the blocker and instructions
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function () {
        controls.lock();
    }, false);

    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });

    controls.addEventListener('unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
    });

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
            if (canJump === true) velocity.y += 350;
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

        velocity.y -= 9.8 * 100.0 * delta; // Apply gravity (mass * gravity)

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

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        controls.getObject().position.y += velocity.y * delta; // Apply gravity to Y position

        // Prevent falling below ground
        if (controls.getObject().position.y < 1.5) {
            velocity.y = 0;
            controls.getObject().position.y = 1.5;
            canJump = true;
        }

        prevTime = time;
    }

    renderer.render(scene, camera);
}

// Start the game once the content is loaded
window.addEventListener('DOMContentLoaded', (event) => {
    init();
});
