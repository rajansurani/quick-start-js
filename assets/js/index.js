// Constants
const API_BASE_URL = "https://api.videosdk.live";

//DOM elements
let btnCreateMeeting = document.getElementById("btnCreateMeeting");
let btnJoinMeeting = document.getElementById("btnJoinMeeting");
let videoContainer = document.getElementById("videoContainer");
let btnToggleMic = document.getElementById("btnToggleMic");
let btnToggleWebCam = document.getElementById("btnToggleWebCam");

//variables
let meetingId = "";
let token = "";
let totalParticipant = 0;
let stream = {};
let localParticipantVideo = "";
let localParticipantAudio = "";
let webcamOn = true;
let micOn = true;

//handlers
async function tokenValidation() {
  if (TOKEN != "") {
    token = TOKEN;
    console.log("token : ", token);
  } else {
    alert("Please Provide Your Token First");
  }
}

function createLocalParticipant() {
  localParticipant = createVideoElement(meeting.localParticipant.id);
  console.log("video : ", localParticipant);
  localParticipantAudio = createAudioElement(meeting.localParticipant.id);
  videoContainer.appendChild(localParticipant);
}

async function enablePermission() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: webcamOn,
    audio: micOn,
  });

  // if (webcamOn) {
  //   stream = await navigator.mediaDevices.getUserMedia({
  //     video: true,
  //     audio: false,
  //   });
  //   webcamOn = true;
  // } else {
  //   stream = await navigator.mediaDevices.getUserMedia({
  //     video: false,
  //     audio: true,
  //   });
  //   webcamOn = false;
  // }
  // if (micOn) {
  //   stream = await navigator.mediaDevices.getUserMedia({
  //     video: true,
  //     audio: true,
  //   });
  //   micOn = true;
  // } else {
  //   stream = await navigator.mediaDevices.getUserMedia({
  //     video: false,
  //     audio: true,
  //   });
  //   micOn = false;
  // }
}

//createLocalParticipant
function createParticipant(participant) {
  //request permission for accessing media(mic/webcam)

  let participantVideo = createVideoElement(
    participant.id,
    participant.displayName
  );
  console.log("participantVideo : ", participantVideo);

  let participantAudio = createAudioElement(participant.id);
  videoContainer.appendChild(participantVideo);
  videoContainer.appendChild(participantAudio);
}

function createLocalParticipant(localParticipant) {
  localParticipantVideo = createVideoElement(
    localParticipant.id,
    localParticipant.displayName
  );

  localParticipantAudio = createAudioElement(localParticipant.id);
  videoContainer.appendChild(localParticipantVideo);
  videoContainer.appendChild(localParticipantAudio);
}

async function meetingHandler(newMeeting) {
  let joinMeetingName = "JS-SDK";

  enablePermission();
  //token validation
  tokenValidation();

  if (newMeeting) {
    const url = `${API_BASE_URL}/api/meetings`;
    const options = {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
    };

    const { meetingId } = await fetch(url, options)
      .then((response) => response.json())
      .catch((error) => alert("error", error));
    document.getElementById("lblMeetingId").value = "Meeting ID : " + meetingId;
    document.getElementById("join-screen").style.display = "none";
    document.getElementById("grid-screen").style.display = "inline-block";
    startMeeting(token, meetingId, joinMeetingName);
  } else {
    meetingId = document.getElementById("txtMeetingCode").value;
    document.getElementById("lblMeetingId").value = "Meeting ID : " + meetingId;
    document.getElementById("join-screen").style.display = "none";
    document.getElementById("grid-screen").style.display = "inline-block";
    startMeeting(token, meetingId, joinMeetingName);
  }
}

