// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase/config";
import { Login } from "./modules/auth/Login";
import { Lobby } from "./modules/lobby/Lobby";
import {ChatRoom} from "./modules/chat/ChatRoom.tsx";
// (más adelante: import { ChatRoom } from "./modules/chat/ChatRoom")

function App() {
    const [user, loading] = useAuthState(auth);

    if (loading) return <div
        className="flex flex-col gap-4 justify-center items-center h-screen bg-violet-300">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"/>
        <p className="text-white font-semibold">Loading...</p>
    </div>;

    return (
        <Routes>
            <Route
                path="/"
                element={
                    user ? <Navigate to="/lobby" replace /> : <Navigate to="/login" replace />
                }
            />
            <Route
                path="/login"
                element={!user ? <Login /> : <Navigate to="/lobby" replace />}
            />
            <Route
                path="/lobby"
                element={user ? <Lobby user={user} /> : <Navigate to="/login" replace />}
            />
            {/* Más adelante agregamos esto 👇 */}
            <Route
                path="/sala/:roomId"
                element={user ? <ChatRoom /> : <Navigate to="/login" replace />}
            />
        </Routes>
    );
}

export default App;
