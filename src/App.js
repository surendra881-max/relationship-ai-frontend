import React, { useState, useEffect } from 'react'; // Make sure useEffect is imported
import axios from 'axios';
import './index.css';

const BASE_URL = "https://relationship-ai-backend-1.onrender.com";

function App() {
  const [alert, setAlert] = useState(false);
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState('onboarding');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    const loadVoices = () => {
      const synthVoices = window.speechSynthesis.getVoices();
      setVoices(synthVoices);

      const female = synthVoices.find(voice =>
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('zira')
      );
      setSelectedVoice(female || synthVoices[0]);
    };

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    loadVoices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');
    setAlert(false); // Reset previous alert
  
    try {
      const res = await axios.post(`${BASE_URL}/chat`, {
        message,
        phase
      });
      
  
      const aiReply = res.data.response;
      const alertFlag = res.data.alert;
  
      console.log("🚨 Alert from backend:", alertFlag); // ✅ Debug
      setResponse(aiReply);
      setAlert(alertFlag); // ✅ Set once only!
  
      const analysisRes = await axios.post(`${BASE_URL}/analyze`, { message });

  
      const sentiment = analysisRes.data.sentiment;
      const depth = analysisRes.data.depth;
  
      setChatHistory(prev => [
        ...prev,
        {
          user: message,
          ai: aiReply,
          phase: phase,
          timestamp: new Date().toLocaleString(),
          sentiment,
          depth
        }
      ]);
  
      // ✅ Voice output
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(aiReply);
      utter.lang = 'en-US';
      utter.pitch = 1;
      utter.rate = 1;
      if (selectedVoice) {
        utter.voice = selectedVoice;
      }
      synth.speak(utter);
  
    } catch (err) {
      console.error(err);
      setResponse('⚠️ Error talking to the AI.');
    } finally {
      setLoading(false);
    }
  };
  


  const handleVoiceInput = () => {
    const recognition = new window.webkitSpeechRecognition() || new window.SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
    };

    recognition.start();
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>🎙️ Relationship AI</h1>

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '2rem' }}>
        <label>Talk or type about your relationship:</label><br />

        <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        cols={50}
        required
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          borderRadius: '8px',
          border: '1px solid #ccc',
          marginBottom: '1rem'
        }}
        />
      <br />

      <button
      type="button"
      onClick={handleVoiceInput}
      style={{
        backgroundColor: '#007bff',
        color: '#fff',
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '5px',
        marginRight: '1rem',
        cursor: 'pointer'
      }}
    >
  {isRecording ? '🎤 Listening...' : '🎙️ Speak'}
</button>

        <br /><br />

        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
  <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
    <label>Select Phase:</label><br />
    <select 
    value={phase}
    onChange={(e) => setPhase(e.target.value)}
    style={{
      padding: '0.5rem',
      borderRadius: '5px',
      border: '1px solid #ccc',
      marginBottom: '1rem',
      width: '100%'
    }}>
      <option value="onboarding">Onboarding</option>
      <option value="emotional_mapping">Emotional Mapping</option>
      <option value="dynamics">Dynamics & Tensions</option>
      <option value="dual_reflection">Dual Reflection</option>
    </select>
  </div>

  <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
    <label>Select Voice:</label><br />
    <select
     style={{
      padding: '0.5rem',
      borderRadius: '5px',
      border: '1px solid #ccc',
      marginBottom: '1rem',
      width: '100%'
    }}
      onChange={(e) => {
        const selected = voices.find(v => v.name === e.target.value);
        setSelectedVoice(selected);
      }}
      value={selectedVoice?.name || ''}
    >
      {voices.map((voice, idx) => (
        <option key={idx} value={voice.name}>
          {voice.name} ({voice.lang})
        </option>
      ))}
    </select>
  </div>
</div>
        <br /><br />
        <button
        type="submit"
        style={{
          backgroundColor: '#28a745',
          color: '#fff',
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Send to AI
      </button>
      </form>
      <button className="summary-button"
      style={{
        backgroundColor: '#cce5ff',
        color: '#004085',
        padding: '0.5rem 1rem',
        border: '1px solid #b8daff',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '1rem'
      }}
      
        onClick={async () => {
          const res = await axios.post(`${BASE_URL}/summarize`, { history: chatHistory });
          setSummary(res.data.summary); 
        }}
      >
        📜 Generate Session Summary
      </button>
      <div style={{ marginTop: '2rem' }}>
        {loading && <p>⏳ Thinking...</p>}
        {response && (
          <div className="card">
            <h3>🧠 AI Response:</h3>
            <p>{response}</p>
          </div>
        )}

      {alert && (
        <div className="alert-box">
          🛑 <strong>Emotional Safety Alert:</strong> Your message may reflect distress or harm.
          <br /> Please consider talking to someone you trust or seeking professional help.
        </div>
      )}
      {summary && (
        <div className="card" style={{ backgroundColor: '#fffdf5', fontFamily: 'Georgia, serif' }}>
          <h3>📜 Session Summary</h3>
          <p>{summary}</p>
        </div>
      )}
      </div>
      {chatHistory.length > 0 && (
  <div style={{ marginTop: '2rem' }}>
    <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="card">
  <h3>🧠 Reflection Journal</h3>
  <ul>
    {chatHistory.map((entry, index) => (
      <li key={index} style={{ marginBottom: '1rem' }}>
        <strong>{entry.timestamp}</strong> <em>({entry.phase})</em><br />
        <strong>You:</strong> {entry.user}<br />
        <strong>AI:</strong> {entry.ai}<br />
        <strong>Sentiment:</strong>{" "}
        <span style={{ color: entry.sentiment === 'NEGATIVE' ? 'red' : entry.sentiment === 'POSITIVE' ? 'green' : 'gray' }}>
          {entry.sentiment || 'Unknown'}
        </span><br />
        <strong>Depth:</strong>{" "}
        <span style={{ color: entry.depth === 'deep' ? 'purple' : 'blue' }}>
          {entry.depth || 'Unknown'}
        </span>
      </li>
    ))}
  </ul>
</div>
    <ul>
    {chatHistory.map((entry, index) => (
  <li key={index} style={{ marginBottom: '1rem' }}>
    <strong>{entry.timestamp}</strong> <em>({entry.phase})</em><br />
    <strong>You:</strong> {entry.user}<br />
    <strong>AI:</strong> {entry.ai}<br />
    <strong>Sentiment:</strong>{" "}
    <span style={{ color: entry.sentiment === 'NEGATIVE' ? 'red' : entry.sentiment === 'POSITIVE' ? 'green' : 'gray' }}>
      {entry.sentiment || 'Unknown'}
    </span><br />

    <strong>Depth:</strong>{" "}
    <span style={{ color: entry.depth === 'deep' ? 'purple' : 'blue' }}>
      {entry.depth || 'Unknown'}
    </span>
  </li>
))}
    </ul>
  </div>
      )}
    </div>
  );
}

export default App;
