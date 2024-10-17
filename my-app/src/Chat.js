import React, { useState, useEffect } from 'react';
import './Chat.css';
import axios from 'axios';
import io from "socket.io-client";
import ScrollToBottom from 'react-scroll-to-bottom';
//const backendPort = '5000';
const socket = io.connect(`http://localhost:5000/`);
const Chat = ({user}) => {

    const [users, setUsers] = useState([]);
    const [curOtherUser, setCurOtherUser] = useState(users[0]);
    const [roomId, setRoomId] = useState("");
    const [curMessage, setCurMessage] = useState("");
    const [chatHistory, setChatHistory] = useState({}); 


    useEffect(() => {
        socket.on("receive_message", (data) => {
            setChatHistory(prev => ({
                ...prev, 
                [data.room]: [...(prev[data.room] || []), data]
            }));
        });
    }, [socket]);

    useEffect(() => {
        const fetchAllUsers = async () => {
          try {
            const res = await axios.get('http://localhost:5000/api/users');
            let usersData = res.data;
            usersData = usersData.filter(u => u.email !== user.email);
            setUsers(usersData);

            if (usersData.length > 0) {
              for (let otherUser of usersData) {
                joinRoom(otherUser);
              }
            }
          } catch (error) {
            console.error('Error fetching users:', error);
          }
        };
    
        fetchAllUsers();
      }, [user]);

    if (!user) {
        return <h1>Please login</h1>
    }

    const getRoomId = (user1, user2) => {
        const sortedUsers = [user1.email, user2.email].sort();
        return sortedUsers.join('_');
    }

    const joinRoom = (otherUser) => {
       setCurOtherUser(otherUser);
       const newRoomId = getRoomId(user, otherUser);
       setRoomId(newRoomId);
       socket.emit("join_room", newRoomId);
    }

    const sendMessage = () => {
        if (curMessage === "" || roomId === "") {
            return;
        }

        const messageData = {
            room: roomId,
            author: user,
            content: curMessage,
            date: new Date(),
        };
        
        socket.emit("send_message", messageData);
        
        setChatHistory(prev => ({
            ...prev, 
            [roomId]: [...(prev[roomId] || []), messageData]
        }));

        setCurMessage("");
    }

    
    const getAMPM = (date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const AMPM = hours >= 12 ? 'PM' : 'AM';
        const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for midnight and handle 12-hour format
        return `${adjustedHours}:${String(minutes).padStart(2, '0')} ${AMPM}`;
    }

    return (
        <div className="chat-container">
            <div className="chat-sidebar">
                <h2>Chats</h2>
                <ul>
                    {users.map((user, idx) => (
                        <li key={idx} onClick={() => joinRoom(user)}>
                            {user.email /*Decide whether to use email or name*/} 
                        </li>
                    ))}
                </ul>
            </div>
            <div className="chat-main">
                <h2>{curOtherUser ? curOtherUser.email : ''}</h2>
                <ScrollToBottom className="messages-container">
                    {(chatHistory[roomId] || []).map((message, idx) => (
                        <div key={idx} className={`message ${user.email === message.author.email ? 'you' : 'other'}`}>
                            <div className="message-meta">
                                <p>{getAMPM(message.date)}</p>
                                <p>{message.author.email}</p>
                            </div>
                            <div className="message-content">
                                <p>{message.content}</p>
                            </div>
                        </div>
                    ))}
                </ScrollToBottom>
                <div className="chat-input">
                    <input 
                        type="text" 
                        placeholder="Type a message..." 
                        onChange={e => setCurMessage(e.target.value)}
                        value={curMessage}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default Chat;