import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import io, { Socket } from 'socket.io-client';
import { CircularProgress } from '@mui/material';

interface ChatMessage {
  sender: string;
  text: string;
  isThinking?: boolean;
}

interface ChatBubble {
  sender: string;
  text: string;
}

function VirtualAssistantDisplay() {
  const [userInput, setUserInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const ChatBubble: React.FC<ChatMessage> = ({ sender, text, isThinking }) => {
    const isUser = sender === 'User';
    const isBot = sender === 'Bot';

    return (
      <Box sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'center',
        margin: '10px',
        // Adjust these margins to increase space between the avatar and the chat bubble
        marginLeft: isUser ? '10px' : '48px', // space on the left for user messages
        marginRight: isUser ? '48px' : '10px', // space on the right for bot messages
      }}>
        <Avatar sx={{ bgcolor: isUser ? 'secondary.main' : 'primary.main' }}>
          {isUser ? 'U' : 'B'}
        </Avatar>
        <Box sx={{
          maxWidth: 'calc(70% - 48px)', // Adjust the maxWidth to account for the added margin
          padding: '10px',
          backgroundColor: isUser ? '#e0f7fa' : '#fff9c4',
          borderRadius: '10px',
          // If you want to have the same space on both sides, you can set a uniform margin here
          margin: '0 8px', // For example, 8px space from the avatar
        }}>
          <Typography variant="body1">{text}</Typography>
          {/* {isThinking && <CircularProgress size={24} sx={{ marginLeft: '10px' }} />} */}
        </Box>
      </Box>
    );
  };
  // Inside the VirtualAssistantDisplay component:
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the WebSocket server
    socket.current = io('http://localhost:5000');

    socket.current.on('response', (data) => {
      const newChar = data.char;

      setChatHistory(prevHistory => {
        const lastMessageIndex = prevHistory.length - 1;
        const isLastMessageBotThinking = lastMessageIndex >= 0
          && prevHistory[lastMessageIndex].sender === 'Bot'
          && prevHistory[lastMessageIndex].isThinking;

        if (data.fullMessage) {
          // Handle the case where the full message is sent
          return [
            ...prevHistory.slice(0, lastMessageIndex),
            { sender: 'Bot', text: data.fullMessage, isThinking: false }
          ];
        }

        if (newChar === '<NEW_MESSAGE>') {
          if (isLastMessageBotThinking) {
            // If the last message is a "thinking" message from the bot, update it to a new empty message
            return [
              ...prevHistory.slice(0, lastMessageIndex),
              { ...prevHistory[lastMessageIndex], text: '', isThinking: false }
            ];
          } else {
            // If the last message is not a "thinking" message, add a new bot message with the isThinking flag
            return [...prevHistory, { sender: 'Bot', text: '', isThinking: true }];
          }
        }

        if (newChar && isLastMessageBotThinking) {
          // If there's a new character and the last message is a "thinking" message, update its text
          return [
            ...prevHistory.slice(0, lastMessageIndex),
            { ...prevHistory[lastMessageIndex], text: prevHistory[lastMessageIndex].text + newChar }
          ];
        } else if (newChar) {
          // If there's a new character but the last message is not a "thinking" message, add it as a new message
          return [...prevHistory, { sender: 'Bot', text: newChar }];
        }

        return prevHistory;
      });
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const sendMessage = () => {
    // Emit the message to the WebSocket server
    if (socket.current) {
      socket.current.emit('message', { message: userInput });
      // Add the user message to the chat history
      setChatHistory(prevHistory => [
        ...prevHistory,
        { sender: 'User', text: userInput },
        { sender: 'Bot', text: '', isThinking: true } // Add a thinking message for the bot
      ]);
    } else {
      console.error('Socket is not connected.');
    }

    setUserInput('');
  };


  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 800, overflow: 'auto' }}>
          {chatHistory.map((msg, index) => (
            <ChatBubble key={index} {...msg} />
          ))}
          <div ref={endOfMessagesRef} />
        </Paper>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message here..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userInput.trim()) {
                sendMessage();
              }
            }}
            sx={{
              borderRadius: '20px',
              input: { padding: '10px' },
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            sx={{ ml: 1, backgroundColor: '#64b5f6' }}
            disabled={!userInput.trim()}
          >
            Send
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default VirtualAssistantDisplay;
