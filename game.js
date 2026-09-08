import { Engine } from "./engine/engine.js";
import {
	colourText,
	boldText
} from "./engine/text.js";

const engine = new Engine({
	element: "#mainWindow",
	width: 87,
	height: 26,
	fps: 60
});

let playerX = 40;
let playerY = 12;

let moveCooldown = [0, 0];
const moveCooldownTime = [0.1, 0.15] //in seconds

engine.start({
	setup(game) {
		// game.audio.preload({
		//     click: "audio/ding.wav"
		// });

	},

	update(game, deltaTime) {
		game.screen.clear("-");

		game.screen.drawTextBox(
			5,
			3,
			"Welcome to my game!"
		);

		movement(game, deltaTime);

		if (game.input.justPressed("Space")) {
			game.audio.play("click");
		}

		game.screen.write(
			playerX,
			playerY,
			colourText("O", "red")
		);
	}
});

function movement(game, deltaTime) {

	moveCooldown[0] -= deltaTime;
	moveCooldown[1] -= deltaTime;

	if (game.input.isPressed("KeyA")) {
		if (moveCooldown[0] < 0) {
			playerX -= 1;
			moveCooldown[0] = moveCooldownTime[0];
		}
	}

	if (game.input.isPressed("KeyD")) {
		if (moveCooldown[0] < 0) {
			playerX += 1;
			moveCooldown[0] = moveCooldownTime[0];
		}
	}

	if (game.input.isPressed("KeyW")) {
		if (moveCooldown[1] < 0) {
			playerY -= 1;
			moveCooldown[1] = moveCooldownTime[1];
		}
	}

	if (game.input.isPressed("KeyS")) {
		if (moveCooldown[1] < 0) {
			playerY += 1;
			moveCooldown[1] = moveCooldownTime[1];
		}
	}
}