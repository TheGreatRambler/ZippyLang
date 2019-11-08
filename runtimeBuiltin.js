const compileScript = require("./compileScript");
const vm = require("vm");
const controllerMappings = require("./controllerMappings");
const inputBufferPacking = require("./inputBufferPacking");
const angleFuncs = require("radians");
const colorString = require("color-string");
const requireDir = require("require-dir");

// Get all extra runtimes
var extraRuntimeGlobals = requireDir("./additionalRuntimeGlobals", {
	recurse: true
});

var allBuiltins = [];
// This allows runtimes to extend the global vars
var allGlobalVars = require("./scriptGlobals");

function addBuiltin(func, zippyContext) {
	// Generic way to add ANY function as a builtin
	// Add builtins themselves
	zippyContext[func.name + "_"] = func;
	// This is an ugly hack to get the global context to mirror that of the vm
	// IMPORT is special in that it gets the full context
	var context = func.name === "IMPORT" ? "___THIS_GLOBAL___" : "this";
	var codeToAdd = `
		Zippy.${func.name} = function() {
			// Need to include the context of the function
			Zippy.${func.name}_(${context}, ...arguments);
		};
	`;
	return codeToAdd;
}

function addAdditionalRuntime(name, zippyContext) {
	var runtime = extraRuntimeGlobals[name];
	if (runtime) {
		// These globals exist, add them to the builtins
		var combinedFuncs = "";
		runtime.funcs.forEach(function(func) {
			// Add these functions to the sandbox the same way it was done for the others
			combinedFuncs += addBuiltin(func, zippyContext);
		});
		// Add globals from runtime
		// Not returned to the VM but set to an object that the VM has a reference to
		allGlobalVars = Object.assign(allGlobalVars, runtime.variables);

		// Return to vm
		return combinedFuncs;
	}
	// Return empty string if the runtime doesnt exist
	return "";
}

function SET_PREFERRED_EXPORT(c, preferredExport) {
	// Set the export target that the TAS file will choose if none is specified
	c.PREFERRED_EXPORT = preferredExport;
}
allBuiltins.push(SET_PREFERRED_EXPORT);

function SET_PREFERRED_EXPORT_REQUIRED(c, wetherRequired) {
	// Set wether the preffered export is actually required and will do bad things if it is not chosen
	c.PREFERRED_EXPORT_REQUIRED = wetherRequired;
}
allBuiltins.push(SET_PREFERRED_EXPORT_REQUIRED);

function READ_FILE(c, filePath, encoding) {
	// Return the file with the specified encoding, if needed
	// If no encoding, the variable will be undefined and everything will be fine
	return c.fs.readFileSync(filePath, encoding);
}
allBuiltins.push(READ_FILE);

function SET_VIDEO_STANDARD(c, type) {
	// Should be either PAL or NTSC, raise error if not
	c.METADATA.VIDEO_STANDARD = type;
}
allBuiltins.push(SET_VIDEO_STANDARD);

function IMPORT(c, scriptName) {
	// TODO this doesnt work
	// IMPORT is special in that it's context is completely global, not just the API
	// Compile this script
	var script = new vm.Script(compileScript(scriptName), {
		filename: scriptName
	});

	vm.createContext(c);
	//console.log(c);

	// Run in the context of the script (hopefully contextifying it doesn't ruin anything down the road)
	script.runInContext(c);
}
allBuiltins.push(IMPORT);

function _TURN_OFF_IF_NOT_TOGGLED(c, keyName) {
	var key = c.CURRENT_KEYS[keyName][0];
	var isToggled = c.CURRENT_KEYS[keyName][1];

	if (!isToggled) {
		// Whenever the keys aren't toggled, they are cleared automatically
		if (typeof key === "number") {
			// Set to zero because it is a number value
			// Needs to be full path to keep reference
			c.CURRENT_KEYS[keyName][0] = 0;
		} else {
			c.CURRENT_KEYS[keyName][0] = false;
		}
	}
}
allBuiltins.push(_TURN_OFF_IF_NOT_TOGGLED);

