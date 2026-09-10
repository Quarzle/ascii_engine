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

const maps = {
	"demo": {
		display: `
╔════════════════════════════════════════════════════╗
║                                                    ║
║   ┌──────┬───  ─┐    ┌─────┐                       ║
║   │ !    │      ├────┤     │                        
║   │             │   O│     │                        
║   ├─  ──────────┴╴ ╶─┴╴ ┐                           
║   │                     ├──┘                       ║
║   └─────────────────────┘     !                    ║
║                                                    ║
║                                                    ║
║                                                    ║
║                                                    ║
║                                                    ║
╚════════════════════════════════════════════════════╝
`,
		collisions: {
			tiles: `
######################################################
#                                                    #
#   ###########  ##    #######                       #
#   # i    #      ######     #                       >
#   #             #   O#     #                      2>
#   ##  ############ #### #                          >
#   #                     ####                       #
#   #######################     !                    #
#                                                    #
#                        1                           #
#                                                    #
#                                                    #
#                                                    #
######################################################
`,
			definitions: {
				"#": ["wall"],
				">": ["transition", "castle", "left"],
				"1": ["spawn", "central"],
				"2": ["spawn", "right"],
				"i": ["sign", "You are inside the walls."],
				"!": ["sign", "This is a sign"]
			}
		}
	},
	"castle": {
		display: `
                  P                  P         P       
                 /\\     P      P    /\\        /\\       
                /__\\   /\\_____/\\   /__\\      /__\\      
╔═══════════════|. |_=_|. . . .|_=_=_=_=_=_=_|. |═════╗
║          ╲    |. |. .|  ___  |. . . . . . .|. |    _║
            ╲   |. |   | |   | |             |. |   ╱ ║
             ╲__|__|___|_|   |_|_____________|__|__╱  ║
                 #####           ###     ###          ║
║                    #           #                    ║
║###                 #           #                    ║
║   ###                                               ║
║      ##                        #                    ║
║        #########  ##############                    ║
║        #           #           #                    ║
║        #           #           #                    ║
╚═════════════════════════════════════════════════════╝
`,
		collisions: {
			tiles: `
                  P                  P         P
                 /\\     P      P    /\\        /\\
                /__\\   /\\_____/\\   /__\\      /__\\
################|. |_=_|. . . .|_=_=_=_=_=_=_|. |═════#
#          #    |. |. .| ##### |. . . . . . .|. |    ##
<           #   |. |   | #CCC# |             |. |   # #
<1           ######|_##### 2 #############__########  #
<                #####           ###     ###          #
#                    #           #                    #
####                 #           #                    #
#   ###                                               #
#      ##                        #                    #
#        #########  ##############                    #
#        #           #           #                    #
#        #           #           #                    #
#######################################################
`,
			definitions: {
				"#": ["wall"],
				"C": ["transition", "demo", "central"],
				"1": ["spawn", "left"],
				"2": ["spawn", "gate"],
				"<": ["transition", "demo", "right"]
			}
		}
	}
};

function getDimensions(mapName) {
	const linesArray = maps[mapName].collisions.tiles.split("\n");
	let longest = 0;

	for (const line of linesArray) {
		if (line.length > longest) {
			longest = line.length;
		}
	}

	return {
		x: longest,
		y: linesArray.length - 2
	};
}


function getTileData(x, y, collisionData) {
	const mapArray = collisionData.tiles.split("\n");

	if (y < 0 || y >= mapArray.length) return null;
	if (x < 0 || x >= mapArray[y].length) return null;

	const tile = mapArray[y][x];

	return collisionData.definitions[tile] ?? null;
}


function findFirst(char, mapText) {	
	const lines = mapText.split("\n");

	for (let y = 0; y < lines.length; y++) {
		const line = lines[y];
		for (let x = 0; x < line.length; x++) {
			const mapChar = line[x];
			if (mapChar === char) {
				return {
					x: x,
					y: y
				}
			}
		}
	}

	return null;
}

function spawnToChar(collisionData, spawnName) {
	for (const [key, value] of Object.entries(collisionData.definitions)) {
		if (value[0] === "spawn") {
			if (value[1] === spawnName) {
				return key;
			}
		}
	}

	return null;
}