const runtimeBuiltins = require("./runtimeBuiltin");
const compileScript = require("./compileScript");
const vm = require("vm");
const getExportedFile = require("./turnIntoTASFile");

function start(data) {
	var code = compileScript(data.scriptName);
	// Use globals from the runtime builtins
	// They will be extended by the additional runtimes
	// Sandbox actually only has one object that accesses outside functions to not pollute the global environment
	var sandbox = runtimeBuiltins.globalVars
	// Contextify the sandbox
	vm.createContext(sandbox);
	// JS is being dumb and not exposing the `global` var
	// Set correct controller type for system
	sandbox.CONTROLLER_TYPE = data.args.controller;
	// Dependencies currently write to the global context for now
	runtimeBuiltins.dependencies.forEach(function(dep) {
		// Add all required dependencies
		if (dep.charAt(0) === ".") {
			// Local file
			sandbox[dep.substr(2)] = require(dep);
		} else {
			// global
			sandbox[dep] = require(dep);
		}
	});

	// All the funcs to be included are in the same Zippy namespace
	var functionStrings = "";

	runtimeBuiltins.builtins.forEach(function(builtin) {
		var codeToAdd = runtimeBuiltins.addBuiltin(builtin, sandbox);
		
		functionStrings += codeToAdd;
	});
	
	// Add additional runtimes if needed
	if (data.args.runtimes.length !== 0) {
		// There are actually some runtimes to load
		data.args.runtimes.split(",").forEach(function(runtime) {
			var codeToAdd = runtimeBuiltins.addAdditionalRuntime(runtime, sandbox);
			// As before, load it in
			functionStrings += codeToAdd;
		});
	}

	// Put all these functions BEFORE the main code
	// Probably breaks V8 optimization
	code = functionStrings + code;

	// Create a script object so that the line number is correct in stack traces
	var actualLineStart = functionStrings.split("\n").length * -1;
	var script = new vm.Script(code, {
		// Filename for stack traces
		filename: data.scriptName,
		// Beginning line number so built in funcs are not included
		lineOffset: actualLineStart
	});
	// Run (May take forever, should probably be async)
	script.runInContext(sandbox);
	// Now that the intermediary units have been obtained, the script can convert to the needed export type
	var file = getExportedFile(sandbox.INTERMEDIARY_INPUTS, data.args["export"], sandbox);

	// Return buffer, finally
	return file;
}

module.exports.start = start;