function _OUTPUT_THIS_FRAME(c) {
	// Send data to globals
	c.INTERMEDIARY_INPUTS.push(inputBufferPacking.createBuffer(c));
	// Loop through key object
	Object.keys(c.CURRENT_KEYS).forEach(function(key) {
		// Turn off if it is not toggled now
		_TURN_OFF_IF_NOT_TOGGLED(c, key);
	});
	// Finished. Increment frame
	c.CURRENT_FRAME++;
}
allBuiltins.push(_OUTPUT_THIS_FRAME);

function PRINT(c, text) {
	console.log(text);
}
allBuiltins.push(PRINT);

function _PARSE_INPUT_LINE(c, line) {
	// Determine if controller type is invalid and raise an error accordingly
	if (!controllerMappings[c.CONTROLLER_TYPE]) {
		console.log(c.CONTROLLER_TYPE);
		// TODO raise error
		return;
	}

	// Trim whitespace and then split on whitespace
	var inputs = line.trim().split(/\s+/);
	inputs.forEach(function(input) {
		var toggle = 0; // 0 means do nothing
		if (input.charAt(0) === "+") {
			// Toggle ON
			toggle = 1;
			// Remove +
			input = input.substr(1);
		} else if (input.charAt(0) === "-") {
			// Toggle OFF
			toggle = 2;
			// Remove -
			input = input.substr(1);
		}

		var newKey = controllerMappings[c.CONTROLLER_TYPE][input];
		if (newKey) {
			// This key is remapped by this controller
			c.CURRENT_KEYS[newKey][0] = true;
			if (toggle === 1) {
				c.CURRENT_KEYS[newKey][1] = true;
			} else if (toggle === 2) {
				c.CURRENT_KEYS[newKey][1] = false;
			}
		} else {
			if (c.CURRENT_KEYS[input]) {
				// This key exists and needs to be turned on
				c.CURRENT_KEYS[input][0] = true;
				if (toggle === 1) {
					c.CURRENT_KEYS[input][1] = true;
				} else if (toggle === 2) {
					c.CURRENT_KEYS[input][1] = false;
				}
			} else {
				// This is likely an analog stick thing
				// If it isn't... oh well!
				var i = c.CURRENT_KEYS;
				if (input.includes("LS(")) {
					var data = input.slice(3, -1).split(",");
					var chosenAngle = 0;
					if (c.ANGLE_TYPE === 1) {
						// Convert to degrees before proceeding
						// 90 is to preserve as much accuracy as possible because rounding is done
						chosenAngle = angleFuncs.radians(parseInt(data[0])) * 90;
					} else {
						// This is in degrees, but extra steps need to be made to maximise accuracy
						chosenAngle = parseInt(data[0]) * 90;
					}
					// Fastest way to round
					i.LANGLE[0] = chosenAngle >> 0;
					i.LPOW[0] = parseInt(data[1]);
					if (toggle === 1) {
						i.LANGLE[1] = true;
						i.LPOW[1] = true;
					} else if (toggle === 2) {
						i.LANGLE[1] = false;
						i.LPOW[1] = false;
					}
				} else if (input.includes("RS(")) {
					var data = input.slice(3, -1).split(",");
					var chosenAngle = 0;
					if (c.ANGLE_TYPE === 1) {
						// Convert to degrees before proceeding
						// 90 is to preserve as much accuracy as possible because rounding is done
						chosenAngle = angleFuncs.radians(parseInt(data[0])) * 90;
					} else {
						// This is in degrees, but extra steps need to be made to maximise accuracy
						chosenAngle = parseInt(data[0]) * 90;
					}
					// Fastest way to round
					i.RANGLE[0] = chosenAngle >> 0;
					i.RPOW[0] = parseInt(data[1]);
					if (toggle === 1) {
						i.RANGLE[1] = true;
						i.RPOW[1] = true;
					} else if (toggle === 2) {
						i.RANGLE[1] = false;
						i.RPOW[1] = false;
					}
				} else if (input.includes("ACC(")) {
					var data = input.slice(4, -1).split(",")
					i.AX[0] = parseInt(data[0]);
					i.AY[0] = parseInt(data[1]);
					i.AZ[0] = parseInt(data[2]);
					if (toggle === 1) {
						i.AX[1] = true;
						i.AY[1] = true;
						i.AZ[1] = true;
					} else if (toggle === 2) {
						i.AX[1] = false;
						i.AY[1] = false;
						i.AZ[1] = false;
					}
				} else if (input.includes("GYR(")) {
					var data = input.slice(4, -1).split(",");
					i.G1[0] = parseInt(data[0]);
					i.G2[0] = parseInt(data[1]);
					i.G3[0] = parseInt(data[2]);
					if (toggle === 1) {
						i.G1[1] = true;
						i.G2[1] = true;
						i.G3[1] = true;
					} else if (toggle === 2) {
						i.G1[1] = false;
						i.G2[1] = false;
						i.G3[1] = false;
					}
				} else {
					// This data is not valid, let the user know
				}
			}
		}
	});
	// Output this frame to the system
	_OUTPUT_THIS_FRAME(c);
}
allBuiltins.push(_PARSE_INPUT_LINE);

