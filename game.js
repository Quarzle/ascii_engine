let textBoxes = []


function setup() {
	preloadSounds({
		test: "audio/ding.mp3",
	});

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

	doInput()

	insertText(getMousePosition().x, getMousePosition().y, "X");

}


function doInput() {
	if (isKeyJustPressed("mouse0")) {
		textBoxes.push({
			x: getMousePosition().x,
			y: getMousePosition().y,
			text: "Wow, another\n cool box!"
		});
	}

	if (isKeyJustPressed("KeyE")) {
		playSound("test")
	}

	if (isKeyJustPressed("KeyR")) {
		playSound("test", 1, 0.75)
	}


	if (isKeyJustPressed("mouse2")) {
		textBoxes.push({
			x: getMousePosition().x,
			y: getMousePosition().y,
			text: `This is a box with a ${colourText("red", "red")} word!`
		});
	}
}