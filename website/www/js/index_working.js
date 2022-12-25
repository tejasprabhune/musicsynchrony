var authorizeButton = document.getElementById("sync-card2-authorize-button");
var authorizeStatus = document.getElementById("sync-card2-status");
var syncAppleWrapper = document.getElementById("sync-apple-wrapper");

var card1UsernameText = document.getElementById("sync-card1-username-text");
var card1UsernameButton = document.getElementById(
	"sync-card1-username-button"
);
var card1UsernameInput = document.getElementById(
	"sync-card1-username-input");

// Spotify client id and secret from app page
const CLIENT_ID = "7f4fbec3e8b04e01bc4abafda3be80b0";
const CLIENT_SECRET = "b3f4203755634a938fa9c8cb51f92a49";

/*
	Below code kept for future purposes. Was unable to find Buffer.from
	equivalent in browser JavaScript so Spotify token is hardcoded (maybe bad
	practice). Apple token hardcoded from jwt.to with public token empty and
	private token from developer page.
 */

//const auth_token = Buffer.from(`${client_id}:${client_secret}`, 'utf-8')
//	.toString('base64');
const SPOTIFY_TOKEN =
	"N2Y0ZmJlYzNlOGIwNGUwMWJjNGFiYWZkYTNiZTgwYjA6YjNmNDIwMzc1NTYzNGE5MzhmYTlj"
	+ "OGNiNTFmOTJhNDk=";

const APPLE_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IkRXNjVQWk5XWDgifQ."
	+ "eyJpc3MiOiJONEZIOFZQOEtDIiwiaWF0IjoxNjU4ODcyOTIzLC"
	+ "JleHAiOjE2NjkwMDAwMDB9.DJV1pS_Z-cSAChqWXRTcc-GfnbA"
	+ "kfZr0UF_VQPvdx3UZMo7g-aXtJXvqW9fxO0mjSpqfNMsYEAJjX"
	+ "azh4v-whw";

/**
 * Authorizes Apple Music subscriber on click of "authorize" button.
 */
authorizeButton.addEventListener("click", async function () {
	await initMusicKit();
});

/**
 * Gets and displays playlist names on click of button or "enter" keypress.
 */
card1UsernameButton.addEventListener("click", getSpotifyPlaylistNames);
card1UsernameInput.addEventListener("keypress", function (e) {
	if (e.key === "Enter") {
		getSpotifyPlaylistNames();
	}
});

/**
 * Requests all public Spotify playlists of given user and creates object with
 * playlist name and playlist Spotify ID.
 * @param {string} userId Spotify ID of requested user
 * @returns Object of playlist names and Spotify IDs.
 */
async function getSpotifyPlaylists(userId) {

	// Hardcoded for ease of use
	if (userId === "tejas") {
		userId = "totalnotjunk";
	} else if (userId === "anvi") {
		userId = "jq0n4vl96bv76otjnoi08xjd3";
	}

	const token = await getSpotifyToken();
	const playlists = await fetch("https://api.spotify.com/v1/users/"
		+ userId + "/playlists", {
		method: "GET",
		headers: {
			Authorization: "Bearer " + token,
		},
	}
	);

	const playlistsJson = await playlists.json();

	let playlistsObj = {};
	for (let i = 0; i < playlistsJson["items"].length; i++) {
		playlistsObj[playlistsJson["items"][i]["name"]] =
			playlistsJson["items"][i]["id"];
	}
	return playlistsObj;
}

/**
 * Requests all Apple playlists of given authorized user and creates object 
 * with playlist name and playlist Apple ID.
 * @returns Object of playlist names and Apple Music IDs
 */
async function getApplePlaylists() {

	const music = await initMusicKit();
	const { data: result } = await music.api.music(
		"v1/me/library/playlists"
	);

	let playlistsJson = result.data;

	let playlistsObj = {};
	for (let i = 0; i < playlistsJson.length; i++) {
		playlistsObj[playlistsJson[i]['attributes']['name']]
			= playlistsJson[i]['id'];
	}

	return playlistsObj;
}

/**
 * "find playlists" button click handler. Gets all Spotify playlists and
 * generates an h1 button for each playlist with the name. Adds click event
 * handler for each h1 button to show selected playlist and sync to apple
 * button. Adds click event handler for sync to apple button.
 */
