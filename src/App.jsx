import { useState } from "react"
import ReactMarkdown from "react-markdown"
import "./App.css"

function App() {
  const [doubt, setDoubt] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [simplifying, setSimplifying] = useState(false)

  // Robust network handler with built-in Exponential Backoff Retries
  const fetchGeminiResponse = async (promptText) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`
    
    let maxRetries = 3
    let delay = 2000 // Start with a 2-second delay if servers are busy

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        })

        // If the server returns a 503 (High Demand), trigger an automatic retry pause
        if (response.status === 503 && i < maxRetries - 1) {
          console.warn(`Server busy. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2 // Double the waiting period for the next loop
          continue
        }

        if (!response.ok) throw new Error(`API returned status code: ${response.status}`)
        
        const data = await response.json()
        return data.candidates[0].content.parts[0].text

      } catch (error) {
        // On the final loop execution, pass the error up to the UI catch block
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
    <div className="container">
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

        {answer && (
          <div className="answer-box animate-fade-in">
            <div className="answer-header">
              <h3>Tutor Explanation:</h3>
              <button 
                className="simplify-btn" 
                onClick={handleSimplify} 
                disabled={simplifying || loading}
              >
                {simplifying ? "Simplifying..." : "✨ Simplify This Explanation"}
              </button>
            </div>
            
            <div className="markdown-content">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App