const fs = require("fs");
const sharp = require("sharp");

const degrees = [0, 90, 180, 270];
const sizes = [16, 32, 320];
const exportDir = "icons";
const refIcon = sharp("rocket.png", {});

if (!fs.existsSync(exportDir)) {
	fs.mkdirSync(exportDir);
}

(async () => {
	for (const deg of degrees) {
		for (const size of sizes) {
			const filename = "rocket-" + deg + "deg-" + size + "px.png";

			await refIcon
				.clone()
				.rotate(deg)
				.resize(size, size, {
					kernel: "lanczos3",
				})
				.toFile(exportDir + "/" + filename);
		}
	}
})();
