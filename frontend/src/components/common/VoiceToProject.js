import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { voiceToProject } from '../../services/api';
import './VoiceToProject.css';

const VoiceToProject = ({ onResult, onClose }) => {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('en');
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef(null);

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = text;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setText(finalTranscript + interim);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        toast.error(`Mic error: ${event.error}`);
      }
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }, [lang, text]);

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecording(false);
  };

  const handleSubmit = async () => {
    if (!text.trim() || text.trim().length < 10) {
      toast.warning('Please describe your project in more detail');
      return;
    }

    setProcessing(true);
    try {
      const res = await voiceToProject(text.trim());
      if (res.data.success) {
        toast.success('🎉 Project brief created from your description!');
        onResult(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to parse description');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process your description');
    }
    setProcessing(false);
  };

  const examplePrompts = lang === 'ur' ? [
    'Mujhe Lahore mein 10 marla ka ghar chahiye, 2 manzil, 5 kamray, modern style, parking aur garden ke saath',
    'Multan mein 5 marla commercial plaza, 4 floors, basement ke saath, budget 2 crore',
    'Islamabad mein 1 kanal ka farmhouse, contemporary style, swimming pool aur lawn',
  ] : [
    'I want a 10 marla modern house in Lahore with 5 bedrooms, 2 floors, parking and a garden',
    'Build a 4-story commercial plaza on 5 marla in Multan with basement, budget 2 crore PKR',
    'Design a 1 kanal farmhouse in Islamabad with contemporary style, pool and lawn',
  ];

  return (
    <div className="vtp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="vtp-modal">
        <button className="vtp-modal__close" onClick={onClose}>✕</button>
        <h2 className="vtp-modal__title">🎤 Describe Your Dream Project</h2>
        <p className="vtp-modal__subtitle">Speak or type in Urdu or English — AI will create your project brief</p>

        {processing ? (
          <div className="vtp-processing">
            <div className="vtp-processing__spinner"></div>
            <span className="vtp-processing__text">🤖 AI is building your project brief...</span>
          </div>
        ) : (
          <>
            <div className="vtp-lang-switch">
              <button className={`vtp-lang-btn ${lang === 'en' ? 'vtp-lang-btn--active' : ''}`} onClick={() => setLang('en')}>
                🇬🇧 English
              </button>
              <button className={`vtp-lang-btn ${lang === 'ur' ? 'vtp-lang-btn--active' : ''}`} onClick={() => setLang('ur')}>
                🇵🇰 اردو / Roman Urdu
              </button>
            </div>

            <div className="vtp-mic-area">
              <button
                className={`vtp-mic-btn ${recording ? 'vtp-mic-btn--recording' : ''}`}
                onClick={recording ? stopRecording : startRecording}
              >
                {recording ? '⏹️' : '🎤'}
              </button>
              <span className={`vtp-mic-label ${recording ? 'vtp-mic-label--recording' : ''}`}>
                {recording ? '🔴 Listening... tap to stop' : 'Tap to speak'}
              </span>
            </div>

            <div className="vtp-divider">or type below</div>

            <textarea
              className="vtp-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={lang === 'ur'
                ? 'Apne project ke baare mein batayein... jaise "Mujhe Lahore mein 10 marla ka modern ghar chahiye"'
                : 'Describe your project... e.g. "I want a 10 marla modern house in Lahore with 5 bedrooms"'
              }
              rows={4}
            />

            <div className="vtp-examples">
              <div className="vtp-examples__title">💡 Try saying something like:</div>
              <ul className="vtp-examples__list">
                {examplePrompts.map((ex, i) => (
                  <li key={i} onClick={() => setText(ex)}>{ex}</li>
                ))}
              </ul>
            </div>

            <div className="vtp-actions">
              <button className="vtp-btn vtp-btn--secondary" onClick={onClose}>Cancel</button>
              <button
                className="vtp-btn vtp-btn--primary"
                onClick={handleSubmit}
                disabled={!text.trim() || text.trim().length < 10}
              >
                🤖 Create Project Brief
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceToProject;
