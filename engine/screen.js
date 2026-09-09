const TRANSPARENT_CHAR = "\u0000";

export class Screen {
	constructor(engine) {
		if (!engine) {
			throw new TypeError("Screen requires an engine.");
		}

		this.engine = engine;
		this.width = Math.max(0, Number(engine.width) || 0);
		this.height = Math.max(0, Number(engine.height) || 0);
		this.element = engine.element;

		if (!this.element) {
			throw new TypeError("Screen requires an engine.element.");
		}

		this.buffer = this.createBuffer();

		this.dirty = true;
		this.renderSuspended = false;
	}

	createCell(char = " ", style = "") {
		return {
			char: firstCharacter(char),
			style: String(style)
		};
	}

	createBuffer() {
		return Array.from(
			{ length: this.height },
			() =>
				Array.from(
					{ length: this.width },
					() => this.createCell()
				)
		);
	}

	resize(width, height) {
		width = Math.max(0, Number(width) || 0);
		height = Math.max(0, Number(height) || 0);

		if (width === this.width && height === this.height) {
			return;
		}

		const oldBuffer = this.buffer;

		this.width = width;
		this.height = height;
		this.buffer = this.createBuffer();

		const copyHeight = Math.min(
			height,
			oldBuffer.length
		);

		for (let y = 0; y < copyHeight; y++) {
			const copyWidth = Math.min(
				width,
				oldBuffer[y].length
			);

			for (let x = 0; x < copyWidth; x++) {
				this.buffer[y][x] = {
					char: oldBuffer[y][x].char,
					style: oldBuffer[y][x].style
				};
			}
		}

		this.markDirty();
	}

	markDirty() {
		this.dirty = true;
	}

	suspendRender() {
		this.renderSuspended = true;
	}

	resumeRender(render = true) {
		this.renderSuspended = false;

		if (render) {
			this.render();
		}
	}

