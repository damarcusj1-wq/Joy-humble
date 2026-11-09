document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Failed to load activities");
      }
      const activities = await response.json();

      activitiesList.replaceChildren();
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const heading = document.createElement("h4");
        heading.textContent = name;
        activityCard.appendChild(heading);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.appendChild(scheduleLabel);
        schedule.append(document.createTextNode(details.schedule));
        activityCard.appendChild(schedule);

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.appendChild(availabilityLabel);
        availability.append(document.createTextNode(`${spotsLeft} spots left`));
        activityCard.appendChild(availability);

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        activityCard.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        details.participants.forEach((email) => {
          const participant = document.createElement("li");
          const participantEmail = document.createElement("span");
          participantEmail.textContent = email;
          participant.appendChild(participantEmail);

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "remove-participant";
          removeButton.textContent = "×";
          removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          removeButton.addEventListener("click", () => unregisterParticipant(name, email));
          participant.appendChild(removeButton);
          participantsList.appendChild(participant);
        });
        activityCard.appendChild(participantsList);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.replaceChildren();
      const errorMessage = document.createElement("p");
      errorMessage.textContent = "Failed to load activities. Please try again later.";
      activitiesList.appendChild(errorMessage);
      console.error("Error fetching activities:", error);
    }
  }

  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      showMessage(result.message || result.detail, response.ok);
      if (response.ok) {
        await fetchActivities();
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", false);
      console.error("Error unregistering participant:", error);
    }
  }

  function showMessage(message, success) {
    messageDiv.textContent = message;
    messageDiv.className = success ? "success" : "error";
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, true);
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", false);
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", false);
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
