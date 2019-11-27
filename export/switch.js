// NX-TAS format
// Export format uses classes

const radianFuncs = require("radians");

class NxTASFileCreator {
	constructor() {
		this.preferredMapping = "SwitchPro";
		this.extension = "txt";
		this.currentFrame = 0;

		this.lines = [];

		this.keys = [];
	}

	convertButtonName(buttonName) {
		var conversions = {
			A: "KEY_A",
			B: "KEY_B",
			X: "KEY_X",
			Y: "KEY_Y",
			PLUS: "KEY_PLUS",
			MINUS: "KEY_MINUS",
			HOME: false, // Doesn't exist right now???
			CAPTURE: false, // Same deal
			DDOWN: "KEY_DDOWN",
			DLEFT: "KEY_DLEFT",
			DRIGHT: "KEY_DRIGHT",
			DUP: "KEY_DUP",
			ZL: "KEY_ZL",
			ZR: "KEY_ZR",
			L: "KEY_L",
			R: "KEY_R",
			RSTICK: "KEY_RSTICK", // Pressing on stick
			LSTICK: "KEY_LSTICK",
		};
		return conversions[buttonName];
	}

	addFrame(keys) {
		var allPressedKeys = [];
		var self = this;
		// Cache for later use
		if (this.keys.length === 0) {
			this.keys = Object.keys(keys);
		}
		this.keys.forEach(function(key) {
			if (typeof keys[key] !== "number") {
				// This is a button rather than a joystick value or otherwise
				if (keys[key]) {
					// This button is pressed
					var conversion = self.convertButtonName(key);
					if (conversion) {
						// This key has representation
						// Excludes home and capture button currently
						allPressedKeys.push(conversion);
					}
				}
			}
		});
		var keyString;
		if (allPressedKeys.length === 0) {
			keyString = "NONE";
		} else {
			keyString = allPressedKeys.join(";");
		}

		// Need to convert to x y coordinates (TODO)
		// Radius recieved from keys is 0 to 100, but it needs to be 0 to 30000
		// All the values need to be rounded with `val >> 0`
		var rValueLeft = keys.LPOW * 300;
		var thetaValueLeft = radianFuncs.degrees(keys.LANGLE / 90);
		var coordinatesLeft = {
			x: (rValueLeft * Math.cos(thetaValueLeft)) >> 0,
			y: (rValueLeft * Math.sin(thetaValueLeft)) >> 0
		}
		var rValueRight = keys.RPOW * 300;
		var thetaValueRight = radianFuncs.degrees(keys.RANGLE / 90);
		var coordinatesRight = {
			x: (rValueRight * Math.cos(thetaValueRight)) >> 0,
			y: (rValueRight * Math.sin(thetaValueRight)) >> 0
		}

		var fileLine = `${this.currentFrame} ${keyString} ${coordinatesLeft.x};${coordinatesLeft.y} ${coordinatesRight.x};${coordinatesRight.y}`;

		this.lines.push(fileLine);

		this.currentFrame++;
	}

	getBuffer() {
		// Simply join all lines and create the buffer
		return Buffer.from(this.lines.join("\n"), "ascii");
	}
}

module.exports = NxTASFileCreator;