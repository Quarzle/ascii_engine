import {
	Engine,
	colourText,
	boldText
} from "./engine/engine.js";

// Engine setup
const engine = new Engine({
	element: "#mainWindow",
	width: 87,
	height: 26,
	fps: 60
});
const input = engine.input;
const audio = engine.audio;

engine.start({
	setup: setup,
	update: update
});


// ---Game code-----
let gameState = "menu";

let playerX = 5;
let playerY = 16;

let moveCooldown = [0, 0];
const moveCooldownTime = [0.1, 0.15] //in seconds


function setup() {
	audio.preload({
		ding: "audio/ding.mp3"
	});
}


function update(deltaTime) {
	engine.screen.clear(" ");

	engine.screen.drawTextBox(
		5,
		3,
		"Welcome to my game!",
		{
			borderColour: "yellow",
			border: "rounded",
		}
	);

	engine.screen.drawBox(
		60,
		17,
		20,
		5,
		{
			borderColour: "cyan",
			border: "double",
			fill: "."
		}
	);

	engine.screen.drawBox(
		50,
		14,
		20,
		7,
		{
			borderColour: "green",
			fill: "\u0000" // Transparent fill
		}
	);

	engine.screen.insertText(
		4,
		14,
		maze
	);


	movement(deltaTime);

	if (input.justPressed("Space")) {
		audio.play("ding", 1, engine.random.float(0.6, 1.4));
	}

	engine.screen.insertText(
		playerX,
		playerY,
		colourText("▲", "red")
	);
}


function movement(deltaTime) {
	moveCooldown[0] -= deltaTime;
	moveCooldown[1] -= deltaTime;

	if (moveCooldown[0] < 0) {
		playerX -= (input.isPressed("KeyA") - input.isPressed("KeyD"));

		moveCooldown[0] = moveCooldownTime[0];

		if (testPlayerCollision(playerX, playerY, collisionMap, 4, 14)) {
			playerX += (input.isPressed("KeyA") - input.isPressed("KeyD"));
			moveCooldown[0] = 0;
		}
	}

	if (moveCooldown[1] < 0) {
		playerY -= (input.isPressed("KeyW") - input.isPressed("KeyS"));
		moveCooldown[1] = moveCooldownTime[1];

		if (testPlayerCollision(playerX, playerY, collisionMap, 4, 14)) {
			playerY += (input.isPressed("KeyW") - input.isPressed("KeyS"));
			moveCooldown[1] = 0;
		}
	}

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


const collisionMap =
	`###########  ##    #######
#      #      ######     #
#             #    #     #
##  ############ #### #
#                     ####
#######################
`

const maze =
	`╭──────┬───  ─╮    ┌─────┐
│      |      ├────┤     │
│             │    │     │
├─  ──────────┼╴ ╶─┴╴ │
│                     ├──╯
└─────────────┴───────┘`

/*
╔╗╦╬
║╠╣
╚╝╩═
┌┐┬┼╷
│├┤╶╴
└┘┴─╵
╭╮
╰╯
╱╲╳
█ ▓▒░


*/