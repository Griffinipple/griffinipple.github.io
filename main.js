let scene, camera, renderer;
let platform, ramp, block;

function init() {
    // Create a new scene
    scene = new THREE.Scene();

    // Create a camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
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

function animate() {
    requestAnimationFrame(animate);

    // Update game state if necessary

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
