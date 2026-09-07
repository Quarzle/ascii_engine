const mainWindow = document.getElementById("mainWindow");

const FPS = 60;
const FRAME_TIME = 1000 / FPS;

const SCREEN_WIDTH = 87;
const SCREEN_HEIGHT = 22;

// ===================
//   Screen Buffer
// ===================

const screen = createScreen();

let screenDirty = true;
let renderSuspended = false;

function createCell(char = " ", style = "") {
	return {
		char,
		style
	};
}

function createScreen() {
	return Array.from(
		{ length: SCREEN_HEIGHT },
		() =>
			Array.from(
				{ length: SCREEN_WIDTH },
				() => createCell()
			)
	);
}

function markScreenDirty() {
	screenDirty = true;
}

// ===================
//      Input
// ===================

const keysCurrentlyPressed = new Set();
const unreportedKeys = new Set();

let mouseX = 0;
let mouseY = 0;

function initializeInput() {
	document.addEventListener("keydown", keyDown);
	document.addEventListener("keyup", keyUp);

	document.addEventListener("mousedown", mouseDown);
	document.addEventListener("mouseup", mouseUp);

	document.addEventListener("mousemove", event => {
		mouseX = event.clientX;
		mouseY = event.clientY;
	});

	window.addEventListener("blur", () => {
		keysCurrentlyPressed.clear();
		unreportedKeys.clear();
	});

	document.addEventListener('contextmenu', e => e.preventDefault());
}

function updateInput() {
	unreportedKeys.clear();
}

function isKeyJustPressed(keyCode, consume = true) {
	if (!unreportedKeys.has(keyCode)) {
		return false;
	}

	if (consume) {
		unreportedKeys.delete(keyCode);
	}

	return true;
}

function isKeyPressed(keyCode) {
	return keysCurrentlyPressed.has(keyCode);
}

function keyDown(event) {
	if (event.code === "Space" || event.code.startsWith("Arrow")) {
		event.preventDefault();
	}

	if (!keysCurrentlyPressed.has(event.code)) {
		keysCurrentlyPressed.add(event.code);
		unreportedKeys.add(event.code);
	}
}

function keyUp(event) {
	keysCurrentlyPressed.delete(event.code);
}

function mouseDown(event) {
	const button = event.button;

	if (!keysCurrentlyPressed.has("mouse" + button)) {
		keysCurrentlyPressed.add("mouse" + button);
		unreportedKeys.add("mouse" + button);
	}
}

function mouseUp(event) {
	const button = event.button;
	keysCurrentlyPressed.delete("mouse" + button);
}

function getMousePosition() {
	const padding = parseInt(
		window.getComputedStyle(mainWindow).paddingLeft,
		10
	);

	const width = mainWindow.clientWidth;
	const height = mainWindow.clientHeight;

	let x =
		((mouseX + padding) /
			(width - 2 * padding)) *
		SCREEN_WIDTH;

	let y =
		((mouseY + padding) /
			(height - 2 * padding)) *
		SCREEN_HEIGHT;

	x -= 4;
	y -= 2;

	return {
		x: Math.round(x),
		y: Math.round(y)
	};
}

// ===================
//   Screen Rendering
// ===================

function clearScreen() {
	for (let y = 0; y < SCREEN_HEIGHT; y++) {
		for (let x = 0; x < SCREEN_WIDTH; x++) {
			screen[y][x].char = " ";
			screen[y][x].style = "";
		}
	}

	markScreenDirty();
	renderScreen();
}

function renderScreen() {
	if (!screenDirty || renderSuspended) {
		return;
	}

	const lines = screen.map(cells => cellsToHTML(cells));

	mainWindow.innerHTML = lines.join("\n");

	screenDirty = false;
}

// Temporarily prevents individual drawing operations
// from rendering. Useful for functions that perform
// multiple insertText() calls.
function batchRender(callback) {
	const previousState = renderSuspended;

	renderSuspended = true;

	try {
		callback();
	} finally {
		renderSuspended = previousState;
	}

	if (!renderSuspended) {
		renderScreen();
	}
}

// ===================
//    HTML → Cells
// ===================

