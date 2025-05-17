import React, { useEffect, useState } from "react";
import TrackSearchResults from "./TrackSearchResults";

function PlaylistPage({ accessToken, playlistId, onBackClick, onChooseTrack}){

    const [playlist, setPlaylist] = useState(null)
    const [tracks, setTracks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!accessToken || !playlistId) return
        
        const fetchPlaylistDetails = async () => {
            try {
                setLoading(true)

                const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })
                
                if (!playlistResponse.ok){
                    throw new Error('Failed to fetch playlist details')
                }

                const playlistData = await playlistResponse.json()
                setPlaylist(playlistData)

                const trackItems = playlistData.tracks.items
                const processedTracks = trackItems.map(item => {
                    const track = item.track
                    const smallestAlbumImage = track.album.images.reduce((smallest, image) => {
                        if (image.height < smallest.height) return image;
                        return smallest;
                    }, track.album.images[0])

                    return {
                        artist: track.artists[0].name,
                        title: track.name,
                        uri: track.uri,
                        albumURL: smallestAlbumImage.url
                    }
                })

                setTracks(processedTracks)
                setLoading(false)
            }
            catch(err){
                console.error('Error fetching playlist: ', err)
                setError('Could not load playlist, Please try again later.')
                setLoading(false)
            }
        }

        fetchPlaylistDetails()
    }, [accessToken, playlistId])

    if (loading) {
        return (
        <div className="w-full py-8">
            <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
        </div>
        );
    }

    if (error) {
        return (
        <div className="w-full py-8 text-center">
            <p className="text-red-400">{error}</p>
            <button 
            onClick={onBackClick}
            className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
            Back to Playlists
            </button>
        </div>
        );
    }

    if (!playlist) {
        return null;
    }

    return (
        <div className="w-full py-4">
            <div className="flex items-center mb-6 px-2">
                <button
                    onClick={onBackClick}
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="flex items-center">
                    <div className="w-16 h-16 mr-4 overflow-hidden rounded-lg shadow-lg">
                        {playlist.images && playlist.images.length > 0 ? (
                        <img 
                            src={playlist.images[0].url} 
                            alt={playlist.name} 
                            className="w-full h-full object-cover"
                        />
                        ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                            </svg>
                        </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">{playlist.name}</h1>
                        <p className="text-gray-300">{playlist.tracks.total} songs</p>
                    </div>
                </div>
            </div>
            <div className="pl-5 pb-5">
                <div className="max-h-[calc(100vh-22.5rem)] overflow-y-auto py-2"
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
                >
                {tracks.map(track => (
                    <TrackSearchResults 
                    track={track} 
                    key={track.uri} 
                    chooseTrack={onChooseTrack}
                    />
                ))}
                </div>
            </div>
        </div>
    )
}

export default PlaylistPage