document.addEventListener("DOMContentLoaded", () => {

    /* Login Page Logic */
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("error-message");
    const loginBtn = document.getElementById("login-btn");

    if (loginForm && loginBtn) {
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        loginBtn.disabled = true;

        const checkLoginFields = () => {
            loginBtn.disabled =
            emailInput.value.trim() === "" ||
            passwordInput.value.trim() === "";
        };

        emailInput.addEventListener("input", checkLoginFields);
        passwordInput.addEventListener("input", checkLoginFields);

        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            loginError.textContent = "";

            if (!email || !password) {
                loginError.textContent = "Please fill in all fields.";
                return;
            }

            try {
                const response = await fetch("http://localhost:8080/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                window.location.href = "dashboard.html";
            } else {
                loginError.textContent =
                    result.message || "Login failed.";
            }
            } catch (error) {
                loginError.textContent =
                "Server not reachable. Try again later.";
            }
        });
    }


    /* Signup Page Validation*/
    const signupForm = document.getElementById("signup-form");
    const signupError = document.getElementById("signup-error-message");
    const registerBtn = document.getElementById("register-btn");

    const signupUsernameInput = document.getElementById("new-username");
    const signupEmailInput = document.getElementById("E-Mail");
    const signupPasswordInput = document.getElementById("new-password");
    const confirmPasswordInput = document.getElementById("confirm-password");

    if (signupForm && registerBtn) {
        registerBtn.disabled = true;

        const checkSignupValidity = () => {
            const password = signupPasswordInput.value;

            const rules = {
                length: password.length >= 8,
                upper: /[A-Z]/.test(password),
                lower: /[a-z]/.test(password),
                number: /[0-9]/.test(password),
                symbol: /[^A-Za-z0-9]/.test(password)
            };

            toggleRule("rule-length", rules.length);
            toggleRule("rule-upper", rules.upper);
            toggleRule("rule-lower", rules.lower);
            toggleRule("rule-number", rules.number);
            toggleRule("rule-symbol", rules.symbol);

            const allFieldsFilled =
                signupUsernameInput.value.trim() !== "" &&
                signupEmailInput.value.trim() !== "" &&
                signupPasswordInput.value.trim() !== "" &&
                confirmPasswordInput.value.trim() !== "";

            const passwordsMatch =
                signupPasswordInput.value ===
                confirmPasswordInput.value;

            if (
                confirmPasswordInput.value &&
                !passwordsMatch
            ) {
                signupError.textContent = "Passwords do not match.";
            } else {
                signupError.textContent = "";
            }

            registerBtn.disabled = !(
                Object.values(rules).every(Boolean) &&
                allFieldsFilled &&
                passwordsMatch
            );
        };

        signupUsernameInput.addEventListener("input", checkSignupValidity);
        signupEmailInput.addEventListener("input", checkSignupValidity);
        signupPasswordInput.addEventListener("input", checkSignupValidity);
        confirmPasswordInput.addEventListener("input", checkSignupValidity);

        signupForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const username = signupUsernameInput.value.trim();
            const email = signupEmailInput.value.trim();
            const password = signupPasswordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            signupError.textContent = "";

            if (!username || !email || !password || !confirmPassword) {
                signupError.textContent = "Please fill in all fields.";
                return;
            }

            if (password !== confirmPassword) {
                signupError.textContent = "Passwords do not match.";
                return;
            }

            try {
                const response = await fetch("http://localhost:8080/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password })
                });

                const result = await response.json();

                if (response.ok) {
                    window.location.href = "index.html";
                } else {
                    signupError.textContent =
                        result.message || "Signup failed.";
                }
            } catch {
                signupError.textContent =
                    "Server not reachable. Try again later.";
            }
        });
    }
});

/*Password Visibility Toggle*/
function togglePassword(toggleElement) {
    const passwordInput =
        toggleElement.parentElement.querySelector("input");
    const icon = toggleElement.querySelector("i");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        passwordInput.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

/*Password Rule*/
function toggleRule(ruleId, isValid) {
    const rule = document.getElementById(ruleId);
    if (!rule) return;

    rule.classList.toggle("valid", isValid);
    rule.classList.toggle("invalid", !isValid);
}
