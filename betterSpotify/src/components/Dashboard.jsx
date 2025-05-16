import React, { useEffect, useState, useRef } from "react";
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
    const [showLyrics, setShowLyrics] = useState(false)
    const [showLogout, setShowLogout] = useState(false)
    const profileRef = useRef(null)

    function toggleLyrics() {
        setShowLyrics(!showLyrics);
    }

    function toggleLogOut() {
        setShowLogout(!showLogout)
    }

    useEffect(() => {
        function handleOutsideClick(event) {
            if(profileRef.current && !profileRef.current.contains(event.target)){
                setShowLogout(false)
            }
        }

        document.addEventListener("mousedown", handleOutsideClick)
        return() => {
            document.removeEventListener("mousedown", handleOutsideClick)
        }
    }, [])

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

        axios.get(`${import.meta.env.VITE_BACKEND_URL}/lyrics`,{
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
            <div className="flex flex-col md:flex-row w-screen h-screen bg-gradient-to-t from-teal-900 to-gray-900 pb-24">
                {/* Normal Logout button */}
                <div className="hidden md:block h-auto md:w-1/3">
                    <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 mt-4 m-4"
                    >
                        Log Out
                    </button>
                </div>

                {/* Center section */}
                <div className="flex items-center flex-col h-full w-full md:w-1/3 px-4 md:px-0">
                    <div className={`flex flex-col w-full rounded-3xl bg-gray-800/20 backdrop-blur-3xl shadow-md mt-5 transition-all duration-300 &{search === "" ? "min-h-min" : "flex-1 min-h-0"} max-h-[calc(100%-2.5rem)]`}>
                        <div className="relative flex items-center px-4 py-2">
                            <div ref={profileRef} className="md:hidden relative">
                                <button
                                    onClick={toggleLogOut}
                                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mr-2"
                                >
                                <svg className="h-8 w-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                                </button>

                                {showLogout && (
                                    <div className="absolute top-12 left-0 bg-white rounded-lg shadow-lg py-2 px-4 z-50">
                                        <button className="text-red-600 font-medium whitespace-nowrap"
                                        onClick={handleLogout}>
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>

                            <input
                            type="text"
                            className="flex-grow pl-4 pr-4 py-3 border border-gray-300 rounded-3xl bg-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-600 my-5 mx-4 text-white"
                            placeholder="Search song"
                            value = {search}
                            onChange={e => setSearch(e.target.value)}
                            />

                            <button
                                onClick={toggleLyrics}
                                className="md:hidden w-10 h-10 rounded-full bg-green-600 flex items-center justify-center ml-2"
                            >
                                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                                </svg>
                            </button>
                        </div>
                        
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
                </div>

                {/* Lyrics Section for desktop*/}
                <div className="hidden md:block h-full md:w-1/3">
                    <div className="bg-gray-800/20 backdrop-blur-3xl m-5 rounded-3xl h-[calc(100%-2.5rem)] overflow-y-scroll text-center p-4 text-white shadow-md font-bold"
                    style={{
                            whiteSpace: "pre-wrap",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                     }}>
                        {lyrics}
                    </div>
                </div>

                {/* Lyrics Section for mobile */}
                {showLyrics && (
                    <div className="fixed inset-0 z-50 bg-gray-900 p-4 overflow-y-auto md:hidden">
                        <div className="flex justify-center items-center mb-4">
                            <h2 className="text-white text-xl font-bold">Lyrics</h2>
                            <button 
                                onClick={toggleLyrics}
                                className="text-white text-2xl font-bold absolute right-5 top-3"
                            >
                                ×
                            </button>
                        </div>
                        <div className="text-white whitespace-pre-wrap text-center">
                            {lyrics}
                        </div>
                    </div>
                )}

            </div>

            {/* Player Component */}
            <div className="fixed bottom-0 left-0 right-0 z-40">
                <div className="mx-4 md:mx-auto md:max-w-lg bg-gray-800/20 backdrop-blur-3xl rounded-3xl p-2 shadow-lg">
                    <Player accessToken={accessToken} track={ playingTrack }/>
                </div>
            </div>
        </>
    )
}

export default Dashboard