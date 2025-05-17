import React from "react";

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI

const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=streaming user-read-email user-read-private user-library-read user-library-modify user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative`

function Login(){
    return(
        <div className="flex flex-wrap w-full h-screen justify-center center items-center bg-gradient-to-t from-teal-900 to-gray-900">
            <a className="bg-green-600 p-5 rounded-full text-white border-2 border-black"
            href={AUTH_URL}
            >
                Login with Spotify
            </a>
        </div>
    )
}

export default Login