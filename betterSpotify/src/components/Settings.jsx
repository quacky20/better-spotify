import React, { useEffect, useState } from "react";

function Settings({ isOpen, onClose, onSaveSettings }) {
    const [gradientColor1, setGradientColor1] = useState("#0f172a")
    const [gradientColor2, setGradientColor2] = useState("#1e293b")
    const [accentColor, setAccentColor] = useState("#10b981")

    useEffect(() => {
        const savedSettings = JSON.parse(localStorage.getItem('appSettings') || '{}')
        if (savedSettings.gradientColor1) setGradientColor1(savedSettings.gradientColor1)
        if (savedSettings.gradientColor2) setGradientColor2(savedSettings.gradientColor2)
        if (savedSettings.accentColor) setAccentColor(savedSettings.accentColor)
    }, [])

    const handleSave = () => {
        const settings = {
            gradientColor1,
            gradientColor2,
            accentColor
        }

        localStorage.setItem('appSettings', JSON.stringify(settings))

        onSaveSettings(settings)

        onClose()
    }

    const resetToDefaults = () => {
        setGradientColor1("#135e59")
        setGradientColor2("#131631")
        setAccentColor("#0fba3a")
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/60 overflow-hidden backdrop-blur-xl flex items-center justify-center">
            <div className="bg-gray-800/70 backdrop-blur-xl rounded-3xl w-full max-w-md mx-4 p-5 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-white text-xl font-bold">App Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-white text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">
                            Background Gradient - Primary Color
                        </label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={gradientColor1}
                                onChange={(e) => setGradientColor1(e.target.value)}
                                className="w-12 h-10 rounded cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={gradientColor1}
                                onChange={(e) => setGradientColor1(e.target.value)}
                                className="bg-gray-700/60 text-white rounded-lg p-2 flex-1 focus:outline-none focus:ring-2"
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">
                            Background Gradient - Secondary Color
                        </label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={gradientColor2}
                                onChange={(e) => setGradientColor2(e.target.value)}
                                className="w-12 h-10 rounded cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={gradientColor2}
                                onChange={(e) => setGradientColor2(e.target.value)}
                                className="bg-gray-700/60 text-white rounded-lg p-2 flex-1 focus:outline-none focus:ring-2"
                                placeholder="#000000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-white text-sm font-medium mb-2">
                            Accent Color
                        </label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={accentColor}
                                onChange={(e) => setAccentColor(e.target.value)}
                                className="w-12 h-10 rounded cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={accentColor}
                                onChange={(e) => setAccentColor(e.target.value)}
                                className="bg-gray-700/60 text-white rounded-lg p-2 flex-1 focus:outline-none focus:ring-2"
                                placeholder="#000000"
                            />
                        </div>
                    </div>

                    <div className="mt-4 mb-6">
                        <p className="text-white text-sm font-medium mb-2">Preview</p>
                        <div className="h-20 rounded-xl relative overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button
                                style={{ backgroundColor: accentColor }}
                                className="px-4 py-2 rounded-lg text-white font-medium shadow-lg"
                                >
                                Button Example
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between mt-6">
                        <button
                        onClick={resetToDefaults}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                        >
                        Reset to Defaults
                        </button>
                        <button
                        onClick={handleSave}
                        style={{ backgroundColor: accentColor }}
                        className="px-4 py-2 text-white rounded-lg transition-colors duration-200"
                        >
                        Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings