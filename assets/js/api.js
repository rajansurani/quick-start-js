TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiIwODQwOTMwMi1mYzgxLTRlZjItYjM2Ni00OTQ5YWUyZWMxMWMiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTY1MDk2NjI3NywiZXhwIjoxNjUxNTcxMDc3fQ.dcmCkmIBio6AiDd1s2zL7EYygH_4F0xXjJXVuAeXuDQ";

const getToken = async () => {
  try {
    if (TOKEN != "") {
      return TOKEN;
    } else {
      alert("Please Provide Your Token First");
    }
  } catch (e) {
    return "";
  }
};

const getMeetingId = async (token) => {
  try {
    const url = `${API_BASE_URL}/api/meetings`;
    const options = {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
    };

    const { meetingId } = await fetch(url, options)
      .then((response) => response.json())
      .catch((error) => alert("error", error));

    return meetingId;
  } catch (e) {
    return null;
  }
};
