import React from "react";

function PlaylistItem({ playlist, onClick }){
    return(
        <>
            <div className="rounded-lg overflow-hidden shadow-md bg-gray-800/50 backdrop-blur-3xl cursor-pointer hover:bg-gray-700/50 transition-all duration-300"
            onClick={() => onClick(playlist.id)}
            >
                <div className="relative pb-[100%]">
                    {playlist.images && playlist.images.length > 0 ? (
                        <img
                            src={playlist.images[0].url}
                            alt={playlist.name} 
                            className="absolute w-full h-full object-cover"    
                        />
                    ) : (
                        <div className="absolute w-full h-full bg-gray-700 flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                            </svg>
                        </div>
                    )}
                </div>
                <div className="p-3">
                    <h3 className="text-white font-medium truncate">{playlist.name}</h3>
                    <p className="text-gray-300 text-sm truncate">{playlist.tracks.total} songs</p>
                </div>
            </div>        
        </>
    )
}

export default PlaylistItem