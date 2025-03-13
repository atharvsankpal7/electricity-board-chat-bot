"use client";

import "regenerator-runtime/runtime";
import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mic, MicOff, Phone } from "lucide-react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

interface VoiceChatProps {
  onAddressExtracted: (address: string) => void;
}

export function VoiceChat({ onAddressExtracted }: VoiceChatProps) {
  const { transcript, resetTranscript } = useSpeechRecognition();

  const [isClient, setIsClient] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [timer, setTimer] = useState(180);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [endReason, setEndReason] = useState("");
  const [browserSupport, setBrowserSupport] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [conversationState, setConversationState] = useState<
    "initial" | "waitingForIssue" | "waitingForAddress"
  >("initial");
  const [userIssue, setUserIssue] = useState("");
  const [processingTranscript, setProcessingTranscript] = useState(false);

  const speechSynthesis = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    setIsClient(true);
    speechSynthesis.current = window.speechSynthesis;

    import("react-speech-recognition").then((module) => {
      const SpeechRecognition = module.default;
      if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
        setBrowserSupport(false);
      }
    });
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
        SpeechRecognition.stopListening();
        setIsListening(false);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1;

        const loadVoices = () => {
          const voices = speechSynthesis.current!.getVoices();
          const preferredVoice = voices.find(
            (voice) =>
              voice.name.includes("Microsoft Zira") ||
              voice.name.includes("Google UK English Female") ||
              voice.name.includes("Female")
          );

          if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.log("Selected voice:", preferredVoice.name);
          }

          utterance.onstart = () => {
            setIsResponding(true);
            SpeechRecognition.stopListening();
          };

          utterance.onend = () => {
            setIsResponding(false);
            SpeechRecognition.startListening({ continuous: true });
            setIsListening(true);
            setProcessingTranscript(false);
          };

          speechSynthesis.current!.speak(utterance);
        };

        if (speechSynthesis.current.getVoices().length) {
          loadVoices();
        } else {
          speechSynthesis.current.addEventListener(
            "voiceschanged",
            loadVoices,
            {
              once: true,
            }
          );
        }
      }
    },
    [conversationState]
  );

  const endCall = useCallback((reason: string) => {
    setIsListening(false);
    import("react-speech-recognition").then((module) => {
      const SpeechRecognition = module.default;
      SpeechRecognition.stopListening();
    });
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
    }
    setEndReason(reason);
    setShowEndDialog(true);
    setProcessingTranscript(false);
  }, []);

  const resetAll = useCallback(() => {
    setIsListening(false);
    setTimer(180);
    setConversationState("initial");
    setUserIssue("");
    resetTranscript();
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
    }
    SpeechRecognition.stopListening();
    setProcessingTranscript(false);
  }, [resetTranscript]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isListening && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            endCall("Time limit reached");
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isListening, timer, endCall]);

  const processAddress = async (text: string) => {
    try {
      console.log("Processing address:", text);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (data.address) {
        onAddressExtracted(data.address);
        speak(
          "Thank you for providing your address. We'll send someone to help you shortly."
        );
        endCall("Address verified and complaint registered");
      } else {
        speak(data.response);
        resetTranscript();
        setProcessingTranscript(false);
      }
    } catch (error) {
      console.error("Error analyzing text:", error);
      speak(
        "Sorry, there was an error processing your address. Please try again."
      );
      resetTranscript();
      setProcessingTranscript(false);
    }
  };

  const toggleListening = useCallback(() => {
    if (isListening) {
      endCall("Call ended by user");
    } else {
      resetTranscript();
      setConversationState("waitingForIssue");
      const greeting =
        "Hello, you've reached the electricity complaint helpline. How can I assist you today?";
      speak(greeting);
    }
  }, [isListening, speak, resetTranscript, endCall]);

  // Handle manual submission of response
  const handleSubmitResponse = useCallback(() => {
    if (!isListening || isResponding || processingTranscript) return;
    
    setProcessingTranscript(true);
    if (conversationState === "waitingForIssue") {
      setUserIssue(transcript);
      speak(
        "Thank you for explaining the issue. Could you please provide your address?"
      );
      setConversationState("waitingForAddress");
      resetTranscript();
    } else if (conversationState === "waitingForAddress") {
      processAddress(transcript);
    }
  }, [isListening, isResponding, processingTranscript, conversationState, transcript, speak, resetTranscript]);

  if (!isClient) {
    return null;
  }

  if (!browserSupport) {
    return <div>Browser doesn't support speech recognition.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center space-y-6">
          <div className="text-2xl font-bold text-gray-800">
            Electricity Helpline
          </div>

          <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
            {isListening ? (
              isResponding ? (
                <div className="w-16 h-16 text-green-500 animate-pulse">🗣️</div>
              ) : (
                <Mic className="w-16 h-16 text-blue-500 animate-pulse" />
              )
            ) : (
              <MicOff className="w-16 h-16 text-gray-400" />
            )}
          </div>

          <div className="text-center">
            <div className="text-xl font-semibold mb-2">
              {isListening
                ? isResponding
                  ? "Assistant Speaking..."
                  : processingTranscript
                  ? "Processing..."
                  : "Listening..."
                : "Start Call"}
            </div>
            <div className="text-gray-600">
              {Math.floor(timer / 60)}:
              {(timer % 60).toString().padStart(2, "0")}
            </div>
          </div>

          <div className="flex space-x-4">
            {isListening && !isResponding && !processingTranscript && (
              <Button
                onClick={handleSubmitResponse}
                variant="default"
                size="lg"
                className="rounded-full"
              >
                <Phone className="w-6 h-6 mr-2" />
                Submit Response
              </Button>
            )}
            
            <Button
              onClick={toggleListening}
              variant={isListening ? "destructive" : "default"}
              size="lg"
              className="rounded-full"
              disabled={isResponding || processingTranscript}
            >
              {isListening ? (
                <>
                  <Phone className="w-6 h-6 mr-2" />
                  End Call
                </>
              ) : (
                <>
                  <Phone className="w-6 h-6 mr-2" />
                  Start Call
                </>
              )}
            </Button>
          </div>

          <div className="w-full mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Transcript:</p>
            <p className="mt-2 text-gray-800">{transcript}</p>
            {processingTranscript && (
              <p className="mt-2 text-blue-600 text-sm">Processing your response...</p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call Ended</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{endReason}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}