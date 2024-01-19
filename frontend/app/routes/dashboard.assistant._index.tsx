import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';

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

function DashboardAssistantDisplay() {
  const [userInput, setUserInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const sendMessage = async () => {
    // Add the user message to the chat history
    setChatHistory(prevHistory => [...prevHistory, { sender: 'User', text: userInput }]);

    // Send message to the backend and get response
    const response = await fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userInput }),
    });
    const data = await response.json();

    // Isolate the chatbot's reply from the response
    const reply = data.reply;

    // Add the bot's response to the chat history
    setChatHistory(prevHistory => [...prevHistory, { sender: 'Bot', text: reply }]);
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

export default DashboardAssistantDisplay;
