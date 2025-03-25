import { signInWithPopup, signInAnonymously } from "firebase/auth";
import { auth, googleProvider } from "../../firebase/config";

export function Login() {
    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            console.error("Error al iniciar sesión", err);
        }
    };

    const handleAnonymousLogin = async () => {
        try {
            await signInAnonymously(auth);
        } catch (err) {
            console.error("Error with anonymous login", err);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-violet-400">
            <h1 className="text-4xl font-bold text-white mb-4">Bienvenido a Chat Rooms 🔥</h1>
            <button
                onClick={handleGoogleLogin}
                className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer min-w-[200px]"
            >
                Log in with Google
            </button>
            <button
                onClick={handleAnonymousLogin}
                className="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded cursor-pointer min-w-[200px]"
            >
                Log in Anonymously
            </button>
        </div>
    );
}
