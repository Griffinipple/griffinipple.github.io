// This file serves as the entry point for the JavaScript code. It initializes the game, sets up the rendering context, and manages the game loop.

const canvas = document.getElementById('gameCanvas');
let context = canvas.getContext('webgl');

// Ensure the WebGL context is available
if (!context) {
    console.error('WebGL not supported, falling back on experimental-webgl');
    context = canvas.getContext('experimental-webgl');
}
if (!context) {
    alert('Your browser does not support WebGL');
}

let camera = {
    x: 0,
    y: 0,
    z: 0,
    pitch: 0,
    yaw: 0
};

let gameRunning = true;

function init() {
    // Initialize WebGL context and set up the scene
    context.clearColor(0.0, 0.0, 0.0, 1.0);
    context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

    // Load 3D models and other assets here
    loadAssets();

    document.addEventListener('click', () => {
        document.body.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mousemove', updateCameraDirection, false);
}

function loadAssets() {
    // Load models, textures, etc.
    // Placeholder for asset loading logic
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
        camera.yaw += event.movementX * 0.002;
        camera.pitch -= event.movementY * 0.002;
        camera.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.pitch));
    }
}

function gameLoop() {
    if (gameRunning) {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
}

function update() {
    // Update game state
}

function render() {
    // Render the scene
    context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

    // Apply camera transformations
    let viewMatrix = mat4.create();
    mat4.rotateX(viewMatrix, viewMatrix, camera.pitch);
    mat4.rotateY(viewMatrix, viewMatrix, camera.yaw);
    mat4.translate(viewMatrix, viewMatrix, [-camera.x, -camera.y, -camera.z]);

    // Draw the white platform
    drawPlatform(viewMatrix);

    // Draw the black ramp
    drawRamp(viewMatrix);

    // Draw the block next to the ramp
    drawBlock(viewMatrix);
}

function drawPlatform(viewMatrix) {
    // Placeholder for platform drawing logic
    // Set up and draw a white platform using WebGL
    context.uniform4f(context.getUniformLocation(program, 'color'), 1.0, 1.0, 1.0, 1.0); // white
    // Add the platform drawing code here
}

function drawRamp(viewMatrix) {
    // Placeholder for ramp drawing logic
    // Set up and draw a black ramp using WebGL
    context.uniform4f(context.getUniformLocation(program, 'color'), 0.0, 0.0, 0.0, 1.0); // black
    // Add the ramp drawing code here
}

function drawBlock(viewMatrix) {
    // Placeholder for block drawing logic
    // Set up and draw a block next to the ramp using WebGL
    context.uniform4f(context.getUniformLocation(program, 'color'), 0.5, 0.5, 0.5, 1.0); // grey
    // Add the block drawing code here
}

window.onload = () => {
    init();
    gameLoop();
};

// Wait for the DOM to fully load before accessing the button element
document.addEventListener('DOMContentLoaded', (event) => {
    // Get the button element by its ID
    const playButton = document.getElementById('play-button');

    // Add an event listener for the 'click' event
    playButton.addEventListener('click', () => {
        // Hide the play button and show the game canvas
        playButton.style.display = 'none';
        canvas.style.display = 'block';

        // Call the function that starts the game
        startGame();
    });
});

// Define the function that starts the game
function startGame() {
    console.log('Game started!');
    init();
    gameLoop();
}
