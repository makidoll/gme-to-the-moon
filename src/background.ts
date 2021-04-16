import Pbf from "pbf";
import { yaticker } from "./yaticker";

browser.browserAction.setBadgeTextColor({
	color: "#fff",
});

let lastText = "";
const setText = (text: string) => {
	if (lastText == text) return;
	browser.browserAction.setBadgeText({
		text,
	});
};

let lastColor = "";
const setColor = (color: string) => {
	if (lastColor == color) return;
	browser.browserAction.setBadgeBackgroundColor({
		color,
	});
};

let lastIconFilename = "";
const setIcon = (filename: string) => {
	if (lastIconFilename == filename) return;
	browser.browserAction.setIcon({
		path: "icons/" + filename,
	});
};

const connectToYahoo = () => {
	const socket = new WebSocket("wss://streamer.finance.yahoo.com");

	let lastPrice = 0;

	socket.onopen = () => {
		socket.send(JSON.stringify({ subscribe: ["GME"] }));
	};

	socket.onmessage = event => {
		const raw = Uint8Array.from(atob(event.data), c => c.charCodeAt(0));
		const pbf = new Pbf(raw);
		const { id, price } = yaticker.read(pbf);
		if (id != "GME") return;

		const tendieManComing = price >= lastPrice;
		lastPrice = price;

		setText(String(Math.floor(price)));
		setColor(tendieManComing ? "#4caf50" : "#f44336");
		setIcon(tendieManComing ? "rocket-up.png" : "rocket-down.png");
	};

	socket.onclose = () => {
		setText("");
		setIcon("rocket-up.png");
		setTimeout(() => {
			connectToYahoo();
		}, 5000);
	};
};

connectToYahoo();
