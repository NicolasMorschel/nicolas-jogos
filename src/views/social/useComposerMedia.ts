import { useEffect, useRef, useState } from 'react';
import { requestAudioStream } from './socialHelpers';

export function useComposerMedia() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  function setFileWithPreview(file: File | null) {
    if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
    setSelectedFile(file);
    setSelectedFileUrl(file ? URL.createObjectURL(file) : '');
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError('Seu navegador nao liberou gravacao de audio aqui.');
      return;
    }

    setRecordingError('');
    setIsPreparingRecording(true);

    try {
      const stream = await requestAudioStream();
      recordingStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voz-${Date.now()}.webm`, { type: 'audio/webm' });
        setFileWithPreview(file);
        stream.getTracks().forEach(track => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
      };
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.warn('Nao foi possivel iniciar a gravacao de audio.', error);
      setRecordingError('Nao deu para acessar o microfone. Confere a permissao do navegador e tenta de novo.');
      setIsRecording(false);
    } finally {
      setIsPreparingRecording(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    setIsRecording(false);
  }

  useEffect(() => () => {
    if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
    recordingStreamRef.current?.getTracks().forEach(track => track.stop());
  }, [selectedFileUrl]);

  return {
    selectedFile,
    selectedFileUrl,
    setFileWithPreview,
    isRecording,
    isPreparingRecording,
    recordingError,
    setRecordingError,
    startRecording,
    stopRecording
  };
}

export type ComposerMediaState = ReturnType<typeof useComposerMedia>;
