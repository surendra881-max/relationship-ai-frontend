import {
  Box,
  Container,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const BACKEND_URL = "https://relationship-ai-backend-1.onrender.com";

export default function App() {
  const [tab, setTab] = useState(0);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState("en-IN");
  const [autoSpeak, setAutoSpeak] = useState(true);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = voiceStyle;
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setMessage(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, [voiceStyle]);

  useEffect(() => {
    if (autoSpeak && response) {
      const utter = new SpeechSynthesisUtterance(response);
      utter.lang = voiceStyle;
      synthRef.current.speak(utter);
    }
  }, [response, autoSpeak]);

  const handleChat = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/chat`, {
        message,
        phase: "reflection",
      });
      setResponse(res.data.response);
      setHistory([...history, { user: message, ai: res.data.response }]);
    } catch {
      setResponse("⚠️ AI Error");
    } finally {
      setLoading(false);
      setMessage("");
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/analyze`, { message });
      setResponse(
        `Sentiment: ${res.data.sentiment}\nDepth: ${res.data.depth}`
      );
    } catch {
      setResponse("⚠️ Analysis Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/summarize`, { history });
      setResponse(res.data.summary);
    } catch {
      setResponse("⚠️ Summary Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleListen = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    } else {
      alert("Voice recognition not supported.");
    }
  };

  const speakManually = () => {
    if (!response) return;
    const utter = new SpeechSynthesisUtterance(response);
    utter.lang = voiceStyle;
    synthRef.current.speak(utter);
  };

  return (
    <Box
      sx={{
        background: "linear-gradient(to bottom right, #d1c4e9, #bbdefb)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
              🤖 Relationship AI Coach
            </Typography>

            <Tabs
              value={tab}
              onChange={(e, newTab) => setTab(newTab)}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
              sx={{ mt: 2 }}
            >
              <Tab label="Chat" />
              <Tab label="Analyze" />
              <Tab label="Summarize" />
            </Tabs>

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Type or use voice..."
              sx={{ mt: 3 }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            {/* Action Buttons */}
            <Stack direction="column" spacing={1} mt={2}>
              {tab === 0 && (
                <Button
                  variant="contained"
                  color="info"
                  fullWidth
                  onClick={handleChat}
                >
                  💬 Send to AI
                </Button>
              )}
              {tab === 1 && (
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={handleAnalyze}
                >
                  🧠 Analyze Message
                </Button>
              )}
              {tab === 2 && (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={handleSummarize}
                >
                  📄 Summarize Session
                </Button>
              )}
            </Stack>

            {/* Voice Controls */}
            <Stack
              direction="row"
              spacing={2}
              mt={3}
              alignItems="center"
              justifyContent="space-between"
            >
              <Button
                variant="contained"
                color={isListening ? "error" : "primary"}
                fullWidth
                onClick={handleListen}
                startIcon={<MicIcon />}
              >
                {isListening ? "Listening..." : "Voice Input"}
              </Button>

              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={speakManually}
                startIcon={<VolumeUpIcon />}
              >
                Voice Output
              </Button>
            </Stack>

            <Select
              value={voiceStyle}
              onChange={(e) => setVoiceStyle(e.target.value)}
              sx={{ mt: 2, width: "100%" }}
            >
              <MenuItem value="en-IN">English (India)</MenuItem>
              <MenuItem value="en-US">English (US)</MenuItem>
              <MenuItem value="hi-IN">Hindi</MenuItem>
              <MenuItem value="ta-IN">Tamil</MenuItem>
              <MenuItem value="te-IN">Telugu</MenuItem>
            </Select>

            {/* Loader */}
            {loading && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                <CircularProgress />
              </Box>
            )}

            {/* AI Response */}
            {response && (
              <Paper
                elevation={2}
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: "#f9fbe7",
                  borderRadius: 2,
                }}
              >
                <Typography whiteSpace="pre-wrap">{response}</Typography>
              </Paper>
            )}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}
