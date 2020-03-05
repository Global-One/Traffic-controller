function logEvent(title, message = undefined) {
    if (typeof message == 'string')
        var str = JSON.stringify(JSON.parse(message), undefined, 4);
    let div =
        `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">${title}</h5>
                <p class="card-text"></p>
            </div>
        </div>
        `;
    let d = $(div);
    let card_text = d.children().first().children().last();
    card_text.text((str === undefined) ? str : str.trim());
    let x = $("#log-cards");
    x.append(d.html().trim());
    $("#control").scrollTop(x.height());
}

$("#control").scroll(function () {
    if ($("#control").scrollTop() > 20) {
        let btn = $("#arrow")[0];
        btn.style.display = "block";
    } else {
        $("#arrow")[0].style.display = "none";
    }
});

$("#arrow").click(function () {
    $("#control").scrollTop(0);
});
