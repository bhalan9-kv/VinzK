import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Library } from "./pages/Library";
import { Session } from "./pages/Session";
import { Progress } from "./pages/Progress";
import { Auth } from "./components/Auth";
import { onAuthLost } from "./lib/apiClient";

function App() {
  const [auth, setAuth] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // When any API returns 401, open the auth modal with a friendly message.
    return onAuthLost(() => {
      setMessage("Your session has ended. Please sign in again to continue.");
      setAuth(true);
    });
  }, []);

  const close = () => { setAuth(false); setMessage(""); };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home onLogin={() => setAuth(true)}/>}/>
          <Route path="/library" element={<Library onLogin={() => setAuth(true)}/>}/>
          <Route path="/session/:id" element={<Session onAuth={() => setAuth(true)}/>}/>
          <Route path="/progress" element={<Progress onLogin={() => setAuth(true)}/>}/>
        </Routes>
        <AnimatePresence>
          {auth && <Auth close={close} banner={message}/>}
        </AnimatePresence>
      </BrowserRouter>
    </div>
  );
}
export default App;