function startMeeting(token, meetingId, name) {
  // Meeting config
  window.ZujoSDK.config(token);

  // Meeting Init
  meeting = window.ZujoSDK.initMeeting({
    meetingId: meetingId, // required
    name: name, // required
    micEnabled: micOn, // optional, default: true
    webcamEnabled: webcamOn, // optional, default: true
    maxResolution: "hd", // optional, default: "hd"
  });

  //join meeting
  meeting.join();

  //all remote participants
  participants = meeting.participants;

  //for Local Participant join
  meeting.on("meeting-joined", () => {
    createLocalParticipant(meeting.localParticipant);

    //local participant stream-enabled
    meeting.localParticipant.on("stream-enabled", (stream) => {
      console.log("stream : ", stream);
      setTrack(
        stream,
        localParticipant,
        localParticipantAudio,
        meeting.localParticipant.id
      );
    });
    //local participant stream-disabled
    meeting.localParticipant.on("stream-disabled", (stream) => {
      console.log("local participant stream disabled");
      setTrack(
        stream,
        document.getElementById(`v-${meeting.localParticipant.id}`),
        document.getElementById(`a-${meeting.localParticipant.id}`),
        meeting.localParticipant.id
      );
    });
  });

  //for remote participant join
  meeting.on("participant-joined", (participant) => {
    createParticipant(participant);
    participant.on("stream-enabled", (stream) => {
      console.log("Stream ENable : ", stream);
      setTrack(
        stream,
        document.querySelector(`#v-${participant.id}`),
        document.getElementById(`a-${participant.id}`),
        participant.id
      );
    });
  });

  //for any participant left
  meeting.on("participant-left", (participant) => {
    let vElement = document.querySelector(`#v-${participant.id}`);
    vElement.parentNode.removeChild(vElement);
    let aElement = document.getElementById(`a-${participant.id}`);
    aElement.parentNode.removeChild(aElement);
    participants = new Map(meeting.participants);
    //remove it from participant list participantId;
    document.getElementById(`p-${participant.id}`).remove();
  });

  addDomEvents();
}

// creating video element
function createVideoElement(id, name) {
  //create video
  let videoElement = document.createElement("video");
  videoElement.classList.add("video");
  videoElement.setAttribute("id", `v-${id}`);
  // videoElement.setAttribute("autoplay", true);
  // videoFrame.appendChild(videoElement);

  //add overlay
  // let overlay = document.createElement("div");
  // overlay.classList.add("overlay");
  // overlay.innerHTML = `Name : ${name}`;

  // videoFrame.appendChild(overlay);
  return videoElement;
}

// creating audio element
function createAudioElement(pId) {
  let audioElement = document.createElement("audio");
  audioElement.setAttribute("autoPlay", false);
  audioElement.setAttribute("playsInline", "false");
  audioElement.setAttribute("controls", "false");
  audioElement.setAttribute("id", `a-${pId}`);
  audioElement.style.display = "none";
  return audioElement;
}

function setTrack(stream, videoElem, audioElement, id) {
  console.log("from setTrack");
  if (stream.kind == "video") {
    const mediaStream = new MediaStream();
    mediaStream.addTrack(stream.track);
    videoElem.srcObject = mediaStream;
    videoElem
      .play()
      .catch((error) =>
        console.error("videoElem.current.play() failed", error)
      );
  }
  if (stream.kind == "audio") {
    if (id == meeting.localParticipant.id) return;
    const mediaStream = new MediaStream();
    mediaStream.addTrack(stream.track);
    audioElement.srcObject = mediaStream;
    audioElement
      .play()
      .catch((error) => console.error("audioElem.play() failed", error));
  }
}

//events of DOM elements
function addDomEvents() {
  btnToggleMic.addEventListener("click", () => {
    if (btnToggleMic.innerText == "Unmute Mic") {
      meeting.unmuteMic();
      btnToggleMic.innerText = "Mute Mic";
    } else {
      meeting.muteMic();
      btnToggleMic.innerText = "Unmute Mic";
    }
  });

  btnToggleWebCam.addEventListener("click", () => {
    if (btnToggleWebCam.innerText == "Disable Webcam") {
      meeting.disableWebcam();
      btnToggleWebCam.innerText = "Enable Webcam";
    } else {
      meeting.enableWebcam();
      btnToggleWebCam.innerText = "Disable Webcam";
    }
  });

  btnLeaveMeeting.addEventListener("click", async () => {
    // leavemeeting
    meeting.leave();
    document.getElementById("join-screen").style.display = "inline-block";
    document.getElementById("grid-screen").style.display = "none";
  });
}
