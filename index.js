#!/usr/bin/env node
// That line is needed to allow this to act as a cli program

const fs = require("fs");
const getopts = require("getopts");
const vm = require("vm");
const runInVm = require("./runInVm");
const compileScript = require("./compileScript");
const bitwise = require("bitwise");
const path = require("path");

var TEST_ARGS = ["-c", "SwitchPro", "test.zpy", "-e", "switch"];

// Will be process.argv.slice(2) in production
var args = getopts(TEST_ARGS, {
	alias: {
		help: "h",
		controller: "c",
		["export"]: "e", // Export is a reserved token apparently
		runtimes: "r"
	},
	string: ["controller", "export", "runtimes"],
	boolean: ["help"],
	default: {
		controller: "SwitchPro",
		// Export purposely not specified so the movie can choose itself
		//["export"]: "switch",
		runtimes: ""
	}
});

// _ represents unparsed arguments, filenames in this case
var filesToParse = args._ || ["index.zpy"];

filesToParse.forEach(function(file) {
	// This does all the heavy lifting
	var compiledScript = runInVm.start({
		scriptName: file,
		args: args
	});
	// Buffer has been recieved
	// Write in this directory with the name of the file
	var fileName = __dirname + path.sep + path.basename(file, path.extname(file)) + "." + compiledScript.extension;
	// Finally, write the file
	// Because this is a buffer, encoding is ignored
	fs.writeFileSync(fileName, compiledScript.buf);
});