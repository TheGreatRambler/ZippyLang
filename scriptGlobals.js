module.exports = {
	// Simple binary script format that is an intermediary to compiling to emulator specific files
	// It is an array of arraybuffers
	INTERMEDIARY_INPUTS: [],
	// Controller type for convinience
	CONTROLLER_TYPE: "",
	// Includes joystick values
	CURRENT_KEYS: {
		A: [false, false],
		B: [false, false],
		X: [false, false],
		Y: [false, false],
		PLUS: [false, false],
		MINUS: [false, false],
		HOME: [false, false],
		CAPTURE: [false, false],
		DDOWN: [false, false],
		DLEFT: [false, false],
		DRIGHT: [false, false],
		DUP: [false, false],
		ZL: [false, false],
		ZR: [false, false],
		L: [false, false],
		R: [false, false],
		RSTICK: [false, false], // Pressing on stick
		LSTICK: [false, false],
		LANGLE: [0, false], // LS is the data
		LPOW: [0, false],
		RANGLE: [0, false], // RS is the data
		RPOW: [0, false],
		AX: [0, false], // ACC is the data
		AY: [0, false],
		AZ: [0, false],
		G1: [0, false], // GYR is the data
		G2: [0, false],
		G3: [0, false],
	},
	CURRENT_FRAME: 0, // Incremented every frame
	ANGLE_TYPE: 0, // 0 is degrees, 1 is radians
	METADATA: {
		// Authors of the TAS
		AUTHORS: [],
		// The video standard (either PAL or NTSC)
		VIDEO_STANDARD: "",
		// Can only be set, not appended
		COMMENTS: "",
		_CURRENT_SUBTITLE: {
			text: "",
			startFrame: 0,
			length: 0,
			x: 0,
			y: 0,
			// Color is in the format #RRGGBBAA or #RGBA
			// https://css-tricks.com/8-digit-hex-codes/
			// This default is black
			color: "#000000FF",
			fontSize: 0
		},
		ALL_SUBTITLES: [],
		// The emu version, optional mostly
		EMU_VERSION: ""
	},
	// Preferred export target
	PREFERRED_EXPORT: "",
	// Wether this target is required for the TAS
	// Default is no for extra portability
	PREFERRED_EXPORT_REQUIRED: false,
};

/*
The first value in the array is the value of the key, the second is wether it was set, as opposed to just for one frame

Keys are chosen to align with a Switch Pro Controller (Meant to be easily transferred to all other controller types)
*/