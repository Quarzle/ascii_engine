/*
╔╗╦╬
║╠╣
╚╝╩═
┌┐┬┼╷
│├┤╶╴
└┘┴─╵
╭╮
╰╯
╱╲╳
█ ▓▒░

*/
async function getMap(mapName) {
	const response = await fetch(`maps/${mapName}.map`);

	if (!response.ok) {
		throw new Error(`Could not load map "${mapName}"`);
	}

	const text = await response.text();

	return parseMap(text);
}


function parseMap(text) {
	const sections = parseSections(text);

	if (!sections.data) {
		console.warn("Map is missing [data] section");
	}

	if (!sections.display) {
		throw new Error("Map is missing [display] section");
	}

	if (!sections.collisions) {
		throw new Error("Map is missing [collisions] section");
	}

	if (!sections.definitions) {
		throw new Error("Map is missing [definitions] section");
	}

	let data;
	if (sections.data) {
		data = parseData(sections.data);
	}

	let display;
	let collisions;
	if (!sections.data) {
		display = sections.display;
		collisions = sections.collisions;

	} else {
		display = applyPadding(
			sections.display,
			data
		);

		collisions = applyPadding(
			sections.collisions,
			data
		);
	}

	return {
		data,
		display,
		collisions: {
			tiles: collisions,
			definitions: parseDefinitions(sections.definitions)
		}
	};
}


function parseSections(text) {
	const sections = {};
	let currentSection = null;
	let currentLines = [];

	for (const line of text.split(/\r?\n/)) {
		const sectionMatch = line.match(
			/^\[([^\]]+)\]\s*$/
		);

		if (sectionMatch) {
			if (currentSection !== null) {
				sections[currentSection] =
					cleanSection(currentLines);
			}

			currentSection =
				sectionMatch[1].toLowerCase();

			currentLines = [];

			continue;
		}

		if (currentSection !== null) {
			currentLines.push(line);
		}
	}

	if (currentSection !== null) {
		sections[currentSection] =
			cleanSection(currentLines);
	}

	return sections;
}


function cleanSection(lines) {
	while (
		lines.length > 0 &&
		lines[0].trim() === ""
	) {
		lines.shift();
	}

	while (
		lines.length > 0 &&
		lines[lines.length - 1].trim() === ""
	) {
		lines.pop();
	}

	return lines.join("\n");
}


function parseData(text) {
	const data = {
		name: null,
		padding_top: 0,
		padding_bottom: 0,
		padding_left: 0,
		padding_right: 0
	};

	for (const line of text.split("\n")) {
		if (line.trim() === "") {
			continue;
		}

		const match = line.match(
			/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/
		);

		if (!match) {
			throw new Error(
				`Invalid data definition: ${line}`
			);
		}

		const key = match[1];
		const value = parseValue(match[2]);

		if (!(key in data)) {
			throw new Error(
				`Unknown map data property "${key}"`
			);
		}

		data[key] = value;
	}

	validatePadding(data);

	return data;
}


function parseValue(value) {
	value = value.trim();

	// Quoted string
	if (
		value.startsWith('"') &&
		value.endsWith('"')
	) {
		return value.slice(1, -1);
	}

	// Number
	if (/^-?\d+$/.test(value)) {
		return Number(value);
	}

	// Boolean
	if (value === "true") {
		return true;
	}

	if (value === "false") {
		return false;
	}

	// Plain string
	return value;
}


function validatePadding(data) {
	const paddingProperties = [
		"padding_top",
		"padding_bottom",
		"padding_left",
		"padding_right"
	];

	for (const property of paddingProperties) {
		if (
			!Number.isInteger(data[property]) ||
			data[property] < 0
		) {
			throw new Error(
				`${property} must be a non-negative integer`
			);
		}
	}
}


function applyPadding(text, data) {
	const lines = text.split("\n");

	const left = " ".repeat(data.padding_left);
	const right = " ".repeat(data.padding_right);

	// Horizontal padding
	const paddedLines = lines.map(line => {
		return left + line + right;
	});

	// Vertical padding
	const emptyLine =
		" ".repeat(
			getLongestLineLength(paddedLines)
		);

	for (
		let i = 0;
		i < data.padding_top;
		i++
	) {
		paddedLines.unshift(emptyLine);
	}

	for (
		let i = 0;
		i < data.padding_bottom;
		i++
	) {
		paddedLines.push(emptyLine);
	}

	return paddedLines.join("\n");
}


function getLongestLineLength(lines) {
	let longest = 0;

	for (const line of lines) {
		if (line.length > longest) {
			longest = line.length;
		}
	}

	return longest;
}


function parseDefinitions(text) {
	const definitions = {};

	for (const line of text.split("\n")) {
		if (line.trim() === "") {
			continue;
		}

		const match = line.match(
			/^(\S)\s*=\s*(.+)$/
		);

		if (!match) {
			throw new Error(
				`Invalid definition: ${line}`
			);
		}

		const char = match[1];
		const definitionText = match[2];

		definitions[char] =
			parseDefinition(definitionText);
	}

	return definitions;
}


function parseDefinition(text) {
	const tokens =
		text.match(/"[^"]*"|\S+/g) ?? [];

	return tokens.map(token => {
		if (
			token.startsWith('"') &&
			token.endsWith('"')
		) {
			return token.slice(1, -1);
		}

		return token;
	});
}


function getDimensions(map) {
	const linesArray =
		map.collisions.tiles.split("\n");

	let longest = 0;

	for (const line of linesArray) {
		if (line.length > longest) {
			longest = line.length;
		}
	}

	return {
		x: longest,
		y: linesArray.length
	};
}


function getTileData(x, y, collisionData) {
	const mapArray =
		collisionData.tiles.split("\n");

	if (
		y < 0 ||
		y >= mapArray.length
	) {
		return null;
	}

	if (
		x < 0 ||
		x >= mapArray[y].length
	) {
		return null;
	}

	const tile = mapArray[y][x];

	return collisionData.definitions[tile] ?? null;
}


function findFirst(char, mapText) {
	const lines = mapText.split("\n");

	for (let y = 0; y < lines.length; y++) {
		const line = lines[y];

		for (let x = 0; x < line.length; x++) {
			if (line[x] === char) {
				return {
					x: x,
					y: y
				};
			}
		}
	}

	return null;
}


function spawnToChar(collisionData, spawnName) {
	for (
		const [key, value]
		of Object.entries(collisionData.definitions)
	) {
		if (
			value[0] === "spawn" &&
			value[1] === spawnName
		) {
			return key;
		}
	}

	return null;
}