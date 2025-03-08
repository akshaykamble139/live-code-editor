import { useState, useEffect, useMemo, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { xcodeLight } from '@uiw/codemirror-theme-xcode';
import { FiSave, FiDownload, FiMoon, FiSun, FiMaximize, FiMinimize } from 'react-icons/fi';
import { debounce } from 'lodash';

export default function LiveCodeEditor() {
  // State for code content
  const [htmlCode, setHtmlCode] = useState("<h1>Hello, World!</h1>");
  const [cssCode, setCssCode] = useState("h1 { color: red; }");
  const [jsCode, setJsCode] = useState("function func() { \n   alert('Hello');\n}");
  
  // Additional state for features
  const [darkMode, setDarkMode] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expanded, setExpanded] = useState(null); // For expanding editors (null, 'html', 'css', 'js')
  const [codeChanged, setCodeChanged] = useState(false);

  // Load saved code from localStorage on component mount
  useEffect(() => {
    const savedHtml = localStorage.getItem('live-editor-html');
    const savedCss = localStorage.getItem('live-editor-css');
    const savedJs = localStorage.getItem('live-editor-js');
    const savedDarkMode = localStorage.getItem('live-editor-dark-mode');
    
    if (savedHtml) setHtmlCode(savedHtml);
    if (savedCss) setCssCode(savedCss);
    if (savedJs) setJsCode(savedJs);
    if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');
  }, []);

  // Debounced save function to avoid excessive localStorage writes
  const saveToLocalStorage = useCallback(debounce(() => {
    try {
      localStorage.setItem('live-editor-html', htmlCode);
      localStorage.setItem('live-editor-css', cssCode);
      localStorage.setItem('live-editor-js', jsCode);
      localStorage.setItem('live-editor-dark-mode', darkMode.toString());
      setCodeChanged(false);
      setErrorMsg("");
    } catch (error) {
      setErrorMsg("Failed to save: " + error.message);
    }
  }, 1000), [htmlCode, cssCode, jsCode, darkMode]);

  // Auto-save when code changes
  useEffect(() => {
    setCodeChanged(true);
    saveToLocalStorage();
  }, [htmlCode, cssCode, jsCode, saveToLocalStorage]);

  // Generate the preview content with error handling
  const srcDoc = useMemo(() => {
    try {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <style>${cssCode}</style>
          </head>
          <body>
            ${htmlCode}
            <script>
              // Error handling wrapper
              window.onerror = function(message, source, lineno, colno, error) {
                const errorElement = document.createElement('div');
                errorElement.style.position = 'fixed';
                errorElement.style.bottom = '0';
                errorElement.style.left = '0';
                errorElement.style.right = '0';
                errorElement.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                errorElement.style.color = 'white';
                errorElement.style.padding = '8px';
                errorElement.style.fontSize = '14px';
                errorElement.textContent = 'JavaScript Error: ' + message;
                document.body.appendChild(errorElement);
                return true; // Prevents the default error handling
              };
              // User JS code
              try {
                ${jsCode}
              } catch(e) {
                console.error('Error in user JavaScript:', e);
              }
            </script>
          </body>
        </html>
      `;
    } catch (error) {
      setErrorMsg("Error generating preview: " + error.message);
      return `<html><body><p>Preview error. Check your code.</p></body></html>`;
    }
  }, [htmlCode, cssCode, jsCode]);

  // Handle manual save button click
  const handleSave = () => {
    saveToLocalStorage.flush(); // Force immediate save
    setErrorMsg("Code saved successfully!");
    setTimeout(() => setErrorMsg(""), 2000);
  };

  // Handle download as ZIP
  const handleDownload = () => {
    try {
      // Create HTML file content
      const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Code Editor Export</title>
  <style>
${cssCode}
  </style>
</head>
<body>
${htmlCode}
  <script>
${jsCode}
  </script>
</body>
</html>
`;
      
      // Create blob and download link
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'live-editor-export.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setErrorMsg("Downloaded successfully!");
      setTimeout(() => setErrorMsg(""), 2000);
    } catch (error) {
      setErrorMsg("Download failed: " + error.message);
    }
  };

  // Handle editor expansion
  const toggleExpand = (editor) => {
    setExpanded(expanded === editor ? null : editor);
  };

  // Current theme based on dark mode setting
  const currentTheme = darkMode ? dracula : xcodeLight;

  return (
    <div className={`flex flex-col h-screen w-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header/Toolbar */}
      <div className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
        <h1 className="text-xl font-bold">Live Code Editor</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            className={`p-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white flex items-center`}
            title="Save code"
          >
            <FiSave className="mr-1" /> {codeChanged ? "Save*" : "Save"}
          </button>
          <button
            onClick={handleDownload}
            className={`p-2 rounded-md ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white flex items-center`}
            title="Download as HTML"
          >
            <FiDownload className="mr-1" /> Export
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-md ${darkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600'} text-white flex items-center`}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <FiSun className="mr-1" /> : <FiMoon className="mr-1" />}
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      {/* Error/Status Bar */}
      {errorMsg && (
        <div className={`py-1 px-3 text-sm ${errorMsg.includes("Error") || errorMsg.includes("Failed") ? "bg-red-600" : "bg-green-600"} text-white`}>
          {errorMsg}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden md:flex-row flex-col">
        {/* Code Editors Section */}
        <div className={`${expanded ? (expanded === 'preview' ? 'hidden' : 'w-full') : 'md:w-1/2 w-full'} flex flex-col p-3 space-y-3 ${darkMode ? 'border-r border-gray-700' : 'border-r border-gray-300'}`}>
          {/* HTML Editor */}
          <div className={`${expanded === 'html' ? 'flex-1' : (expanded && expanded !== 'html' ? 'hidden' : 'flex-1')} overflow-y-auto border ${darkMode ? 'border-blue-500' : 'border-blue-400'} rounded-lg p-2`} style={{ display: expanded === 'html' || !expanded ? 'block' : expanded !== 'preview' ? 'none' : 'block' }}>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">HTML</h2>
              <button 
                onClick={() => toggleExpand('html')}
                className="text-gray-400 hover:text-white"
                title={expanded === 'html' ? "Minimize" : "Maximize"}
              >
                {expanded === 'html' ? <FiMinimize /> : <FiMaximize />}
              </button>
            </div>
            <CodeMirror 
              value={htmlCode} 
              onChange={setHtmlCode} 
              extensions={[html()]} 
              theme={currentTheme} 
              className="rounded-lg shadow-lg h-full"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
              }}
            />
          </div>
          
          {/* CSS and JS Editors Row */}
          {(expanded === null || expanded === 'css' || expanded === 'js') && (
            <div className={`${expanded ? 'flex-1' : 'h-2/5'} flex md:flex-row flex-col space-y-3 md:space-y-0 md:space-x-3`}>
              {/* CSS Editor */}
              <div 
                className={`${expanded === 'css' ? 'w-full' : (expanded === 'js' ? 'hidden' : 'md:w-1/2 w-full')} overflow-y-auto border ${darkMode ? 'border-green-500' : 'border-green-400'} rounded-lg p-2`}
                style={{ display: expanded === 'css' || !expanded || (expanded !== 'js' && expanded !== 'preview' && expanded !== 'html') ? 'block' : 'none' }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">CSS</h2>
                  <button 
                    onClick={() => toggleExpand('css')}
                    className="text-gray-400 hover:text-white"
                    title={expanded === 'css' ? "Minimize" : "Maximize"}
                  >
                    {expanded === 'css' ? <FiMinimize /> : <FiMaximize />}
                  </button>
                </div>
                <CodeMirror 
                  value={cssCode} 
                  onChange={setCssCode} 
                  extensions={[css()]} 
                  theme={currentTheme} 
                  className="rounded-lg shadow-lg h-full"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    foldGutter: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                  }}
                />
              </div>
              
              {/* JavaScript Editor */}
              <div 
                className={`${expanded === 'js' ? 'w-full' : (expanded === 'css' ? 'hidden' : 'md:w-1/2 w-full')} overflow-y-auto border ${darkMode ? 'border-yellow-500' : 'border-yellow-400'} rounded-lg p-2`}
                style={{ display: expanded === 'js' || !expanded || (expanded !== 'css' && expanded !== 'preview' && expanded !== 'html') ? 'block' : 'none' }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">JavaScript</h2>
                  <button 
                    onClick={() => toggleExpand('js')}
                    className="text-gray-400 hover:text-white"
                    title={expanded === 'js' ? "Minimize" : "Maximize"}
                  >
                    {expanded === 'js' ? <FiMinimize /> : <FiMaximize />}
                  </button>
                </div>
                <CodeMirror 
                  value={jsCode} 
                  onChange={setJsCode} 
                  extensions={[javascript()]} 
                  theme={currentTheme} 
                  className="rounded-lg shadow-lg h-full"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    foldGutter: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Section */}
        <div className={`${expanded ? (expanded === 'preview' ? 'w-full h-full' : 'hidden') : 'md:w-1/2 w-full'} p-3`}>
          <div className={`flex justify-between items-center mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <h2 className="text-lg font-semibold">Live Preview</h2>
            <button 
              onClick={() => toggleExpand('preview')}
              className="text-gray-400 hover:text-white"
              title={expanded === 'preview' ? "Minimize" : "Maximize"}
            >
              {expanded === 'preview' ? <FiMinimize /> : <FiMaximize />}
            </button>
          </div>
          <div className={`w-full h-full overflow-y-auto border ${darkMode ? 'border-red-500' : 'border-red-400'} rounded-lg bg-white`}>
            <iframe
              title="Live Preview"
              className="w-full h-full border-none rounded-lg shadow-xl"
              srcDoc={srcDoc}
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
}