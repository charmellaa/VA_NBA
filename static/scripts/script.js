

function newAlert(message) {
    const alertContainer = document.createElement('div');
    alertContainer.className = 'new-alert';
    const alertContent = document.createElement('div');
    alertContent.className = 'new-alert-content';
    alertContent.textContent = message;
    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.className = 'new-alert-button';
    okButton.onclick = () => {
        document.body.removeChild(alertContainer);
    };
    alertContent.appendChild(okButton);
    alertContainer.appendChild(alertContent);
    document.body.appendChild(alertContainer);
}

window.alert = newAlert;

const button = document.querySelector('.start-button');

button.addEventListener('click', navigateToNextPage);
function navigateToNextPage() {
    window.location.href = "next.html";
}