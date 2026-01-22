import React from 'react'
import ReactDOM from 'react-dom/client'

console.log('main-test.jsx is loading...')

const TestApp = () => {
  return (
    <div>
      <h1>Test App is Working!</h1>
      <p>If you see this, React is rendering correctly.</p>
    </div>
  )
}

console.log('Creating React root...')

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<TestApp />)

console.log('React app rendered!')
