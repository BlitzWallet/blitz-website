import { formatDate, getPostByName } from "./blogContentList.js";
// const blogTypeImage = document.getElementById("blogTypeImage");
// const blogTypeText = document.getElementById("blogTypeText");
const blogTitle = document.getElementById("blogTitle");
const blogSubHeader = document.getElementById("blogSubHeader");
const authorName = document.getElementById("authorName");
const postReadTime = document.getElementById("postReadTime");
const postDate = document.getElementById("postDate");

const authorProfilePicture = document.getElementById("authorProfilePicture");
window.addEventListener("load", () => {
  const url = window.location.href;
  const urlParams = new URL(url.toString());
  const postTitle = urlParams.pathname.split("/")?.[3];

  const [post] = getPostByName(postTitle);
  console.log(url, urlParams, postTitle, post);
  // document.title = `Blitz Wallet | ${post.title}`;
  // blogTypeImage.src = `/src/assets/images/${post.imageUrl}`;
  // blogTypeImage.alt = `Image of a ${
  //   post.type.toLowerCase() === "release"
  //     ? "megaphone"
  //     : post.type.toLowerCase() === "tutorial"
  //       ? "question mark"
  //       : "microphone"
  // } to show that post is of type ${post.type.toLowerCase()}`;
  // blogTypeText.textContent = ` ${post.type}`;
  blogTitle.textContent = post.title;
  blogSubHeader.textContent = post.description;
  authorProfilePicture.src = post.authorImage;
  authorProfilePicture.style.padding = post.customAuthor ? "0px" : "10px";
  authorName.textContent = post.author;
  postReadTime.textContent = `${post.readingLengthEST} minutes`;
  postDate.textContent = formatDate(post.time);
  setMetaDescription(post.pageMetaDescription);
});

function setMetaDescription(newDescription) {
  if (!newDescription) return;
  if (!document.querySelector('meta[name="description"]')) {
    const metaDescription = document.createElement("meta");
    metaDescription.name = "description";
    metaDescription.content = newDescription;
    document.head.appendChild(metaDescription);
  } else
    document
      .querySelector('meta[name="description"]')
      .setAttribute("content", newDescription);
}