	clear(char = " ") {
		char = firstCharacter(char);

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				this.buffer[y][x].char = char;
				this.buffer[y][x].style = "";
			}
		}

		this.markDirty();
	}

	render() {
		if (!this.dirty || this.renderSuspended) {
			return;
		}

		const lines = this.buffer.map(
			cells => cellsToHTML(cells)
		);

		this.element.innerHTML = lines.join("\n");

		this.dirty = false;
	}

	getScreenText(x, y, width = 1, height = 1) {
		x = Math.trunc(x);
		y = Math.trunc(y);
		width = Math.trunc(width);
		height = Math.trunc(height);

		if (width < 1 || height < 1) {
			return "";
		}

		if (
			x < 0 ||
			x >= this.width ||
			y < 0 ||
			y >= this.height
		) {
			return "";
		}

		const endX = Math.min(
			x + width,
			this.width
		);

		const endY = Math.min(
			y + height,
			this.height
		);

		let result = "";

		for (let currentY = y; currentY < endY; currentY++) {
			for (
				let currentX = x;
				currentX < endX;
				currentX++
			) {
				result +=
					this.buffer[currentY][currentX].char;
			}

			if (currentY < endY - 1) {
				result += "\n";
			}
		}

		return result;
	}

	writeCell(x, y, cell) {
		x = Math.trunc(x);
		y = Math.trunc(y);

		if (
			x < 0 ||
			x >= this.width ||
			y < 0 ||
			y >= this.height
		) {
			return false;
		}

		if (!cell) {
			return false;
		}

		const char = firstCharacter(cell.char);

		/*
		 * Null is the transparent character.
		 *
		 * A transparent cell does not modify the destination
		 * cell at all, including its existing style.
		 */
		if (char === TRANSPARENT_CHAR) {
			return false;
		}

		const style = String(cell.style ?? "");

		const destination = this.buffer[y][x];

		if (
			destination.char === char &&
			destination.style === style
		) {
			return false;
		}

		destination.char = char;
		destination.style = style;

		this.markDirty();

		return true;
	}

	insertText(
		x,
		y,
		text,
		inheritedStyle = ""
	) {
		x = Math.trunc(x);
		y = Math.trunc(y);

		if (
			!text ||
			y >= this.height ||
			x >= this.width
		) {
			return;
		}

		const cells = htmlToCells(
			String(text),
			inheritedStyle
		);

		let sourceIndex = 0;
		let currentY = y;

		while (
			sourceIndex < cells.length &&
			currentY < this.height
		) {
			if (currentY < 0) {
				while (
					sourceIndex < cells.length &&
					cells[sourceIndex].char !== "\n"
				) {
					sourceIndex++;
				}

				if (sourceIndex < cells.length) {
					sourceIndex++;
					currentY++;
				}

				continue;
			}

			let lineEnd = sourceIndex;

			while (
				lineEnd < cells.length &&
				cells[lineEnd].char !== "\n"
			) {
				lineEnd++;
			}

			const sourceStart = Math.max(0, -x);
			const destinationStart = Math.max(0, x);

			const sourceLength =
				lineEnd - sourceIndex;

			const availableSource = Math.max(
				0,
				sourceLength - sourceStart
			);

			const availableDestination = Math.max(
				0,
				this.width - destinationStart
			);

			const visibleLength = Math.min(
				availableSource,
				availableDestination
			);

			for (let i = 0; i < visibleLength; i++) {
				this.writeCell(
					destinationStart + i,
					currentY,
					cells[
						sourceIndex +
						sourceStart +
						i
					]
				);
			}

			if (lineEnd >= cells.length) {
				break;
			}

			sourceIndex = lineEnd + 1;
			currentY++;
		}
	}

	drawBox(
		x,
		y,
		width,
		height,
		options = {}
	) {
		const {
			fill = " ",
			borderColour = "var(--text-color)",
			border = "single"
		} = options;

		x = Math.trunc(x);
		y = Math.trunc(y);
		width = Math.trunc(width);
		height = Math.trunc(height);

		if (width < 1 || height < 1) {
			return;
		}

		const fillCharacter = firstCharacter(fill);
		const borders = getBorder(border);
		const borderStyle = `color: ${borderColour}`;

		if (width === 1 && height === 1) {
			this.writeCell(x, y, {
				char: fillCharacter,
				style: ""
			});

			return;
		}

		// Top border.
		this.writeCell(x, y, {
			char: borders.topLeft,
			style: borderStyle
		});

		for (let col = 1; col < width - 1; col++) {
			this.writeCell(x + col, y, {
				char: borders.horizontal,
				style: borderStyle
			});
		}

		this.writeCell(x + width - 1, y, {
			char: borders.topRight,
			style: borderStyle
		});

		// Middle.
		for (let row = 1; row < height - 1; row++) {
			this.writeCell(x, y + row, {
				char: borders.vertical,
				style: borderStyle
			});

			for (let col = 1; col < width - 1; col++) {
				this.writeCell(x + col, y + row, {
					char: fillCharacter,
					style: ""
				});
			}

			this.writeCell(
				x + width - 1,
				y + row,
				{
					char: borders.vertical,
					style: borderStyle
				}
			);
		}

		// Bottom border.
		if (height > 1) {
			this.writeCell(
				x,
				y + height - 1,
				{
					char: borders.bottomLeft,
					style: borderStyle
				}
			);

			for (let col = 1; col < width - 1; col++) {
				this.writeCell(
					x + col,
					y + height - 1,
					{
						char: borders.horizontal,
						style: borderStyle
					}
				);
			}

			this.writeCell(
				x + width - 1,
				y + height - 1,
				{
					char: borders.bottomRight,
					style: borderStyle
				}
			);
		}
	}

	drawTextBox(
		x,
		y,
		textContent,
		options = {}
	) {
		let {
			borderColour = "var(--text-color)",
			border = "single",
			padding = 1,
			fill = " "
		} = options;

		x = Math.trunc(x);
		y = Math.trunc(y);
		padding = Math.max(0, Math.trunc(padding));

		const cells = htmlToCells(
			String(textContent)
		);

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

		const contentWidth = Math.max(
			0,
			...lines.map(line => line.length)
		);

		const innerWidth =
			contentWidth +
			padding * 2;

		const totalWidth =
			innerWidth + 2;

		const totalHeight =
			lines.length + 2;

		const borders = getBorder(border);
		const borderStyle =
			`color: ${borderColour}`;

		const fillCharacter =
			firstCharacter(fill);

		// Top border.
		this.writeCell(x, y, {
			char: borders.topLeft,
			style: borderStyle
		});

		for (let col = 0; col < innerWidth; col++) {
			this.writeCell(
				x + col + 1,
				y,
				{
					char: borders.horizontal,
					style: borderStyle
				}
			);
		}

		this.writeCell(
			x + totalWidth - 1,
			y,
			{
				char: borders.topRight,
				style: borderStyle
			}
		);

		// Content.
		for (let row = 0; row < lines.length; row++) {
			const line = lines[row];
			const screenY = y + row + 1;

			this.writeCell(x, screenY, {
				char: borders.vertical,
				style: borderStyle
			});

			// Left padding.
			for (let i = 0; i < padding; i++) {
				this.writeCell(
					x + 1 + i,
					screenY,
					{
						char: fillCharacter,
						style: ""
					}
				);
			}

			// Text.
			for (let i = 0; i < line.length; i++) {
				this.writeCell(
					x + 1 + padding + i,
					screenY,
					line[i]
				);
			}

			// Right padding / remaining space.
			for (
				let i = line.length;
				i < contentWidth + padding;
				i++
			) {
				this.writeCell(
					x + 1 + padding + i,
					screenY,
					{
						char: fillCharacter,
						style: ""
					}
				);
			}

			this.writeCell(
				x + totalWidth - 1,
				screenY,
				{
					char: borders.vertical,
					style: borderStyle
				}
			);
		}

		// Bottom border.
		const bottomY =
			y + totalHeight - 1;

		this.writeCell(x, bottomY, {
			char: borders.bottomLeft,
			style: borderStyle
		});

		for (let col = 0; col < innerWidth; col++) {
			this.writeCell(
				x + col + 1,
				bottomY,
				{
					char: borders.horizontal,
					style: borderStyle
				}
			);
		}

		this.writeCell(
			x + totalWidth - 1,
			bottomY,
			{
				char: borders.bottomRight,
				style: borderStyle
			}
		);
	}
}

