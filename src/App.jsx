import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import Skeleton from "./components/Skeleton"
import CodeBlock from "./components/CodeBlock"
import "./App.css"

function App() {
  const [doubt, setDoubt] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [simplifying, setSimplifying] = useState(false)
  
  // Persistent Storage Loader Hook
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("eduquery_history")
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem("eduquery_history", JSON.stringify(history))
  }, [history])

  // Robust network handler with built-in Exponential Backoff Retries
  const fetchGeminiResponse = async (promptText) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`
    
    let maxRetries = 3
    let delay = 2000 

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        })

        if (response.status === 503 && i < maxRetries - 1) {
          console.warn(`Server busy. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2 
          continue
        }

        if (!response.ok) throw new Error(`API returned status code: ${response.status}`)
        
        const data = await response.json()
        return data.candidates[0].content.parts[0].text

      } catch (error) {
        if (i === maxRetries - 1) throw error
      }
    }
  }

  // Initial Answer Request
  const handleSubmit = async () => {
    if (!doubt.trim()) return
    setLoading(true)
    setAnswer("")

    try {
      const systemPrompt = `You are an expert, highly pedagogical engineering professor. 
      Break down the following student doubt step-by-step. 
      Use bullet points, clear headings, and real-world engineering analogies or code examples where applicable. 
      
      Student Doubt: "${doubt}"`

      const result = await fetchGeminiResponse(systemPrompt)
      setAnswer(result)
      
      // Update history tracking array block safely
      setHistory(prev => [{ id: Date.now(), text: doubt, result }, ...prev.slice(0, 9)])
    } catch (error) {
      setAnswer("### System Busy or Key Error\nThe public AI server is experiencing heavy global traffic. Please wait a few moments and click 'Get Explanation' again to try fresh network cycles.")
    } finally {
      setLoading(false)
    }
  }

  // Dynamic feature: Iterative prompt adjustment
  const handleSimplify = async () => {
    if (!answer || simplifying) return
    setSimplifying(true)

    try {
      const simplifyPrompt = `You are a helpful teacher. Review your previous explanation below and rewrite it so it is incredibly easy to understand, like explaining to a first-year college student or using a simpler analogy. Keep any essential technical terminology but explain it better.
      
      Previous Explanation:
      ${answer}`

      const result = await fetchGeminiResponse(simplifyPrompt)
      setAnswer(result)
    } catch (error) {
      alert("Failed to simplify due to network congestion. Please click again in a few moments.")
    } finally {
      setSimplifying(false)
    }
  }

  return (
    <div className="layout-wrapper">
      
      {/* PROFESSIONAL HISTORY SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-title">EduQuery AI</div>
          <div className="history-heading">Past Doubts</div>
          <div className="history-list">
            {history.length === 0 ? (
              <p style={{ color: "#626972", fontSize: "0.85rem", fontStyle: "italic" }}>No searches yet</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setAnswer(item.result); setDoubt(item.text); }}
                  className="history-item-btn"
                  title={item.text}
                >
                  {item.text}
                </button>
              ))
            )}
          </div>
        </div>
        {history.length > 0 && (
          <button onClick={() => setHistory([])} className="clear-btn">
            Clear Local History
          </button>
        )}
      </aside>

      {/* CORE DISPLAY WORKBENCH */}
      <div className="container" style={{ flex: 1, minHeight: "auto" }}>
        <header className="app-header">
          <h1>EduQuery AI</h1>
          <p className="subtitle">Instant, step-by-step technical explanations for engineering concepts</p>
        </header>

        <main className="main-content">
          <textarea
            className="input-box"
            rows={5}
            placeholder="Type your engineering doubt here... (e.g., Explain how the virtual DOM works in React with an analogy)"
            value={doubt}
            onChange={(e) => setDoubt(e.target.value)}
          />

          <div className="action-bar">
            <button className="submit-btn" onClick={handleSubmit} disabled={loading || simplifying}>
              {loading ? "Analyzing Doubt & Self-Healing..." : "Get Explanation"}
            </button>
          </div>

          {/* DYNAMIC RESULTS ENGINE */}
          {(loading || answer) && (
            <div className="answer-box animate-fade-in">
              <div className="answer-header">
                <h3>Tutor Explanation:</h3>
                {answer && !loading && (
                  <button 
                    className="simplify-btn" 
                    onClick={handleSimplify} 
                    disabled={simplifying || loading}
                  >
                    {simplifying ? "Simplifying..." : "✨ Simplify This Explanation"}
                  </button>
                )}
              </div>
              
              <div className="markdown-content">
                {loading ? (
                  <Skeleton />
                ) : (
                  <ReactMarkdown components={{ code: CodeBlock }}>{answer}</ReactMarkdown>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App