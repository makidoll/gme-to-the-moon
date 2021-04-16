import Pbf from "pbf";
import { yaticker } from "./yaticker";

const isChrome = window.browser == null;
if (window.browser == null) {
	window.browser = (window as any).chrome;
}

if (!isChrome) {
	browser.browserAction.setBadgeTextColor({
		color: "#fff",
	});
}

let lastText = "";
const setText = (text: string) => {
	if (lastText == text) return;
	lastText = text;
	browser.browserAction.setBadgeText({
		text,
	});
};

let lastColor = "";
const setColor = (color: string) => {
	if (lastColor == color) return;
	lastColor = color;
	browser.browserAction.setBadgeBackgroundColor({
		color,
	});
};

let lastIconUp: boolean = null;
const setIconUp = (up: boolean) => {
	if (lastIconUp == up) return;
	lastIconUp = up;

	// looks better flipped in firefox
	const deg = isChrome ? (up ? 0 : 180) : up ? 270 : 90;

	browser.browserAction.setIcon({
		path: {
			"16": "icons/rocket-" + deg + "deg-16px.png",
			"32": "icons/rocket-" + deg + "deg-32px.png",
			"320": "icons/rocket-" + deg + "deg-320px.png",
		},
	});
};

const makeLoading = () => {
	setText("...");
	setColor("#607d8b");
	setIconUp(true);
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
		setIconUp(tendieManComing);
	};

	socket.onclose = () => {
		makeLoading();
		setTimeout(() => {
			connectToYahoo();
		}, 5000);
	};
};

makeLoading();
connectToYahoo();
