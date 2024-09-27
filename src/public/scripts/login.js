document.getElementById("toggle-link")
    .addEventListener("click", function (e) {
        e.preventDefault();
        const loginSection = document.getElementById("login-section");
        const registerSection = document.getElementById("register-section");
        if (loginSection.classList.contains("hidden")) {
            loginSection.classList.remove("hidden");
            registerSection.classList.add("hidden");
            this.textContent = "Don't have an account? Register";
        } else {
            loginSection.classList.add("hidden");
            registerSection.classList.remove("hidden");
            this.textContent = "Already have an account? Login";
        }
    });

function validatePassword() {
    const passEl = document.getElementById("register-password");
    const valPassEl = document.getElementById("register-confirm-password");
    const submitBtn = document.getElementById("register-submit");

    if (passEl.value !== valPassEl.value) {
        valPassEl.setCustomValidity("Passwords do not match");
        submitBtn.classList.add("disabled")
    } else {
        valPassEl.setCustomValidity("");
        submitBtn.classList.remove("disabled");
    }
}

function submitLogin(event) {
    event.preventDefault()
    document.getElementById("login-error").innerText = "";

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const url = "/login";
    const data = { email, password };
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    };

    fetch(url, options)
        .then(response =>
            response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("token", data.token);
                window.location.href = "/";
            } else {
                document.getElementById("login-error").innerText = data.message;
            }
        }
        )
        .catch(error => {
            document.getElementById("login-error").innerText = "An error occurred";
            console.error("Error logging in", error);
        });

}

function submitRegister(event) {
    event.preventDefault()
    document.getElementById("register-error").innerText = "";
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const url = "/register";
    const data = { email, password };
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    };

    console.log("Registering", data);
    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message);
                });
            }
            return response.json();
        })
        .then(data => {
            document.getElementById("register-error").style.color = "green";
            document.getElementById("register-error").innerText = data.message;
        })
        .catch(error => {
            console.error(error);
            document.getElementById("register-error").style.color = "red";
            document.getElementById("register-error").innerText = error.message;
        });
}

document.getElementById('google-signin').addEventListener('click', function () {
    const clientId = '2iuchbislgfpcvkdcd7ra3jcku';
    const redirectUri = encodeURIComponent('http://localhost:3000');
    const cognitoDomain = 'n10752846-code-analysis.auth.ap-southeast-2.amazoncognito.com';

    const url = `https://${cognitoDomain}/oauth2/authorize` +
        `?response_type=code&client_id=${clientId}` +
        `&redirect_uri=${redirectUri}&identity_provider=Google`;

    window.location.href = url;
});