function htmlToCells(html, inheritedStyle = "") {
	// Fast path for ordinary text.
	if (!html.includes("<")) {
		return Array.from(html, char => ({
			char,
			style: inheritedStyle
		}));
	}

	const container = document.createElement("div");
	container.innerHTML = html;

	const cells = [];

	function walk(node, style) {
		if (node.nodeType === Node.TEXT_NODE) {
			for (const char of node.nodeValue) {
				cells.push({
					char,
					style
				});
			}

			return;
		}

		if (node.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		let childStyle = style;

		if (node.hasAttribute("style")) {
			childStyle = mergeStyles(
				style,
				node.getAttribute("style")
			);
		}

		for (const child of node.childNodes) {
			walk(child, childStyle);
		}
	}

	for (const child of container.childNodes) {
		walk(child, inheritedStyle);
	}

	return cells;
}

function mergeStyles(parentStyle, childStyle) {
	if (!parentStyle) {
		return childStyle;
	}

	if (!childStyle) {
		return parentStyle;
	}

	// CSS declarations later in the string override
	// earlier declarations, matching the original behavior.
	return `${parentStyle};${childStyle}`;
}

// ===================
//    Cells → HTML
// ===================

function cellsToHTML(cells) {
	let html = "";
	let currentStyle = null;
	let text = "";

	function flush() {
		if (!text) {
			return;
		}

		const escaped = text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");

		if (currentStyle) {
			html += `<span style="${currentStyle}">${escaped}</span>`;
		} else {
			html += escaped;
		}

		text = "";
	}

	for (const cell of cells) {
		if (cell.style !== currentStyle) {
			flush();
			currentStyle = cell.style;
		}

		text += cell.char;
	}

	flush();

	return html;
}

// ===================
//    Screen Utils
// ===================

function writeCell(x, y, cell) {
	if (
		x < 0 ||
		x >= SCREEN_WIDTH ||
		y < 0 ||
		y >= SCREEN_HEIGHT
	) {
		return;
	}

	const destination = screen[y][x];

	if (
		destination.char === cell.char &&
		destination.style === cell.style
	) {
		return;
	}

	destination.char = cell.char;
	destination.style = cell.style;

	markScreenDirty();
}

function insertText(x, y, text, inheritedStyle = "") {
	const addedCells = htmlToCells(text, inheritedStyle);

	let sourceIndex = 0;
	let currentY = y;

	while (
		sourceIndex < addedCells.length &&
		currentY < SCREEN_HEIGHT
	) {
		let lineEnd = sourceIndex;

		while (
			lineEnd < addedCells.length &&
			addedCells[lineEnd].char !== "\n"
		) {
			lineEnd++;
		}

		const sourceStart = Math.max(-x, 0);
		const destinationStart = Math.max(x, 0);

		const sourceLength = lineEnd - sourceIndex;

		const visibleLength = Math.min(
			sourceLength - sourceStart,
			SCREEN_WIDTH - destinationStart
		);

		if (visibleLength > 0) {
			for (let i = 0; i < visibleLength; i++) {
				writeCell(
					destinationStart + i,
					currentY,
					addedCells[
					sourceIndex +
					sourceStart +
					i
					]
				);
			}
		}

		if (lineEnd >= addedCells.length) {
			break;
		}

		currentY++;
		sourceIndex = lineEnd + 1;
	}

	// Preserve the original behavior:
	// calling insertText() immediately updates the display.
	// renderScreen();
}

// ===================
//      Text Box
// ===================

function drawTextBox(
	x,
	y,
	textContent,
	colour = "var(--text-color)",
	padding = 1
) {
	batchRender(() => {
		const cells = htmlToCells(textContent);

		const lines = [];
		let currentLine = [];

		for (const cell of cells) {
			if (cell.char === "\n") {
				lines.push(currentLine);
				currentLine = [];
			} else {
				currentLine.push(cell);
			}
		}

		lines.push(currentLine);

		const width = Math.max(
			0,
			...lines.map(line => line.length)
		);

		const horizontal =
			"─".repeat(width + padding * 2);

		const style = `color: ${colour};`;

		// Top
		insertText(
			x,
			y,
			`┌${horizontal}┐`,
			style
		);

		// Content
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Left border + padding
			insertText(
				x,
				y + i + 1,
				`│${" ".repeat(padding)}`,
				style
			);

			// Actual content
			insertText(
				x + padding + 1,
				y + i + 1,
				cellsToHTML(line),
				style
			);

			// Right padding + border
			insertText(
				x + padding + 1 + line.length,
				y + i + 1,
				`${" ".repeat(
					width - line.length + padding
				)}│`,
				style
			);
		}

		// Bottom
		insertText(
			x,
			y + lines.length + 1,
			`└${horizontal}┘`,
			style
		);
	});
}

// ===================
//        Box
// ===================

function drawBox(x, y, width, height) {
	if (width < 2 || height < 2) {
		return;
	}

	batchRender(() => {
		const horizontal =
			"─".repeat(width - 2);

		const middle =
			`│${" ".repeat(width - 2)}│`;

		// Top
		insertText(
			x,
			y,
			`┌${horizontal}┐`
		);

		// Sides
		for (let i = 1; i < height - 1; i++) {
			insertText(
				x,
				y + i,
				middle
			);
		}

		// Bottom
		insertText(
			x,
			y + height - 1,
			`└${horizontal}┘`
		);
	});
}

// ===================
//      Text Utils
// ===================

function colourText(text, colour) {
	return `<span style="color: ${colour};">${text}</span>`;
}

function boldText(text) {
	return `<span style="font-weight: bold">${text}</span>`;
}

// ===================
//       Main Loop
// ===================

function tick() {
	update();
	updateInput();

	// Only touch the DOM if something actually changed.
	renderScreen();

	requestAnimationFrame(tick);
}

function init() {
	clearScreen();
	initializeInput();

	setup();

	// setup() may have drawn to the screen.
	renderScreen();

	requestAnimationFrame(tick);
}

// ===================
//     Main Program
// ===================

init();

console.log("Engine initialized");
