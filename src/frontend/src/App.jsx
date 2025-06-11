import { useState } from 'react'

const endpoints = [
  { label: 'Color', path: '/color' },
  { label: 'Cat', path: '/cat' },
  { label: 'Photo', path: '/random-photo' },
  { label: 'Time', path: '/time' },
  { label: 'Scare', path: '/scare' },
  { label: 'Lookalike', path: '/lookalike' },
]

export default function App() {
  const [result, setResult] = useState({})
  const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const handleClick = async (label, path) => {
    try {
      const res = await fetch(`${API}${path}`)
      const data = await res.json()
      setResult((prev) => ({ ...prev, [label]: data }))
      if (label === 'Color') {
        document.body.style.backgroundColor = data.color
      }
    } catch (err) {
      console.error(err)
    }
  }

  const renderResult = (label) => {
    const data = result[label]
    if (!data) return null

    switch (label) {
      case 'Cat':
        return <img src={data.cat_image_url} alt="cat" className="w-60 rounded mx-auto" />
      case 'Photo':
        return <img src={data.random_photo_url} alt="photo" className="w-60 rounded mx-auto" />
      case 'Time':
        return <p className="text-lg">{data.current_time}</p>
      case 'Scare':
        return <img src={data.scare_image_url} alt="scare" className="w-60 rounded mx-auto" />
      case 'Lookalike':
        return <img src={data.lookalike_image_url} alt="lookalike" className="w-60 rounded mx-auto" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <h1 className="text-3xl font-semibold text-center mb-8">🎛️ Painel de Testes da API</h1>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {endpoints.map(({ label, path }) => (
          <div key={label} className="bg-white p-6 rounded-2xl shadow-md flex flex-col items-center">
            <button
              onClick={() => handleClick(label, path)}
              className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {label}
            </button>
            <div className="mt-4">{renderResult(label)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
