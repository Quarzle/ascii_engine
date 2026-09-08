export class Screen {
	constructor(engine) {
		this.engine = engine;

		this.width = engine.width;
		this.height = engine.height;
		this.element = engine.element;

		this.buffer = this.createBuffer();

		this.dirty = true;
		this.renderSuspended = false;
	}

	createCell(char = " ", style = "") {
		return {
			char,
			style
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

	markDirty() {
		this.dirty = true;
	}

	clear(text = " ") {
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				this.buffer[y][x].char = text;
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

		if (width == 1 && height == 1) {
			return this.buffer[y][x].char;
		} else {
			let result = "";
			for (let j = 0; j < height; j++) {
				for (let i = 0; i < width; i++) {
					result += this.getScreenText(
						x + i,
						y + j
					);
				}
				result += "\n";
			}
			return result;
		}
	}

	writeCell(x, y, cell) {
		if (
			x < 0 ||
			x >= this.width ||
			y < 0 ||
			y >= this.height
		) {
			return;
		}

		const destination = this.buffer[y][x];

		if (
			destination.char === cell.char &&
			destination.style === cell.style
		) {
			return;
		}

		destination.char = cell.char;
		destination.style = cell.style;

		this.markDirty();
	}

	insertText(x, y, text, inheritedStyle = "") {
		const cells = htmlToCells(text, inheritedStyle);

		let sourceIndex = 0;
		let currentY = y;

		while (
			sourceIndex < cells.length &&
			currentY < this.height
		) {
			let lineEnd = sourceIndex;

			while (
				lineEnd < cells.length &&
				cells[lineEnd].char !== "\n"
			) {
				lineEnd++;
			}

			const sourceStart = Math.max(-x, 0);
			const destinationStart = Math.max(x, 0);

			const sourceLength = lineEnd - sourceIndex;

			const visibleLength = Math.min(
				sourceLength - sourceStart,
				this.width - destinationStart
			);

			if (visibleLength > 0) {
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
			}

			if (lineEnd >= cells.length) {
				break;
			}

			currentY++;
			sourceIndex = lineEnd + 1;
		}
	}

	drawBox(
		x,
		y,
		width,
		height,
		colour = "var(--text-color)"
	) {
		if (width < 2 || height < 2) {
			this.insertText(x, y, "▯");
			return;
		}

		const horizontal = "─".repeat(width - 2);
		const middle =
			`│${" ".repeat(width - 2)}│`;

		let text =
			colourText(
				`┌${horizontal}┐`,
				colour
			) + "\n";

		for (let i = 1; i < height - 1; i++) {
			text +=
				colourText(middle, colour) + "\n";
		}

		text += colourText(
			`└${horizontal}┘`,
			colour
		);

		this.insertText(x, y, text);
	}

	drawTextBox(
		x,
		y,
		textContent,
		colour = "var(--text-color)",
		padding = 1,
		style = 1
	) {
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

		let text;
		if (style === 2) {
			text = colourText(
				`╭${horizontal}╮`,
				colour
			) + "\n";
		} else if (style === 3) {
			text = colourText(
				`╔${horizontal}╗`,
				colour
			) + "\n";
		} else {
			text = colourText(
				`┌${horizontal}┐`,
				colour
			) + "\n";
		}


		for (const line of lines) {
			if (style === 3) {
				text += colourText(
					`║${" ".repeat(padding)}`,
					colour
				);
			} else {
				text += colourText(
					`│${" ".repeat(padding)}`,
					colour
				);
			}


			text += cellsToHTML(line);

			text += colourText(
				`${" ".repeat(
					width - line.length + padding
				)}│`,
				colour
			);

			text += "\n";
		}

		text += colourText(
			`└${horizontal}┘`,
			colour
		);

		this.insertText(x, y, text);
	}
}

function colourText(text, colour) {
	return `<span style="color: ${colour};">${text}</span>`;
}

function htmlToCells(
	html,
	inheritedStyle = ""
) {
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

function concatStyles(parentStyle, childStyle) {
	if (!parentStyle) {
		return childStyle;
	}

	if (!childStyle) {
		return parentStyle;
	}

	return `${parentStyle};${childStyle}`;
}

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
			html +=
				`<span style="${currentStyle}">` +
				`${escaped}</span>`;
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