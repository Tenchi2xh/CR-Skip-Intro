const metadataMarker = "    vilos.config.media = ";

function inject(source) {
    const script = document.createElement("script"),
          firstScript = document.getElementsByTagName("script")[0];
    script.textContent = source;
    firstScript.parentNode.insertBefore(script, firstScript);
    firstScript.parentNode.removeChild(script);
}

function saveAdBreaks() {
    document.body.setAttribute("data-adBreaks", JSON.stringify(vilos.adService.adBreaks));
}

async function getTimestamps(episodeUrl) {
    let midrolls = [];
    inject("(" + saveAdBreaks.toString() + ")()");
    let playerAdBreaks = JSON.parse(document.body.getAttribute("data-adBreaks"));

    if (Array.isArray(playerAdBreaks) && playerAdBreaks.length) {
        midrolls = playerAdBreaks.filter(ad => ad["type"] === "midroll").map(ad => ad["offset"]);
    } else {
        let html = await fetch("https://cors-anywhere.herokuapp.com/" + episodeUrl).then(response => response.text());
        let metadataLine = html.split("\n").find(line => line.startsWith(metadataMarker));
        let metadata = JSON.parse(metadataLine.slice(metadataMarker.length, -1));
        midrolls = metadata["ad_breaks"].filter(ad => ad["type"] === "midroll").map(ad => ad["offset"] / 1000);
    }
    return midrolls;
}

function addSkipButton(video, timestamp) {
    let duration = document.getElementsByClassName("vjs-duration")[0];
    let button = document.createElement("div");
    let text = document.createTextNode("SKIP INTRO");

    button.style.zIndex = 999;
    button.style.color = "white";
    button.style.position = "fixed";
    button.style.right = 0;
    button.style.bottom = "65px";
    button.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
    button.style.border = "1px solid white";
    button.style.padding = "10px 10px 9px 10px";
    button.style.margin = "0 20px 0 0";
    button.style.fontSize = "16px";
    button.style.cursor = "pointer";
    button.style.display = "block";

    button.onclick = () => {
        if (timestamp > video.currentTime) {
            video.currentTime = timestamp;
        }
    };

    button.appendChild(text);
    duration.insertAdjacentElement("afterend", button);

    setInterval(() => {
        if (video.currentTime > timestamp - 1 && button.style.display === "block") {
            button.style.display = "none";
        } else if (video.currentTime < timestamp - 1 && button.style.display === "none") {
            button.style.display = "block";
        }
    }, 1000);
}

function init() {
    let video = document.getElementById("player_html5_api");
    let episodeUrl = document.referrer;
    let done = false;
    video.onplay = () => {
        if (done) return;
        done = true;
        getTimestamps(episodeUrl)
            .then(timestamps => {
                let afterIntro = timestamps[0];
                addSkipButton(video, afterIntro);
            });
    };
}

init();
