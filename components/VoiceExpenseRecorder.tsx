"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Square, Loader2, Type, Send } from "lucide-react";
import { toast } from "sonner";

interface VoiceTransactionRecorderProps {
  onTransactionAdded?: () => void;
}

export const VoiceTransactionRecorder: React.FC<VoiceTransactionRecorderProps> = ({
  onTransactionAdded
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        // Add these properties to improve reliability
        recognitionRef.current.maxAlternatives = 1;
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPart;
            } else {
              interimTranscript += transcriptPart;
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
          }
          setInterimTranscript(interimTranscript);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'network') {
            toast.error("Network error. Please check your internet connection or try the manual input option.");
            setShowManualInput(true);
          } else if (event.error === 'no-speech') {
            toast.info("No speech detected. Please speak clearly.");
          } else if (event.error === 'audio-capture') {
            toast.error("Microphone access denied or not available.");
            setShowManualInput(true);
          } else if (event.error === 'not-allowed') {
            toast.error("Microphone permission denied. Please allow microphone access or use manual input.");
            setShowManualInput(true);
          } else if (event.error === 'service-not-allowed') {
            toast.error("Speech recognition service not available. Please use the manual input option.");
            setShowManualInput(true);
          } else {
            toast.error(`Speech recognition error: ${event.error}. Please try the manual input option.`);
            setShowManualInput(true);
          }
          
          // Stop recording on error
          setIsRecording(false);
          if (timerRef.current) clearTimeout(timerRef.current);
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
        };
        
        recognitionRef.current.onend = () => {
          if (isRecording) {
            // Try to restart recognition if still recording
            try {
              setTimeout(() => {
                if (recognitionRef.current && isRecording) {
                  recognitionRef.current.start();
                }
              }, 100);
            } catch (error) {
              console.error("Error restarting recognition:", error);
            }
          }
        };
      } catch (error) {
        console.error("Error initializing speech recognition:", error);
        toast.error("Speech recognition could not be initialized. Please use the manual input option.");
        setShowManualInput(true);
      }
    } else {
      // Speech recognition not supported
      setShowManualInput(true);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
        }
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser. Please use the manual input option below.");
      setShowManualInput(true);
      return;
    }
    
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsRecording(true);
      setTimeLeft(30);
      setRecordingTime(0);
      setTranscript("");
      setInterimTranscript("");
      setShowManualInput(false);
      
      // Start speech recognition
      recognitionRef.current.start();
      
      // Recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Countdown timer
      let countdown = 30;
      countdownRef.current = setInterval(() => {
        countdown--;
        setTimeLeft(countdown);
        if (countdown <= 0) {
          stopRecording();
        }
      }, 1000);
      
      // Auto-stop after 30 seconds
      timerRef.current = setTimeout(() => {
        stopRecording();
      }, 30000);
      
      toast.success("Recording started! Speak clearly about your transaction (income or expense).");
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please use the manual input option below.");
      setShowManualInput(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    setIsRecording(false);
    
    // Process the final transcript
    const finalTranscript = transcript + interimTranscript;
    if (finalTranscript.trim()) {
      processTranscriptToExpense(finalTranscript.trim());
    } else {
      toast.error("No speech detected. Please try again.");
    }
  };

  const processManualInput = () => {
    if (!manualText.trim()) {
      toast.error("Please enter your expense details.");
      return;
    }
    
    processTranscriptToExpense(manualText.trim());
    setManualText("");
    setShowManualInput(false);
  };

  const processTranscriptToExpense = async (transcription: string) => {
    setIsProcessing(true);
    
    try {
      toast.info(`Processing: "${transcription}"`);
      
      // Send to our voice transaction API
      const response = await fetch('/api/voice-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to process expense");
        setIsProcessing(false);
        return;
      }
      
      if (data.success) {
        toast.success(
          `${data.transaction.type === 'income' ? 'Income' : 'Expense'} added: $${data.transaction.amount} for ${data.transaction.description}`
        );
        onTransactionAdded?.();
      } else {
        toast.error(data.error || "Failed to create expense");
      }
      
    } catch (error) {
      console.error("Error processing transcript:", error);
      toast.error("Failed to process the recording. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Voice Transaction Recorder
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
        Click the microphone to record your transaction, or use the text input if voice recording doesn&apos;t work. 
        Examples: &ldquo;I spent 25 dollars on groceries&rdquo;, &ldquo;Earned 500 from freelancing&rdquo;, or &ldquo;Got paid 1000 salary&rdquo;
      </p>
      
      <div className="flex items-center space-x-4">
        {!isRecording && !isProcessing && (
          <>
            <Button 
              onClick={startRecording}
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4"
            >
              <Mic className="h-6 w-6" />
            </Button>
            <span className="text-gray-400">or</span>
            <Button 
              onClick={() => setShowManualInput(!showManualInput)}
              size="lg"
              variant="outline"
              className="rounded-full p-4"
            >
              <Type className="h-6 w-6" />
            </Button>
          </>
        )}
        
        {isRecording && (
          <Button 
            onClick={stopRecording}
            size="lg"
            className="bg-gray-500 hover:bg-gray-600 text-white rounded-full p-4"
          >
            <Square className="h-6 w-6" />
          </Button>
        )}
        
        {isProcessing && (
          <Button 
            disabled
            size="lg"
            className="bg-blue-500 text-white rounded-full p-4"
          >
            <Loader2 className="h-6 w-6 animate-spin" />
          </Button>
        )}
      </div>
      
      {isRecording && (
        <div className="text-center space-y-2">
          <div className="text-red-500 font-mono text-xl">
            🔴 {formatTime(recordingTime)}
          </div>
          <div className="text-sm text-gray-500">
            Time remaining: {timeLeft}s
          </div>
          {(transcript || interimTranscript) && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-w-md">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium text-black dark:text-white">{transcript}</span>
                <span className="text-gray-500 italic">{interimTranscript}</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {isProcessing && (
        <div className="text-center">
          <div className="text-blue-500 font-medium">
            Processing your expense...
          </div>
        </div>
      )}
      
      {showManualInput && !isRecording && !isProcessing && (
        <div className="w-full max-w-md space-y-3">
          <div className="flex space-x-2">
            <Input
              placeholder="Type your transaction (e.g., 'spent 25 on groceries' or 'earned 500 freelancing')"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && processManualInput()}
              className="flex-1"
            />
            <Button 
              onClick={processManualInput}
              disabled={!manualText.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Type your transaction details if voice recording isn&apos;t working
          </p>
        </div>
      )}
      
      <div className="text-xs text-gray-500 text-center">{showManualInput ? "Click the microphone to try voice recording again" : "Maximum recording time: 30 seconds"}</div>
    </div>
  );
};
