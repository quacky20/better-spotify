import React, { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth.js";
import SpotifyWebApi from "spotify-web-api-node";
import TrackSearchResults from './TrackSearchResults.jsx'
import Player from "./Player.jsx"
import axios from "axios";

const spotifyAPI = new SpotifyWebApi({
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID

})

function Dashboard({code}){
    const accessToken = useAuth(code)

    const [search, setSearch] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [playingTrack, setPlayingTrack] = useState()
    const [lyrics, setLyrics] = useState("Play a song and the lyrics will show up here")

    function chooseTrack(track) {
        setPlayingTrack(track)
        // setSearch('')
        setLyrics('')
    }

    function handleLogout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("expiresIn");
        window.location = "/";
    }

    // console.log("DASHBOARD", playingTrack)
    // console.log(searchResults)

    useEffect(() => {
        if (!playingTrack) return

        axios.get('http://127.0.0.1:3001/lyrics',{
            params: {
                track: playingTrack.title,
                artist: playingTrack.artist
            }
        }).then(res => {
            setLyrics(res.data.lyrics)
        })

    }, [playingTrack])

    useEffect(()=>{
        if (!accessToken) return
        spotifyAPI.setAccessToken(accessToken)
    }, [accessToken])

    useEffect(()=>{
        if (!search) return setSearchResults([])
        if (!accessToken) return

        let cancel = false

        spotifyAPI.searchTracks(search).then(res => {

            if (cancel) return

            setSearchResults(res.body.tracks.items.map(track => {

                const smallestAlbumImage = track.album.images.reduce((smallest, image) => {
                    if (image.height < smallest.height) return image
                    return smallest
                }, track.album.images[0])

                return {
                    artist: track.artists[0].name,
                    title: track.name,
                    uri: track.uri,
                    albumURL: smallestAlbumImage.url
                }
            }))}
        )
        return () => cancel = true
    }, [accessToken, search])

    return(
        <>
            <div className="flex items-center flex-row w-screen h-screen bg-gradient-to-t from-teal-900 to-gray-900">
                <div className="h-full w-1/3">
                    <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 mt-4 m-4"
                    >
                        Log Out
                    </button>

                </div>
                <div className="flex items-center flex-col h-full w-1/3">
                    <div className="flex flex-col w-full rounded-3xl bg-gray-800/20 backdrop-blur-3xl shadow-md mt-5" style={{ flex: 1, minHeight: 0 }}>
                        <input
                        type="text"
                        className="pl-10 pr-10 py-3 border border-gray-300 rounded-3xl bg-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-600 my-5 mx-4 text-white"
                        placeholder="Search song"
                        value = {search}
                        onChange={e => setSearch(e.target.value)}
                        />
                        <div className="grow-1 my-2 overflow-y-auto mx-4"
                            style={{
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                            }}
                        >
                            {searchResults.map(track => (
                                <TrackSearchResults track={track} key={track.uri} chooseTrack={chooseTrack}/>
                            ))}
                        </div>
                    </div>
                    <div className="m-5 bg-gray-800/20 backdrop-blur-3xl w-full rounded-3xl p-2 shadow-md">
                        <Player accessToken={accessToken} track={ playingTrack }/>
                    </div>
                </div>
                <div className="h-full w-1/3">
                    <div className="bg-gray-800/20 backdrop-blur-3xl m-5 rounded-3xl h-[calc(100%-2.5rem)] overflow-y-scroll text-center p-4 text-white shadow-md font-bold"
                    style={{
                            // backgroundImage: `url(${playingTrack ? playingTrack.albumURL : 'None'})`,
                            // backgroundSize: 'cover',
                            // backgroundPosition: 'center',
                            whiteSpace: "pre-wrap",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                     }}>
                        {lyrics}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Dashboard