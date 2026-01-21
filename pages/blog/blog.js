// blog.js

import { postList, getPostsByCategory, formatDate } from "./blogContentList.js";

const postsContainer = document.getElementById("previousPosts");
const highlightedPostContainer = document.querySelector(
  ".highlightedPostContainer",
);
const navContainer = document.querySelector(".postTypeSelector");
const URL_SEARCH_REGEX = /\?[^=]+=(.+)/;

window.addEventListener("load", () => {
  const url = window.location.href;
  const urlParams = new URL(url.toString());
  const selectedCategory = urlParams.search.match(URL_SEARCH_REGEX)?.[1];

  // changeNav(selectedCategory);
  changePostContent(selectedCategory);
});

function changePostContent(selectedCategory) {
  postsContainer.innerHTML = "";
  highlightedPostContainer.innerHTML = "";

  const filteredPosts = getPostsByCategory(selectedCategory);

  if (filteredPosts.length) {
    filteredPosts.forEach((post) => {
      const postElement = createPostElement(post);
      // if (post.isFeatured) highlightedPostContainer.appendChild(postElement);
      // else
      postsContainer.appendChild(postElement);
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
  postElement.className = "post";
  postElement.href = post.htmlPageLink;

  postElement.innerHTML = `
    <article class="post-content">
      <header class="post-header">
        <span class="post-type">${post.type}</span>
      </header>

      <div class="post-body">
        <h2 class="post-title">${post.title}</h2>
        <p class="post-description">${post.description}</p>
      </div>

      <footer class="post-footer">
        <time datetime="${new Date(
          parseInt(post.time),
        ).toISOString()}" class="post-date">
          ${formatDate(post.time)}
        </time>
      </footer>
    </article>
  `;

  return postElement;
}

function createNoContentElement() {
  const postElement = document.createElement("p");
  postElement.className = "noContentText";

  postElement.innerHTML = `There are currently no posts under this category`;

  return postElement;
}
