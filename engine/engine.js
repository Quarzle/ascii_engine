import { Screen } from "./screen.js";
import { Input } from "./input.js";
import { AudioManager } from "./audio.js";
import { Random } from "./random.js";

export class Engine {
	constructor({
		element,
		width = 87,
		height = 26,
		fps = 60,
		fontWidthMultiplier = 0.55
	}) {
		if (typeof element === "string") {
			element = document.querySelector(element);
		}

		if (!element) {
			throw new Error("Engine: could not find screen element.");
		}

		this.element = element;

		this.width = width;
		this.height = height;
		this.fps = fps;
		this.frameTime = 1000 / fps;
		this.fontWidthMultiplier = fontWidthMultiplier;

		this.screen = new Screen(this);
		this.input = new Input(this);
		this.audio = new AudioManager();
		this.random = new Random();


		this.game = null;
		this.running = false;

		this.lastTime = 0;
		this.accumulator = 0;
	}

	start(game) {
		if (this.running) {
			return;
		}

		this.game = game;
		this.running = true;

		this.screen.clear();
		this.input.initialize();

		this.game.setup?.();

		this.screen.render();

		this.lastTime = performance.now();
		this.accumulator = 0;

		requestAnimationFrame(time => this.tick(time));
	}

	stop() {
		this.running = false;
	}

	tick(time) {
		if (!this.running) {
			return;
		}

		const deltaTime =
			Math.min(
				time - this.lastTime,
				250
			) / 1000;

		this.lastTime = time;

		this.game.update?.(
			deltaTime
		);

		this.input.endFrame();

		this.screen.render();

		requestAnimationFrame(
			nextTime => this.tick(nextTime)
		);
	}

}

export function colourText(text, colour) {
	return `<span style="color: ${colour};">${text}</span>`;
}

export function boldText(text) {
	return `<span style="font-weight: bold">${text}</span>`;
}

export function customText(text, className) {
	return `<span class="${className}">${text}</span>`;
}
