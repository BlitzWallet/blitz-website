"use strict";
const userCountText = document.getElementById("userCount");
const loader = document.querySelector(".loader");

async function getUserCount() {
  try {
    const response = await fetch(`/getUserCount`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log(data.count);
    if (data.status !== "SUCCESS") throw new Error("Request failed");
    loader.style.display = "none";
    userCountText.innerHTML = Number(data.count).toLocaleString();
  } catch (err) {
    console.log("error getting user count", err);
    userCountText.innerHTML = Number(1000).toLocaleString();
  }
}

getUserCount();
