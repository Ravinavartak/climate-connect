import "./App.css";
import AuthForm from "./components/AuthForm";
import Home from './pages/Home';
import Analyze from './pages/Analyze'; // Create these components
import Community from './pages/Community';
import News from './pages/News';
import Reddit from './pages/RedditFeed';
import ClimateNewsFeed from "./pages/ClimateNewsFeed";

function App() {
  return (
    <div className="App">
      <AuthForm />
    </div>
  );
}

export default App;
