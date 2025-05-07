import React from "react";

const AUTH_URL = "https://accounts.spotify.com/authorize?client_id=7112c1bb10ec4992a5ec711534aedd9b&response_type=code&redirect_uri=https://localhost:5173&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state"


function Login(){
    return(
        <div className="flex flex-wrap w-full h-screen justify-center center items-center">
            <a className="bg-green-600 p-5 rounded-full text-white border-2 border-black"
            href={AUTH_URL}
            >
                Login with Spotify
            </a>
        </div>
    )
}

export default Login