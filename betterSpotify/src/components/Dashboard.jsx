import React, { useEffect, useState, useRef } from "react";
import useAuth from "../hooks/useAuth.js";
import SpotifyWebApi from "spotify-web-api-node";
import TrackSearchResults from './TrackSearchResults.jsx'
import Player from "./Player.jsx"
import axios from "axios";
import PlaylistSection from "./PlaylistSection.jsx";
import PlaylistPage from "./PlaylistPage.jsx";

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
    const [currentView, setCurrentView] = useState("home")
    const [currentPlaylistId, setCurrentPlaylistId] = useState(null)
    const profileRef = useRef(null)
    const [userProfile, setUserProfile] = useState(null)
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [moodInput, setMoodInput] = useState("")
    const [moodSuggestions, setMoodSuggestions] = useState([])
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
    const [detectedMood, setDetectedMood] = useState("")

    function handlePlaylistClick(playlistId) {
        setCurrentPlaylistId(playlistId)
        setCurrentView("playlist")
        setSearch("")
    }

    function handleBacktoHome(){
        setCurrentView("home")
        setCurrentPlaylistId(null)
    }

    function toggleLyrics() {
        setShowLyrics(!showLyrics);
    }

    function toggleLogOut() {
        setShowLogout(!showLogout)
    }

    function toggleProfileView() {
        setShowProfileMenu(!showProfileMenu)
    }

    function handleSettings() {
        console.log("Setting clicked")
        setShowProfileMenu(false)
    }

    async function getMoodBasedSuggestions() {
        if (!moodInput.trim()) return

        setIsLoadingSuggestions(true)

        try{
            const response = await axios.post(`${import.meta.env.VITE_MLBACKEND_URL}/mood-suggestions`, {
                moodDescription: moodInput,
                accessToken: accessToken
            })

            setMoodSuggestions(response.data.tracks)
            setDetectedMood(response.data.detectedMood)
        }
        catch(err) {
            console.error("Error getting mood suggestions: ", err)
            setMoodSuggestions([])
        }
        finally {
            setIsLoadingSuggestions(false)
        }
    }

    async function createMoodPlaylist() {
        if (moodSuggestions.length === 0) return

        try {
            const response = await axios.post(`${import.meta.env.VITE_MLBACKEND_URL}/create-playlist`, {
                accessToken: accessToken,
                trackUris: moodSuggestions.map(track => track.uri),
                name: `${detectedMood} Mood - ${new Date().toLocaleDateString()}`,
                description: `Songs for when you're feeling: ${moodInput}`
            })

            alert("Playlist created successfully!")

            handleBacktoHome()
        }
        catch(err) {
            console.error("Error creating playlist: ", err)
            alert("Failed to create playlist. Please try again.")
        }
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

        spotifyAPI.getMe().then(data => {
            setUserProfile({
                name: data.body.display_name,
                image: data.body.images?.length > 0 ? data.body.images[0].url : null,
                id: data.body.id
            })
        }).catch(err => {
            console.error("Error fetching user profile: ", err)
        })
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
                <div className="hidden md:block h-auto md:w-1/3 m-5">
                    {/* <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 mt-4 m-4"
                    >
                        Log Out
                    </button> */}
                    <div ref={profileRef} className="flex items-center justify-between bg-gray-800/30 backdrop-blur-3xl rounded-3xl p-4 mb-4">
                        <div className="flex items-center">
                            <div
                                className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden cursor-pointer"
                                onClick={toggleProfileView}
                            >
                                {userProfile?.image ? (
                                    <img src={userProfile.image} alt="Profile" className="w-full h-full object-cover"/>
                                ) : (
                                    <svg className="h-8 w-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                    </svg>
                                )}
                            </div>
                            <div className="ml-3">
                                <p className="text-white font-medium">
                                    {`Hello ${userProfile?.name}` || "Loading..."}
                                </p>
                            </div>
                        </div>

                        {showProfileMenu && (
                            <div className="absolute top-20 left-8 bg-gray-800 rounded-lg shadow-lg py-2 z-50">
                                <button
                                    className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700"
                                    onClick={handleSettings}
                                >
                                    Settings
                                </button>
                                <button
                                    className="block w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700"
                                    onClick={handleLogout}
                                >
                                    Log Out
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mood chat section */}
                    <div className=" flex-1 bg-gray-800/20 backdrop-blur-3xl rounded-3xl flex flex-col w-full p-5">
                        <h2 className="text-white text-xl font-semibold mb-4">Music Mood Finder</h2>
                        <div className="flex-1 overflow-y-auto mb-4">
                            {detectedMood && (
                                <div className="mb-3 bg-teal-900/40 p-3 rounded-lg">
                                    <p className="text-white">
                                        Detected mood: <span className="font-bold">{detectedMood}</span>
                                    </p>
                                </div>
                            )}

                            {isLoadingSuggestions && (
                                <div className="flex justify-center items-center my-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                                </div>
                            )}

                            {moodSuggestions.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-white font-medium">Suggested songs</h3>
                                        <button
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-sm"
                                        onClick={createMoodPlaylist}
                                        >
                                            Create Playlist
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {moodSuggestions.map((track, index) => (
                                            <TrackSearchResults 
                                                track={track} 
                                                key={track.uri || index} 
                                                chooseTrack={chooseTrack}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-auto">
                            <textarea
                                className="w-full p-3 bg-gray-700/60 text-white rounded-lg focus:outline-none focus:rind-2 focus:ring-green-500 resize-none"
                                placeholder="How are you feeling today? Describe your mood..."
                                rows="3"
                                value={moodInput}
                                onChange={(e) => setMoodInput(e.target.value)}
                            ></textarea>
                            <button
                                className="w-full mt-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                                onClick={getMoodBasedSuggestions}
                                disabled={isLoadingSuggestions}
                            >
                                {isLoadingSuggestions ? "Finding songs..." : "Get Song Recommendations"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Center section */}
                <div className="flex items-center flex-col h-full w-full md:w-1/3 px-4 md:px-0">
                    {/* <div className={`flex flex-col w-full rounded-3xl bg-gray-800/20 backdrop-blur-3xl shadow-md mt-5 transition-all duration-300 &{search === "" ? "min-h-min" : "flex-1 min-h-0"} max-h-[calc(100%-2.5rem)]`}> */}
                    <div className={`max-h-[calc(100%-2.5rem)] w-full rounded-3xl bg-gray-800/20 backdrop-blur-3xl shadow-md transition-all duration-300 m-5`}>
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
                            {/* Home button - only on mobile */}
                            {currentView === "playlist" && (
                                <button
                                    onClick={handleBacktoHome}
                                    className="md:hidden w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-2"
                                >
                                    {/* Home icon */}
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                    </svg>
                                </button>
                            )}
                            
                            {/* Home button - when on playlist page */}
                            {currentView === "home" && (
                                <button
                                    onClick={handleBacktoHome}
                                    className="md:hidden w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-2"
                                >
                                    {/* Home icon */}
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                    </svg>
                                </button>
                            )}

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


                        
                        {/* <div className="grow-1 my-2 overflow-y-auto mx-4"
                            style={{
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                            }}
                        >
                            {searchResults.map(track => (
                                <TrackSearchResults track={track} key={track.uri} chooseTrack={chooseTrack}/>
                            ))}
                        </div> */}

                        <div className="w-full overflow-hidden">
                            {/* Search Results */}
                            {search !== "" && (
                                <div className="bg-gray-800/20 backdrop-blur-3xl rounded-3xl overflow-hidden">
                                    <div className="max-h-64 overflow-y-auto py-2 px-4"
                                    style={{
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none',
                                    }}>
                                        {searchResults.map(track => (
                                            <TrackSearchResults track={track} key={track.uri} chooseTrack={chooseTrack}/>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Playlist Section - only when search is empty and on home view */}
                                {search === "" && currentView === "home" && (
                                    <PlaylistSection 
                                        accessToken={accessToken}
                                        onPlaylistClick={handlePlaylistClick}
                                    />
                                )}
                                
                                {/* Playlist Page - when viewing a specific playlist */}
                                {currentView === "playlist" && (
                                    <PlaylistPage
                                        accessToken={accessToken}
                                        playlistId={currentPlaylistId}
                                        onBackClick={handleBacktoHome}
                                        onChooseTrack={chooseTrack}
                                    />
                                )}
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

            {/* Mobile Mood Chat Settings */}
            <button
                className="md:hidden fixed bottom-24 right-4 z-40 bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                onClick={() => document.getElementById('moodModal').classList.remove('hidden')}
            >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
            </button>
            
            <div id="moodModal" className="hidden fixed inset-0 z-50 bg-gray-900/95 md:hidden">
                <div className="h-full flex flex-col p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-white text-xl font-bold">Music Mood Finder</h2>
                        <button 
                            onClick={() => document.getElementById('moodModal').classList.add('hidden')}
                            className="text-white text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto mb-4">
                        {detectedMood && (
                                <div className="mb-3 bg-teal-900/40 p-3 rounded-lg">
                                    <p className="text-white">Detected mood: <span className="font-bold">{detectedMood}</span></p>
                                </div>
                            )}
                            
                            {isLoadingSuggestions && (
                                <div className="flex justify-center items-center my-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                                </div>
                            )}

                            {moodSuggestions.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-white font-medium">Suggested Songs</h3>
                                        <button 
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-sm"
                                            onClick={createMoodPlaylist}
                                        >
                                            Create Playlist
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {moodSuggestions.map((track, index) => (
                                            <TrackSearchResults 
                                                track={track} 
                                                key={track.uri || index} 
                                                chooseTrack={(track) => {
                                                    chooseTrack(track);
                                                    document.getElementById('moodModal').classList.add('hidden');
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>
                    <div className="mt-auto">
                        <textarea
                            className="w-full p-3 bg-gray-700/60text-white rounded-lg focus:outline-nonefocus:ring-2 focus:ring-green-500resize-none"
                            placeholder="How are you feeling today?Describe your mood..."
                            rows="3"
                            value={moodInput}
                            onChange={(e) => setMoodInput(e.target.value)}
                        ></textarea>
                        <button
                            className="w-full mt-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                            onClick={getMoodBasedSuggestions}
                            disabled={isLoadingSuggestions}
                        >
                            {isLoadingSuggestions ? "Finding songs..." : "Get Song Recommendations"}
                        </button>
                    </div>
                </div>
            </div>
            

            {/* Player Component */}
            <div className="fixed bottom-0 left-0 right-0 z-40">
                <div className="mx-4 md:mx-auto md:max-w-full bg-gray-800/20 backdrop-blur-3xl rounded-3xl p-2 shadow-lg">
                    <Player accessToken={accessToken} track={ playingTrack }/>
                </div>
            </div>
        </>
    )
}

export default Dashboard