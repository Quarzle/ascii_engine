export class Input {
	constructor(engine) {
		this.engine = engine;

		this.keysPressed = new Set();
		this.keysJustPressed = new Set();
		this.actions = {};

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
		const button = "Mouse" + event.button;

		if (!this.keysPressed.has(button)) {
			this.keysPressed.add(button);
			this.keysJustPressed.add(button);
		}
	}

	mouseUp(event) {
		this.keysPressed.delete(
			"Mouse" + event.button
		);
	}

	isPressed(inputCode) {
		return (
			this.keysPressed.has(inputCode) ||
			this.keysJustPressed.has(inputCode)
		);
	}

	justPressed(inputCode, consume = false) {
		const pressed =
			this.keysJustPressed.has(inputCode);

		if (pressed && consume) {
			this.keysJustPressed.delete(inputCode);
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


	bindToAction(inputCode, actionName) {
		if (!this.actions[actionName]) {
			this.actions[actionName] = [];
		}

		if (!this.actions[actionName].includes(inputCode)) {
			this.actions[actionName].push(inputCode);
		}
	}


	unbindToAction(inputCode, actionName) {
		const bindings = this.actions[actionName];

		if (!bindings) {
			return false;
		}

		const index = bindings.indexOf(inputCode);

		if (index === -1) {
			return false;
		}

		bindings.splice(index, 1);

		// Clean up empty actions.
		if (bindings.length === 0) {
			delete this.actions[actionName];
		}

		return true;
	}


	unbindAction(actionName) {
		if (!this.actions[actionName]) {
			return false;
		}

		delete this.actions[actionName];

		return true;
	}


	getActionBindings(actionName) {
		return this.actions[actionName]
			? [...this.actions[actionName]]
			: [];
	}


	actionIsPressed(actionName) {
		const bindings = this.actions[actionName];

		if (!bindings) {
			return false;
		}

		for (const inputCode of bindings) {
			if (this.isPressed(inputCode)) {
				return true;
			}
		}

		return false;
	}


	actionJustPressed(actionName, consume = false) {
		const bindings = this.actions[actionName];

		if (!bindings) {
			return false;
		}

		for (const inputCode of bindings) {
			if (this.justPressed(inputCode, consume)) {
				return true;
			}
		}

		return false;
	}
}
