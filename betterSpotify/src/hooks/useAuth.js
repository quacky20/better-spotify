import React, { useEffect, useState } from "react";
import axios from 'axios'

function useAuth(code){
    const [accessToken, setAccessToken] = useState()
    const [refreshToken, setRefreshToken] = useState()
    const [expiresIn, setExpiresIn] = useState()

    useEffect(() => {
        const storedAccessToken = localStorage.getItem("accessToken")
        const storedRefreshToken = localStorage.getItem("refreshToken")
        const storedExpiresIn = localStorage.getItem("expiresIn")

        if (storedAccessToken && storedRefreshToken && storedExpiresIn) {
            setAccessToken(storedAccessToken)
            setRefreshToken(storedRefreshToken)
            setExpiresIn(parseInt(storedExpiresIn))
        }
    }, [])

    useEffect(()=>{

        if (accessToken) return
        if (!code) return

        axios.post(`${import.meta.env.VITE_BACKEND_URL}/login` , {
            code
        })
        .then(res => {
            // window.history.pushState({}, null, "/")
            setAccessToken(res.data.accessToken)
            setRefreshToken(res.data.refreshToken)
            setExpiresIn(res.data.expiresIn)

            // Persist to localStorage
            localStorage.setItem("accessToken", res.data.accessToken)
            localStorage.setItem("refreshToken", res.data.refreshToken)
            localStorage.setItem("expiresIn", res.data.expiresIn)

        })
        .catch(err => {
            console.log(err)
            window.location = '/'
        })
    }, [code]) 


    useEffect(() => {
        if (!refreshToken || !expiresIn) return

        const interval = setInterval(() => {
            axios.post(`${import.meta.env.VITE_BACKEND_URL}/refresh` , {
            refreshToken
            })
            .then(res => {
                console.log(refreshToken)
                // console.log(res.data)
                // window.history.pushState({}, null, "/")
                setAccessToken(res.data.accessToken)
                setExpiresIn(res.data.expiresIn)
                localStorage.setItem("accessToken", res.data.accessToken)
                localStorage.setItem("expiresIn", res.data.expiresIn)
            })
            .catch(err => {
                window.location = '/'
            })
        }, (expiresIn - 60) * 1000)

        return () => clearInterval(interval)
    }, [refreshToken, expiresIn])

    return accessToken
}

export default useAuth