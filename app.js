// TOKEN MANAGEMENT
function saveToken(token) {
    localStorage.setItem("careerloop_token", token);
}

function getToken() {
    return localStorage.getItem("careerloop_token");
}

function logout() {
    localStorage.removeItem("careerloop_token");
    window.location.href = "../index.html";
}
