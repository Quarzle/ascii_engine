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
║   │      │      ├────┤     │                       ║
║   │             │    │     │                       ║
║   ├─  ──────────┴╴ ╶─┴╴ ┐                          ║
║   │                     ├──┘                       ║
║   └─────────────────────┘                          ║
║                                                    ║
║                                                    ║
║                                                    ║
║                                                    ║
║                                                    ║
╚════════════════════════════════════════════════════╝
`,
		collision: `
######################################################
#                                                    #
#   ###########  ##    #######                       #
#   #      #      ######     #                       #
#   #             #    #     #                       #
#   ##  ############ #### #                          #
#   #                     ####                       #
#   #######################                          #
#                                                    #
#                                                    #
#                                                    #
#                                                    #
#                                                    #
######################################################
`,
	}
};

function getDimensions(mapName) {
	let linesArray = maps[mapName].collision.split("\n");
	let longest = 0;

	for (const line of linesArray) {
		if (line.length > longest) {
			longest = line.length;
		}
	}

	return {
		x: longest,
		y: (linesArray.length - 2) // 2 is so the maps can all stay aligned while being created
	};
}