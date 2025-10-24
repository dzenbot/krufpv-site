## MultiGP Chapter Landing Page Generator

This project is intended to serve as a base template that other chapters can customize to suit their needs.

At this stage, the implementation remains chapter-specific to streamline and accelerate initial development.
The long-term objective is to build a page generator script capable of automatically producing fully configured chapter landing pages, making it simple for any organizer to deploy their own instance on GitHub Pages with minimal manual setup.

**Core Features:**

 * Dynamically retrieves the chapter’s upcoming events via the RaceSync public API.
 * Allows users to open event details directly on MultiGP.com in a new browser tab.
 * Randomly displays a full-size background image upon each page load.
 * Presents the chapter’s sanctioning bodies, social media links, and contact email for quick access.

**Preview:**

<img width="50%" height="50%" alt="image" src="https://github.com/user-attachments/assets/b2d460df-33d2-4d31-933e-5244af371480" />

### Get Started

1. Fork this repository

2. Pull your forked repository to your local directory

3. Edit the `chapter.json` with your Chapter id and your Chapter API key (see here how to generate an API key)

4. Using a terminal of your choice, navigate to the local directory and run a local web server

```python3 -m http.server 8001``` (if you're on MacOS)

5. Open `http://localhost:8001` in the browser of your choice. You should see a list of your chapter's upcoming events.