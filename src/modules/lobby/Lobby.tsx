// src/modules/lobby/Lobby.tsx
import { useEffect, useState } from "react";
import {collection, addDoc, onSnapshot, query, orderBy, Timestamp, doc, deleteDoc} from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { signOut } from "firebase/auth";
import {useNavigate} from "react-router-dom";
import LockRoundedIcon from '@mui/icons-material/LockRounded';

type Room = {
    createdBy: string;
    password: string | null;
    id: string;
    name: string;
    createdAt: Timestamp;
};

export function Lobby({ user }: { user: { uid: string, displayName: string | null } }) {
    const [filterText, setFilterText] = useState("");
    const navigate = useNavigate();
    const [roomName, setRoomName] = useState("");
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomPassword, setRoomPassword] = useState("");
    const ROOMS_LIMIT = 20;

    // Escucha en tiempo real las salas
    useEffect(() => {
        const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Room, "id">),
            }));
            setRooms(data);
        });

        return () => unsubscribe();
    }, []);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomName.trim()) return;

        await addDoc(collection(db, "rooms"), {
            name: roomName,
            createdAt: Timestamp.now(),
            createdBy: user.uid,
            password: roomPassword ? roomPassword : null,
        });

        setRoomName("");
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!roomId) return;
        try {
            const msgRef = doc(db, "rooms", roomId);
            await deleteDoc(msgRef);
        } catch (err) {
            console.error("Error al marcar la sala como eliminada:", err);
        }
    }

    const filteredRooms = rooms?.filter((r) => r.name.toLowerCase().includes(filterText.toLowerCase()));

    return (
        <div className="mx-auto mb-10">
            <div className="flex justify-between items-center mb-10 bg-violet-600 p-8">
                <h2 className="text-2xl text-white">Hi <span className="font-bold">{user.displayName || "Anonymous"}</span>, create or join a room 🔥</h2>
                <button
                    onClick={() => signOut(auth)}
                    className="px-3 py-1 rounded text-white"
                >
                    Log out
                </button>
            </div>

            <div className="max-w-xl mx-auto px-4">
                <form onSubmit={handleCreateRoom} className="grid gap-2 mb-6 bg-neutral-100 p-6 rounded-md shadow-sm border border-neutral-200">
                    <input
                        type="text"
                        placeholder="Room's name"
                        value={roomName}
                        autoComplete="off"
                        onChange={(e) => setRoomName(e.target.value)}
                        className="border border-neutral-500 bg-white px-4 py-2 rounded-md"
                    />
                    <input
                        type="password"
                        placeholder="Password (optional)"
                        value={roomPassword}
                        autoComplete="off"
                        onChange={(e) => setRoomPassword(e.target.value)}
                        className="border border-neutral-500 bg-white px-4 py-2 rounded-md"
                    />
                    {
                        rooms.length < ROOMS_LIMIT && <button type="submit"
                                                    className="min-w-[120px] bg-violet-500 text-white px-4 py-2 rounded-md hover:bg-violet-600 cursor-pointer">
                            Create Room
                        </button>
                    }
                    {
                        rooms.length > ROOMS_LIMIT - 1 && <span className="text-red-500">Se alcanzó el limite de salas permitidas</span>
                    }

                </form>

                <h2 className="text-center font-semibold mb-4 text-xl text-neutral-900">Rooms</h2>
                <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="border border-neutral-500 bg-white px-4 py-2 rounded-md w-full mb-4"
                    placeholder="Filter by name"
                />
                <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-violet-400 scrollbar-track-transparent">
                    {filteredRooms.length === 0 ? (
                        <p>No rooms were found.</p>
                    ) : (
                        filteredRooms.map((room) => (
                            <div key={room.id} className="p-3 bg-violet-100 rounded-md flex justify-between items-center">
                                <span>{room.name}</span>
                                <div className="flex gap-x-2 items-center">
                                    {
                                        room.password && <LockRoundedIcon className="text-neutral-900" titleAccess="Private room"/>
                                    }
                                    <button
                                        onClick={() => navigate(`/sala/${room.id}`)}
                                        className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md cursor-pointer"
                                    >
                                        Join
                                    </button>
                                    {
                                        room.createdBy === user.uid && <button
                                            onClick={() => handleDeleteRoom(room.id)}
                                            className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md cursor-pointer"
                                        >
                                            Delete
                                        </button>
                                    }
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>


        </div>
    );
}
