const bitwise = require("bitwise");

// Simple Plain Keys for use with decoding
var plainKeys = {
	A: false,
	B: false,
	X: false,
	Y: false,
	PLUS: false,
	MINUS: false,
	HOME: false,
	CAPTURE: false,
	DDOWN: false,
	DLEFT: false,
	DRIGHT: false,
	DUP: false,
	ZL: false,
	ZR: false,
	L: false,
	R: false,
	RSTICK: false, // Pressing on stick
	LSTICK: false,
	LANGLE: 0, // LS is the data
	LPOW: 0, // Max 100
	RANGLE: 0, // RS is the data
	RPOW: 0, // Max 100
	AX: 0, // ACC is the data
	AY: 0,
	AZ: 0,
	G1: 0, // GYR is the data
	G2: 0,
	G3: 0
};

function n(bool) {
	// Converts boolean to number
	return bool | 0;
}

function b(num) {
	// Converts number to boolean
	return !!num;
}

function createBuffer(context) {
	// Buffer to write to
	// Unsafe because all the bytes are written to anyway
	// 23 bytes is the size of all the bytes written
	var buf = Buffer.allocUnsafe(23);
	// Reads from context and returns a buffer
	var KEYS = context.CURRENT_KEYS;
	// Handwritten for speed
	var bits = [
		// First byte
		n(KEYS.A[0]),
		n(KEYS.B[0]),
		n(KEYS.X[0]),
		n(KEYS.Y[0]),
		n(KEYS.PLUS[0]),
		n(KEYS.MINUS[0]),
		n(KEYS.HOME[0]),
		n(KEYS.CAPTURE[0]),
		// Second byte
		n(KEYS.DDOWN[0]),
		n(KEYS.DLEFT[0]),
		n(KEYS.DRIGHT[0]),
		n(KEYS.DUP[0]),
		n(KEYS.ZL[0]),
		n(KEYS.ZR[0]),
		n(KEYS.L[0]),
		n(KEYS.R[0]),
		// Third byte
		n(KEYS.RSTICK[0]),
		n(KEYS.LSTICK[0]),
		0, // Unused, but needed to make full bytes
		0,
		0,
		0,
		0,
		0,
	];
	// Create buffer with just buttons
	var buttons = bitwise.buffer.create(bits);
	// Copy buttons into the buf
	buttons.copy(buf, 0, 0, 3);
	// Write accelerometer and joystick data
	buf.writeInt16LE(KEYS.LANGLE[0], 3);
	buf.writeInt16LE(KEYS.LPOW[0], 5);
	buf.writeInt16LE(KEYS.RANGLE[0], 7);
	buf.writeInt16LE(KEYS.RPOW[0], 9);
	buf.writeInt16LE(KEYS.AX[0], 11);
	buf.writeInt16LE(KEYS.AY[0], 13);
	buf.writeInt16LE(KEYS.AZ[0], 15);
	buf.writeInt16LE(KEYS.G1[0], 17);
	buf.writeInt16LE(KEYS.G2[0], 19);
	buf.writeInt16LE(KEYS.G3[0], 21);

	// Get arraybuffer of Buffer for easier storing
	// https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer/31394257#31394257
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function readBuffer(KEYS, buffer) {
	// Reads from buffer and sets appropriate values on context
	// 18 bits need to be read because 6 are unused
	var bits = bitwise.buffer.read(buffer, 0, 18);

	// All bits have to be converted to booleans
	KEYS.A = b(bits[0]);
	KEYS.B = b(bits[1]);
	KEYS.X = b(bits[2]);
	KEYS.Y = b(bits[3]);
	KEYS.PLUS = b(bits[4]);
	KEYS.MINUS = b(bits[5]);
	KEYS.HOME = b(bits[6]);
	KEYS.CAPTURE = b(bits[7]);
	// Second byte
	KEYS.DDOWN = b(bits[8]);
	KEYS.DLEFT = b(bits[9]);
	KEYS.DRIGHT = b(bits[10]);
	KEYS.DUP = b(bits[11]);
	KEYS.ZL = b(bits[12]);
	KEYS.ZR = b(bits[13]);
	KEYS.L = b(bits[14]);
	KEYS.R = b(bits[15]);
	// Third byte
	KEYS.RSTICK = b(bits[16]);
	KEYS.LSTICK = b(bits[17]);

	// Read numerical data now
	KEYS.LANGLE = buffer.readUInt16LE(3);
	KEYS.LPOW = buffer.readUInt16LE(5);
	KEYS.RANGLE = buffer.readUInt16LE(7);
	KEYS.RPOW = buffer.readUInt16LE(9);
	KEYS.AX = buffer.readUInt16LE(11);
	KEYS.AY = buffer.readUInt16LE(13);
	KEYS.AZ = buffer.readUInt16LE(15);
	KEYS.G1 = buffer.readUInt16LE(17);
	KEYS.G2 = buffer.readUInt16LE(19);
	KEYS.G3 = buffer.readUInt16LE(21);

	// No need to return, the passed object was just changed
}

module.exports.createBuffer = createBuffer;
module.exports.readBuffer = readBuffer;
module.exports.plainKeys = plainKeys;