import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  IconButton,
  Paper
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';

const Message = ({ type, content, onApplyCode }) => {
  const isAssistant = type === 'assistant';
  const hasCodeBlock = content.includes('```');

  const renderContent = () => {
    if (!hasCodeBlock) {
      return <Typography>{content}</Typography>;
    }

    const parts = content.split(/(```[\s\S]*?```)/);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).trim();
        return (
          <Box key={index} sx={{ my: 1 }}>
            <Paper
              sx={{
                p: 2,
                backgroundColor: '#f5f5f5',
                fontFamily: 'monospace',
                position: 'relative'
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{code}</pre>
              {onApplyCode && (
                <Button
                  variant="contained"
                  size="small"
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={() => onApplyCode(code)}
                >
                  Применить
                </Button>
              )}
            </Paper>
          </Box>
        );
      }
      return <Typography key={index}>{part}</Typography>;
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isAssistant ? 'flex-start' : 'flex-end',
        mb: 2
      }}
    >
      <Paper
        sx={{
          p: 2,
          maxWidth: '80%',
          backgroundColor: isAssistant ? '#f5f5f5' : '#e3f2fd'
        }}
      >
        {renderContent()}
      </Paper>
    </Box>
  );
};

export default function ChatDialog({
  open,
  onClose,
  onSendMessage,
  onApplyCode,
  messages = [],
  loading = false
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Chat GPT Assistant</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 3,
        overflowY: 'auto'
      }}>
        {messages.map((msg, index) => (
          <Message
            key={index}
            type={msg.type}
            content={msg.content}
            onApplyCode={msg.type === 'assistant' ? onApplyCode : undefined}
          />
        ))}
        <div ref={messagesEndRef} />
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Опишите, что нужно сделать с диаграммой..."
            disabled={loading}
          />
          <IconButton 
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
