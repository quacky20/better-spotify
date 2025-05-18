from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List
import json
import random
import logging
import traceback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:5173"])

groq_api_key = os.getenv("GROQ_API_KEY")

client_id = os.getenv("SPOTIFY_CLIENT_ID")
client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI")

class SongRecommendation(BaseModel):
    # model_config = ConfigDict(from_attributes=True)

    mood: str = Field(description="The detected mood or emotion based on user input")
    genres: List[str] = Field(description="List of music genres that match the mood")
    keywords: List[str] = Field(description="Keywords for searching songs that match the mood")
    energy_level: float = Field(description="Energy level from 0.0 to 1.0")
    valence_level: float = Field(description="Valence/positivity level from 0.0 to 1.0")
    explanation: str = Field(description="Brief explanation of why these music elements mathc the mood")

parser = PydanticOutputParser(pydantic_object=SongRecommendation)

state = {
    "mood_description": "",  # to be filled in from user input
    "mood": None,
    "genres": [],
    "keywords": [],
    "energy_level": None,
    "valence_level": None,
    "explanation": ""
}

llm = ChatGroq(
    temperature=0.4,
    api_key=groq_api_key,
    model_name="llama3-70b-8192"
)

mood_prompt = PromptTemplate(
    input_variables=["mood_description"],
    template="""
        Analyze the following mood description and return a single keyword that represents the mood:\n\n{mood_description}
        \n\n IMPORTANT: RETURN ONLY THE KEYWORD.
        """
)

mood_chain = LLMChain(llm=llm, prompt=mood_prompt)

genre_prompt = PromptTemplate(
    input_variables=["mood"],
    template="Given the mood '{mood}', suggest 3 music genres that would match this emotional state, as a comma-separated list. DO NOT RETURN ANYTHING ELSE."
)

genre_chain = LLMChain(llm=llm, prompt=genre_prompt)

keyword_prompt = PromptTemplate(
    input_variables=["mood"],
    template="For the mood '{mood}', give 3 musical search keywords (like 'slow beat', 'uplifting vocals'), comma-separated. DO NOT RETURN ANYTHING ELSE."
)

keyword_chain = LLMChain(llm=llm, prompt=keyword_prompt)

energy_prompt = PromptTemplate(
    input_variables=["mood"],
    template="On a scale from 0.0 (very calm) to 1.0 (very energetic), estimate the energy level of music that suits the mood '{mood}'. RETURN ONLY A NUMBER."
)

energy_chain = LLMChain(llm=llm, prompt=energy_prompt)

valence_prompt = PromptTemplate(
    input_variables=["mood"],
    template="On a scale from 0.0 (very negative) to 1.0 (very positive), estimate the valence level of music that matches the mood '{mood}'. RETURN ONLY A NUMBER."
)

valence_chain = LLMChain(llm=llm, prompt=valence_prompt)

explanation_prompt = PromptTemplate(
    input_variables=["mood", "genres", "keywords"],
    template=(
        "Given the mood '{mood}', genres {genres}, and keywords {keywords}, explain in 2-3 sentences why this music fits the emotional state."
    )
)

explanation_chain = LLMChain(llm=llm, prompt=explanation_prompt)

def build_song_recommendation(mood_description: str) -> dict:
    state["mood_description"] = mood_description.strip()

    # Step-by-step execution
    state["mood"] = mood_chain.invoke({"mood_description": state["mood_description"]})["text"].strip()

    genres_raw = genre_chain.invoke({"mood": state["mood"]})["text"]
    state["genres"] = [g.strip() for g in genres_raw.split(",")]

    keywords_raw = keyword_chain.invoke({"mood": state["mood"]})["text"]
    state["keywords"] = [k.strip() for k in keywords_raw.split(",")]

    energy_raw = energy_chain.invoke({"mood": state["mood"]})["text"]
    state["energy_level"] = float(energy_raw.strip())

    valence_raw = valence_chain.invoke({"mood": state["mood"]})["text"]
    state["valence_level"] = float(valence_raw.strip())

    explanation_raw = explanation_chain.invoke({
        "mood": state["mood"],
        "genres": ", ".join(state["genres"]),
        "keywords": ", ".join(state["keywords"])
    })
    state["explanation"] = explanation_raw["text"].strip()

    return state

