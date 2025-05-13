
# 🎵 **Better Spotify**

Better Spotify is a web application that allows you to search for songs, play them using the Spotify API, and instantly view song lyrics fetched from Genius. It provides a **dark mode** interface with sleek **blur effects** to enhance your listening experience.

---

## 🛠 **Tech Stack**

- **Frontend**: React, Tailwind CSS, Vite  
- **Backend**: Node.js, Express  
- **APIs**: Spotify API, Genius API  
- **Other**: Axios

---

## ⚙️ **Setup Instructions**

To get started with this project, follow the steps below:

### 1. **Clone the Repository**  
Clone the repository to your local machine:
```bash
git clone https://github.com/yourusername/better-spotify.git
```

### 2. **Install Dependencies**

#### Frontend (React):  
Navigate to the frontend folder and install the necessary dependencies:
```bash
cd server
npm install
```

#### Backend (Express):  
Navigate to the backend folder and install the necessary dependencies:
```bash
cd betterSpotify
npm install
```

### 3. **Add Environment Variables**  
In both the frontend and backend folders, you will need to add the necessary API keys to `.env` files.

#### Frontend:  
Inside the `betterSpotify` folder, create a `.env` file and add:
```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
```

#### Backend:  
Inside the `server` folder, create a `.env` file and add:
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173
GENIUS_ACCESS_TOKEN=your_genius_access_token
```

Replace `your_spotify_client_id`, `your_spotify_client_secret`, and `your_genius_access_token` with your actual API credentials.

---

## 🚀 **How to Run**

### Running the Frontend  
In the `betterSpotify` folder, run:
```bash
npm run dev
```
This will start the React development server at `http://127.0.0.1:5173`.

### Running the Backend  
In the `server` folder, run:
```bash
npm run devStart
```
This will start the Express server at `http://127.0.0.1:3001`.

---

## 💡 **Features**

- **Spotify Login**: Sign in using your Spotify account. 🎧  
- **Search and Play**: Search for songs and play them directly from the Spotify catalog. 🔍🎶  
- **Instant Lyrics**: View the lyrics for the currently playing song in real-time from Genius. 📝  
- **Dark Mode UI**: A sleek dark mode interface with beautiful blur effects for a modern user experience. 🌑✨

---

## 🤝 **Contributing**  
Feel free to submit issues or pull requests if you want to contribute. Contributions are welcome! 💻✨
