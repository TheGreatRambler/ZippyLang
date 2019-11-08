function replaceFOR(line) {
	// Match REPEAT line
	var match = line.match(/REPEAT\([^\)]*\)/g);
	if (match) {
		var text = match[0];
		// Returns the inner portion
		var innerText = text.slice(7, -1);
		var newForLoop = "for (var _ = 0; _ < " + innerText + "; _++)";
		// Set the new line
		return line.replace(text, newForLoop);
	} else {
    	return line;
  	}
}

function replaceInput(line) {
	const INPUT_LINE_MATCHER = /^[\s]*\]/g; // Hope it's good
	// It does match the ']', so hope nobody hates it
	var match = line.match(INPUT_LINE_MATCHER);
	if (match) {
		// Remove whitespace
		var text = line.match(/\][\S\s]*/g)[0].substr(1).trim();
		// Because it uses backticks, this supports the ${} syntax for including variables
		return "Zippy._PARSE_INPUT_LINE(`" + text + "`);";
	} else {
		return line;
	}
}

function replaceAllCompiles(line) {
	// Replaces FOR if need be
	line = replaceFOR(line);
	line = replaceInput(line);
	return line;
}

module.exports.replaceAllCompiles = replaceAllCompiles;