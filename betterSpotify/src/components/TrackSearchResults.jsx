import React from "react";

function TrackSearchResults({ track, chooseTrack }){
    function handlePlay() {
        chooseTrack(track)
    }
    return(
        <>
            <div
            className="flex m-2 center items-center"
            style={{ cursor: "pointer" }}
            onClick={handlePlay}
            >
                <img src={track.albumURL} style={{ height: '64px', width: '64px' }} className="rounded-4xl" />
                <div className="ml-3">
                    <div className="text-white font-bold">{track.title}</div>
                    <div className="text-gray-400">{track.artist}</div>
                </div>
            </div>
        </>
    )
}

export default TrackSearchResults