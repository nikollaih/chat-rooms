// src/modules/chat/ChatRoom.tsx
import { useEffect, useState, useRef } from "react";
import {useNavigate, useParams} from "react-router-dom";
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot as onSnapshotUsers,
    orderBy,
    getDoc,
    serverTimestamp,
    query,
    addDoc,
    updateDoc
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { auth } from "../../firebase/config";
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

type Message = {
    deleted: boolean;
    id: string;
    text: string;
    createdAt: unknown;
    user: {
        photo: string | null;
        id: string;
        name: string;
    };
};

export function ChatRoom() {
    const navigate = useNavigate();
    const [activeUsers, setActiveUsers] = useState<{ id: string; name: string }[]>([]);
    const [enabledRoom, setEnabledRoom] = useState<boolean>(false);
    const { roomId } = useParams();
    const [roomName, setRoomName] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const user = auth.currentUser;

        if (!user || !roomId) return;

        const userRef = doc(db, "rooms", roomId, "activeUsers", user.uid);
        setDoc(userRef, {
            name: user.displayName,
            joinedAt: serverTimestamp(),
        });

        // Eliminar usuario al salir
        const removeUser = () => deleteDoc(userRef);
        window.addEventListener("beforeunload", removeUser);
        return () => {
            removeUser();
            window.removeEventListener("beforeunload", removeUser);
        };
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return;
        if(enabledRoom){
            const q = collection(db, "rooms", roomId, "activeUsers");
            const unsubscribe = onSnapshotUsers(q, (snapshot) => {
                const users = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as { name: string }),
                }));
                setActiveUsers(users);
            });

            return () => unsubscribe();
        }
    }, [roomId, enabledRoom]);


    useEffect(() => {
        const getRoomName = async () => {
            const docRef = doc(db, "rooms", roomId!);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setRoomName(data.name);

                if (data.password) {
                    const input = prompt("This room is private 🔒\nType the password:");
                    if (input !== data.password) {
                        alert("Incorrect password");
                        window.location.href = "/lobby";
                    }
                    else setEnabledRoom(true);
                }
                else setEnabledRoom(true);
            }
        };

        getRoomName();
    }, [roomId]);


    useEffect(() => {
        if(enabledRoom){
            const q = query(
                collection(db, "rooms", roomId!, "messages"),
                orderBy("createdAt")
            );
            const unsubscribe = onSnapshotUsers(q, (snapshot) => {
                const msgs = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as Omit<Message, "id">),
                }));
                setMessages(msgs);
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            });

            return () => unsubscribe();
        }
    }, [roomId, enabledRoom]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const isAtBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 1;

        if (isAtBottom) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            setShowScrollButton(false);
        } else {
            setShowScrollButton(true);
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user || !newMessage.trim()) return;
        console.log(user)

        await addDoc(collection(db, "rooms", roomId!, "messages"), {
            text: newMessage.trim(),
            createdAt: serverTimestamp(),
            user: {
                id: user.uid,
                name: user.displayName,
                photo: user.photoURL || null,
            },
        });

        setNewMessage("");
    };

    const handleDelete = async (messageId: string) => {
        if (!roomId) return;
        try {
            const msgRef = doc(db, "rooms", roomId, "messages", messageId);
            await updateDoc(msgRef, {
                deleted: true,
            });
        } catch (err) {
            console.error("An error has occurred:", err);
        }
    };

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const isAtBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            setShowScrollButton(!isAtBottom);
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="flex flex-col h-screen p-4">
            <div className="bg-violet-600 mb-4 -m-4 flex items-center gap-x-1 px-4">
                <ArrowBackRoundedIcon className="text-white cursor-pointer" onClick={() => navigate(`/lobby`)} />
                <h2 className="text-xl text-white font-bold p-8">Room's name: <span className="font-light">{roomName}</span></h2>
            </div>

            <div className="mb-4 text-sm text-gray-600">
                <strong>Online ({activeUsers.length}):</strong>{" "}
                {activeUsers.map((u) => u.name || "Anonymous").join(", ")}
            </div>

            <div ref={messagesContainerRef}
                className="flex-1 overflow-y-auto space-y-2 p-3 rounded-lg bg-neutral-200">
                {messages.length <= 0 && <span className="text-md text-neutral-500" >No messages</span>}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className="p-2 rounded-xl bg-white flex items-start gap-2 px-4 max-w-xl w-fit"
                    >
                        {/* Avatar */}
                        {msg.user.photo ? (
                            <img
                                src={msg.user.photo}
                                alt={msg.user.name}
                                className="w-9 h-9 rounded-full"
                            />
                        ) : (
                            <div
                                className="w-9 h-9 rounded-full bg-gray-300 text-sm flex items-center justify-center font-bold text-white">
                                {msg.user.name ? msg.user.name?.charAt(0) : "A"}
                            </div>
                        )}

                        {/* Mensaje */}
                        <div className="flex-1 ml-3">
                            {msg.deleted ? (
                                <em className="text-gray-500 text-sm">🗑 Deleted</em>
                            ) : (
                                <>
                                    <strong>{msg.user.name || "Anonymous"}</strong>: <span className="-mt-3">{msg.text}</span>
                                </>
                            )}
                        </div>

                        {/* Botón eliminar */}
                        {!msg.deleted && auth.currentUser?.uid === msg.user.id && (
                            <button
                                onClick={() => handleDelete(msg.id)}
                                className="text-red-500 ml-8 text-sm"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                ))}
                <div ref={bottomRef}/>
            </div>

            <form onSubmit={handleSend} className="mt-4 flex gap-2">
                {showScrollButton && (
                    <button
                        onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                        className="absolute bottom-24 right-14 bg-orange-400 text-white px-3 py-1 rounded shadow-lg animate-bounce"
                    >
                        <ArrowDownwardRoundedIcon />
                    </button>
                )}
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-neutral-400 px-4 py-2 rounded-lg"
                />
                <button
                    type="submit"
                    className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-md cursor-pointer"
                >
                    Send message
                </button>
            </form>
        </div>
    );
}
