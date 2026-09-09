import {
	Engine,
	colourText,
	boldText
} from "./engine/engine.js";

const WIDTH = 87;
const HEIGHT = 26;

// Engine setup
const engine = new Engine({
	element: "#mainWindow",
	width: WIDTH,
	height: HEIGHT,
	fps: 60
});
const input = engine.input;
const audio = engine.audio;

engine.start({
	setup: setup,
	update: update
});


// ---Game code-----
// let gameState = "menu";

let currentMap = "demo";

let playerX = 45;
let playerY = 14;

let moveCooldown = [0, 0];
const moveCooldownTime = [0.1, 0.15] //in seconds


function setup() {
	audio.preload({
		ding: "audio/ding.mp3"
	});
}


function update(deltaTime) {
	engine.screen.clear(".");

	movement(deltaTime);

	drawBackground();

	// Draw player
	engine.screen.insertText(
		playerX,
		playerY,
		colourText("▲", "red")
	);
}


function drawBackground() {
	const title = "Ascii game demo!";


	engine.screen.drawTextBox(
		Math.round(WIDTH/2 - (title.length/2 + 2)), //one char of padding and one of border
		2,
		title,
		{
			borderColour: "#d70000",
			border: "rounded",
		}
	);


	engine.screen.insertText(		
		Math.round(WIDTH/2 - getDimensions(currentMap).x/2),
		6,
		maps[currentMap].display
	);
}


function movement(deltaTime) {
	moveCooldown[0] -= deltaTime;
	moveCooldown[1] -= deltaTime;

	if (moveCooldown[0] < 0) {
		playerX -= (input.isPressed("KeyA") - input.isPressed("KeyD"));

		moveCooldown[0] = moveCooldownTime[0];

		if (testPlayerCollision(playerX, playerY, maps[currentMap].collision, Math.round(WIDTH/2 - getDimensions(currentMap).x/2), 6)) {
			playerX += (input.isPressed("KeyA") - input.isPressed("KeyD"));
			moveCooldown[0] = 0;
		}
	}

	if (moveCooldown[1] < 0) {
		playerY -= (input.isPressed("KeyW") - input.isPressed("KeyS"));
		moveCooldown[1] = moveCooldownTime[1];

		if (testPlayerCollision(playerX, playerY, maps[currentMap].collision, Math.round(WIDTH/2 - getDimensions(currentMap).x/2), 6)) {
			playerY += (input.isPressed("KeyW") - input.isPressed("KeyS"));
			moveCooldown[1] = 0;
		}
	}

	// Teleport to the mouse on click
	if (input.justPressed("mouse0")) {
		playerX = input.getMousePosition().x;
		playerY = input.getMousePosition().y;
	}
}


function testPlayerCollision(x, y, collisionMap, mapOffsetX = 0, mapOffsetY = 0, collisionChar = "#") {
	let mapArray = collisionMap.split("\n");

	if (y - mapOffsetY < 0 || y - mapOffsetY >= mapArray.length) return false;
	if (x - mapOffsetX < 0 || x - mapOffsetX >= mapArray[y - mapOffsetY].length) return false;

	if (mapArray[y - mapOffsetY][x - mapOffsetX] == collisionChar) {

		return true;
	};
	return false;
}