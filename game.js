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

// --- Game code ---

let currentMap = null;

let mapOffset = {
	x: 0,
	y: 4
};

let playerX = 0;
let playerY = 0;

let moveCooldown = { x: 0, y: 0 };
const moveCooldownTime = { x: 0.1, y: 0.15 }; // in seconds


async function switchMap(nextMap, spawnLocation) {
	currentMap = await getMap(nextMap);

	mapOffset = {
		x: Math.round(
			WIDTH / 2 - getDimensions(currentMap).x / 2
		),
		y: 4
	};

	const spawnChar = spawnToChar(
		currentMap.collisions,
		spawnLocation
	);

	if (spawnChar === null) {
		throw new Error(
			`Spawn "${spawnLocation}" not found in map "${nextMap}"`
		);
	}

	const pos = findFirst(
		spawnChar,
		currentMap.collisions.tiles
	);

	if (pos === null) {
		throw new Error(
			`Spawn character "${spawnChar}" not found in map "${nextMap}"`
		);
	}

	playerX = pos.x + mapOffset.x;
	playerY = pos.y + mapOffset.y;
}


// This is down here so that variables are defined before setup is called.
engine.start({
	setup: setup,
	update: update
});


async function setup() {
	audio.preload({
		ding: "audio/ding.mp3"
	});

	await switchMap("demo", "central");
}


function update(deltaTime) {
	screen.clear(" ");

	// Don't try to update/draw before the first map has loaded.
	if (currentMap === null) {
		return;
	}

	movement(deltaTime);

	drawBackground();

	// Draw player
	screen.insertText(
		playerX,
		playerY,
		colourText("▲", "red")
	);
}


function drawBackground() {
	const title = "Ascii game demo!";

	screen.drawTextBox(
		Math.round(WIDTH / 2 - (title.length / 2 + 2)),
		0,
		title,
		{
			borderColour: "#d70000",
			border: "rounded",
		}
	);

	screen.insertText(
		mapOffset.x,
		mapOffset.y,
		currentMap.display
	);

	testPlayerCollision();
}


function movement(deltaTime) {
	moveCooldown.x -= deltaTime;
	moveCooldown.y -= deltaTime;

	if (moveCooldown.x < 0) {
		const movementX =
			input.isPressed("KeyA") -
			input.isPressed("KeyD");

		playerX -= movementX;

		moveCooldown.x = moveCooldownTime.x;

		if (testPlayerWallCollision()) {
			playerX += movementX;
			moveCooldown.x = 0;
		}
	}

	if (moveCooldown.y < 0) {
		const movementY =
			input.isPressed("KeyW") -
			input.isPressed("KeyS");

		playerY -= movementY;

		moveCooldown.y = moveCooldownTime.y;

		if (testPlayerWallCollision()) {
			playerY += movementY;
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
	const data = getTileData(
		playerX - mapOffset.x,
		playerY - mapOffset.y,
		currentMap.collisions
	);

	if (data === null) {
		return false;
	}

	return data[0] === "wall";
}


function testPlayerCollision() {
	const data = getTileData(
		playerX - mapOffset.x,
		playerY - mapOffset.y,
		currentMap.collisions
	);

	if (data === null) {
		return;
	}

	if (data[0] === "sign") {
		const message = data[1];

		screen.drawTextBox(
			Math.round(
				WIDTH / 2 - (message.length / 2 + 2)
			),
			23,
			message,
			{
				borderColour: "#d7af00"
			}
		);
	}

	if (data[0] === "transition") {
		const nextMap = data[1];
		const spawnLocation = data[2];

		switchMap(nextMap, spawnLocation);
	}
}