function getBorder(border) {
	switch (border) {
		case "rounded":
			return {
				topLeft: "╭",
				topRight: "╮",
				bottomLeft: "╰",
				bottomRight: "╯",
				horizontal: "─",
				vertical: "│"
			};

		case "double":
			return {
				topLeft: "╔",
				topRight: "╗",
				bottomLeft: "╚",
				bottomRight: "╝",
				horizontal: "═",
				vertical: "║"
			};

		case "single":
		default:
			return {
				topLeft: "┌",
				topRight: "┐",
				bottomLeft: "└",
				bottomRight: "┘",
				horizontal: "─",
				vertical: "│"
			};
	}
}

function firstCharacter(value) {
	const characters = Array.from(
		String(value ?? "")
	);

	return characters.length > 0
		? characters[0]
		: " ";
}

function htmlToCells(
	html,
	inheritedStyle = ""
) {
	html = String(html ?? "");
	inheritedStyle =
		String(inheritedStyle ?? "");

	if (!html.includes("<")) {
		return Array.from(
			html,
			char => ({
				char,
				style: inheritedStyle
			})
		);
	}

	const container =
		document.createElement("div");

	container.innerHTML = html;

	const cells = [];

	function pushText(text, style) {
		if (!text) {
			return;
		}

		for (const char of text) {
			cells.push({
				char,
				style
			});
		}
	}

	function walk(node, style) {
		if (node.nodeType === Node.TEXT_NODE) {
			pushText(node.nodeValue, style);
			return;
		}

		if (node.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		if (
			node.tagName.toLowerCase() === "br"
		) {
			cells.push({
				char: "\n",
				style
			});

			return;
		}

		let childStyle = style;

		if (node.hasAttribute("style")) {
			childStyle = concatStyles(
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

function concatStyles(
	parentStyle,
	childStyle
) {
	parentStyle = String(parentStyle ?? "");
	childStyle = String(childStyle ?? "");

	if (!parentStyle) {
		return childStyle;
	}

	if (!childStyle) {
		return parentStyle;
	}

	return `${parentStyle};${childStyle}`;
}

function escapeHTML(text) {
	return String(text)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function cellsToHTML(cells) {
	let html = "";
	let currentStyle = null;
	let text = "";

	function flush() {
		if (!text) {
			return;
		}

		const escaped = escapeHTML(text);

		if (currentStyle) {
			html +=
				`<span style="${escapeHTML(currentStyle)}">` +
				`${escaped}</span>`;
		} else {
			html += escaped;
		}

		text = "";
	}

	for (const cell of cells) {
		const style = String(cell.style ?? "");

		if (style !== currentStyle) {
			flush();
			currentStyle = style;
		}

		text += firstCharacter(cell.char);
	}

	flush();

	return html;
}
