export class Input {
	constructor(engine) {
		this.engine = engine;

		this.keysPressed = new Set();
		this.keysJustPressed = new Set();

		this.mouseX = 0;
		this.mouseY = 0;

		this.initialized = false;
	}

	initialize() {
		if (this.initialized) {
			return;
		}

		this.initialized = true;

		document.addEventListener(
			"keydown",
			event => this.keyDown(event)
		);

		document.addEventListener(
			"keyup",
			event => this.keyUp(event)
		);

		document.addEventListener(
			"mousedown",
			event => this.mouseDown(event)
		);

		document.addEventListener(
			"mouseup",
			event => this.mouseUp(event)
		);

		document.addEventListener(
			"mousemove",
			event => {
				this.mouseX = event.clientX;
				this.mouseY = event.clientY;
			}
		);

		window.addEventListener("blur", () => {
			this.keysPressed.clear();
			this.keysJustPressed.clear();
		});

		document.addEventListener(
			"contextmenu",
			event => event.preventDefault()
		);
	}

	keyDown(event) {
		if (
			event.code === "Space" ||
			event.code.startsWith("Arrow")
		) {
			event.preventDefault();
		}

		// Only register the press once.
		if (!this.keysPressed.has(event.code)) {
			this.keysPressed.add(event.code);
			this.keysJustPressed.add(event.code);
		}
	}

	keyUp(event) {
		this.keysPressed.delete(event.code);
	}

	mouseDown(event) {
		const button = "mouse" + event.button;

		if (!this.keysPressed.has(button)) {
			this.keysPressed.add(button);
			this.keysJustPressed.add(button);
		}
	}

	mouseUp(event) {
		this.keysPressed.delete(
			"mouse" + event.button
		);
	}

	isPressed(key) {
		return this.keysPressed.has(key) || this.keysJustPressed.has(key);
	}

	justPressed(key, consume = false) {
		const pressed =
			this.keysJustPressed.has(key);

		if (pressed && consume) {
			this.keysJustPressed.delete(key);
		}

		return pressed;
	}

	endFrame() {
		this.keysJustPressed.clear();
	}

	getMousePosition() {
		const rect =
			this.engine.element.getBoundingClientRect();

		const style =
			window.getComputedStyle(
				this.engine.element
			);

		const paddingLeft =
			parseFloat(style.paddingLeft) || 0;

		const paddingTop =
			parseFloat(style.paddingTop) || 0;

		const fontSize =
			parseFloat(style.fontSize);

		const lineHeight =
			parseFloat(style.lineHeight);

		const charWidth =
			fontSize *
			this.engine.fontWidthMultiplier;

		const localX =
			this.mouseX -
			rect.left -
			paddingLeft;

		const localY =
			this.mouseY -
			rect.top -
			paddingTop;

		return {
			x: Math.floor(localX / charWidth),
			y: Math.floor(localY / lineHeight)
		};
	}
}