def generate_ai_song_recommendations(mood_description: str, num_songs: int = 15) -> list:
    """Generate specific song recommendations using AI based on mood description"""
    
    # Get the mood analysis first
    state = build_song_recommendation(mood_description)
    mood = state["mood"]
    
    # Create a prompt for song recommendations
    song_recommendation_prompt = PromptTemplate(
        input_variables=["mood_description", "mood", "genres", "keywords", "num_songs"],
        template="""
        Based on the mood description: "{mood_description}", mood '{mood}', which is associated with genres {genres} and keywords {keywords},
        recommend exactly {num_songs} specific songs (with their artists) that would match this mood. If the user requests some specific tracks add them to the list as well. Your main priority is user satisfiability.
        
        Return ONLY a comma-separated list in the format "Song Title by Artist" without numbering or additional text.
        For example: "Bohemian Rhapsody by Queen, Yesterday by The Beatles, Imagine by John Lennon"
        """
    )
    
    song_recommendation_chain = LLMChain(llm=llm, prompt=song_recommendation_prompt)
    
    # Get song recommendations
    recommendations_raw = song_recommendation_chain.invoke({
        "mood_description": mood_description,
        "mood": mood,
        "genres": ", ".join(state["genres"]),
        "keywords": ", ".join(state["keywords"]),
        "num_songs": num_songs
    })["text"].strip()
    
    # Parse the comma-separated list into a list of dictionaries
    song_list = []
    for song_entry in recommendations_raw.split(","):
        song_entry = song_entry.strip()
        if " by " in song_entry:
            title, artist = song_entry.split(" by ", 1)
            song_list.append({
                "title": title.strip(),
                "artist": artist.strip()
            })
    
    logger.info(f"AI generated {len(song_list)} song recommendations")
    return song_list, state

def get_spotify_for_token(token):
    """Create a spotify client using provided access token"""
    try:
        sp = spotipy.Spotify(auth=token)
        sp.current_user()
        logger.info("Spotify authentication successfull")
        return sp
    except Exception as e:
        logger.error(f"Spotify authentication error: {str(e)}")
        raise

