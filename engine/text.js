export function htmlToCells(
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

export function cellsToHTML(cells) {
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

export function colourText(text, colour) {
	return `<span style="color: ${colour};">${text}</span>`;
}

export function boldText(text) {
	return `<span style="font-weight: bold">${text}</span>`;
}

export function customText(text, className) {
	return `<span class="${className}">${text}</span>`;
}