function getSpotifyPlaylistNames() {
	getSpotifyPlaylists(card1UsernameInput.value).then((playlistsObj) => {

		// Accesses wrapper div to add all playlist h1s into
		var contentWrapper = document.getElementById("playlist-wrapper");
		// Empties wrapper div
		contentWrapper.innerHTML = "";

		// Creates title h1 "playlists"
		var playlistTitle = createText("playlists")
		playlistTitle.classList.add("card-title");
		contentWrapper.appendChild(playlistTitle);

		// Creates h1 for each retrieved playlist and adds text and button
		// classes. Adds to wrapper div.
		for (var key of Object.keys(playlistsObj)) {
			var playlistH1 = createText(key);
			playlistH1.classList.add("card-text");
			playlistH1.classList.add("card-text-button");
			contentWrapper.appendChild(playlistH1);
		}

		// Queries for every element with card-text-button class (only these
		// h1s) and creates an event listener for each of those h1s.
		document.querySelectorAll(".card-text-button").forEach((item) => {
			item.addEventListener("click", (event) => {

				// Empties wrapper div
				contentWrapper.innerHTML = "";
				contentWrapper.appendChild(playlistTitle);

				// Creates selected playlist section and convert button.
				var selectedPlaylistH1 = createText("selected playlist: "
					+ item.textContent);
				selectedPlaylistH1.classList.add("card-text");
				selectedPlaylistH1.classList.add("card-text-selected");
				contentWrapper.appendChild(selectedPlaylistH1);

				var convertToAppleButton = document.createElement("button");
				var convertToAppleText = document.createTextNode(
					"convert to apple music"
				);

				convertToAppleButton.appendChild(convertToAppleText);
				convertToAppleButton.classList.add("centered_button");
				contentWrapper.appendChild(convertToAppleButton);

				// Adds click event handler with sync func for convert button.
				convertToAppleButton.addEventListener(
					"click", async function () {
						syncToAppleMusic(item.textContent, playlistsObj[item.textContent]);
					}
				);
			});
		});
	});
}

/**
 * Configures Apple MusicKit with developer token and app name. Gets instance
 * of API and authorizes with a subscriber. Updates status to authorized.
 * @returns authorized music object that can be used for GET calls
 */
async function initMusicKit() {

	try {
		await MusicKit.configure({
			developerToken:
				"eyJhbGciOiJFUzI1NiIsImtpZCI6IkRXNjVQWk5XWDgifQ."
				+ "eyJpc3MiOiJONEZIOFZQOEtDIiwiaWF0IjoxNjU4ODcyOTIzLC"
				+ "JleHAiOjE2NjkwMDAwMDB9.DJV1pS_Z-cSAChqWXRTcc-GfnbA"
				+ "kfZr0UF_VQPvdx3UZMo7g-aXtJXvqW9fxO0mjSpqfNMsYEAJjX"
				+ "azh4v-whw",
			app: {
				name: "synchrony",
				build: "0.1",
			},
		});

	} catch (err) {
		console.log(err);
	}

	const music = MusicKit.getInstance();
	await music.authorize();
	authorizeStatus.innerHTML = "status: authorized!";
	return music;
}

/**
 * Syncs a Spotify playlist to its Apple Music equivalent. Checks if the
 * corresponding playlist exists in Apple Music. If so, every track in Spotify
 * but not in Apple Music gets added to the Apple playlist.
 * @param {string} playlistName Name of Spotify playlist to transfer
 * @param {string} playlistId ID of Spotify playlist to transfer
 */