function BLANK(c, numOfBlank) {
	for (var i = 0; i < numOfBlank; i++) {
		// Output this frame without any arguments
		// Change no keys
		// This does mean, however, that toggled keys are still set
		_OUTPUT_THIS_FRAME(c);
	}
}
allBuiltins.push(BLANK);

function SET_COMMENTS(c, comments) {
	c.METADATA.COMMENTS = comments;
}
allBuiltins.push(SET_COMMENTS);

function START_SUBTITLE(c, text, x, y, color, fontSize) {
	var subtitle = c.METADATA._CURRENT_SUBTITLE;

	// Guarenteed to exist
	subtitle.text = text;

	if (x !== undefined) {
		subtitle.x = x;
	} else {
		subtitle.x = 0;
	}

	if (y !== undefined) {
		subtitle.y = y;
	} else {
		subtitle.y = 0;
	}

	if (color !== undefined) {
		// Get color (supports all css valid color types)
		subtitle.color = colorString.to.hex(colorString.get.rgb(color));
	} else {
		subtitle.color = "#000000FF";
	}

	if (fontSize !== undefined) {
		// I don't think any emulator actually supports this, but I'm idealistic
		subtitle.fontSize = fontSize;
	} else {
		subtitle.fontSize = 0;
	}

	// Set first frame
	subtitle.startFrame = c.CURRENT_FRAME;

	// Subtitle will get added later on
}
allBuiltins.push(START_SUBTITLE);

function END_SUBTITLE(c) {
	// End current subtitle
	var subtitle = c.METADATA._CURRENT_SUBTITLE;
	subtitle.length = c.CURRENT_FRAME - subtitle.startFrame;

	// Doesnt do a shallow copy to take advantage of V8 optimizations
	var template = {
		text: subtitle.text,
		startFrame: subtitle.startFrame,
		length: subtitle.length,
		x: subtitle.x,
		y: subtitle.y,
		color: subtitle.color,
		fontSize: subtitle.fontSize
	};
	c.METADATA.ALL_SUBTITLES.push(template);
	// No data is cleared because it will be overwritten later anyway
}
allBuiltins.push(END_SUBTITLE);

function READ_BIN_FILE(c, filepath) {
	// Get binary file (mostly for getting things like savestates)
	// Returns a buffer
	return fs.readFileSync(filepath);
}
allBuiltins.push(READ_BIN_FILE);

// Dependencies of the builtins
// Might not need to be populated at all
module.exports.dependencies = [];
// All allBuiltins
module.exports.builtins = allBuiltins;
module.exports.globalVars = allGlobalVars;
module.exports.addBuiltin = addBuiltin;
module.exports.addAdditionalRuntime = addAdditionalRuntime;