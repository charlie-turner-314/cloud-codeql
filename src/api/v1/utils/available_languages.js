
const availableLanguages = (req, res) => {
    return res.json({
        "languages": [
            "python",
            "javascript",
            "java",
            "c"
        ]
    })
}

export default availableLanguages