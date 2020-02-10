function logEvent(title, message) {
    let div =
        `<div class="card">
            <div class="card-body">
                <h5 class="card-title">${title}</h5>
                <p class="card-text">
                    ${message}
                </p>
            </div>
        </div>
        `;
    let x = $("#log-cards");
    x.append(div);
    $("#control").scrollTop(x.height());
}

$("#control").scroll(function () {
    if ($("#control").scrollTop() > 20) {
        let btn = $("#arrow")[0];
        console.log(btn);
        btn.style.display = "block";
    } else {
        $("#arrow")[0].style.display = "none";
    }
});

$("#arrow").click(function () {
    $("#control").scrollTop(0);
});