@app.route('/mood-suggestions', methods=['POST'])
def get_mood_suggestions():
    data = request.json
    mood_description = data.get('moodDescription')
    access_token = data.get('accessToken')

    logger.info(f"Received mood description: {mood_description[:20]}...")
    logger.info(f"Access token received (first 10 chars): {access_token[:10] if access_token else 'None'}")

    if not mood_description or not access_token:
        return jsonify({"error": "Missing mood description or access token"}), 400
    
    try:
        # Generate AI song recommendations
        song_recommendations, mood_state = generate_ai_song_recommendations(mood_description, num_songs=15)
        
        # Create Spotify client with the token
        sp = get_spotify_for_token(access_token)
        
        # Verify token is valid
        try:
            sp.current_user()
            logger.info("Token verification successful")
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            return jsonify({"error": "Invalid or expired Spotify token. Please log in again."}), 401
        
        # Search for each recommended song on Spotify
        found_tracks = []
        for song in song_recommendations:
            try:
                # Search for the exact song with artist
                search_query = f"track:{song['title']} artist:{song['artist']}"
                logger.info(f"Searching for: {search_query}")
                
                results = sp.search(q=search_query, type='track', limit=1)
                
                if results['tracks']['items']:
                    track = results['tracks']['items'][0]
                    smallest_album_image = min(track['album']['images'], key=lambda x: x['height']) if track['album']['images'] else None
                    
                    found_tracks.append({
                        'title': track['name'],
                        'artist': track['artists'][0]['name'],
                        'uri': track['uri'],
                        'albumURL': smallest_album_image['url'] if smallest_album_image else None
                    })
                    logger.info(f"Found track: {track['name']} by {track['artists'][0]['name']}")
                else:
                    # Try a more general search if exact match fails
                    general_query = f"{song['title']} {song['artist']}"
                    logger.info(f"Trying general search: {general_query}")
                    results = sp.search(q=general_query, type='track', limit=1)
                    
                    if results['tracks']['items']:
                        track = results['tracks']['items'][0]
                        smallest_album_image = min(track['album']['images'], key=lambda x: x['height']) if track['album']['images'] else None
                        
                        found_tracks.append({
                            'title': track['name'],
                            'artist': track['artists'][0]['name'],
                            'uri': track['uri'],
                            'albumURL': smallest_album_image['url'] if smallest_album_image else None
                        })
                        logger.info(f"Found similar track: {track['name']} by {track['artists'][0]['name']}")
            except Exception as e:
                logger.error(f"Error searching for track {song['title']}: {str(e)}")
        
        # If we found fewer than 5 tracks, fall back to keyword search
        if len(found_tracks) < 5:
            logger.info("Not enough tracks found, falling back to keyword search")
            for keyword in mood_state["keywords"]:
                try:
                    results = sp.search(q=keyword, type='track', limit=3)
                    if results['tracks']['items']:
                        for track in results['tracks']['items']:
                            smallest_album_image = min(track['album']['images'], key=lambda x: x['height']) if track['album']['images'] else None
                            
                            found_track = {
                                'title': track['name'],
                                'artist': track['artists'][0]['name'],
                                'uri': track['uri'],
                                'albumURL': smallest_album_image['url'] if smallest_album_image else None
                            }
                            
                            # Avoid duplicates
                            if found_track['uri'] not in [t['uri'] for t in found_tracks]:
                                found_tracks.append(found_track)
                except Exception as e:
                    logger.error(f"Error in fallback search for keyword {keyword}: {str(e)}")
        
        # Get unique tracks (should already be unique but just to be safe)
        unique_tracks = []
        track_uris = set()
        
        for track in found_tracks:
            if track['uri'] not in track_uris and len(unique_tracks) < 10:
                track_uris.add(track['uri'])
                unique_tracks.append(track)
        
        logger.info(f"Returning {len(unique_tracks)} unique tracks")
        return jsonify({
            "detectedMood": mood_state["mood"],
            "explanation": mood_state["explanation"],
            "tracks": unique_tracks
        })
    
    except Exception as e:
        logger.error(f"Error in mood suggestions: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/create-playlist', methods=['POST'])
def create_playlist():
    data = request.json
    access_token = data.get('accessToken')
    track_uris = data.get('trackUris')
    name = data.get('name')
    description = data.get('description', '')

    logger.info(f"Creating playlist: {name} with {len(track_uris) if track_uris else 0} tracks")

    if not access_token or not track_uris or not name:
        return jsonify({"error": "Missing required parameters"}), 400
    
    try:
        sp = get_spotify_for_token(access_token)
        user_info = sp.current_user()
        user_id = user_info['id']

        # Create the playlist
        playlist = sp.user_playlist_create(
            user=user_id,
            name=name,
            public=False,
            description=description
        )

        # Add tracks to the playlist
        if track_uris:
            # Spotify allows a maximum of 100 tracks per request
            if len(track_uris) <= 100:
                sp.playlist_add_items(
                    playlist_id=playlist['id'],
                    items=track_uris
                )
            else:
                # Split into chunks of 100 if more than 100 tracks
                for i in range(0, len(track_uris), 100):
                    chunk = track_uris[i:i+100]
                    sp.playlist_add_items(
                        playlist_id=playlist['id'],
                        items=chunk
                    )
        
        logger.info(f"Successfully created playlist with ID: {playlist['id']}")
        return jsonify({
            "success": True,
            "playlistId": playlist['id'],
            "playlistUrl": playlist['external_urls']['spotify']
        })
        
    except Exception as e:
        logger.error(f"Error creating playlist: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)