async function syncToAppleMusic(playlistName, playlistId) {

	// Empties card 2 wrapper div
	syncAppleWrapper.innerHTML = "";

	let applePlaylists = await getApplePlaylists();

	// Creates status h1 for whether equivalent Apple playlist exists.
	var hasPlaylistText = createText("");
	hasPlaylistText.classList.add("card-text");
	syncAppleWrapper.append(hasPlaylistText);

	// Checks whether requested playlist exists in the applePlaylists object.
	let hasPlaylist = false;
	for (var key of Object.keys(applePlaylists)) {
		if (playlistName === key) {
			hasPlaylist = true;
		}
	}

	// Updates status h1 with existence check results.
	if (hasPlaylist) {
		hasPlaylistText.innerHTML = "playlist found in apple music: "
			+ playlistName;
	} else {
		hasPlaylistText.innerHTML = "playlist not found in apple music";
	}

	/*
		TODO: Add a "create playlist" button if playlist not found. Move
		below code into separate function called addMissingToApple or smt
		which gets called in first half of the above if or after the playlist
		is created.
	*/

	// Gets all current playlist tracks in separate Spotify/Apple playlists.
	let spotifyTracks = await getSpotifyPlaylistTracks(playlistId);
	let appleTracks
		= await getApplePlaylistTracks(applePlaylists[playlistName]);

	// Counter to display number of tracks added to Apple playlist.
	let numAdded = 0;
	for (let key of Object.keys(spotifyTracks)) {
		/*
			This check is needed because of slight differences between Spotify
			and Apple track names.

			E.g. A BOY IS A GUN* in Spotify
			vs	 A BOY IS A GUN in Apple

			The "*" vs no "*" discrepancy means just a
			  appleTracks[key] === undefined check is not enough. Instead, a
			similarity check is used to see if the names are almost the same.
			If not, the track is added to Apple Music.
		*/
		if (appleTracks[key] === undefined) {
			let similarFlag = false;
			/*
				TODO: nested for loops seems inefficient here - maybe better
				search method?
			*/
			for (var i = 0; i < Object.keys(appleTracks).length; i++) {
				// Similarity as secondary check.
				if (similarity(key, Object.keys(appleTracks)[i]) > 0.60) {
					similarFlag = true;
				}
			}

			/* 
				If key is not in appleTracks and not similar, add Apple song by
				first searching the Apple Music catalog with a query of 
				"{track name} {first track artist}"
			*/
			if (!similarFlag) {
				await addAppleSong(applePlaylists[playlistName], await searchAppleSong(key + " " + spotifyTracks[key]));
				numAdded++;
			}
		}
	}

	// Create status h1 with the number of tracks added to Apple Music.
	var numAddedText = createText("number of songs added to apple music: " + numAdded);
	numAddedText.classList.add("card-text");
	syncAppleWrapper.append(numAddedText);
}

/**
 * Searches for songs in Apple Music catalog given a query.
 * @param {string} query Query to send to Apple Music search
 * @returns ID of first Apple Music song matching query
 */
async function searchAppleSong(query) {
	const music = await initMusicKit();
	const result = await music.api.music(
		"v1/catalog/us/search",
		{ term: query, types: 'songs' }
	);

	return result["data"]["results"]["songs"]["data"][0]["id"];
}

/**
 * Creates h1 element with given text.
 * @param {string} text Text in h1
 * @returns HTML h1 element with given text embedded
 */
function createText(text) {
	var h1Elem = document.createElement("h1");
	var h1Text = document.createTextNode(text);
	h1Elem.appendChild(h1Text);
	return h1Elem;
}

/**
 * Gets all track names and Spotify IDs for given playlist.
 * @param {string} playlistId Spotify ID for public playlist
 * @returns Object with track names and Spotify track IDs
 */
async function getSpotifyPlaylistTracks(playlistId) {
	const token = await getSpotifyToken();
	const tracks = await fetch(
		"https://api.spotify.com/v1/playlists/" + playlistId + "/tracks", {
		method: "GET",
		headers: {
			Authorization: "Bearer " + token,
		},
	}
	);

	const tracksJson = await tracks.json();
	let tracksObj = {};

	// Extracts track information from GET JSON and into name:id format.
	for (let i = 0; i < tracksJson["items"].length; i++) {
		try {
			tracksObj[tracksJson["items"][i]["track"]["name"]] =
				tracksJson["items"][i]["track"]["artists"][0]["name"];
		} catch (error) {
			console.log(i + error);
		}
	}

	/*
		Similarity check is not enough for shorter names that have features
		because small discrepancies have a big effect on string distance and
		0.60 threshold is not meaningful. To resolve, remove all information
		from parentheses - keeps core of song name so similarity is enough.

		TODO: do this in above for loop instead of cycling through twice.
	*/
	for (let key of Object.keys(tracksObj)) {
		// If track name has parentheses, remove all info from parentheses.
		if (key.indexOf("(") > 0) {
			let new_key = key.substring(0, key.indexOf("("));
			delete Object.assign(tracksObj, { [new_key]: tracksObj[key] })[key];
		}
	}
	return tracksObj;
}

