
import React, { useState, useCallback, ChangeEvent } from 'react';
import { AnalysisResponse, ErrorDetail } from './types';
import { SUPPORTED_FILE_TYPES } from './constants';
import { analyzeCode } from './services/geminiService';
import { BugIcon, CheckIcon, CodeIcon, LightBulbIcon, ClipboardIcon, ClipboardCheckIcon } from './components/Icons';

// --- Helper Components (Defined outside App to prevent re-creation on re-renders) ---

const Header: React.FC = () => (
  <header className="py-4 px-8 bg-surface border-b border-overlay">
    <h1 className="text-2xl font-bold text-text">
      DevOps Assistant for <span className="text-love">Bhanu Prakash</span>
    </h1>
    <p className="text-sm text-subtle">Your friendly syntax checker and DevOps tutor.</p>
  </header>
);

interface CodeInputProps {
  code: string;
  setCode: (code: string) => void;
  fileType: string;
  setFileType: (type: string) => void;
  onValidate: () => void;
  isLoading: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({ code, setCode, fileType, setFileType, onValidate, isLoading }) => {
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        setCode(typeof text === 'string' ? text : '');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col p-6 bg-surface rounded-lg shadow-lg h-full">
      <div className="flex justify-between items-center mb-4">
        <label htmlFor="fileType" className="text-lg font-semibold text-text">Select File Type:</label>
        <select
          id="fileType"
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          className="bg-overlay border border-muted text-text text-sm rounded-lg focus:ring-love focus:border-love p-2.5"
        >
          {SUPPORTED_FILE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={`Paste your ${fileType} code here...`}
        className="flex-grow w-full p-4 bg-bkg border border-muted rounded-md text-text font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-love"
        spellCheck="false"
      />
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <label htmlFor="file-upload" className="cursor-pointer text-center w-full block bg-muted hover:bg-subtle text-text font-bold py-2 px-4 rounded transition duration-300">
            Upload File
          </label>
          <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
        </div>
        <button
          onClick={onValidate}
          disabled={isLoading || !code.trim()}
          className="flex-1 bg-love hover:bg-rose disabled:bg-muted disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition duration-300 flex items-center justify-center gap-2"
        >
          {isLoading ? 'Analyzing...' : 'Validate Code'}
        </button>
      </div>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-love mb-4"></div>
        <h3 className="text-xl font-semibold text-text">Let me check that for you, Bhanu...</h3>
        <p className="text-subtle mt-2">Running a full syntax and best practice analysis. This might take a moment.</p>
    </div>
);

const CopyToClipboardButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 bg-highlight-med hover:bg-highlight-high rounded-md transition-colors"
            title="Copy to clipboard"
        >
            {copied ? <ClipboardCheckIcon className="w-5 h-5 text-foam" /> : <ClipboardIcon className="w-5 h-5 text-iris" />}
        </button>
    );
};

const ErrorCard: React.FC<{ error: ErrorDetail }> = ({ error }) => (
    <div className="bg-highlight-low border-l-4 border-rose p-4 rounded-r-lg mb-4">
        <p className="font-mono text-sm text-rose">
            <span className="font-bold">Line {error.lineNumber}:</span> {error.error}
        </p>
        <p className="mt-2 text-text text-sm">{error.explanation}</p>
    </div>
);

interface AnalysisResultProps {
  result: AnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, isLoading, error }) => {
  const [activeTab, setActiveTab] = useState<'errors' | 'corrected' | 'practices'>('errors');

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="p-8 text-center text-rose"><strong>Oops!</strong> {error}</div>;
  if (!result) return (
    <div className="p-8 text-center text-subtle">
      <h3 className="text-xl font-semibold text-text mb-2">Ready When You Are!</h3>
      <p>Paste or upload your code snippet and I'll get right to it.</p>
    </div>
  );

  const tabs = [
    { id: 'errors', label: 'Errors Found', icon: BugIcon, count: result.errors.length, color: 'text-rose' },
    { id: 'corrected', label: 'Corrected Code', icon: CodeIcon, color: 'text-foam' },
    { id: 'practices', label: 'Best Practices', icon: LightBulbIcon, color: 'text-gold' },
  ];

  return (
    <div className="flex flex-col h-full p-6 bg-surface rounded-lg shadow-lg">
      {result.isValid ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <CheckIcon className="w-16 h-16 text-foam mb-4" />
          <h2 className="text-2xl font-bold text-foam">Looks Great, Bhanu!</h2>
          <p className="text-subtle mt-2">I've checked your code, and it's valid. Well done!</p>
        </div>
      ) : (
        <>
          <div className="flex border-b border-overlay mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-love text-love'
                    : 'text-subtle hover:text-text'
                }`}
              >
                {<tab.icon className="w-5 h-5" />}
                {tab.label}
                {tab.count !== undefined && <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${tab.color} bg-highlight-med`}>{tab.count}</span>}
              </button>
            ))}
          </div>
          <div className="flex-grow overflow-y-auto pr-2">
            {activeTab === 'errors' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-text">I found a few things to fix:</h3>
                {result.errors.map((err, index) => <ErrorCard key={index} error={err} />)}
              </div>
            )}
            {activeTab === 'corrected' && (
              <div className="relative">
                <h3 className="text-lg font-semibold mb-4 text-text">Here's the corrected version:</h3>
                <pre className="bg-bkg p-4 rounded-md text-text font-mono text-sm whitespace-pre-wrap">
                    <code>{result.correctedCode}</code>
                </pre>
                <CopyToClipboardButton text={result.correctedCode} />
              </div>
            )}
            {activeTab === 'practices' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-text">Some friendly advice:</h3>
                <ul className="space-y-3">
                  {result.bestPractices.map((practice, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <LightBulbIcon className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span className="text-text text-sm">{practice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// --- Main App Component ---

function App() {
  const [code, setCode] = useState<string>('');
  const [fileType, setFileType] = useState<string>(SUPPORTED_FILE_TYPES[0]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = useCallback(async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeCode(code, fileType);
      setAnalysisResult(result);
      if (result.isValid === false && result.errors.length === 0) {
        // A fallback for when the model says it's invalid but provides no errors
        setError("The model indicated an issue but didn't provide specific errors. Try rephrasing your code or checking for subtle problems.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}. Please check the console for more details.`);
      } else {
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, fileType]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-grow p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="h-[calc(100vh-120px)] min-h-[500px]">
          <CodeInput
            code={code}
            setCode={setCode}
            fileType={fileType}
            setFileType={setFileType}
            onValidate={handleValidate}
            isLoading={isLoading}
          />
        </div>
        <div className="h-[calc(100vh-120px)] min-h-[500px]">
          <AnalysisResult
            result={analysisResult}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
