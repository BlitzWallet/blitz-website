// blog.js

import { postList, getPostsByCategory, formatDate } from "./blogContentList.js";

const postsContainer = document.getElementById("previousPosts");
const highlightedPostContainer = document.querySelector(
  ".highlightedPostContainer"
);
const navContainer = document.querySelector(".postTypeSelector");
const URL_SEARCH_REGEX = /\?[^=]+=(.+)/;

window.addEventListener("load", () => {
  const url = window.location.href;
  const urlParams = new URL(url.toString());
  const selectedCategory = urlParams.search.match(URL_SEARCH_REGEX)?.[1];

  changeNav(selectedCategory);
  changePostContent(selectedCategory);
});

function changePostContent(selectedCategory) {
  postsContainer.innerHTML = "";
  highlightedPostContainer.innerHTML = "";
  console.log(selectedCategory);
  const filteredPosts = getPostsByCategory(selectedCategory);

  if (filteredPosts.length) {
    filteredPosts.forEach((post) => {
      const postElement = createPostElement(post);
      if (post.isFeatured) highlightedPostContainer.appendChild(postElement);
      else postsContainer.appendChild(postElement);
    });
  } else {
    const element = createNoContentElement();
    postsContainer.appendChild(element);
  }
}

function changeNav(selectedCategory) {
  const navChildren = Array.from(navContainer.children);
  navChildren.forEach((child) => {
    const linkText = child.textContent?.trim();
    child.classList.remove("activeNav");

    if (!selectedCategory && linkText?.toLowerCase() === "all") {
      child.classList.add("activeNav");
    } else if (linkText?.toLowerCase() === selectedCategory?.toLowerCase()) {
      child.classList.add("activeNav");
    }
  });
}
function createPostElement(post) {
  const postElement = document.createElement("a");
  postElement[post.isFeatured ? "id" : "className"] = post.isFeatured
    ? "highlightedPost"
    : "blogPost";
  postElement.href = post.htmlPageLink;

  postElement.innerHTML = `
      <div class="postTypeContainer">
      <div class="imgContainer">
          <img src="${post.imageUrl}" alt="${post.type} icon" />
      </div>
      <p>${post.type}</p>
      </div>
      <div class="${
        post.isFeatured ? "highlightedPostImageContainer" : "postImageContainer"
      }">
      <img class=${
        post.isFeatured ? "highlightedPostImage" : "postImage"
      } src="${post.thumbnailUrl}" alt="${post.title}" />
      </div>
      <div class="textContainer">
      <h2>${post.title}</h2>
      <p>${post.description}</p>
      <time datetime="${new Date(
        parseInt(post.time)
      ).toISOString()}">${formatDate(post.time)}</time>
      </div>
    `;

  return postElement;
}

function createNoContentElement() {
  const postElement = document.createElement("p");
  postElement.className = "noContentText";

  postElement.innerHTML = `There are currently no posts under this category`;

  return postElement;
}
