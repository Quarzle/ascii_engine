import { Engine,
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
let playerX = 40;
let playerY = 12;

let moveCooldown = [0, 0];
const moveCooldownTime = [0.1, 0.15] //in seconds



function setup() {
	audio.preload({
		ding: "audio/ding.mp3"
	});

}

function update(deltaTime) {
	engine.screen.clear("-");

	engine.screen.drawTextBox(
		5,
		3,
		"Welcome to my game!"
	);

	movement(deltaTime);

	if (input.justPressed("Space")) {
		audio.play("ding", 1, engine.random.float(0.5, 1.5));
	}

	engine.screen.write(
		playerX,
		playerY,
		colourText("O", "red")
	);
}

function movement(deltaTime) {
	moveCooldown[0] -= deltaTime;
	moveCooldown[1] -= deltaTime;

	if (input.isPressed("KeyA")) {
		if (moveCooldown[0] < 0) {
			playerX -= 1;
			moveCooldown[0] = moveCooldownTime[0];
		}
	}

	if (input.isPressed("KeyD")) {
		if (moveCooldown[0] < 0) {
			playerX += 1;
			moveCooldown[0] = moveCooldownTime[0];
		}
	}

	if (input.isPressed("KeyW")) {
		if (moveCooldown[1] < 0) {
			playerY -= 1;
			moveCooldown[1] = moveCooldownTime[1];
		}
	}

	if (input.isPressed("KeyS")) {
		if (moveCooldown[1] < 0) {
			playerY += 1;
			moveCooldown[1] = moveCooldownTime[1];
		}
	}
}