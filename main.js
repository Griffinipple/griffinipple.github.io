let scene, camera, renderer;
let platform, ramp, block;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

function init() {
    // Create a new scene
    scene = new THREE.Scene();

    // Create a camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 5);
    camera.lookAt(0, 0, 0);

    // Create a renderer and append it to the document
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create the platform
    const platformGeometry = new THREE.BoxGeometry(10, 1, 10);
    const platformMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -0.5;
    scene.add(platform);

    // Create the ramp
    const rampGeometry = new THREE.BoxGeometry(5, 0.5, 2);
    const rampMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.set(2, 0, -4);
    ramp.rotation.x = -Math.PI / 6; // Tilt the ramp
    scene.add(ramp);

    // Create the block
    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const blockMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
    block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.position.set(2, 0.5, -6);
    scene.add(block);

    // Add event listeners
    document.addEventListener('click', () => {
        document.body.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mousemove', updateCameraDirection, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    // Start the animation loop
    animate();
}

function lockChangeAlert() {
    if (document.pointerLockElement === document.body) {
        console.log('The pointer lock status is now locked');
    } else {
        console.log('The pointer lock status is now unlocked');
    }
}

function updateCameraDirection(event) {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= event.movementX * 0.002;
        camera.rotation.x -= event.movementY * 0.002;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
}

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Update movement
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movement in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 0.1;
    if (moveLeft || moveRight) velocity.x -= direction.x * 0.1;

    camera.position.add(velocity);

    // Render the scene
    renderer.render(scene, camera);
}

// Wait for the DOM to fully load before accessing the button element
document.addEventListener('DOMContentLoaded', (event) => {
    // Get the button element by its ID
    const playButton = document.getElementById('play-button');

    // Add an event listener for the 'click' event
    playButton.addEventListener('click', () => {
        // Hide the play button and show the game canvas
        playButton.style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'block';

        // Initialize and start the game
        init();
    });
});
