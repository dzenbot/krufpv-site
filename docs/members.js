if (hasFeature("members")) {
  const trigger = document.querySelector(".members-trigger");
  const dialog = document.querySelector(".members-dialog");
  const form = dialog.querySelector("form");
  const status = dialog.querySelector(".members-status");
  const password = form.querySelector("#members-password");
  const passwordLabel = form.querySelector('label[for="members-password"]');
  const help = form.querySelector(".members-help");
  const back = form.querySelector(".members-back");
  let recovering = false;

  function showRecovery(enabled) {
    recovering = enabled;
    dialog.querySelector("h2").textContent = enabled ? "Recover Password" : "Members Area";
    password.hidden = enabled;
    password.disabled = enabled;
    passwordLabel.hidden = enabled;
    password.value = "";
    help.hidden = enabled;
    back.hidden = !enabled;
    form.querySelector(".members-submit-label").textContent = enabled
      ? "Submit"
      : "Login with MultiGP";
    form.querySelector(".members-login-icon").hidden = enabled;
    status.textContent = "";
  }

  document.querySelector(".members-nav").hidden = false;
  document.body.classList.add("members-enabled");
  let closeTimer;

  function closeDialog() {
    if (closeTimer) {
      return;
    }
    dialog.classList.remove("is-visible");
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180;
    closeTimer = window.setTimeout(() => dialog.close(), delay);
  }

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  trigger.addEventListener("click", () => {
    document.querySelector("#site-nav").classList.remove("open");
    document.querySelector(".menu-button").setAttribute("aria-expanded", "false");
    showRecovery(false);
    dialog.showModal();
    // Establish the hidden state before starting the opening transition.
    dialog.getBoundingClientRect();
    dialog.classList.add("is-visible");
    document.body.classList.add("members-open");
  });

  dialog.querySelector(".members-close").addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    ) {
      closeDialog();
    }
  });
  dialog.addEventListener("close", () => {
    window.clearTimeout(closeTimer);
    closeTimer = undefined;
    dialog.classList.remove("is-visible");
    form.reset();
    document.body.classList.remove("members-open");
  });

  // UI preview only: credentials are never sent or stored.
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = recovering
      ? "Password recovery will be available when member login launches."
      : "Member login is coming soon.";
  });
  help.querySelector("button:not(.members-join)").addEventListener("click", () => {
    showRecovery(true);
    form.querySelector("#members-email").focus();
  });
  back.addEventListener("click", () => {
    showRecovery(false);
    form.querySelector("#members-email").focus();
  });
}
