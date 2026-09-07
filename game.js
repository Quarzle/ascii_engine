let textBoxes = []

function setup() {
	console.log("Game Started");

	textBoxes.push({
		x: 5,
		y: 5,
		text: `Wow, this is a ${boldText("cool")} textbox!`
	});

}

function update() {
	clearScreen();

	for (const textBox of textBoxes) {
		drawTextBox(textBox.x, textBox.y, textBox.text);
	}

	if (isKeyJustPressed("mouse0")) {
		textBoxes.push({
			x: getMousePosition().x,
			y: getMousePosition().y,
			text: "Wow, another\n cool box!"
		});
	}

	if (isKeyPressed("mouse0")) {
		drawTextBox(getMousePosition().x, getMousePosition().y, "Wow, another\n cool box!");
	} else {
		drawTextBox(getMousePosition().x, getMousePosition().y, "Wow, another\n cool box!", "gray");
	}
	insertText(getMousePosition().x, getMousePosition().y, "X");

}

