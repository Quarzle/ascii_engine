const mainWindow = document.getElementById("mainWindow");
const FPS = 60;
const SCREEN_WIDTH = 87;
const SCREEN_HEIGHT = 22;

const keysCurrentlyPressed = new Set();
const unreportedKeys = new Set();

let mouseX, mouseY = 0;

function init() {
	clearScreen();
	initializeInput();
	setInterval(tick, 1000 / FPS);
	setup();
}

function tick() {
	update();
	updateInput();
}

// ===================
//   Input Manager
// ===================

function initializeInput() {
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
	document.addEventListener("mousedown", mouseDown);
    document.addEventListener("mouseup", mouseUp);
	document.addEventListener('mousemove', (event) => { 
		mouseX = event.clientX;
		mouseY = event.clientY; 
	});
}

function updateInput() {
    unreportedKeys.clear();
}

function isKeyJustPressed(keyCode, consume=true) {
    if (unreportedKeys.has(keyCode)) {
		if (consume) {
        	unreportedKeys.delete(keyCode);
		}
        return true;
    }

    return false;
}

function isKeyPressed(keyCode) {
    return keysCurrentlyPressed.has(keyCode);
}

function keyDown(event) {
	// console.log(event.code);
    if (!keysCurrentlyPressed.has(event.code)) {
        keysCurrentlyPressed.add(event.code);
        unreportedKeys.add(event.code);
    }
}

function keyUp(event) {
    keysCurrentlyPressed.delete(event.code);
}

function mouseDown() {
    if (!keysCurrentlyPressed.has("click")) {
        keysCurrentlyPressed.add("click");
        unreportedKeys.add("click");
    }
}

function mouseUp() {
    keysCurrentlyPressed.delete("click");
}

function getMousePosition() {
	const PADDING = 20; // Adjust this value based on your needs

	let rect = {
		width: mainWindow.clientWidth,
		height: mainWindow.clientHeight
	}
	let X = ((mouseX + PADDING) / (rect.width - 2 * PADDING)) * SCREEN_WIDTH;
	let Y = ((mouseY + PADDING) / (rect.height - 2 * PADDING)) * SCREEN_HEIGHT;

	X -= 4;
	Y -= 2;

	return {
		x: Math.round( X ),
		y: Math.round( Y )
	}
}

// ===================
//    Screen Utils
// ===================

function clearScreen() {
	mainWindow.textContent = "";

	for (let y = 0; y < SCREEN_HEIGHT; y++) {
		mainWindow.textContent += " ".repeat(SCREEN_WIDTH);

		if (y < SCREEN_HEIGHT - 1) {
			mainWindow.textContent += "\n";
		}
	}
}

function terminalNewline(newlineText) {
	let lines = mainWindow.textContent.split("\n");
	const newLines = newlineText.split("\n");

	// Add new lines to the top of the screen
	lines = [...newLines, ...lines];

	// Keep only the visible screen
	lines = lines.slice(0, SCREEN_HEIGHT);

	mainWindow.textContent = lines.join("\n");
}

function insertText(x, y, text) {
	const lines = mainWindow.textContent.split("\n");
	const addedLines = text.split("\n");

	for (let j = 0; j < addedLines.length; j++) {
		const lineIndex = y + j;

		// Vertical clipping
		if (lineIndex < 0 || lineIndex >= SCREEN_HEIGHT) {
			continue;
		}

		const inserted = addedLines[j];

		// Horizontal clipping
		const startX = Math.max(x, 0);
		const sourceStart = Math.max(-x, 0);

		// Nothing visible horizontally
		if (startX >= SCREEN_WIDTH || sourceStart >= inserted.length) {
			continue;
		}

		// Only take the portion of the source that fits on screen
		const visibleText = inserted.substring(
			sourceStart,
			sourceStart + (SCREEN_WIDTH - startX)
		);

		const line = lines[lineIndex] ?? "";

		// Ensure the existing line is SCREEN_WIDTH characters wide
		const paddedLine = line.padEnd(SCREEN_WIDTH, " ");

		// Overwrite the visible section
		lines[lineIndex] =
			paddedLine.substring(0, startX) +
			visibleText +
			paddedLine.substring(startX + visibleText.length);

		// Guarantee the line doesn't exceed screen width
		lines[lineIndex] = lines[lineIndex].substring(0, SCREEN_WIDTH);
	}

	// Keep exactly SCREEN_HEIGHT rows
	mainWindow.textContent = lines
		.slice(0, SCREEN_HEIGHT)
		.join("\n");
}

function drawTextBox(x, y, textContent, padding = 1) {
	const lines = textContent.split("\n");
	const width = Math.max(...lines.map(line => line.length));

	const horizontal = "─".repeat(width + padding * 2);

	// Top
	insertText(x, y, `┌${horizontal}┐`);

	// Content
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].padEnd(width, " ");

		insertText(
			x,
			y + i + 1,
			`│${" ".repeat(padding)}${line}${" ".repeat(padding)}│`
		);
	}

	// Bottom
	insertText(x, y + lines.length + 1, `└${horizontal}┘`);
}

function drawBox(x, y, width, height) {
	if (width < 2 || height < 2) {
		return;
	}

	// Top
	insertText(
		x,
		y,
		`┌${"─".repeat(width - 2)}┐`
	);

	// Sides
	for (let i = 1; i < height - 1; i++) {
		insertText(
			x,
			y + i,
			`│${" ".repeat(width - 2)}│`
		);
	}

	// Bottom
	insertText(
		x,
		y + height - 1,
		`└${"─".repeat(width - 2)}┘`
	);
}



// ---Main program------
init();
console.log("Engine initialized");
