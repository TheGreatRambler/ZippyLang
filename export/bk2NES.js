class bizhawkNES {
	constructor() {
		this.preferredMapping = "NES";
		this.extension = "bk2";
		this.subtitles = [];
	}

	setComments(comments) {
		// Add comments so they can be used later
		this.comments = comments;
	}

	addSubtitle(subtitle) {
		// Alpha is in wrong place (RGBA), so needs to be moved to ARGB
		// Also need to disregard #, so boot up everything by 1
		var actualColorText = colorText.substring(7, 9) + colorText.substring(1, 7);
		var text = `subtitle ${subtitle.startFrame} ${subtitle.x} ${subtitle.y} ${subtitle.length} ${actualColorText}`;
		this.subtitles.push(text);
	}
}

module.exports = bizhawkNES;