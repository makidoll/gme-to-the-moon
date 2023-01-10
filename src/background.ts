import Pbf from "pbf";
import { yaticker } from "./yaticker";
import browser from "webextension-polyfill";

import rocket0deg16px from "./icons/rocket-0deg-16px.png";
import rocket0deg32px from "./icons/rocket-0deg-32px.png";
import rocket0deg320px from "./icons/rocket-0deg-320px.png";
import rocket90deg16px from "./icons/rocket-90deg-16px.png";
import rocket90deg32px from "./icons/rocket-90deg-32px.png";
import rocket90deg320px from "./icons/rocket-90deg-320px.png";
import rocket180deg16px from "./icons/rocket-180deg-16px.png";
import rocket180deg32px from "./icons/rocket-180deg-32px.png";
import rocket180deg320px from "./icons/rocket-180deg-320px.png";
import rocket270deg16px from "./icons/rocket-270deg-16px.png";
import rocket270deg32px from "./icons/rocket-270deg-32px.png";
import rocket270deg320px from "./icons/rocket-270deg-320px.png";

const rocketIcons = {
	"0": {
		"16": rocket0deg16px,
		"32": rocket0deg32px,
		"320": rocket0deg320px,
	},
	"90": {
		"16": rocket90deg16px,
		"32": rocket90deg32px,
		"320": rocket90deg320px,
	},
	"180": {
		"16": rocket180deg16px,
		"32": rocket180deg32px,
		"320": rocket180deg320px,
	},
	"270": {
		"16": rocket270deg16px,
		"32": rocket270deg32px,
		"320": rocket270deg320px,
	},
};

const browserAction = browser.action ?? browser.browserAction;

const isFirefox = browser.runtime
	.getManifest()
	.icons?.["16"].startsWith("moz-extension://");

// doesn't exist anymore
// browserAction.setBadgeTextColor({
// 	color: "#fff",
// });

let lastText = "";
const setText = (text: string) => {
	if (lastText == text) return;
	lastText = text;
	browserAction.setBadgeText({
		text,
	});
};

let lastColor = "";
const setColor = (color: string) => {
	if (lastColor == color) return;
	lastColor = color;
	browserAction.setBadgeBackgroundColor({
		color,
	});
};

let lastIconUp: boolean | null = null;
const setIconUp = (up: boolean) => {
	if (lastIconUp == up) return;
	lastIconUp = up;

	// looks better flipped in firefox
	const deg = isFirefox ? (up ? 270 : 90) : up ? 0 : 180;
	// const path = "../icons/rocket-" + deg + "deg-";

	browserAction.setIcon({
		// path: {
		// 	"16": path + "16px.png",
		// 	"32": path + "32px.png",
		// 	"320": path + "320px.png",
		// },
		path: rocketIcons[deg],
	});
};

const makeLoading = () => {
	setText("...");
	setColor("#607d8b");
	setIconUp(true);
};

const formatNumber = (n: number) => {
	// return new Intl.NumberFormat("en-US", {
	// 	style: "currency",
	// 	currency: "USD",
	// })
	// 	.format(n)
	// 	.replace(/^\$/, "");
	// return n.toFixed(2);
	return String(Math.floor(n));
};

let lastPrice = 0;
const setPrice = (price: number) => {
	const tendieManComing = price >= lastPrice;
	lastPrice = price;

	setText(formatNumber(price));
	setColor(tendieManComing ? "#4caf50" : "#f44336");
	setIconUp(tendieManComing);
};

const updateWithCurrentPrice = async () => {
	const req = await fetch("https://finance.yahoo.com/quote/GME/");
	const html = await req.text();

	/*
	const matches = html.match(/root\.App\.main = ({[^]+?});\n/i);
	if (matches == null) return;
	if (matches.length < 2) return;

	const data = JSON.parse(matches[1]);
	const GME =
		data?.context?.dispatcher?.stores?.StreamDataStore?.quoteData?.GME;
	if (GME == null) return;

	const price = GME?.regularMarketPrice?.raw;
	if (price == null) return;
	*/

	const matches = html.match(
		/<fin-streamer[^]+?data-symbol=["']GME["'][^]+?>([^]+?)<\/fin-streamer>/i,
	);
	if (matches == null) return;
	if (matches.length < 2) return;

	const price = Number(matches[1]);
	if (Number.isNaN(price)) return;

	console.log("Manually fetched from Yahoo Finance");
	setPrice(price);
};

const connectToYahoo = () => {
	const socket = new WebSocket("wss://streamer.finance.yahoo.com");

	socket.onopen = () => {
		console.log("Connected to Yahoo Finance");
		socket.send(JSON.stringify({ subscribe: ["GME"] }));
	};

	socket.onmessage = event => {
		const raw = Uint8Array.from(atob(event.data), c => c.charCodeAt(0));
		const pbf = new Pbf(raw);
		const { id, price } = yaticker.read(pbf);
		if (id != "GME") return;
		setPrice(price);
	};

	socket.onclose = () => {
		console.log("Disconnected from Yahoo Finance");
		// makeLoading();
		updateWithCurrentPrice();
		setTimeout(() => {
			connectToYahoo();
		}, 5000);
	};
};

makeLoading();

updateWithCurrentPrice();

connectToYahoo();
