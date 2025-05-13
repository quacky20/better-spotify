const express = require('express')
const cors = require('cors')
const SpotifyWebApi = require('spotify-web-api-node')
const bodyParser = require('body-parser')
require('dotenv').config();
const Genius = require('genius-lyrics')
const Client = new Genius.Client(process.env.GENIUS_TOKEN)

const app = express()
app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/refresh', (req, res) => {
    const refreshToken = req.body.refreshToken
    const spotifyAPI = new SpotifyWebApi({
        redirectUri: process.env.SPOTIFY_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        refreshToken: refreshToken
    })  

    spotifyAPI.refreshAccessToken()
    .then((data) => {
        res.json({
            accessToken: data.body.access_token,
            expiresIn: data.body.expires_in
        })
    })
    .catch((err) => {
        console.log(err)
        res.sendStatus(400)
    })
})

app.post('/login', (req, res)=>{
    const code = req.body.code
    const spotifyAPI = new SpotifyWebApi({
        redirectUri: process.env.SPOTIFY_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    })    

    spotifyAPI.authorizationCodeGrant(code).then(data => {
        res.json({
            accessToken: data.body.access_token,
            refreshToken: data.body.refresh_token,
            expiresIn: data.body.expires_in
        })
    }).catch((err) => {
        console.log("Login failed: ", err)
        res.sendStatus(400)
    })
})

async function getLyrics(artist, track) {
    try {
        const searches = await Client.songs.search(`${artist} ${track}`);
        const song = searches[0];
        if (!song) return "Lyrics not found.";
        let rawLyrics = await song.lyrics();

        const match = rawLyrics.match(/(\[.*?\][\s\S]*)/);
        const cleanedLyrics = match ? match[1].trim() : rawLyrics.trim();

        return cleanedLyrics;

    } catch (err) {
        console.error("Genius error:", err.message);
        return "Error fetching lyrics.";
    }
}

app.get('/lyrics', async (req, res) => {
    // console.log(lyricsFinder(req.query.artist, req.query.track))

    // const lyrics = await lyricsFinder(req.query.artist, req.query.track) || "Still looking for the lyrics for this song"
    // console.log(lyrics)
    // res.json({ lyrics })

    const { artist, track } = req.query;
    const lyrics = await getLyrics(artist, track) || "Still looking for the lyrics for this song";
    res.json({ lyrics });
})

app.listen(3001, '127.0.0.1', () => {
    console.log('Server running on http://127.0.0.1:3001');
})