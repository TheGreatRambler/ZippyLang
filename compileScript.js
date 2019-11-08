const fs = require("fs");
const builtins = require("./compileBuiltin");

function compileScript(file) {
	var contents = fs.readFileSync(file, "utf8");
	var allLines = contents.split(/\r?\n/);
	var returnedText = "";
	allLines.forEach(function(line) {
		// Replace compiles if need be
		line = builtins.replaceAllCompiles(line);
		// Add to returnedText
		returnedText += "\n" + line;
	});
	return returnedText;
}

module.exports = compileScript;