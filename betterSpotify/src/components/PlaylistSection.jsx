import React, { useEffect, useState } from "react";
import PlaylistItem from './PlaylistItem'

function PlaylistSection({ accessToken, onPlaylistClick }) {
    const [playlists, setPlaylists] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [playlistRefreshTrigger, setPlaylistRefreshTrigger] = useState(0);

    function refreshPlaylists(){
        setPlaylistRefreshTrigger(prev => prev + 1)
    }

    useEffect(() => {
        if (!accessToken) return

        const fetchPlaylists = async () => {
            try {
                setLoading(true)
                const response = await fetch('https://api.spotify.com/v1/me/playlists', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })

                if (!response.ok) {
                    throw new Error('Failed to fetch playlists')
                }

                const data = await response.json()
                setPlaylists(data.items)
                setLoading(false)
            }
            catch(err){
                console.error('Error fetching playlists: ', err)
                setError('Could not load playlists. Please try again later.')
                setLoading(false)
            }
        }

        fetchPlaylists()
    }, [accessToken, playlistRefreshTrigger])

    if (loading) {
        return(
            <div className="w-full py-8">
                <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return(
            <div className="w-full py-8 text-center">
                <p className="text-red-400">{error}</p>
            </div>
        )
    }

    if (playlists.length === 0) {
        return (
            <div className="w-full py-8 text-center">
                <p className="text-red-400">No playlists found. Create some on Spotify!</p>
            </div>
        )
    }


    return (
        <div className="w-full py-4 px-4">
            <div>
                <div className="flex justify-between items-center px-4 py-2">
                    <h2 className="text-white text-xl font-semibold">Your Playlists</h2>
                    <button 
                        onClick={refreshPlaylists}
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full"
                        title="Refresh playlists"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-2 max-h-[calc(100vh-19.5rem)] overflow-y-auto"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                {playlists.map(playlist => (
                <PlaylistItem 
                    key={playlist.id} 
                    playlist={playlist} 
                    onClick={() => onPlaylistClick(playlist.id)}
                />
                ))}
            </div>
        </div>
    )
}

export default PlaylistSection