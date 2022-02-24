// Constants
const API_BASE_URL = "https://api.videosdk.live";

//DOM elements
let btnCreateMeeting = document.getElementById("btnCreateMeeting");
let btnJoinMeeting = document.getElementById("btnJoinMeeting");
let videoContainer = document.getElementById("videoContainer");
let participantsList = document.getElementById("participantsList");
let btnToggleMic = document.getElementById("btnToggleMic");
let btnToggleWebCam = document.getElementById("btnToggleWebCam");
//variables
let meetingId = "";
let token = "";
let totalParticipant = 0;
let participants = [];
let localParticipant;
let localParticipantAudio;

//handlers
async function tokenGeneration() {
  if (TOKEN != "") {
    token = TOKEN;
    console.log("token : ", token);
  } else {
    alert("Please Provide Your Token First");
  }
}

async function meetingHandler(newMeeting) {
  let joinMeetingName = "JS-SDK";
  console.log(newMeeting);
  tokenGeneration();
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
    meetingId = await validateMeeting();
    document.getElementById("lblMeetingId").value = "Meeting ID : " + meetingId;
    document.getElementById("join-screen").style.display = "none";
    document.getElementById("grid-screen").style.display = "inline-block";
    startMeeting(token, meetingId, joinMeetingName);
  }
}

async function validateMeeting() {
  meetingId = document.getElementById("txtMeetingCode").value;
  const url = `${API_BASE_URL}/api/meetings/${meetingId}`;
  const options = {
    method: "POST",
    headers: { Authorization: token },
  };

  const result = await fetch(url, options)
    .then((response) => response.json()) //result will have meeting id
    .catch((error) => {
      console.error("error", error);
      alert("Invalid Meeting Id");
      window.location.href = "/";
      return;
    });
  if (result.meetingId === meetingId) {
    return meetingId;
  }
}

function startMeeting(token, meetingId, name) {
  // Meeting config
  window.ZujoSDK.config(token);

  // Meeting Init
  meeting = window.ZujoSDK.initMeeting({
    meetingId: meetingId, // required
    name: name, // required
    micEnabled: true, // optional, default: true
    webcamEnabled: true, // optional, default: true
    maxResolution: "hd", // optional, default: "hd"
  });

  meeting.join();
  participants = meeting.participants;
  console.log("meeting : ", meeting);

  //create Local Participant

  if (totalParticipant == 0) {
    createLocalParticipant();
  }

  //participant joined
  meeting.on("participant-joined", (participant) => {
    let videoElement = createVideoElement(
      participant.id,
      participant.displayName
    );
    let audioElement = createAudioElement(participant.id);

    // enablePermission(participant.id);

    participant.on("stream-enabled", (stream) => {
      console.log("Stream ENable : ", stream);
      setTrack(
        stream,
        document.querySelector(`#v-${participant.id}`),
        audioElement,
        participant.id
      );
    });
    videoContainer.appendChild(videoElement);
    videoContainer.appendChild(audioElement);
    addParticipantToList({
      id: participant.id,
      displayName: participant.displayName,
    });
  });

  // participants left
  meeting.on("participant-left", (participant) => {
    let vElement = document.querySelector(`#v-${participant.id}`);
    vElement.parentNode.removeChild(vElement);
    let aElement = document.getElementById(`a-${participant.id}`);
    aElement.parentNode.removeChild(aElement);
    participants = new Map(meeting.participants);
    //remove it from participant list participantId;
    document.getElementById(`p-${participant.id}`).remove();
  });

  meeting.localParticipant.on("stream-enabled", (stream) => {
    setTrack(
      stream,
      localParticipant,
      localParticipantAudio,
      meeting.localParticipant.id
    );
  });

  addDomEvents();
}

function enablePermission(id) {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      // audio: true,
    })
    .then((stream) => {
      document.querySelector(`#v-${id}`).srcObject = stream;
      document.querySelector(`#v-${id}`).play();
    });
}

//createLocalParticipant
function createLocalParticipant() {
  localParticipant = createVideoElement(
    meeting.localParticipant.id,
    meeting.localParticipant.displayName
  );
  localParticipantAudio = createAudioElement(meeting.localParticipant.id);

  enablePermission(meeting.localParticipant.id);

  addParticipantToList({
    id: meeting.localParticipant.id,
    displayName: meeting.localParticipant.displayName,
  });
  videoContainer.appendChild(localParticipant);
}

// creating video element
function createVideoElement(id, name) {
  let videoFrame = document.createElement("div");
  videoFrame.classList.add("video-frame");

  //create video
  let videoElement = document.createElement("video");
  videoElement.classList.add("video");
  videoElement.setAttribute("id", `v-${id}`);
  videoElement.setAttribute("autoplay", true);
  videoFrame.appendChild(videoElement);

  //add overlay
  let overlay = document.createElement("div");
  overlay.classList.add("overlay");
  overlay.innerHTML = `Name : ${name}`;

  videoFrame.appendChild(overlay);
  return videoFrame;
  // let videoElement = document.createElement("video");
  // videoElement.classList.add("video-frame");
  // videoElement.setAttribute("id", `v-${pId}`);
  // videoElement.setAttribute("autoplay", true);
  // return videoElement;
}

// creating audio element
function createAudioElement(pId) {
  let audioElement = document.createElement("audio");
  audioElement.setAttribute("autoPlay", false);
  audioElement.setAttribute("playsInline", "false");
  audioElement.setAttribute("controls", "false");
  audioElement.setAttribute("id", `a-${pId}`);
  audioElement.style.visibility = "hidden";
  return audioElement;
}

//add participant to list
function addParticipantToList({ id, displayName }) {
  totalParticipant++;
  let participantTemplate = document.createElement("div");
  //refer .participant from index.css
  participantTemplate.className = "participant";

  //icon
  let colIcon = document.createElement("div");
  colIcon.className = "col-2";
  colIcon.innerHTML = "Icon";
  participantTemplate.appendChild(colIcon);

  //name
  let content = document.createElement("div");
  colIcon.className = "col-3";
  colIcon.innerHTML = `${displayName}`;
  participantTemplate.appendChild(content);
}

function setTrack(stream, videoElem, audioElement, id) {
  if (stream.kind == "video") {
    enablePermission(id);
    // const mediaStream = new MediaStream();
    // mediaStream.addTrack(stream.track);
    // videoElem.srcObject = mediaStream;
    // videoElem
    //   .play()
    //   .catch((error) =>
    //     console.error("videoElem.current.play() failed", error)
    //   );
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
