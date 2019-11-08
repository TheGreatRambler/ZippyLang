const requireDir = require("require-dir");
const bufferPacking = require("./inputBufferPacking");
const invertObject = require("lodash.invert");
const mappings = require("./controllerMappings");

// Get all export targets
var exportTargets = requireDir("./export", {
	recurse: true
});

function optionalVariables(exporter, fullContext) {
	// Set comments if needed
	if (exporter.setComments) {
		exporter.setComments(c.METADATA.COMMENTS);
	}

	if (exporter.addSubtitle) {
		fullContext.METADATA.ALL_SUBTITLES.forEach(function(subtitle) {
			exporter.addSubtitle(subtitle);
		});
	}
}

function createTAS(intermediary, exportTarget, fullContext) {
	// Returns a buffer with the file (even for text)
	// If the first char is _, it is a file to help other exporters, and is itself not an exporter
	if (!exportTarget) {
		// It was not specified, check to see if the movie has a preference
		// It will still be considered false even when there is no preferred, but this shouldnt be a problem
		exportTarget = fullContext.PREFERRED_EXPORT;
	} else {
		if (fullContext.PREFERRED_EXPORT) {
			// This TAS has a preference, if it is marked required and the chosen export does not match, raise error
			if (exportTarget !== fullContext.PREFERRED_EXPORT) {
				// TODO: Raise BIG error
				return;
			}
		}
	}


	if (exportTarget && exportTarget.charAt(0) !== "_" && exportTargets[exportTarget]) {
		// YAY we're in buisness
		// Create instance
		var exporter = new exportTargets[exportTarget]();
		// Allow the exporter to setup anything it needs
		if (exporter.setup) {
			exporter.setup();
		}
		// Add all optional variables (like savestate, comments, etc...)
		optionalVariables(exporter, fullContext);
		var preferredMapping = {};
		if (exporter.preferredMapping && mappings[exporter.preferredMapping]) {
			// Use this so that the script can refer to the buttons as it wishes
			preferredMapping = invertObject(mappings[exporter.preferredMapping]);
		}
		// Removes weird array notation that goes with the other
		var keys = bufferPacking.plainKeys;
		intermediary.forEach(function(frame) {
			// Create new buffer and pass to the program
			bufferPacking.readBuffer(keys, Buffer.from(new Uint8Array(frame)))
			// Use mappings for ease of use
			Object.keys(preferredMapping).forEach(function(key) {
				if (keys[key]) {
					// This mapping is correct
					keys[preferredMapping[key]] = keys[key];
					// No need to clear old values because the program just won't bother with them, they are either overwritten or are named contrary to the mapping
				}
			});
			// Make exporter aware of the updated values
			exporter.addFrame(keys)
		});
		// All inputs have been added, end
		if (exporter.finish) {
			exporter.finish();
		}
		// Return buffer (and extension) to finish up
		return {
			// Text extension by default is text
			extension: exporter.extension || "txt",
			buf: exporter.getBuffer()
		};

	} else {
		// This export target doesn't exist or there was none specified and there is no preferred from the TAS, TODO raise error
		return;
	}
}

// Only this function
module.exports = createTAS;