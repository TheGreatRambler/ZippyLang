// Bizhawk specific runtime globals

var functions = [];
var globalVars = {
	// Optional savestate
	BIZHAWK_CORE_SAVESTATE: undefined,
	BIZHAWK_SYNC_SETTINGS: {}
};

function BIZHAWK_SET_SAVESTATE(c, savestatePath) {
	// It's just a binary, so no encoding
	c.BIZHAWK_CORE_SAVESTATE = c.READ_FILE(savestatePath);
}

function BIZHAWK_SET_SYNC_SETTINGS(c, syncSettingsJson) {
	// Load sync settings as an object, or JSON
	c.BIZHAWK_SYNC_SETTINGS = syncSettingsJson;
}

module.exports.funcs = functions;
module.exports.variables = globalVars;