import React, { useEffect, useState } from "react";
import SpotifyPlayer from 'react-spotify-web-playback'

function Player({ accessToken, track }){

    const [play, setPlay] = useState(false)

    useEffect(()=>{
        setPlay(true)
    }, [track])
    
    if (!accessToken) return null
    // console.log("PLAYER", track ? track.uri : '')
    return(
        <>
            <div>
                <SpotifyPlayer 
                token={accessToken}
                showSaveIcon
                callback={state => {
                    if (!state.isPlaying && play) setPlay(false)
                }}
                play={play}
                uris={track ? [track.uri] : []}
                layout="responsive"
                hideAttribution={true}
                inlineVolume={false}
                styles={{
                    bgColor: 'transparent',
                    color: '#ffffff',
                    trackNameColor: '#ffffff',
                    trackArtistColor: '#ffffff',
                }}
                />
            </div>
        </>
    )
}

export default Player