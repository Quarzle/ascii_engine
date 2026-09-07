let textBoxes = []

function setup() {
	console.log("Game Started");

	textBoxes.push({
		x: 5,
		y: 5,
		text: "Wow, this is a cool textbox!"
	});
	
}

function update() {
	clearScreen();

	for (const textBox of textBoxes) {
		drawTextBox(textBox.x, textBox.y, textBox.text);
	}

	if (isKeyJustPressed("click")) {
		textBoxes.push({
			x: getMousePosition().x,
			y: getMousePosition().y,
			text: "Wow, another\n cool box!"
		});
	}

	insertText(getMousePosition().x, getMousePosition().y, "X");
}