/**
 * Gets all track names and Apple IDs for given playlist.
 * @param {string} playlistId Apple playlist ID
 * @returns Object with track names and Apple track IDs
 */
async function getApplePlaylistTracks(playlistId) {

	const music = await initMusicKit();
	let tracksJson = {};
	try {
		const { data: result } = await music.api.music(
			"v1/me/library/playlists/" + playlistId + "/tracks"
		);

		tracksJson = result.data;
	} catch (err) {
		console.log(err);
	}

	let tracksObj = {};

	// Extracts track information from GET JSON and into name:id format.
	for (let i = 0; i < tracksJson.length; i++) {
		tracksObj[tracksJson[i]["attributes"]["name"]] = tracksJson[i]["attributes"]["artistName"];
	}

	/*
		Similarity check is not enough for shorter names that have features
		because small discrepancies have a big effect on string distance and
		0.60 threshold is not meaningful. To resolve, remove all information
		from parentheses - keeps core of song name so similarity is enough.

		TODO: do this in above for loop instead of cycling through twice.
	*/
	for (let key of Object.keys(tracksObj)) {
		// If track name has parentheses, remove all info from parentheses.
		if (key.indexOf("(") > 0) {
			let newKey = key.substring(0, key.indexOf("("));
			delete Object.assign(tracksObj, { [newKey]: tracksObj[key] })[key];
		}
	}
	return tracksObj;
}

/**
 * Issues POST to Spotify API as developer to retrieve access token.
 * @returns Authorized Spotify access token as developer.
 */
async function getSpotifyToken() {
	return await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			Authorization: `Basic ${SPOTIFY_TOKEN}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},

		// Original used qs.stringify, was not able to move qs to browser.
		body: "grant_type=client_credentials",
	}).then((response) => response.json()).then((data) => data.access_token);
}

/**
 * Adds given song to given Apple playlist.
 * @param {string} playlistId Apple playlist ID
 * @param {string} songId Apple song ID
 * @returns POST response from adding track to Apple playlist
 */
async function addAppleSong(playlistId, songId) {

	/*
		All other MusicKit API calls use music.api.music() because they are GET.
		The API is unclear on how to add HTTP body information in that
		method, so a regular fetch POST is used instead.
		
		A Music-User-Token has to be retrieved from authorize() to access a
		specific subscriber's information.

		The HTTP body needs an object with the song ID and the type of content
		being added to the playlist.
	*/
	const music = await initMusicKit();
	const user_token = await music.authorize();
	return await fetch("https://api.music.apple.com/v1/me/library/playlists/" + playlistId + "/tracks", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${APPLE_TOKEN}`,
			"Music-User-Token": user_token
		},
		body: JSON.stringify({
			id: songId,
			type: "songs"
		})
	})
}

/**
 * Returns how similar two strings are.
 * From: https://stackoverflow.com/a/36566052
 * 
 * @param {string} s1 First string to compare
 * @param {string} s2 Second string to compare
 * @returns Floating point number indicating similarity of two strings

 */
function similarity(s1, s2) {
	// TODO: use better similarity metric - F1 Score?

	var longer = s1;
	var shorter = s2;
	if (s1.length < s2.length) {
		longer = s2;
		shorter = s1;
	}
	var longerLength = longer.length;
	if (longerLength == 0) {
		return 1.0;
	}
	return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

/**
 * Finds the Levenshtein distance between two strings as an indicator of
 * similarity
 * From: https://stackoverflow.com/a/36566052
 * 
 * @param {string} s1 First string
 * @param {string} s2 Second string
 * @returns Levenshtein distance between two strings
 */
function editDistance(s1, s2) {
	s1 = s1.toLowerCase();
	s2 = s2.toLowerCase();

	var costs = new Array();
	for (var i = 0; i <= s1.length; i++) {
		var lastValue = i;
		for (var j = 0; j <= s2.length; j++) {
			if (i == 0)
				costs[j] = j;
			else {
				if (j > 0) {
					var newValue = costs[j - 1];
					if (s1.charAt(i - 1) != s2.charAt(j - 1))
						newValue = Math.min(Math.min(newValue, lastValue),
							costs[j]) + 1;
					costs[j - 1] = lastValue;
					lastValue = newValue;
				}
			}
		}
		if (i > 0)
			costs[s2.length] = lastValue;
	}
	return costs[s2.length];
}