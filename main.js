let scene, camera, renderer;
let platform, ramp, block;
let controls;
let raycaster;
let objects = [];
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

function init() {
    // Create a new scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcce0ff);
    
    // Create a camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Create a renderer and append it to the document
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Add lights
    const light = new THREE.HemisphereLight(0xffffff, 0x444444);
    light.position.set(0, 20, 0);
    scene.add(light);
    
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
    platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.5;
    scene.add(platform);
    objects.push(platform);
    
    // Create the ramp
    const rampGeometry = new THREE.BoxGeometry(5, 0.5, 2);
    const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.set(2, 0.25, -4);
    ramp.rotation.z = -Math.PI / 6; // Tilt the ramp
    scene.add(ramp);
    objects.push(ramp);
    
    // Create the block
    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const blockMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.position.set(2, 0.5, -6);
    scene.add(block);
    objects.push(block);
    
    // Raycaster for collision detection
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
    
    // Add event listeners
    document.addEventListener('click', () => {
        controls.lock();
    }, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    
    // Start the animation loop
    animate();
}

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveForward = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveBackward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = true;
            break;
        case 'Space':
            if (canJump === true) velocity.y += 5;
            canJump = false;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveForward = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveBackward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = false;
            break;
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (controls.isLocked === true) {
        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 1.5;
        
        const intersections = raycaster.intersectObjects(objects, false);
        const onObject = intersections.length > 0;
        
        // Apply gravity
        velocity.y -= 9.8 * 0.05; // 9.8 m/s^2
        
        // Reset vertical velocity if on object
        if (onObject === true) {
            velocity.y = Math.max(0, velocity.y);
            canJump = true;
        }
        
        // Movement controls
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        
        if (moveForward || moveBackward) velocity.z -= direction.z * 0.1;
        if (moveLeft || moveRight) velocity.x -= direction.x * 0.1;
        
        // Apply damping for smooth stopping
        velocity.x -= velocity.x * 0.1;
        velocity.z -= velocity.z * 0.1;
        
        // Update position
        controls.moveRight(-velocity.x);
        controls.moveForward(-velocity.z);
        
        controls.getObject().position.y += velocity.y * 0.05; // delta is 0.05
        
        // Prevent falling through the floor
        if (controls.getObject().position.y < 1.5) {
            velocity.y = 0;
            controls.getObject().position.y = 1.5;
            canJump = true;
        }
    }
    
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
