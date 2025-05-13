import Login from './components/Login.jsx'
import Dashboard from './components/Dashboard.jsx'

const code = new URLSearchParams(window.location.search).get('code')
const token = localStorage.getItem('accessToken')

function App() {
  return (
    code||token ? <Dashboard code={code}/> : <Login/>
  )
}

export default App