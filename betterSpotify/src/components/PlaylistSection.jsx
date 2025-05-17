import React, { useEffect, useState } from "react";
import PlaylistItem from './PlaylistItem'

function PlaylistSection({ accessToken, onPlaylistClick }) {
    const [playlists, setPlaylists] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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
    }, [accessToken])

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
            <h2 className="text-white text-xl font-bold mb-4 px-2">Your Playlists</h2>
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