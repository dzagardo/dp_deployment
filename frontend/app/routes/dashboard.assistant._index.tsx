import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import io, { Socket } from 'socket.io-client';


interface ChatMessage {
  sender: string;
  text: string;
}

interface ChatBubble {
  sender: string;
  text: string;
}

const ChatBubble: React.FC<ChatMessage> = ({ sender, text }) => {
  const isUser = sender === 'User';
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
      </Box>
    </Box>
  );
};

function VirtualAssistantDisplay() {
  const [userInput, setUserInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Inside the VirtualAssistantDisplay component:
  const socket = useRef<Socket | null>(null);

  function shouldStartNewMessage(newWord: string, prevHistory: ChatMessage[]) {
    // Check for a special word indicating the start of a new message
    if (newWord === '<NEW_MESSAGE>') {
      return true;
    }
    // Add other conditions as needed
    return false;
  }

  useEffect(() => {
    // Connect to the WebSocket server
    socket.current = io('http://localhost:5000');

    socket.current.on('response', (data) => {
      const newChar = data.char;  // Assuming each character is sent under the key 'char'
      console.log(`Received character: '${newChar}'`);  // Detailed logging

      setChatHistory(prevHistory => {
        console.log('Previous chat history:', prevHistory);  // Log the previous chat history

        const lastMessageIndex = prevHistory.length - 1;
        const isLastMessageFromBot = lastMessageIndex >= 0 && prevHistory[lastMessageIndex].sender === 'Bot';

        // Handle <NEW_MESSAGE> signal
        if (newChar === '<NEW_MESSAGE>') {
          console.log('Received <NEW_MESSAGE> signal.');
          if (!isLastMessageFromBot || (isLastMessageFromBot && prevHistory[lastMessageIndex].text !== '')) {
            console.log('Starting a new message.');
            return [...prevHistory, { sender: 'Bot', text: '' }];
          }
          return prevHistory;
        }

        // Append the character to the bot's current message
        if (isLastMessageFromBot) {
          console.log(`Appending character '${newChar}' to the existing message.`);
          let updatedHistory = [...prevHistory];
          updatedHistory[lastMessageIndex].text += newChar;  // Append the character directly
          return updatedHistory;
        } else {
          // Start a new bot message with the character
          console.log(`Starting a new bot message with: '${newChar}'`);
          return [...prevHistory, { sender: 'Bot', text: newChar }];
        }
      });
    });


    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const sendMessage = () => {
    // Add the user message to the chat history
    setChatHistory(prevHistory => [...prevHistory, { sender: 'User', text: userInput }]);

    // Check if socket.current is not null before calling emit
    if (socket.current) {
      // Emit the message to the WebSocket server
      socket.current.emit('message', { message: userInput });
    } else {
      console.error('Socket is not connected.');
    }

    setUserInput('');
  };


  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400, overflow: 'auto' }}>
          {chatHistory.map((msg, index) => (
            <ChatBubble key={index} sender={msg.sender} text={msg.text} />
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
