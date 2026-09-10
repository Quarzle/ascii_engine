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

const { input, audio, screen } = engine;

// ---Game code-----
// let gameState = "menu";

let currentMap = "demo";

let mapOffset = {
	x: Math.round(WIDTH / 2 - getDimensions(currentMap).x / 2),
	y: 6
};

let playerX = 0;
let playerY = 0;

let moveCooldown = { x: 0, y: 0 };
const moveCooldownTime = { x: 0.1, y: 0.15 }; // in seconds

let signs = [
	{
		x: 50,
		y: 15,
		message: "This is a sign"
	},
	{
		x: 22,
		y: 10,
		message: "You are inside!"
	}
];

function switchMap(nextMap, spawnLocation) {
	currentMap = nextMap
	mapOffset = {
		x: Math.round(WIDTH / 2 - getDimensions(currentMap).x / 2),
		y: 6
	};	

	let pos = findFirst(spawnToChar(maps[currentMap].collisions, spawnLocation), maps[currentMap].collisions.tiles);
	playerX = pos.x + mapOffset.x;
	playerY = pos.y + mapOffset.y;
}

// this is down here so that variables are defined before setup is called
engine.start({
	setup: setup,
	update: update
});

function setup() {
	audio.preload({
		ding: "audio/ding.mp3"
	});

	switchMap("demo", "central")
}


function update(deltaTime) {
	screen.clear(".");

	movement(deltaTime);

	drawBackground();

	// Draw player
	screen.insertText(
		playerX,
		playerY,
		colourText("▲", "red")
	);
}

let playedSignSound = false;

function drawBackground() {
	const title = "Ascii game demo!";

	screen.drawTextBox(
		Math.round(WIDTH / 2 - (title.length / 2 + 2)), //one char of padding and one of border
		2,
		title,
		{
			borderColour: "#d70000",
			border: "rounded",
		}
	);

	screen.insertText(
		mapOffset.x,
		mapOffset.y,
		maps[currentMap].display
	);

	testPlayerCollision();
}


function movement(deltaTime) {
	moveCooldown.x -= deltaTime;
	moveCooldown.y -= deltaTime;

	if (moveCooldown.x < 0) {
		playerX -= (input.isPressed("KeyA") - input.isPressed("KeyD"));

		moveCooldown.x = moveCooldownTime.x;

		if (testPlayerWallCollision(playerX, playerY, maps[currentMap].collision, mapOffset.x, mapOffset.y)) {
			playerX += (input.isPressed("KeyA") - input.isPressed("KeyD"));
			moveCooldown.x = 0;
		}
	}

	if (moveCooldown.y < 0) {
		playerY -= (input.isPressed("KeyW") - input.isPressed("KeyS"));
		moveCooldown.y = moveCooldownTime.y;

		if (testPlayerWallCollision(playerX, playerY, maps[currentMap].collision, mapOffset.x, mapOffset.y)) {
			playerY += (input.isPressed("KeyW") - input.isPressed("KeyS"));
			moveCooldown.y = 0;
		}
	}

	// Teleport to the mouse on click
	if (input.justPressed("mouse0")) {
		playerX = input.getMousePosition().x;
		playerY = input.getMousePosition().y;
	}
}


function testPlayerWallCollision() {
	const data = getTileData(playerX - mapOffset.x, playerY - mapOffset.y, maps[currentMap].collisions);
	if (data === null) {
		return false;
	}
	if (data[0] === "wall") {
		return true
	}
	return false;
}

function testPlayerCollision() {
	const data = getTileData(playerX - mapOffset.x, playerY - mapOffset.y, maps[currentMap].collisions);
	if (data === null) {
		return;
	}

	if (data[0] === "sign") {
		const message = data[1];
		screen.drawTextBox(
			Math.round(WIDTH / 2 - (message.length / 2 + 2)),
			22,
			message,
			{
				borderColour: "#d7af00"
			}
		);
	}

	if (data[0] === "transition") {
		const nextLevel = data[1];		
		const spawnLocation = data[2];

		switchMap(nextLevel, spawnLocation);
	}
}