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

  // This effect now only handles cleanup when the component unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // This can happen if the recognition is already stopped.
          console.error("Error stopping recognition on unmount:", error);
        }
      }
    };
  }, []);

  const startRecording = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported. Please use manual input.");
      setShowManualInput(true);
      return;
    }
    
    try {
      // 1. Confirm microphone access and log it.
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Microphone access granted. Audio stream is available.");
      
      setIsRecording(true);
      setRecordingTime(0);
      setTimeLeft(30);
      setTranscript("");
      setInterimTranscript("");
      setShowManualInput(false);
      
      // 2. Create a NEW recognition instance for each recording.
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onresult = (event: any) => {
        // 3. Log that audio data is being received and processed.
        console.log("🎤 Audio data received, processing result...");
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
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'network') {
          toast.error("Network error. Check connection or use manual input.");
        } else if (event.error === 'audio-capture') {
          toast.error("Microphone is busy or unavailable. Please check other tabs/apps or refresh the page.");
        } else if (event.error === 'not-allowed') {
          toast.error("Microphone permission denied. Please allow access.");
        } else {
          toast.error(`Error: ${event.error}. Please try manual input.`);
        }
        setShowManualInput(true);
        stopRecording(false); // Stop without processing
      };
      
      recognition.onend = () => {
        // This will be called when stopRecording() is invoked.
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      
      // Recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      
      // Auto-stop after 30 seconds
      timerRef.current = setTimeout(() => {
        stopRecording();
      }, 30000);
      
      toast.success("Recording started! Speak clearly.");
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please allow permission and try again.");
      setShowManualInput(true);
    }
  };

  const stopRecording = (process = true) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (timerRef.current) clearTimeout(timerRef.current);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    
    setIsRecording(false);
    
    if (process) {
      // A short delay to allow the final transcript to be processed
      setTimeout(() => {
        const finalTranscript = (transcript + interimTranscript).trim();
        if (finalTranscript) {
          processTranscriptToExpense(finalTranscript);
        } else {
          toast.info("No speech was detected.");
        }
      }, 200);
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
            onClick={() => stopRecording()}
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
